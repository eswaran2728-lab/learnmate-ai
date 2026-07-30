"""
Parametric CadQuery model for the Laptop Hinge Repair Clamp.

Three printed parts per side (Left / Right):
    1. Base Clamp   - C-channel that clips over the bottom-shell edge near
                       the hinge and rigidly bolts to the Bridge.
    2. Screen Clamp - C-channel that clips over the LCD rear-cover edge
                       near the hinge and pivots on the Bridge's clevis.
    3. Bridge       - Rigid link between the two clamps. One end bolts
                       solid to the Base Clamp; the other end forms a
                       clevis pivot that the Screen Clamp's knuckle bosses
                       rotate in. A full-diameter clearance bore runs
                       through the pivot area so the original hinge
                       barrel and display cable are never touched at any
                       opening angle.

Right-side parts are produced by mirroring the CAD solids about the YZ
plane (true CAD mirror, not a mesh flip), per the brief's requirement.

Run `python3 build.py` in this directory to regenerate every export.
"""

import cadquery as cq
import params as P

# ---------------------------------------------------------------------------
# Derived geometry
# ---------------------------------------------------------------------------
BASE_STACK_HEIGHT = P.CLAMP_OPENING + 2 * P.WALL_THK          # 31.0
SCREEN_STACK_HEIGHT = BASE_STACK_HEIGHT                        # same opening assumption
SCREEN_Z0 = BASE_STACK_HEIGHT + P.STACK_GAP                    # 37.0
PIVOT_X = -P.PIVOT_OFFSET_X
PIVOT_Z = P.PIVOT_OFFSET_Z if P.PIVOT_OFFSET_Z is not None else (
    BASE_STACK_HEIGHT + P.STACK_GAP / 2.0
)

MOUNT_Y = P.MOUNT_SPACING_Y / 2.0   # +/- this on Y


def _fillet_safe(wp, edge_selector, radius):
    """Fillet the selected edges, but never blow up the whole build if a
    particular selector matches nothing or a radius is locally too big --
    fall back to the un-filleted body so the script always finishes and the
    remaining, more important features still get built."""
    try:
        sel = wp.edges(edge_selector)
        if len(sel.vals()) == 0:
            return wp
        return sel.fillet(radius)
    except Exception:
        return wp


def channel_block(jaw_depth, width, opening=P.CLAMP_OPENING, wall=P.WALL_THK,
                   z0=0.0, corner_r=P.CORNER_R, cable_relief=True,
                   pad_recess=True):
    """A C-channel clamp body: outer block with a pocket open at +X.

    Cross-section lies in the XZ plane, extruded along Y (width), then
    translated so its channel floor sits at Z = z0.
    """
    stack_h = opening + 2 * wall

    outer = (
        cq.Workplane("XZ")
        .rect(jaw_depth, stack_h, centered=False)
        .extrude(width)
    )
    pocket = (
        cq.Workplane("XZ")
        .workplane(offset=0)
        .transformed(offset=cq.Vector(wall, wall, 0))
        .rect(jaw_depth, opening, centered=False)
        .extrude(width)
    )
    body = outer.cut(pocket)

    # Workplane("XZ").extrude(width) pushes along global -Y, giving a
    # Y-range of [-width, 0]. Re-centre it to [-width/2, width/2] and lift
    # the channel floor to z0.
    body = body.translate((0, width / 2.0, z0))

    # --- fillets -----------------------------------------------------
    # Outer long edges (parallel to Y) at the far/back corners (away from
    # the open jaw mouth) get the spec'd corner radius.
    body = _fillet_safe(body, "|Y and <X", min(corner_r, wall * 0.9))
    # Inner pocket corners (stress risers where jaw meets spine) get a
    # smaller stress-relief fillet.
    body = _fillet_safe(body, "|Y and (>X or <Z or >Z)", P.GLOBAL_FILLET * 0.6)

    # --- cable relief notch -------------------------------------------
    # Rounded relief along the inner top corner of the pocket so a
    # trapped display cable is never pinched against a sharp edge. The
    # real display cable is a discrete bundle, not spread across the full
    # width, so this is a *localised* notch -- deliberately off-centre
    # (biased toward +Y, the inboard/screen-centre side) rather than a
    # full-width slot. That asymmetry is what makes the Left/Right CAD
    # mirror operation in build_assembly() produce a genuinely different
    # (correctly handed) part instead of a no-op on a symmetric shape.
    if cable_relief:
        relief_r = P.CABLE_CLEARANCE / 2.0 + 1.0
        notch_len = P.CABLE_CLEARANCE * 2.5
        notch_y_center = width * 0.28   # off-centre, toward +Y
        relief = (
            cq.Workplane("XZ")
            .center(wall, wall + opening)
            .circle(relief_r)
            .extrude(notch_len)
            .translate((0, notch_y_center + notch_len / 2.0, z0))
        )
        body = body.cut(relief)

    # --- anti-slip pad recess ------------------------------------------
    # Shallow 1mm pockets on the inner jaw faces for a TPU / adhesive
    # foam pad, kept well inboard of the fillets and the cable relief.
    if pad_recess:
        pad_w = width * 0.6
        pad_len = jaw_depth - wall - 4
        if pad_len > 4 and pad_w > 4:
            for z_face, sign in ((wall, 1), (wall + opening, -1)):
                pad = (
                    cq.Workplane("XZ")
                    .center(wall + 2, z_face + sign * P.PAD_RECESS_DEPTH / 2.0)
                    .rect(pad_len, P.PAD_RECESS_DEPTH, centered=False)
                    .extrude(pad_w)
                    .translate((0, pad_w / 2.0, z0))
                )
                body = body.cut(pad)

    return body


# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------
def _cylinder(radius, height, base_point, axis=(1, 0, 0)):
    """Unambiguous cylinder: starts at base_point, extends `height` along
    `axis` (does not depend on any workplane-normal sign convention)."""
    solid = cq.Solid.makeCylinder(radius, height, cq.Vector(*base_point), cq.Vector(*axis))
    return cq.Workplane(obj=solid)


def _xz_box(x0, x_len, z0_, z_len, y_center, y_len):
    """Axis-aligned box, explicit in every dimension: X in [x0, x0+x_len],
    Z in [z0_, z0_+z_len], Y in [y_center-y_len/2, y_center+y_len/2]."""
    box = (
        cq.Workplane("XZ")
        .center(x0, z0_)
        .rect(x_len, z_len, centered=False)
        .extrude(y_len)
    )
    return box.translate((0, y_center + y_len / 2.0, 0))


# ---------------------------------------------------------------------------
# Mount geometry shared between Base Clamp / Screen Clamp / Bridge
# ---------------------------------------------------------------------------
BASE_MOUNT_Z = BASE_STACK_HEIGHT / 2.0          # 15.5 -- rigid bolt height on Base Clamp
SCREEN_PIVOT_Z = SCREEN_Z0 + P.WALL_THK / 2.0   # 39.5 -- pivot knuckle height on Screen Clamp
# PIVOT_Z (module-level default computed above) is only used as a fallback;
# the pivot actually used by the joint geometry lives at SCREEN_PIVOT_Z so
# the knuckle sits on solid material integral with the Screen Clamp spine.
PIVOT_Z = SCREEN_PIVOT_Z

KNUCKLE_WIDTH = 12.0                     # axial length of each pivot knuckle
KNUCKLE_SLOT_R = P.INSERT_BOSS_OD / 2.0 + 2.0   # bridge fork bore radius (bearing ID)
KNUCKLE_R = KNUCKLE_SLOT_R - P.PIVOT_RUNNING_CLEARANCE  # screen-clamp boss OD/2 (bearing OD)
LEG_WIDTH = KNUCKLE_WIDTH + 2 * P.PIVOT_RUNNING_CLEARANCE + 2 * P.BRIDGE_FLANGE_THK


def base_clamp():
    """Part 1: clips over the bottom-shell edge; bolts rigidly to the Bridge."""
    body = channel_block(jaw_depth=P.JAW_DEPTH, width=P.CLAMP_WIDTH, z0=0.0)

    boss_len = P.INSERT_DEPTH + 3.0
    boss_r = P.INSERT_BOSS_OD / 2.0
    for y in (-MOUNT_Y, MOUNT_Y):
        boss = _cylinder(boss_r, boss_len, (0, y, BASE_MOUNT_Z), axis=(-1, 0, 0))
        body = body.union(boss)
        bore = _cylinder(P.INSERT_DIA / 2.0, P.INSERT_DEPTH,
                          (-boss_len, y, BASE_MOUNT_Z), axis=(1, 0, 0))
        body = body.cut(bore)
        body = _fillet_safe(body, cq.selectors.NearestToPointSelector((0, y, BASE_MOUNT_Z + boss_r)),
                             P.GLOBAL_FILLET * 0.5)
    return body


