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
# v1 used a 16mm channel to span a generic 5-13mm range. That was the
# wrong trade: it forced the part to 28mm tall, and the printed part did
# not fit the laptop at all. Universality is worthless if the part cannot
# go where it needs to go.
#
# The channel is now sized to the actual lid with just enough clearance to
# slide on and let the set screws bite. Adjust LID_THK for a different
# laptop -- the part stays compact either way.
LID_THK = 7.3               # ASUS X541 lid -- INFERRED (spec 28mm closed - 20.7mm measured base)
# Clearance has two jobs: let the splint slide on, and leave the set screws
# somewhere to travel. Too tight and the screws bottom out with no clamping
# force left. Budget: ~1mm for the TPU pad + ~1.5mm of usable screw travel.
#
# Extra clearance is also insurance: LID_THK above is inferred from a spec
# sheet, not measured. If the real lid is a millimetre off either way, the
# screws absorb it. A tight channel would simply not go on.
LID_CLEARANCE = 2.5
CHANNEL_OPENING = LID_THK + LID_CLEARANCE   # 9.8

# Lids this one printed part can actually clamp. The upper bound has to
# leave room for BOTH the 1mm TPU pad and at least ~0.5mm of screw travel
# on top of it -- subtracting only the pad leaves the screws bottomed out
# with nothing left to clamp with.
LID_THK_MIN = 6.0
LID_THK_MAX = CHANNEL_OPENING - 1.5   # 8.3

# ---------------------------------------------------------------------------
# THE HARD CONSTRAINT -- measured on the actual laptop
# ---------------------------------------------------------------------------
# With the lid open there is only 4.1mm between the bottom of the screen
# and the keyboard deck. v1 wrapped the lid's HINGE edge as well as its
# side edge, which put a 5mm-thick back wall straight into that 4.1mm
# space -- it could never have fitted.
#
# v2 wraps the SIDE edge only. There is open air beside the lid, so the
# splint is unconstrained there, and because it never extends past the
# lid's bottom edge it does not enter the 4.1mm gap at all.
SCREEN_DECK_GAP = 4.1
WRAP_HINGE_EDGE = False     # v1 behaviour; leave False unless your gap is large
# Anything that does end up in the gap must clear it with margin.
GAP_SAFETY = 0.6

# ---------------------------------------------------------------------------
# GRIP GEOMETRY
# ---------------------------------------------------------------------------
# How far the splint reaches onto the lid's REAR cover (the safe side --
# rigid plastic, no panel underneath). Long, for load spreading.
REAR_GRIP = 25.0

# How far it reaches onto the FRONT (bezel) side. Deliberately SHORT so it
# only catches the outer bezel frame and can never touch the LCD panel.
# Set to 0.0 to omit the front lip entirely (see docs -- do this if the
# lip fouls the keyboard when the lid closes).
FRONT_LIP = 7.0
# Thin: when the lid shuts, this lip is what sits between the bezel and the
# keyboard deck, so every extra millimetre here risks holding the lid open.
FRONT_LIP_THK = 1.5

# Wall thickness of the rear jaw. Must still house a heat-set insert, so
# it is thick enough to take the insert directly WITHOUT a boss standing
# proud of the surface -- a protruding boss was pure wasted height.
WALL = 6.0

# ---------------------------------------------------------------------------
# PLAN -- side edge only (see WRAP_HINGE_EDGE above)
# ---------------------------------------------------------------------------
# Hinge torque tries to peel the cracked corner open. With only one edge
# available to grip, resistance comes from GRIP LENGTH instead: the longer
# the splint runs up the lid's side, the better the leverage against that
# peel. It starts flush with the lid's bottom edge so it spans the crack,
# and extends upward well past it onto undamaged plastic.
LEG_SIDE_LEN = 80.0      # along the side edge, from the bottom corner upward
LEG_HINGE_LEN = 55.0     # only used when WRAP_HINGE_EDGE is True

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
# 0.0 => no boss standing proud of the jaw. WALL (6.0) already exceeds
# INSERT_DEPTH (5.0), so the insert seats fully inside the jaw and the
# 4mm of boss height v1 added on top was wasted in a height-critical part.
INSERT_BOSS_H = 0.0

N_SCREWS_SIDE_LEG = 4
N_SCREWS_HINGE_LEG = 3    # only used when WRAP_HINGE_EDGE is True
SCREW_INSET = 12.0        # how far in from the edge the screws sit (onto rear cover)

# ---------------------------------------------------------------------------
# WIRING / CABLE RELIEF
# ---------------------------------------------------------------------------
# Antenna and display wiring runs through the damaged corner. A rounded
# relief keeps the splint from ever pinching it.
# Must stay under CHANNEL_OPENING/2 or the hole breaches the rear jaw and
# splits the part (splint_model.py asserts this).
CABLE_RELIEF_R = 3.0        # 6mm dia pass-through
CABLE_CLEARANCE = 4.0

# Positions of the wiring pass-throughs, measured along whichever leg is
# being wrapped. Kept clear of the corner (a cut at the corner severs the
# legs when both are present) and clear of the set screws. Add or move
# entries freely -- each one just adds another routing hole.
CABLE_SLOT_Y = [18.0]       # along the side-edge leg (v2 default)
CABLE_SLOT_X = [16.0, 34.0]  # along the hinge-edge leg, if WRAP_HINGE_EDGE

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
# v2 sizes the channel to the lid, so the big gap-filling bars v1 needed
# are gone. What remains are thin shims for fine adjustment if the lid
# turns out thinner than the inferred 7.3mm. Most builds will not need one
# at all -- the TPU pad plus set screws are enough.
BAR_THICKNESSES = [1.0, 1.5, 2.0]
BAR_THK_DEFAULT = 1.5
BAR_CLEARANCE = 0.5       # side clearance so the bar slides freely in the channel
BAR_DIMPLE_DEPTH = 1.0    # locating dimple under each screw tip

# ---------------------------------------------------------------------------
# GENERAL / MANUFACTURING
# ---------------------------------------------------------------------------
FILLET = 3.0
CORNER_R = 8.0
MIN_WALL = 3.0
