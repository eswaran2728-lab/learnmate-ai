"""
Fit verification for the UNIVERSAL LID CORNER SPLINT.

Unlike the pivoting design, there is no hinge motion to sweep here -- the
splint is rigid and static, so the meaningful checks are:

  1. Does the shell actually slip over a real lid without interfering?
     (simulated as a slab with a realistic rounded corner)
  2. Does the lid + pressure bar stack fit inside the channel, leaving a
     sensible amount for the set screws to take up?
  3. Is the part a single solid, and is the opposite hand a genuine
     mirror rather than a no-op on a symmetric shape?

Run: python3 check_splint.py
"""
import cadquery as cq
import splint_model as S
import splint_params as P

LID_CORNER_R = 8.0     # typical laptop lid corner radius


def sim_lid(thickness, corner_r=LID_CORNER_R, size=200.0):
    """A stand-in for the laptop lid: occupies X>0, Y>0, Z in [0,thickness],
    with a rounded corner at the origin like a real lid has."""
    slab = S._box(0.0, size, 0.0, size, 0.0, thickness)
    # carve the rounded corner: remove the square corner, add back the fillet
    corner_block = S._box(0.0, corner_r, 0.0, corner_r, -1.0, thickness + 1.0)
    slab = slab.cut(corner_block)
    fillet_cyl = S._cyl(corner_r, thickness, (corner_r, corner_r, 0.0))
    quarter = fillet_cyl.intersect(
        S._box(0.0, corner_r, 0.0, corner_r, 0.0, thickness)
    )
    return slab.union(quarter)


def vol(wp):
    solids = wp.solids().vals()
    return sum(s.Volume() for s in solids) if solids else 0.0


def main():
    shell = S.splint()
    n = len(shell.solids().vals())
    print(f"shell solids                     : {n}  {'OK' if n == 1 else 'FAIL - must be 1'}")

    # --- 1. interference against a real lid ------------------------------
    print("\nlid interference (shell must not clash with the lid it slips over):")
    worst = 0.0
    for thk in (P.LID_THK_MIN, P.LID_THK, P.LID_THK_MAX):
        lid = sim_lid(thk)
        overlap = vol(shell.intersect(lid))
        worst = max(worst, overlap)
        tag = "OK" if overlap < 1.0 else "INTERFERENCE"
        note = "  <- ASUS X541" if abs(thk - 7.3) < 0.01 else ""
        print(f"  lid {thk:5.1f} mm  overlap = {overlap:9.3f} mm^3   {tag}{note}")

    # --- 1b. the constraint that killed v1 --------------------------------
    # Y=0 is the lid's bottom (hinge) edge; below it is the measured 4.1mm
    # gap to the keyboard deck. v1 wrapped that edge and put 6mm of wall
    # into it, which is why the printed part did not fit. Nothing may
    # protrude below Y=0 unless it clears the gap with margin.
    bb = shell.val().BoundingBox()
    protrusion = max(0.0, -bb.ymin)
    budget = P.SCREEN_DECK_GAP - P.GAP_SAFETY
    gap_ok = protrusion <= budget
    print(f"\nscreen-to-deck gap ({P.SCREEN_DECK_GAP} mm measured):")
    print(f"  protrusion below lid bottom edge = {protrusion:.2f} mm "
          f"(budget {budget:.2f} mm)   {'OK' if gap_ok else 'WILL NOT FIT'}")

    # --- 2. clamping travel ----------------------------------------------
    # v2 sizes the channel to the lid, so the question is no longer "which
    # gap-filling bar do I need" but "do the set screws have room to
    # actually clamp". Budget: a 1mm TPU pad, then usable screw travel.
    print("\nclamping travel (screws must have room to bite after the pad):")
    stack_ok = True
    for thk in (P.LID_THK_MIN, P.LID_THK, P.LID_THK_MAX):
        gap = P.CHANNEL_OPENING - thk
        travel = gap - P.PAD_RECESS_DEPTH
        ok = 0.4 <= travel <= 4.0
        stack_ok = stack_ok and ok
        note = "  <- ASUS X541 (inferred)" if abs(thk - P.LID_THK) < 0.01 else ""
        print(f"  lid {thk:5.1f} mm  gap {gap:4.1f}  pad {P.PAD_RECESS_DEPTH:3.1f}  "
              f"screw travel {travel:4.1f} mm  {'OK' if ok else 'CHECK'}{note}")

    # --- 3. handedness ----------------------------------------------------
    # Deliberately avoids a boolean cut between the two filleted solids --
    # that is expensive enough to exhaust memory on this geometry. Volume
    # preserved + centroid reflected proves the same thing far cheaper: a
    # mirror that neither distorts the solid nor leaves it unchanged.
    other = S.mirror_other_hand(shell)
    c0, c1 = shell.val().Center(), other.val().Center()
    same_vol = abs(vol(shell) - vol(other)) < 1e-6
    reflected = abs(c1.x + c0.x) < 1e-6 and abs(c1.y - c0.y) < 1e-6
    handed = abs(c0.x) > 1.0          # centroid off the mirror plane => not symmetric
    print("\nopposite hand (true CAD mirror, not a mesh flip):")
    print(f"  volume preserved : {same_vol}   (mirror must not distort the solid)")
    print(f"  centroid reflected: {reflected}   (x flips sign, y/z unchanged)")
    print(f"  genuinely handed : {handed}   (centroid x={c0.x:.2f} is off the mirror plane,")
    print(f"                                 so the mirror is not a no-op)")
    differs = reflected and handed

    ok_all = n == 1 and worst < 1.0 and same_vol and differs and gap_ok and stack_ok
    print("\nRESULT:", "PASS" if ok_all else "FAIL")
    return ok_all


if __name__ == "__main__":
    main()