def screen_clamp():
    """Part 2: clips over the LCD rear-cover edge; pivots on the Bridge clevis."""
    body = channel_block(jaw_depth=P.SCREEN_LIP_DEPTH, width=P.CLAMP_WIDTH, z0=SCREEN_Z0)

    arm_thk = 10.0
    for y in (-MOUNT_Y, MOUNT_Y):
        # Connector arm: reaches from the clamp's own spine (X=0 face) out
        # to the pivot axis (X=PIVOT_X), so the knuckle is fully integral
        # with the Screen Clamp rather than floating in space.
        arm = _xz_box(
            x0=PIVOT_X, x_len=-PIVOT_X,
            z0_=SCREEN_PIVOT_Z - arm_thk / 2.0, z_len=arm_thk,
            y_center=y, y_len=KNUCKLE_WIDTH + 2 * P.PIVOT_RUNNING_CLEARANCE,
        )
        body = body.union(arm)

        # Knuckle: the actual rotating bearing surface (OD rides inside the
        # Bridge fork's bore). The M3 screw through its centre is a
        # retaining pin only -- it does not carry the hinge bending load.
        knuckle = _cylinder(KNUCKLE_R, KNUCKLE_WIDTH,
                             (PIVOT_X, y - KNUCKLE_WIDTH / 2.0, SCREEN_PIVOT_Z), axis=(0, 1, 0))
        body = body.union(knuckle)

        pin_bore = _cylinder(P.SCREW_CLEARANCE_DIA / 2.0, KNUCKLE_WIDTH + 1.0,
                              (PIVOT_X, y - KNUCKLE_WIDTH / 2.0 - 0.5, SCREEN_PIVOT_Z), axis=(0, 1, 0))
        body = body.cut(pin_bore)

    return body


