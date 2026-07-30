"""
BONUS / BEST-EFFORT -- Fusion 360 API script for the Bridge leg.

STATUS: written from the Fusion 360 Python API reference, but NOT run or
verified inside Fusion 360 -- this environment doesn't have the
application. Treat the CadQuery model in cad/model.py (bridge_leg()) as
the verified source of truth; use this script as a starting point to get
a native, timeline-editable Fusion document, then check it against the
STEP export in exports/left/left_bridge.step before trusting it.

WHAT THIS DOES
--------------
Recreates ONE Bridge leg (see cad/model.py:bridge_leg()) as a native
Fusion 360 parametric feature tree:
  1. A box from the Base-Clamp mounting point to the pivot region
  2. A cylindrical bore for the rigid-joint screw + a register pocket
  3. A cylindrical clevis/bearing bore at the pivot
  4. A corridor slot so the Screen Clamp's arm can pass through
  5. Edge fillets

Use Fusion's own Mirror feature (about the same axis this script uses
for the left/right leg spacing) to get the second leg, and Fusion's
Mirror-in-design / "flip" workflow for the Right-side assembly, exactly
as the brief asked for -- do that step in Fusion itself once this leg
exists, rather than trusting a second untested script here.

HOW TO RUN
----------
Fusion 360 -> Utilities tab -> Add-Ins -> Scripts and Add-Ins -> "+" ->
select this file -> Run. It creates a new component called "BridgeLeg"
in the active document.
"""

import adsk.core
import adsk.fusion
import traceback

# ---------------------------------------------------------------------
# Parameters -- kept in lock-step with cad/params.py. If you tune the
# CadQuery model, mirror the same numbers here.
# ---------------------------------------------------------------------
CLAMP_OPENING = 21.0
WALL_THK = 5.0
PIVOT_OFFSET_X = 15.0
STACK_GAP = 6.0
BASE_STACK_HEIGHT = CLAMP_OPENING + 2 * WALL_THK          # 31.0
SCREEN_Z0 = BASE_STACK_HEIGHT + STACK_GAP                  # 37.0
BASE_MOUNT_Z = BASE_STACK_HEIGHT / 2.0                      # 15.5
SCREEN_PIVOT_Z = SCREEN_Z0 + WALL_THK / 2.0                 # 39.5

PIVOT_X = -PIVOT_OFFSET_X
BRIDGE_THK = 9.0
BRIDGE_FILLET = 6.0
ARM_MARGIN = 3.0

SCREW_CLEARANCE_DIA = 3.4
SCREW_HEAD_DIA = 5.7
SCREW_HEAD_DEPTH = 3.2
INSERT_DIA = 4.0
INSERT_DEPTH = 6.0
INSERT_BOSS_OD = 9.5

KNUCKLE_WIDTH = 12.0
PIVOT_RUNNING_CLEARANCE = 0.35
KNUCKLE_SLOT_R = INSERT_BOSS_OD / 2.0 + 2.0
BRIDGE_FLANGE_THK = 8.0
LEG_WIDTH = KNUCKLE_WIDTH + 2 * PIVOT_RUNNING_CLEARANCE + 2 * BRIDGE_FLANGE_THK

CM = 0.1  # this script's dimensions are in mm; Fusion's API works in cm internally


