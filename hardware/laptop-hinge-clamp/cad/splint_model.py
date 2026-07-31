"""
UNIVERSAL LID CORNER SPLINT -- parametric CadQuery model.

Geometry frame
--------------
The lid is a slab lying flat:
    - lid material occupies X > 0, Y > 0
    - front (bezel) face at Z = 0
    - rear cover face at Z = CHANNEL_OPENING
    - the two broken edges are X = 0 (side edge) and Y = 0 (hinge edge)

The splint is an L in plan (wrapping the X=0 / Y=0 corner) and a C in
cross-section (wrapping over each edge). It grips the rear cover with a
long jaw, catches the outer bezel frame with a short thin lip, and is
clamped by M3 set screws that press down through the rear jaw.

No pivot, no hinge axis, no alignment requirement -- see splint_params.py.
"""

import cadquery as cq
import splint_params as P

OPEN = P.CHANNEL_OPENING            # lid sits in Z = [0, OPEN]
Z_REAR_JAW_0 = OPEN                 # rear jaw underside
Z_REAR_JAW_1 = OPEN + P.WALL        # rear jaw top
Z_FRONT_0 = -P.FRONT_LIP_THK        # front lip underside
Z_TOP = Z_REAR_JAW_1
Z_BOT = Z_FRONT_0 if P.FRONT_LIP > 0 else 0.0


def _box(x0, x1, y0, y1, z0, z1):
    """Axis-aligned box from explicit min/max in every axis."""
    return cq.Workplane(obj=cq.Solid.makeBox(
        x1 - x0, y1 - y0, z1 - z0, cq.Vector(x0, y0, z0)
    ))


def _cyl(radius, height, base, axis=(0, 0, 1)):
    return cq.Workplane(obj=cq.Solid.makeCylinder(
        radius, height, cq.Vector(*base), cq.Vector(*axis)
    ))


def _fillet_safe(wp, selector, radius):
    """Fillet if possible, otherwise return the original body untouched.

    Checks isValid() on the result and rolls back if the fillet corrupted
    the solid. This matters: OCC does not always raise on a bad fillet --
    it can return a self-intersecting solid that silently tessellates into
    a non-watertight, unprintable STL. Catching the exception alone is not
    enough; the result has to be validated.
    """
    try:
        sel = wp.edges(selector)
        if not sel.vals():
            return wp
        out = sel.fillet(radius)
        if not out.val().isValid():
            return wp
        return out
    except Exception:
        return wp


def _leg(along, length):
    """One C-section leg wrapping one edge.

    along='X' -> leg runs along the hinge edge (Y=0), wraps in -Y
    along='Y' -> leg runs along the side edge  (X=0), wraps in -X
    """
    if along == "X":
        x0, x1 = -P.WALL, length
        back = _box(x0, x1, -P.WALL, 0.0, Z_BOT, Z_TOP)
        rear_jaw = _box(x0, x1, -P.WALL, P.REAR_GRIP, Z_REAR_JAW_0, Z_REAR_JAW_1)
        leg = back.union(rear_jaw)
        if P.FRONT_LIP > 0:
            front = _box(x0, x1, -P.WALL, P.FRONT_LIP, Z_FRONT_0, 0.0)
            leg = leg.union(front)
    else:
        y0, y1 = -P.WALL, length
        back = _box(-P.WALL, 0.0, y0, y1, Z_BOT, Z_TOP)
        rear_jaw = _box(-P.WALL, P.REAR_GRIP, y0, y1, Z_REAR_JAW_0, Z_REAR_JAW_1)
        leg = back.union(rear_jaw)
        if P.FRONT_LIP > 0:
            front = _box(-P.WALL, P.FRONT_LIP, y0, y1, Z_FRONT_0, 0.0)
            leg = leg.union(front)
    return leg


def _screw_positions():
    """(x, y) of each clamping set screw, on the rear jaw."""
    pts = []
    # Along the hinge-edge leg: spread from the corner outward.
    span = P.LEG_HINGE_LEN - P.SCREW_INSET
    for i in range(P.N_SCREWS_HINGE_LEG):
        frac = (i + 1) / (P.N_SCREWS_HINGE_LEG + 1)
        pts.append((P.SCREW_INSET + frac * span, P.SCREW_INSET))
    # Along the side-edge leg.
    span_s = P.LEG_SIDE_LEN - P.SCREW_INSET
    for i in range(P.N_SCREWS_SIDE_LEG):
        frac = (i + 1) / (P.N_SCREWS_SIDE_LEG + 1)
        pts.append((P.SCREW_INSET, P.SCREW_INSET + frac * span_s))
    return pts


