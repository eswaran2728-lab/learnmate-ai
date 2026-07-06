"""
SEPANG DISTRICT OPEN SILAMBAM CHAMPIONSHIP 2026 - Appreciation Award Trophy
============================================================================
Parametric, production-ready 3D trophy generator for FDM printing
(Bambu Lab P1S / A1 Mini, AMS/MMU multi-color).

Coordinate system (modeled lying on its back = print orientation):
    X = width   (centered on 0)
    Y = height  (0 = bottom of base, 250 = top of trophy)
    Z = depth   (0 = flat back plane / print bed, +Z = toward viewer)

Outputs:
    output/trophy_upper_part_A.stl      - fused upper decorative section
    output/trophy_base_part_B.stl       - fused lower base section
    output/trophy_full_assembly.stl     - complete assembled trophy
    output/trophy.step                  - STEP assembly (all color bodies)
    output/trophy_multicolor.3mf        - multi-color 3MF (separated bodies)
    output/bodies/*.stl                 - each color body as its own STL
"""

import math
import os
from build123d import (
    Align, Axis, Box, Circle, Compound, Cylinder, Ellipse, Plane, Polygon,
    Pos, Rectangle, Rot, SlotCenterToCenter, Text, chamfer, export_step,
    export_stl, scale,
)

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
BODY_OUT = os.path.join(OUT, "bodies")
os.makedirs(BODY_OUT, exist_ok=True)

# ---------------------------------------------------------------- constants
TEXT_RAISE = 1.5          # embossed text depth  (spec: >= 1.2 mm)
BORDER_RAISE = 1.5        # raised gold border frames
DISC_C = (0.0, 164.0)     # circular background centre
DISC_R = 62.0             # circular background radius
RIM_RI, RIM_RO = 58.0, 63.0
BASE_TOP = 100.0          # split plane between Part A and Part B

TENON_W, TENON_H, TENON_T = 16.0, 18.0, 8.0   # connector 18 mm deep
TENON_X = 25.0                                 # +/- centre of connectors
TENON_Z0 = 4.0                                 # connector front/back position
CLR = 0.25                                     # connector tolerance per side


# ---------------------------------------------------------------- helpers
def ex(sk, z0, z1):
    """Extrude an XY sketch from z0 to z1."""
    from build123d import extrude
    return extrude(Plane.XY.offset(z0) * sk, z1 - z0)


def ring_sector(cx, cy, r_in, r_out, a0, a1, n=48):
    """2D annular sector centred at (cx,cy), angles in degrees CCW from +X."""
    ring = Circle(r_out) - Circle(r_in)
    pts = [(0.0, 0.0)]
    rr = r_out * 1.5
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        pts.append((rr * math.cos(a), rr * math.sin(a)))
    wedge = Polygon(*pts, align=None)
    return Pos(cx, cy) * (ring & wedge)


