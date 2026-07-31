"""
Build/export script for the UNIVERSAL LID CORNER SPLINT.

Exports, for each hand (Left / Right corner of the lid):
    - the splint shell
    - the pressure bar in every supported thickness

Usage:
    python3 build_splint.py
"""
import os
import cadquery as cq
import splint_model as S
import splint_params as P

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "exports", "universal_splint")

STL_TOL = 0.02
STL_ANG_TOL = 0.1


def export(shape, path_no_ext, step=True):
    cq.exporters.export(shape, path_no_ext + ".stl",
                        tolerance=STL_TOL, angularTolerance=STL_ANG_TOL)
    print(f"  wrote {os.path.relpath(path_no_ext + '.stl', ROOT)}")
    if step:
        cq.exporters.export(shape, path_no_ext + ".step")
        print(f"  wrote {os.path.relpath(path_no_ext + '.step', ROOT)}")


def main():
    os.makedirs(OUT, exist_ok=True)

    # Clear stale exports first. Without this, files from a previous
    # parameter set survive alongside the new ones -- e.g. the large v1
    # pressure bars linger after v2 shrinks the set, and there is nothing
    # in the filename to tell you which generation you are about to print.
    removed = 0
    for f in os.listdir(OUT):
        if f.endswith((".stl", ".step", ".3mf")):
            os.remove(os.path.join(OUT, f))
            removed += 1
    if removed:
        print(f"cleared {removed} stale export(s)")

    for hand, mirrored in (("left", False), ("right", True)):
        print(f"\n=== {hand.upper()} corner splint ===")
        shell = S.splint(mirror=mirrored)
        export(shell, os.path.join(OUT, f"{hand}_splint_shell"))

    # Pressure bars are symmetric in plan only for the L footprint, so they
    # are handed too -- export both.
    for hand, mirrored in (("left", False), ("right", True)):
        print(f"\n=== {hand.upper()} pressure bars ===")
        for t in P.BAR_THICKNESSES:
            bar = S.pressure_bar(t)
            if mirrored:
                bar = S.mirror_other_hand(bar)
            # :g not int() -- int(1.5) and int(1.0) both render "1mm", so
            # the 1.5mm shim silently overwrote the 1mm one.
            name = f"{hand}_shim_{t:g}mm"
            # STL only for the bars -- they are simple plates and this keeps
            # the export set manageable; the shell STEP carries the CAD.
            export(bar, os.path.join(OUT, name), step=False)

    print("\nAll splint exports complete.")


if __name__ == "__main__":
    main()
