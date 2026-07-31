"""
Parametric definitions for the Laptop Hinge Repair Clamp.

Every dimension the design depends on lives in this file. Nothing is
hard-coded in model.py -- change a number here, re-run build.py, and every
STL/STEP/drawing regenerates consistently for both the left and right
assemblies.

Units: millimetres, degrees.

LAPTOP: ASUS X541N-AGO280T (VivoBook Max X541N, mfg. 2017-08). This model
shares its chassis/hinge design with the X541/R541/X540/A540/K541 family
(confirmed via generic replacement hinge sets sold for that whole group),
and its official closed-lid dimensions are ~27.6-28mm thick x 382mm wide x
251mm deep. That, combined with the user's own caliper measurement of the
base at 20.7mm, is where SCREEN_MEASURED_THICKNESS below comes from.

HOW TO TUNE AFTER A TEST FIT
----------------------------
The geometry that is genuinely uncertain from a spec sheet alone -- because
it depends on where your laptop's actual metal hinge barrel sits, and how
big it is -- is called out below under "HINGE / PIVOT GEOMETRY". Measure
your laptop once you have the hinge area exposed and correct those four
numbers. Everything else (clamp opening, wall thickness, width, corner
radius, screw spacing, cable clearance) is also exposed here for the same
reason: these are the values the brief explicitly asked to be adjustable
post-print.
"""

# ---------------------------------------------------------------------------
# LAPTOP / CLAMP FIT (from the supplied measurements)
# ---------------------------------------------------------------------------
MEASURED_THICKNESS = 20.7      # measured (caliper) laptop BASE thickness at the clamp zone
FIT_TOLERANCE = 0.3            # running clearance added to the measurement
CLAMP_OPENING = MEASURED_THICKNESS + FIT_TOLERANCE   # = 21.0 mm internal gap, Base Clamp only

# Screen lid thickness -- NOT measured directly yet, inferred as
# (official closed-laptop thickness) - (measured base thickness)
# = 28.0 - 20.7 = 7.3mm. This is a real, model-specific estimate (not a
# generic guess), but it's still an inference, not a caliper reading --
# confirm with calipers on the actual rear cover if you get the chance,
# then update SCREEN_MEASURED_THICKNESS directly.
CLOSED_LAPTOP_THICKNESS_SPEC = 28.0    # official ASUS X541 series spec, closed
SCREEN_MEASURED_THICKNESS = CLOSED_LAPTOP_THICKNESS_SPEC - MEASURED_THICKNESS  # = 7.3
SCREEN_CLAMP_OPENING = SCREEN_MEASURED_THICKNESS + FIT_TOLERANCE   # = 7.6 mm internal gap, Screen Clamp only

WALL_THK = 5.0                 # minimum wall thickness around the opening
CLAMP_WIDTH = 97.0             # overall width along the hinge axis (Y)
CORNER_R = 8.0                 # outer-profile corner radius

# How far each clamp's jaw reaches over the top/bottom shell surfaces,
# measured from the outer (installed) edge inward. Tune to how much intact,
# uncracked shell material is available to grip.
JAW_DEPTH = 34.0

# Screen-side clamp is a lipped bracket (flat pad + short return flange)
# rather than a full wrap-around channel, so it can never load the bezel
# or touch the LCD panel itself -- it only contacts the rigid rear cover.
SCREEN_LIP_DEPTH = 14.0

# ---------------------------------------------------------------------------
# FASTENERS
# ---------------------------------------------------------------------------
SCREW_NOMINAL_DIA = 3.0
SCREW_CLEARANCE_DIA = 3.4      # M3 clearance hole
SCREW_HEAD_DIA = 5.7           # M3 socket head cap screw head OD (+clearance)
SCREW_HEAD_DEPTH = 3.2         # counterbore depth for a flush SHCS head
SCREW_LENGTH = 20.0            # M3x20 SHCS

INSERT_DIA = 4.0               # typical M3 brass heat-set insert OD
INSERT_DEPTH = 6.0             # insert bore depth
INSERT_BOSS_OD = 9.5           # reinforced boss diameter around each insert

# Spacing between the two fasteners on each interface (base-rigid joint and
# screen-pivot joint), centred on the clamp width.
MOUNT_SPACING_Y = 60.0

# ---------------------------------------------------------------------------
# HINGE / PIVOT GEOMETRY  <-- MEASURE YOUR LAPTOP AND ADJUST THESE FOUR
# ---------------------------------------------------------------------------
# Distance from the clamp's installed face (X=0) back to the true hinge
# rotation axis. Keep this as small as the printed wall thickness allows --
# it is the single most important number for smooth, low-stress rotation.
PIVOT_OFFSET_X = 15.0

# Vertical gap left between the Base Clamp stack and the Screen Clamp stack
# (closed pose). This is where the original hinge barrel, its remaining
# bracket, and the Bridge's clevis/boss material live. Measure the real
# gap at your hinge and adjust.
STACK_GAP = 6.0

# Height (Z) of the true hinge axis, measured from the base clamp's channel
# floor (Z=0). Derived from the base clamp stack height + half the gap by
# default -- see model.py:BASE_STACK_HEIGHT. Override directly if you have
# a better measurement.
PIVOT_OFFSET_Z = None   # None => auto-computed in model.py

# Radius of the clearance bore/notch that must stay empty at every angle so
# the bridge/clamps never touch the real hinge barrel or the display cable.
# Default assumes an ~8 mm hinge barrel; measure yours and adjust.
HINGE_BARREL_RADIUS = 4.0
CABLE_CLEARANCE = 4.0          # minimum radial clearance for the cable, min 4mm per spec
PIVOT_CLEARANCE_RADIUS = HINGE_BARREL_RADIUS + CABLE_CLEARANCE + 2.0  # +2mm margin

# Running clearance for the printed clevis pivot (screen-clamp boss rotates
# freely between the two bridge flanges).
PIVOT_RUNNING_CLEARANCE = 0.35

# ---------------------------------------------------------------------------
# BRIDGE (Part 3)
# ---------------------------------------------------------------------------
BRIDGE_THK = 9.0                # 8-10mm per spec
BRIDGE_FLANGE_THK = 8.0         # thickness of each clevis flange
BRIDGE_FILLET = 6.0

# ---------------------------------------------------------------------------
# MOTION / INTERFERENCE CHECK ANGLES
# ---------------------------------------------------------------------------
CHECK_ANGLES = [0, 30, 45, 60, 90, 120, 135]
MAX_OPEN_ANGLE = 150.0

# ---------------------------------------------------------------------------
# PROTECTION / SOFT PADS
# ---------------------------------------------------------------------------
PAD_RECESS_DEPTH = 1.0          # 1mm TPU / adhesive foam pad recess

# ---------------------------------------------------------------------------
# GENERAL
# ---------------------------------------------------------------------------
GLOBAL_FILLET = 3.0              # general edge-break fillet used broadly
MIN_WALL = 3.0                   # manufacturing floor -- nothing thinner than this
