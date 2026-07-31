"""
Parameters for the UNIVERSAL LID CORNER SPLINT.

This is a different design from the pivoting clamp in params.py/model.py.
See docs/UNIVERSAL_SPLINT.md for why.

Short version: the user's hinge is stiff/seized. A repair bracket that
pivots would form a second hinge running in parallel with the real one,
and two parallel hinges must share an axis or they fight. With a stiff
hinge the metal always wins and the printed part loses. So this design
has NO pivot at all -- it is a rigid splint that clamps across the crack
and holds the lid's broken hinge boss to the rest of the lid. The
laptop's own hinge stays the only hinge.

Because there is no axis to align, this design needs no precise
measurements. Thickness variation is absorbed by adjustable set screws
rather than by a machined-to-fit channel, so ONE printed size covers a
wide range of laptops.

Units: millimetres.
"""

# ---------------------------------------------------------------------------
# UNIVERSAL FIT RANGE
# ---------------------------------------------------------------------------
# The channel is deliberately cut oversize; the set screws take up the
# slack. Any lid from LID_THK_MIN to LID_THK_MAX clamps firmly with the
# same printed part. ASUS X541 lid is ~7.3mm, comfortably mid-range.
LID_THK_MIN = 5.0
LID_THK_MAX = 13.0
# Headroom must cover the THINNEST pressure bar plus screw take-up, or the
# thickest supported lid has no bar that fits. min(BAR_THICKNESSES)=2.0
# plus ~1mm of screw travel -> 3.0mm of headroom above LID_THK_MAX.
CHANNEL_OPENING = LID_THK_MAX + 3.0     # 16.0

# ---------------------------------------------------------------------------
# GRIP GEOMETRY
# ---------------------------------------------------------------------------
# How far the splint reaches onto the lid's REAR cover (the safe side --
# rigid plastic, no panel underneath). Long, for load spreading.
REAR_GRIP = 30.0

# How far it reaches onto the FRONT (bezel) side. Deliberately SHORT so it
# only catches the outer bezel frame and can never touch the LCD panel.
# Set to 0.0 to omit the front lip entirely (see docs -- do this if the
# lip fouls the keyboard when the lid closes).
FRONT_LIP = 8.0
FRONT_LIP_THK = 3.0                     # kept thin so it fits the closed-lid gap

# Wall thickness of the shell / rear jaw.
WALL = 5.0

# ---------------------------------------------------------------------------
# L-SHAPED PLAN -- wraps the lid CORNER, not just one edge.
# ---------------------------------------------------------------------------
# The crack is at a corner, and hinge torque tries to peel that corner
# open. Gripping two edges at once resists that far better than a
# straight bar along one edge.
LEG_HINGE_LEN = 90.0     # along the hinge (rear) edge
LEG_SIDE_LEN = 55.0      # along the side edge

# ---------------------------------------------------------------------------
# CLAMPING SET SCREWS -- this is what makes the design universal
# ---------------------------------------------------------------------------
# M3 screws thread into heat-set inserts in the rear jaw and press down
# onto the lid (through a TPU pad) to clamp it. Tightening these adapts
# one printed part to any lid thickness in the range above.
SCREW_CLEARANCE_DIA = 3.4
INSERT_DIA = 4.0
INSERT_DEPTH = 5.0
INSERT_BOSS_OD = 9.0
INSERT_BOSS_H = 4.0       # boss added above the jaw so the insert has full depth

N_SCREWS_HINGE_LEG = 3
N_SCREWS_SIDE_LEG = 2
SCREW_INSET = 14.0        # how far in from the edge the screws sit (onto rear cover)

# ---------------------------------------------------------------------------
# WIRING / CABLE RELIEF
# ---------------------------------------------------------------------------
# Antenna and display wiring runs through the damaged corner. A rounded
# relief keeps the splint from ever pinching it.
CABLE_RELIEF_R = 5.0        # 10mm dia pass-through -- well over the 4mm min clearance
CABLE_CLEARANCE = 4.0

# X positions of the wiring pass-throughs along the hinge-edge leg.
# Kept clear of the corner (a cut at the corner severs the two legs) and
# clear of the set-screw bosses. Add or move entries freely -- each one
# just adds another routing hole.
CABLE_SLOT_X = [16.0, 34.0]

# ---------------------------------------------------------------------------
# PROTECTION
# ---------------------------------------------------------------------------
PAD_RECESS_DEPTH = 1.0    # 1mm TPU / adhesive foam pad recess on gripping faces

# ---------------------------------------------------------------------------
# PRESSURE BAR (Part 2) -- spreads the set-screw clamping load
# ---------------------------------------------------------------------------
# Printed in several thicknesses; pick the one matching your gap:
#     gap = CHANNEL_OPENING - your_lid_thickness
# ASUS X541 lid ~7.3mm -> gap ~6.7mm -> use the 6mm bar.
BAR_THICKNESSES = [2.0, 4.0, 6.0, 8.0, 10.0]
BAR_THK_DEFAULT = 8.0
BAR_CLEARANCE = 0.5       # side clearance so the bar slides freely in the channel
BAR_DIMPLE_DEPTH = 1.0    # locating dimple under each screw tip

# ---------------------------------------------------------------------------
# GENERAL / MANUFACTURING
# ---------------------------------------------------------------------------
FILLET = 3.0
CORNER_R = 8.0
MIN_WALL = 3.0
