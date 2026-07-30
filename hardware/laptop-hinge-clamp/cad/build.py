"""
Master build/export script for the Laptop Hinge Repair Clamp.

Regenerates every STL/STEP deliverable for both the Left and Right
assemblies from the parametric model in model.py / params.py.

Usage:
    python3 build.py
"""
import os
import cadquery as cq
import model as M
import params as P

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
EXPORTS = os.path.join(ROOT, "exports")

STL_TOL = 0.02          # linear deflection for STL tessellation (mm) -- fine enough for 0.20mm layers
STL_ANGULAR_TOL = 0.1


def as_compound(shapes):
    """Combine several Workplanes into ONE file while keeping each part a
    distinct, separate solid -- NOT a boolean union. Booleaning parts that
    are only meant to sit next to each other (with running clearance, or
    touching at a mounting face) risks CAD welding them into a single
    rigid blob wherever a tiny numerical sliver overlap exists, which is
    both misleading (it no longer looks like 3 assembled parts) and
    unprintable as a working hinge (nothing can rotate anymore)."""
    solids = [s for shape in shapes for s in shape.vals()]
    return cq.Workplane(obj=cq.Compound.makeCompound(solids))


def export_part(shape, path_no_ext):
    stl_path = path_no_ext + ".stl"
    step_path = path_no_ext + ".step"
    cq.exporters.export(shape, stl_path, tolerance=STL_TOL, angularTolerance=STL_ANGULAR_TOL)
    cq.exporters.export(shape, step_path)
    print(f"  wrote {os.path.relpath(stl_path, ROOT)}")
    print(f"  wrote {os.path.relpath(step_path, ROOT)}")


def build_and_export_side(mirror, side_name):
    print(f"\n=== {side_name} ===")
    parts = M.build_side(mirror=mirror)
    out_dir = os.path.join(EXPORTS, side_name.lower())
    os.makedirs(out_dir, exist_ok=True)

    for part_name, shape in parts.items():
        export_part(shape, os.path.join(out_dir, f"{side_name.lower()}_{part_name}"))

    # Combined assembly (closed pose) as one multi-solid STEP/STL -- a
    # compound of the 3 (4-body) parts as-modelled, NOT boolean-unioned,
    # so it still visually and functionally reads as 3 separate printed
    # parts sitting together, not one fused block. Useful for a single
    # test-fit print-check or a single import into other CAD.
    assembly = as_compound([parts["base_clamp"], parts["bridge"], parts["screen_clamp"]])
    export_part(assembly, os.path.join(out_dir, f"{side_name.lower()}_assembly_closed"))
    threemf_path = os.path.join(out_dir, f"{side_name.lower()}_assembly_closed.3mf")
    cq.exporters.export(assembly, threemf_path)
    print(f"  wrote {os.path.relpath(threemf_path, ROOT)}")

    # Exploded view: same three parts, pulled apart along Z (and Bridge
    # pushed back in -X) so every part is visible and separated in one
    # file -- a simple, deterministic stand-in for a Fusion360 "exploded
    # assembly" view.
    explode_gap = 40.0
    base_e = parts["base_clamp"]
    bridge_e = parts["bridge"].translate((-explode_gap, 0, 0))
    screen_e = parts["screen_clamp"].translate((0, 0, explode_gap))
    exploded = as_compound([base_e, bridge_e, screen_e])
    export_part(exploded, os.path.join(out_dir, f"{side_name.lower()}_assembly_exploded"))

    return parts


def main():
    os.makedirs(EXPORTS, exist_ok=True)
    build_and_export_side(mirror=False, side_name="Left")
    build_and_export_side(mirror=True, side_name="Right")
    print("\nAll exports complete.")


if __name__ == "__main__":
    main()