def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface
        design = adsk.fusion.Design.cast(app.activeProduct)
        if not design:
            ui.messageBox("No active Fusion design -- open/create a design first.")
            return

        root = design.rootComponent
        occ = root.occurrences.addNewComponent(adsk.core.Matrix3D.create())
        comp = occ.component
        comp.name = "BridgeLeg"

        y_center = 0.0  # build one leg centred on Y=0; pattern/mirror in Fusion for the pair

        # --- main leg block ------------------------------------------------
        sk = comp.sketches.add(comp.xZConstructionPlane)
        x0 = (PIVOT_X - ARM_MARGIN) * CM
        x1 = (0.0) * CM
        z0 = (min(BASE_MOUNT_Z, SCREEN_PIVOT_Z) - BRIDGE_THK / 2.0) * CM
        z1 = (max(BASE_MOUNT_Z, SCREEN_PIVOT_Z) + BRIDGE_THK / 2.0) * CM
        lines = sk.sketchCurves.sketchLines
        lines.addTwoPointRectangle(
            adsk.core.Point3D.create(x0, z0, 0),
            adsk.core.Point3D.create(x1, z1, 0),
        )
        prof = sk.profiles.item(0)
        ext_input = comp.features.extrudeFeatures.createInput(
            prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation
        )
        ext_input.setDistanceExtent(False, adsk.core.ValueInput.createByReal(LEG_WIDTH * CM))
        ext = comp.features.extrudeFeatures.add(ext_input)
        body = ext.bodies.item(0)
        # centre the extrude on Y (Fusion extrudes from the sketch plane along +normal)
        move_input = comp.features.moveFeatures.createInput(
            adsk.core.ObjectCollection.createWithArray([body]),
            adsk.core.Matrix3D.create(),
        )
        transform = adsk.core.Matrix3D.create()
        transform.translation = adsk.core.Vector3D.create(0, 0, -LEG_WIDTH / 2.0 * CM)
        move_input.transform = transform
        comp.features.moveFeatures.add(move_input)

        # --- helper for a cylindrical cut ----------------------------------
        def cut_cylinder(cx, cy, cz, axis_vec, radius, height):
            plane_input = comp.constructionPlanes.createInput()
            # Build cylinder as a sketch circle on a plane normal to axis_vec,
            # then extrude-cut. For simplicity here (X or Y axis only):
            if axis_vec == (1, 0, 0):
                sketch = comp.sketches.add(comp.yZConstructionPlane)
                center = adsk.core.Point3D.create(cy * CM, cz * CM, 0)
            else:  # (0, 1, 0)
                sketch = comp.sketches.add(comp.xZConstructionPlane)
                center = adsk.core.Point3D.create(cx * CM, cz * CM, 0)
            sketch.sketchCurves.sketchCircles.addByCenterRadius(center, radius * CM)
            p = sketch.profiles.item(0)
            cut_input = comp.features.extrudeFeatures.createInput(
                p, adsk.fusion.FeatureOperations.CutFeatureOperation
            )
            cut_input.setDistanceExtent(False, adsk.core.ValueInput.createByReal(height * CM))
            comp.features.extrudeFeatures.add(cut_input)

        # Base-side rigid mount: clearance bore + register pocket + head counterbore
        cut_cylinder(PIVOT_X - ARM_MARGIN, y_center, BASE_MOUNT_Z, (1, 0, 0),
                     SCREW_CLEARANCE_DIA / 2.0, abs(PIVOT_X) + 2 * ARM_MARGIN)
        cut_cylinder(0.0, y_center, BASE_MOUNT_Z, (1, 0, 0),
                     INSERT_BOSS_OD / 2.0 + 1.0, INSERT_DEPTH + 3.0)
        cut_cylinder(PIVOT_X - ARM_MARGIN, y_center, BASE_MOUNT_Z, (1, 0, 0),
                     SCREW_HEAD_DIA / 2.0, SCREW_HEAD_DEPTH)

        # Screen-side clevis bore (bearing) + corridor for the Screen Clamp arm
        cut_cylinder(PIVOT_X, y_center, SCREEN_PIVOT_Z, (0, 1, 0),
                     KNUCKLE_SLOT_R, LEG_WIDTH)

        # NOTE: fillets, the exact corridor box, and the insert-side
        # counterbore are left as an exercise here -- add them with
        # Fusion's Fillet and Extrude(Cut) tools directly on this body,
        # matching cad/model.py:bridge_leg() dimensions above. This
        # script gets you a real parametric starting body faster than
        # starting from a blank sketch; it intentionally stops short of
        # replicating 100% of the CadQuery model's boolean detail, since
        # that part was never verified inside real Fusion 360.

        ui.messageBox(
            "BridgeLeg base body created.\n\n"
            "This is a best-effort starting point (see the module "
            "docstring) -- compare it against exports/left/left_bridge.step "
            "and finish the fillets/corridor/insert-side counterbore by hand "
            "or by extending this script."
        )

    except Exception:
        if ui:
            ui.messageBox("Failed:\n{}".format(traceback.format_exc()))