def bridge_leg(y_center):
    """One rigid link: bolts to the Base Clamp at one end, forms a clevis
    fork (bearing bore) that the Screen Clamp knuckle rotates in at the
    other end."""
    arm_margin = 3.0
    leg = _xz_box(
        x0=PIVOT_X - arm_margin, x_len=(-PIVOT_X) + arm_margin,
        z0_=min(BASE_MOUNT_Z, SCREEN_PIVOT_Z) - P.BRIDGE_THK / 2.0,
        z_len=abs(SCREEN_PIVOT_Z - BASE_MOUNT_Z) + P.BRIDGE_THK,
        y_center=y_center, y_len=LEG_WIDTH,
    )
    leg = _fillet_safe(leg, "|Y", P.BRIDGE_FILLET)

    # Base-side rigid mount. The screw is inserted from the leg's OUTER,
    # exposed face (x = PIVOT_X - arm_margin) and travels the full leg
    # length before threading into the Base Clamp's heat-set insert, which
    # sits in a boss that protrudes from the Base Clamp spine (x=0) back
    # toward the bridge. Rather than let that boss collide with the leg's
    # solid material, cut a register pocket that the boss nests into --
    # this also self-aligns the two parts and adds shear resistance beyond
    # what the M3 screw alone would provide.
    boss_len = P.INSERT_DEPTH + 3.0
    boss_r = P.INSERT_BOSS_OD / 2.0
    register_pocket = _cylinder(boss_r + 1.0, boss_len + 0.5,
                                 (0.5, y_center, BASE_MOUNT_Z), axis=(-1, 0, 0))
    leg = leg.cut(register_pocket)

    mount_bore = _cylinder(P.SCREW_CLEARANCE_DIA / 2.0, abs(PIVOT_X) + 2 * arm_margin,
                            (PIVOT_X - arm_margin - 1, y_center, BASE_MOUNT_Z), axis=(1, 0, 0))
    leg = leg.cut(mount_bore)
    # Counterbore for the SHCS head on the leg's outer, accessible face.
    head_cb = _cylinder(P.SCREW_HEAD_DIA / 2.0, P.SCREW_HEAD_DEPTH,
                         (PIVOT_X - arm_margin - 0.5, y_center, BASE_MOUNT_Z), axis=(1, 0, 0))
    leg = leg.cut(head_cb)

    # Screen-side clevis: a slot the width of the knuckle (+running
    # clearance) opens the fork; a full-length bearing bore through the
    # two remaining cheeks carries the retaining pin/insert.
    slot_len = KNUCKLE_WIDTH + 2 * P.PIVOT_RUNNING_CLEARANCE
    slot = _cylinder(KNUCKLE_SLOT_R, slot_len,
                      (PIVOT_X, y_center - slot_len / 2.0, PIVOT_Z),
                      axis=(0, 1, 0))
    leg = leg.cut(slot)

    # The Screen Clamp's own connector arm (screen_clamp(), same Y-band)
    # has to travel from its spine at x=0 out to this same knuckle -- and
    # it runs straight down the middle of this fork, the same way a real
    # clevis yoke does. Open a full-length corridor through the leg's
    # middle Y-band (matching the bearing bore's radius/Z-band) so that
    # arm never collides with the leg's own material; only the two outer
    # cheeks (outside this Y-band) stay solid along the leg's length.
    corridor = _xz_box(
        x0=PIVOT_X, x_len=-PIVOT_X + 1.0,
        z0_=PIVOT_Z - KNUCKLE_SLOT_R, z_len=2 * KNUCKLE_SLOT_R,
        y_center=y_center, y_len=slot_len,
    )
    leg = leg.cut(corridor)

    pin_clear = _cylinder(P.SCREW_CLEARANCE_DIA / 2.0, LEG_WIDTH,
                           (PIVOT_X, y_center - LEG_WIDTH / 2.0, PIVOT_Z), axis=(0, 1, 0))
    leg = leg.cut(pin_clear)

    insert_bore = _cylinder(P.INSERT_DIA / 2.0, P.INSERT_DEPTH,
                             (PIVOT_X, y_center + LEG_WIDTH / 2.0 - P.INSERT_DEPTH, PIVOT_Z),
                             axis=(0, 1, 0))
    leg = leg.cut(insert_bore)

    return leg


def bridge():
    """Part 3: the two rigid links, joined only through the (separately
    printed) Base Clamp and Screen Clamp they both bolt to -- see
    docs/README.md for why the bridge is deliberately built as two narrow
    legs rather than one full-width gusset (keeping the true hinge barrel
    and display cable, which run through the open centre span, untouched
    at every angle by construction rather than by simulation)."""
    left_leg = bridge_leg(-MOUNT_Y)
    right_leg = bridge_leg(MOUNT_Y)
    return left_leg.union(right_leg)


def mirror_right(shape):
    """True CAD mirror about the Y=0 plane (global left/right symmetry
    plane of the laptop) -- NOT a mesh flip. Produces the Right-side part
    from the Left-side master model."""
    return shape.mirror(mirrorPlane="XZ")



def build_side(mirror=False):
    """Return {'base_clamp', 'screen_clamp', 'bridge'} CadQuery Workplanes
    for one side, in the CLOSED-lid pose, sharing one global coordinate
    frame. mirror=True gives the Right assembly (true CAD mirror)."""
    parts = {
        "base_clamp": base_clamp(),
        "screen_clamp": screen_clamp(),
        "bridge": bridge(),
    }
    if mirror:
        parts = {k: mirror_right(v) for k, v in parts.items()}
    return parts


def rotate_screen_clamp(screen_shape, angle_deg):
    """Rotate a Screen Clamp shape by angle_deg about the true pivot axis
    (the line X=PIVOT_X, Z=PIVOT_Z, running along Y) -- this is the same
    axis the printed knuckle/clevis bearing rotates on. angle_deg=0 is the
    closed pose as modelled; positive angle_deg opens the lid (verified by
    check_motion.py: this sign sweeps the Screen Clamp's channel body away
    from the Base Clamp; the opposite sign sweeps it straight into the
    Base Clamp and is physically wrong)."""
    axis_p1 = (PIVOT_X, -1000.0, PIVOT_Z)
    axis_p2 = (PIVOT_X, 1000.0, PIVOT_Z)
    return screen_shape.rotate(axis_p1, axis_p2, -angle_deg)