def splint(mirror=False):
    """Build the complete universal corner splint.

    mirror=True produces the opposite-hand part by a true CAD mirror of
    the solid about the X=Y diagonal plane... see mirror_other_hand().
    """
    body = _leg("X", P.LEG_HINGE_LEN).union(_leg("Y", P.LEG_SIDE_LEN))

    # --- fillets, applied EARLY on clean geometry ------------------------
    # Deliberately before the pockets and holes below. Filleting last would
    # catch the 1mm-deep pad-recess corners with a 3mm radius, which
    # overflows those edges and silently produces an invalid solid.
    body = _fillet_safe(body, "|Z", P.FILLET)
    body = _fillet_safe(body, ">Z", P.FILLET * 0.4)

    # --- clamping set screws: insert boss + insert bore ------------------
    for (sx, sy) in _screw_positions():
        boss = _cyl(P.INSERT_BOSS_OD / 2.0, P.INSERT_BOSS_H,
                    (sx, sy, Z_REAR_JAW_1))
        body = body.union(boss)
        bore = _cyl(P.INSERT_DIA / 2.0, P.INSERT_DEPTH + P.INSERT_BOSS_H + 0.5,
                    (sx, sy, Z_REAR_JAW_1 + P.INSERT_BOSS_H + 0.5),
                    axis=(0, 0, -1))
        body = body.cut(bore)
        # through-hole so the screw tip can reach the lid surface
        thru = _cyl(P.SCREW_CLEARANCE_DIA / 2.0, P.WALL + P.INSERT_BOSS_H + 1.0,
                    (sx, sy, Z_REAR_JAW_1 + P.INSERT_BOSS_H + 0.5),
                    axis=(0, 0, -1))
        body = body.cut(thru)

    # --- cable / wiring pass-through ------------------------------------
    # Antenna and display wiring enters the lid at the hinge edge and would
    # otherwise be pinched between the splint's back wall and the lid edge.
    # A round pass-through in the back wall gives it somewhere to go.
    #
    # Deliberately NOT placed at the corner: a cut there severs the two
    # legs and strands the outer corner as a loose island. It is also cut
    # only BELOW the rear jaw (top of hole < CHANNEL_OPENING), so the jaw
    # bridges continuously over it and the part stays one solid.
    hole_z = OPEN / 2.0
    assert hole_z + P.CABLE_RELIEF_R < OPEN, "cable hole would breach the rear jaw"
    for slot_x in P.CABLE_SLOT_X:
        wire = _cyl(P.CABLE_RELIEF_R, P.WALL + 2.0,
                    (slot_x, -P.WALL - 1.0, hole_z), axis=(0, 1, 0))
        body = body.cut(wire)

    # --- soft-pad recesses on the gripping faces -------------------------
    # Rear jaw underside: the main load-bearing contact patch.
    pad_inset = 3.0
    pad_rear_hinge = _box(pad_inset, P.LEG_HINGE_LEN - pad_inset,
                          pad_inset, P.REAR_GRIP - pad_inset,
                          Z_REAR_JAW_0, Z_REAR_JAW_0 + P.PAD_RECESS_DEPTH)
    body = body.cut(pad_rear_hinge)
    pad_rear_side = _box(pad_inset, P.REAR_GRIP - pad_inset,
                         pad_inset, P.LEG_SIDE_LEN - pad_inset,
                         Z_REAR_JAW_0, Z_REAR_JAW_0 + P.PAD_RECESS_DEPTH)
    body = body.cut(pad_rear_side)

    # Guard: an invalid solid tessellates into a non-watertight STL that
    # slicers will either reject or silently mis-slice. Fail loudly here
    # rather than export unprintable geometry.
    if not body.val().isValid():
        raise RuntimeError(
            "splint(): resulting solid is invalid and would export as a "
            "non-watertight STL -- refusing to return it."
        )

    if mirror:
        body = mirror_other_hand(body)
    return body


def pressure_bar(thickness=None):
    """Part 2: the load-spreading pressure bar.

    The channel is cut oversize so ONE shell fits any lid in the
    LID_THK_MIN..LID_THK_MAX range. That leaves a gap between the lid's
    rear face and the rear jaw. Driving the set screws straight onto the
    lid across that gap would put the whole clamping force on a few 3mm
    screw tips and dent the rear cover.

    This bar goes in between: screws push the bar, the bar pushes the lid
    over a broad padded area. Print the thickness that roughly matches
    your gap (or stack two) and let the screws take up the rest.

        gap ~= CHANNEL_OPENING - (your lid thickness)
        ASUS X541 (lid ~7.3mm) -> gap ~6.7mm -> print the 6mm bar
    """
    t = P.BAR_THK_DEFAULT if thickness is None else thickness
    c = P.BAR_CLEARANCE

    arm_hinge = _box(c, P.LEG_HINGE_LEN - c, c, P.REAR_GRIP - c, 0.0, t)
    arm_side = _box(c, P.REAR_GRIP - c, c, P.LEG_SIDE_LEN - c, 0.0, t)
    bar = arm_hinge.union(arm_side)

    # Soft-pad recess on the face that touches the lid.
    pad_in = 3.0
    if t > P.PAD_RECESS_DEPTH + 1.0:
        pad_h = _box(c + pad_in, P.LEG_HINGE_LEN - c - pad_in,
                     c + pad_in, P.REAR_GRIP - c - pad_in,
                     0.0, P.PAD_RECESS_DEPTH)
        bar = bar.cut(pad_h)
        pad_s = _box(c + pad_in, P.REAR_GRIP - c - pad_in,
                     c + pad_in, P.LEG_SIDE_LEN - c - pad_in,
                     0.0, P.PAD_RECESS_DEPTH)
        bar = bar.cut(pad_s)

    # Shallow dimples on the top face so the screw tips stay located
    # instead of skating across the bar as they are tightened.
    for (sx, sy) in _screw_positions():
        dimple = _cyl(P.SCREW_CLEARANCE_DIA / 2.0 + 0.4, P.BAR_DIMPLE_DEPTH,
                      (sx, sy, t), axis=(0, 0, -1))
        bar = bar.cut(dimple)

    bar = _fillet_safe(bar, "|Z", P.FILLET)
    if not bar.val().isValid():
        raise RuntimeError(
            f"pressure_bar({t}): resulting solid is invalid -- refusing to "
            "return geometry that would export as a non-watertight STL."
        )
    return bar


def mirror_other_hand(shape):
    """True CAD mirror (BREP, not a mesh flip) about the YZ plane, giving
    the opposite-hand corner splint for the other side of the laptop."""
    return shape.mirror(mirrorPlane="YZ")