def capsule(p1, p2, r):
    """2D capsule (thick line segment) between p1 and p2."""
    dx, dy = p2[0] - p1[0], p2[1] - p1[1]
    ln = math.hypot(dx, dy)
    mid = ((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2)
    ang = math.degrees(math.atan2(dy, dx))
    return Pos(*mid) * Rot(0, 0, ang) * SlotCenterToCenter(ln, 2 * r)


def fit_text(txt, height, max_w):
    """Text sketch scaled so glyph bbox height == height, capped to max_w."""
    t = Text(txt, 10, font_path=FONT, align=(Align.CENTER, Align.CENTER))
    bb = t.bounding_box()
    s = height / bb.size.Y
    if bb.size.X * s > max_w:
        s = max_w / bb.size.X
    t = scale(t, by=s)
    bb = t.bounding_box()
    # re-centre after scaling
    return Pos(-(bb.min.X + bb.max.X) / 2, -(bb.min.Y + bb.max.Y) / 2) * t


def frame(w, h, t):
    """2D rectangular frame, outer w x h, band width t."""
    return Rectangle(w, h) - Rectangle(w - 2 * t, h - 2 * t)


# ===========================================================================
# PART B - LOWER BASE SECTION (black pedestal + gold text/borders + ribbon)
# ===========================================================================
print("Building Part B (base) ...")

# --- stepped black pedestal ------------------------------------------------
# (y0, y1, half_width_bottom, half_width_top, depth)
tiers = [
    (0.0, 12.0, 90.0, 90.0, 50.0),     # plinth step 1  (180 wide, 50 deep)
    (12.0, 21.0, 83.0, 83.0, 46.0),    # plinth step 2
    (21.0, 32.0, 77.0, 77.0, 43.0),    # plinth step 3
    (32.0, 54.0, 73.0, 73.0, 40.0),    # APPRECIATION AWARD tier
    (54.0, 100.0, 71.0, 64.0, 37.0),   # main text panel (trapezoid)
]

base_black = None
for (y0, y1, hw0, hw1, d) in tiers:
    sk = Polygon((-hw0, y0), (hw0, y0), (hw1, y1), (-hw1, y1), align=None)
    solid = ex(sk, 0, d)
    # 45 deg chamfer on the two front vertical corners (premium pedestal look)
    ch = 9.0
    for sx in (-1, 1):
        xm = hw0 if y0 < 53 else max(hw0, hw1)
        cut = (
            Pos(sx * (hw0 + hw1) / 2, (y0 + y1) / 2, d)
            * Rot(0, 45, 0)
            * Box(ch * 1.6, (y1 - y0) + 2, ch * 1.6)
        )
        solid -= cut
    base_black = solid if base_black is None else base_black + solid

# --- connector slots (female) ---------------------------------------------
for sx in (-1, 1):
    slot = Pos(sx * TENON_X, BASE_TOP - (TENON_H + CLR * 2) / 2 + 1.0,
               TENON_Z0 + TENON_T / 2) * Box(
        TENON_W + 2 * CLR, TENON_H + 2 * CLR + 2.0, TENON_T + 2 * CLR)
    base_black -= slot

# --- gold border frames ----------------------------------------------------
main_face = 37.0
award_face = 40.0

b_gold = ex(Pos(0, 77) * frame(118, 44, 2.2), main_face,
            main_face + BORDER_RAISE)
b_gold += ex(Pos(0, 43) * frame(130, 17, 2.5), award_face,
             award_face + BORDER_RAISE)

# --- text -------------------------------------------------------------------
main_lines = [
    ("PERSATUAN SILAMBAM MALAYSIA", 5.0, 93.0, 105),
    ("DAERAH  SEPANG", 4.0, 87.0, 105),
    ("SEPANG DISTRICT OPEN", 5.2, 81.0, 105),
    ("SILAMBAM CHAMPIONSHIP 2026", 5.2, 74.5, 105),
    ("BBST SPORTS ARENA", 4.0, 60.0, 105),
]
for (txt, h, ycen, mw) in main_lines:
    b_gold += ex(Pos(0, ycen) * fit_text(txt, h, mw), main_face,
                 main_face + TEXT_RAISE)

b_gold += ex(Pos(0, 43) * fit_text("APPRECIATION AWARD", 7.0, 120),
             award_face, award_face + TEXT_RAISE)

# --- red date ribbon with gold date text ------------------------------------
ribbon = Polygon((-50, 66.75), (-44, 63.5), (44, 63.5), (50, 66.75), (44, 70),
                 (-44, 70), align=None)
b_red = ex(ribbon, main_face, main_face + 1.2)
b_gold += ex(Pos(0, 66.75) * fit_text("★  19 JULY 2026  ★", 4.0, 84),
             main_face + 1.2, main_face + 1.2 + TEXT_RAISE)

# ===========================================================================
# PART A - UPPER DECORATIVE SECTION
# ===========================================================================
print("Building Part A (upper) ...")
CX, CY = DISC_C

# --- BLACK: background disc + neck + connector bosses + tenons ---------------
disc = ex(Pos(CX, CY) * Circle(DISC_R), 0, 6)
neck = ex(Polygon((-38, BASE_TOP), (38, BASE_TOP), (33, 132), (-33, 132),
                  align=None), 0, 6)
a_black = disc + neck

for sx in (-1, 1):
    boss = Pos(sx * TENON_X, 106, 6) * Box(TENON_W, 12, 12)
    a_black += boss
    tenon = Pos(sx * TENON_X, BASE_TOP - TENON_H / 2,
                TENON_Z0 + TENON_T / 2) * Box(TENON_W, TENON_H, TENON_T)
    tenon = chamfer(tenon.edges().group_by(Axis.Y)[0], 1.2)
    a_black += tenon

# --- GOLD: rim ring ----------------------------------------------------------
gold = ex(Pos(CX, CY) * (Circle(RIM_RO) - Circle(RIM_RI)), 0, 9)

# --- GOLD: curved crescent frames -------------------------------------------
# left crescent sweeps over the top-left, right crescent up the right side
gold += ex(ring_sector(CX, CY, 61, 74, 95, 185), 0, 10)
gold += ex(ring_sector(CX, CY, 61, 74, -60, 75), 0, 10)

# --- GOLD: laurel sprigs ------------------------------------------------------
def laurel(a0, a1, n_leaves, flip):
    sk = ring_sector(CX, CY, 61, 67, a0, a1)          # stem band
    for i in range(n_leaves):
        a = a0 + (a1 - a0) * (i + 0.5) / n_leaves
        ar = math.radians(a)
        lx, ly = CX + 70 * math.cos(ar), CY + 70 * math.sin(ar)
        tilt = a + (35 if flip else -35)
        sk += Pos(lx, ly) * Rot(0, 0, tilt) * Ellipse(6.0, 2.8)
    return sk

gold += ex(laurel(192, 250, 6, flip=False), 0, 8)     # left sprig
gold += ex(laurel(290, 348, 6, flip=True), 0, 8)      # right sprig

# nothing decorative may reach below the split plane (base collision)
above_split = ex(Pos(0, 350) * Rectangle(400, 500), -30, 60)
gold &= above_split

# --- GOLD: martial artist silhouette (built from thick capsules) -------------
FX, FY = 1.0, 124.0        # figure feet baseline on the disc
J = lambda x, y: (FX + x, FY + y)

fig = Pos(*J(-10, 90)) * Circle(8.5)                                # head
fig += capsule(J(-8, 78), J(2, 58), 9.5)                            # chest
fig += capsule(J(2, 58), J(5, 44), 8.0)                             # waist/hip
fig += capsule(J(-4, 73), J(-20, 61), 5.5)                          # R upper arm
fig += capsule(J(-20, 61), J(-27, 73), 4.8)                         # R forearm
fig += Pos(*J(-28, 75)) * Circle(5.5)                               # R fist
fig += capsule(J(-35, 61), J(-24, 90), 2.9)                         # hand stick
fig += capsule(J(1, 72), J(14, 62), 5.5)                            # L upper arm
fig += capsule(J(14, 62), J(23, 70), 5.0)                           # L forearm
fig += Pos(*J(24, 71)) * Circle(5.5)                                # L fist
fig += capsule(J(3, 46), J(-18, 27), 7.0)                           # R thigh
fig += capsule(J(-18, 27), J(-26, 8), 6.0)                          # R shin
fig += capsule(J(-29, 4), J(-15, 4), 4.5)                           # R foot
fig += capsule(J(6, 46), J(25, 26), 7.0)                            # L thigh
fig += capsule(J(25, 26), J(30, 8), 6.0)                            # L shin
fig += capsule(J(27, 4), J(41, 4), 4.5)                             # L foot
fig += capsule(J(-6, 52), J(8, 50), 3.0)                            # belt

fig = fig & (Pos(CX, CY) * Circle(DISC_R - 3))       # keep on the disc
fig_solid = ex(fig, 6, 12)                            # 6 mm proud of disc
gold += fig_solid

# --- BROWN: crossed silambam staffs   /  BLUE + RED grips --------------------
CROSS = (0.0, 150.0)
STICK_R = 4.5                 # 9 mm diameter (spec: >= 8 mm)
below_z6 = ex(Rectangle(500, 600), -30, 6)            # halfspace z < 6
disc_prism = ex(Pos(CX, CY) * Circle(57), -5, 40)     # keep on the disc
fig_prism = ex(fig, -5, 40)                           # figure shadow volume

def staff(angle_deg):
    s = (Pos(CROSS[0], CROSS[1], 9.0) * Rot(0, 0, angle_deg) * Rot(0, 90, 0)
         * Cylinder(STICK_R, 160))
    s = (s & disc_prism) - below_z6
    return s

def grip(angle_deg, t):
    a = math.radians(angle_deg)
    cx, cy = CROSS[0] + t * math.cos(a), CROSS[1] + t * math.sin(a)
    g = (Pos(cx, cy, 9.0) * Rot(0, 0, angle_deg) * Rot(0, 90, 0)
         * Cylinder(6.5, 24))
    g = (g & disc_prism) - below_z6
    return g

stick_a = staff(40)      # lower-left -> upper-right
stick_b = staff(140)     # lower-right -> upper-left
grip_blue = grip(40, -47)     # LEFT grip  (blue)
grip_red = grip(140, -47)     # RIGHT grip (red)

# layering: staffs pass BEHIND the figure and behind the grips
brown = (stick_a + stick_b) - fig_prism - grip_blue - grip_red - a_black
grip_blue = grip_blue - fig_prism - a_black
grip_red = grip_red - fig_prism - a_black

# --- RED: angular rear accent panel ------------------------------------------
red_poly = Polygon(
    (22, 210), (44, 196), (49, 162), (36, 132), (55, 116), (68, 158),
    (63, 200), (43, 245), (24, 250), (6, 198),
    align=None,
)
a_red = (ex(red_poly, 0, 5) - a_black - gold) & above_split

# ===========================================================================
# EXPORT
# ===========================================================================
print("Fusing printable parts ...")
part_a = a_black + gold + a_red + brown + grip_blue + grip_red
part_b = base_black + b_gold + b_red

bodies = {
    "PartA_Black_Background": (a_black, (35, 35, 38)),
    "PartA_Gold_Decor": (gold, (212, 175, 55)),
    "PartA_Red_AccentPanel": (a_red, (185, 28, 40)),
    "PartA_Brown_Staffs": (brown, (140, 92, 45)),
    "PartA_Blue_LeftGrip": (grip_blue, (35, 70, 170)),
    "PartA_Red_RightGrip": (grip_red, (185, 28, 40)),
    "PartB_Black_Base": (base_black, (35, 35, 38)),
    "PartB_Gold_TextBorders": (b_gold, (212, 175, 55)),
    "PartB_Red_Ribbon": (b_red, (185, 28, 40)),
}

print("Exporting STLs ...")
export_stl(part_a, os.path.join(OUT, "trophy_upper_part_A.stl"),
           tolerance=0.06, angular_tolerance=0.3)
export_stl(part_b, os.path.join(OUT, "trophy_base_part_B.stl"),
           tolerance=0.06, angular_tolerance=0.3)
assembly = Compound(children=[part_a, part_b])
export_stl(assembly, os.path.join(OUT, "trophy_full_assembly.stl"),
           tolerance=0.06, angular_tolerance=0.3)

print("Exporting per-body STLs ...")
for name, (solid, _rgb) in bodies.items():
    export_stl(solid, os.path.join(BODY_OUT, f"{name}.stl"),
               tolerance=0.06, angular_tolerance=0.3)

print("Exporting STEP ...")
labeled = []
for name, (solid, _rgb) in bodies.items():
    solid.label = name
    labeled.append(solid)
export_step(Compound(children=labeled), os.path.join(OUT, "trophy.step"))

# body colors for the 3MF writer
import json
with open(os.path.join(BODY_OUT, "colors.json"), "w") as f:
    json.dump({n: rgb for n, (_s, rgb) in bodies.items()}, f, indent=1)

print("Done. Bounding checks:")
bb = assembly.bounding_box()
print(f"  overall: {bb.size.X:.1f} x {bb.size.Y:.1f} x {bb.size.Z:.1f} mm")
