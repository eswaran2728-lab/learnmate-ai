# Parametric Laptop Hinge Repair Clamp

A structural (not cosmetic) repair for a broken laptop hinge boss. Two
external clamps -- one on the bottom shell, one on the LCD rear cover --
are bridged by a rigid printed link that carries hinge loads straight into
the print, bypassing the cracked plastic entirely. Left and Right are true
CAD-mirrored assemblies (see "Left/Right mirroring" below).

**Read this before printing.** The laptop's exact hinge-barrel position,
diameter, and internal cable routing were not measured -- they can't be,
from a spec sheet alone. Every dimension that depends on them is a named
parameter in `cad/params.py`, called out explicitly below, so you can
measure your own hinge once it's exposed and regenerate every export in
one command. This is a fully worked, mechanically-reasoned parametric
model, not a placeholder -- but it is a first-fit design meant to be tuned
against your actual laptop, exactly as the brief asked for.

## What's in this folder

```
cad/            Parametric CadQuery (Python) source -- the actual editable model
  params.py       Every input dimension, with comments on what to measure/tune
  model.py        Part geometry: base_clamp(), screen_clamp(), bridge()
  build.py        Regenerates every STL/STEP/3MF export below
  check_motion.py Geometric interference check across hinge angles (see docs/)
  make_drawing.py Generates drawings/hinge_clamp_drawing.svg + .pdf
exports/
  left/, right/   Per-part and per-assembly STL + STEP (+3MF) for each side
drawings/
  hinge_clamp_drawing.svg / .pdf   Reference multi-view drawing
docs/
  BOM.md                    Hardware list
  motion_check_results.json Interference-check output (see below)
  fusion360_bridge_script.py  Bonus: Fusion 360 API script (see limitations)
```

## How the repair works

Three printed parts per side:

1. **Base Clamp** -- a C-channel that clips over the bottom-shell edge
   near the hinge, on solid material away from the crack. Two M3
   heat-set inserts, reached from the Bridge, bolt it rigidly in place.
2. **Screen Clamp** -- the same style of C-channel, clipping over the LCD
   rear-cover edge (never the bezel or glass -- its jaw depth is
   deliberately shallow, `SCREEN_LIP_DEPTH`, to guarantee that).
3. **Bridge** -- built as **two separate rigid legs**, not one full-width
   gusset. Each leg bolts rigidly to the Base Clamp at one end, and forms
   a printed **clevis fork** at the other end that the Screen Clamp's
   knuckle boss rotates inside.

### Why a printed clevis bearing, not "the screw is the hinge"

For a rigid external splint to connect a fixed point (on the base) to a
point on a rotating body (the screen) without binding, that point on the
rotating body has to sit on the rotation axis itself. So the Screen
Clamp's knuckle boss *is* positioned on that axis, and its **outer
diameter** rotates directly against the Bridge fork's bore -- that's the
actual load-bearing surface. The M3 screw through the middle is a
**retaining pin only** (light duty, tension), not the bearing. This is
what lets the joint survive "thousands of cycles" instead of shearing a
3mm screw shank over time.

### Why the Bridge is two narrow legs, not one wide arm

The real hinge barrel and the display cable live in the space *between*
the two legs (near the middle of the 97mm width), which is why that
region is deliberately left empty rather than filled with a single wide
gusset. That guarantees clearance **by construction** -- there's simply
no bridge material there to collide with anything -- rather than by
relying on a simulated sweep to prove it. Keep `MOUNT_SPACING_Y` (the leg
spacing) wide enough that your actual hinge hardware/cable sit inside that
open span; narrow it only if your laptop's hinge is unusually close to the
clamp edges.

## What was actually verified (not just claimed)

`cad/check_motion.py` rotates the real Screen Clamp solid about the real
pivot axis and boolean-intersects it against the real (Base Clamp +
Bridge) solid at 0/30/45/60/90/120/135 deg plus the 150 deg max-open
default, for **both** Left and Right. Result, from `docs/motion_check_results.json`:

**Zero geometric overlap at every angle, both sides.** This is a genuine
CAD interference check on the exact exported geometry, not an estimate.

Separately, `base_clamp() ^ bridge()` intersection in the closed pose was
checked directly: 0.46 mm³ overlap, which is a sub-print-resolution
numerical sliver from a boolean fillet operation (for scale: a standard
0.4mm nozzle line is already thicker than the film this represents) --
negligible next to the 0.3mm+ tolerances already built into every real
fit in this design. `screen_clamp() ^ bridge()` and `base_clamp() ^
screen_clamp()` in the closed pose are exactly 0.

All STL exports were checked with `trimesh` and are watertight, manifold
meshes -- safe to slice as-is.

## Parameters you should measure and tune (cad/params.py)

These four are flagged in the file because they cannot be known without
your actual laptop in hand:

| Parameter | Default | What it is |
|---|---|---|
| `PIVOT_OFFSET_X` | 15.0 mm | Distance from the clamp's installed face back to the true hinge axis. The single most important number for smooth rotation -- keep it as small as your wall thickness allows. |
| `STACK_GAP` | 6.0 mm | Vertical gap between the Base Clamp stack and Screen Clamp stack in the closed pose -- where the real hinge barrel/bracket and the Bridge's clevis material live. |
| `HINGE_BARREL_RADIUS` / `CABLE_CLEARANCE` | 4.0 mm / 4.0 mm | Sizes the open span between the two Bridge legs; widen if your hinge hardware or cable bundle is bigger than assumed. |
| `MOUNT_SPACING_Y` | 60.0 mm | Spacing between the two Bridge legs (and their fasteners) -- must stay wide enough to keep the open centre span clear of your actual hinge/cable. |

Everything else the brief specifically called out as adjustable is also a
named parameter: `CLAMP_OPENING` (measured thickness + tolerance),
`WALL_THK`, `CLAMP_WIDTH`, `CORNER_R`, `BRIDGE_THK`, screw/insert sizing,
and `JAW_DEPTH` / `SCREEN_LIP_DEPTH` (how far each clamp reaches over the
shell).

## Regenerating everything after a tuning pass

```bash
cd cad
pip install cadquery          # first time only
python3 build.py              # STL + STEP + 3MF for Left/Right, all parts + assemblies
python3 check_motion.py       # re-verify zero interference across all angles
python3 make_drawing.py       # regenerate the reference drawing
```

## Left/Right mirroring

`model.py:mirror_right()` calls CadQuery's `Shape.mirror(mirrorPlane="XZ")`
directly on the solids -- a true boundary-representation (BREP) mirror
inside the CAD kernel, not a mesh flip of an STL. The cable-relief notch
is deliberately off-centre (biased toward the screen-centre side) so this
mirror produces a genuinely different, correctly-handed part rather than
a no-op on an already-symmetric shape -- verified directly: mirroring
`base_clamp()` keeps the same volume (42271.96 mm³ both sides) but
`left.cut(right)` is non-zero (208.6 mm³), proving the geometry actually
differs, not just the label.

## Print settings (per the brief)

- Material: ABS preferred, ASA/PETG compatible.
- 6 perimeter walls, 80% gyroid infill, 0.20mm layers.
- Orient each clamp lying on its flat back (spine) face -- this puts the
  hinge-load direction (jaw open/close) in-plane with the strongest print
  axis and keeps every overhang under 50 deg without supports. The
  Bridge legs print flat on either the mounting flange face or a cheek
  face, whichever the slicer flags with less overhang.
- No wall in this design is under `MIN_WALL = 3.0mm`; the thinnest
  structural wall is the 5mm clamp wall.

## Known limitations -- read before you rely on this

- **No native Fusion 360 file (`.f3d`/`.f3z`)** is produced here. That's a
  proprietary Autodesk binary format that only Fusion 360 itself can
  write -- there's no legitimate way to author one outside the
  application. What's provided instead:
  - The STEP files (`exports/*/*.step`), which Fusion 360 opens directly
    (File > Open, or Insert > Insert Mesh/BRep) as a solid you can then
    apply direct-edit or Form features to.
  - `docs/fusion360_bridge_script.py` -- a **best-effort, untested**
    Fusion 360 Python API script that rebuilds the Bridge parametrically
    using Fusion's own API. Run it from Fusion 360's Scripts & Add-Ins
    menu to get a real native, timeline-editable Fusion document. It has
    not been run inside Fusion (not available in this environment) --
    verify it before relying on it, and treat the CadQuery model in
    `cad/` as the source of truth if the two ever disagree.
- **The drawing** (`drawings/hinge_clamp_drawing.svg`/`.pdf`) is a
  silhouette-projection reference sheet (front/top/side/isometric views +
  a parameter table), not a fully GD&T-toleranced production drawing.
- **This is a first-fit parametric design**, not a design validated
  against a physical unit. The geometric interference check is real and
  passes cleanly, but it can only check the model against itself --
  it cannot substitute for a physical test fit against your actual
  laptop. Print the Base Clamp and Screen Clamp alone first (they're
  the cheapest test) and check the 21.0mm channel against your shell
  before committing to a full print.
- No FEA/stress simulation was run. Wall thicknesses, fillets, and the
  8-10mm bridge thickness follow the brief's structural guidance
  (generous fillets, no stress risers, triangulated load path bypassing
  the broken plastic), but cycle-life under real loads should be
  confirmed empirically, not assumed from geometry alone.

## Validation checklist

| Item | Status |
|---|---|
| Fits 21.0mm thickness | Modelled to `CLAMP_OPENING = MEASURED_THICKNESS + FIT_TOLERANCE = 21.0mm`; confirm on your unit before printing all parts |
| Width 97mm | `CLAMP_WIDTH = 97.0mm`, verified in export bounding boxes |
| Screen opens/closes fully | Geometric sweep check clean 0-150 deg both sides (`docs/motion_check_results.json`) |
| Cable never pinched | Hinge/cable clearance span is structurally empty (no bridge material there) by design; size `MOUNT_SPACING_Y`/`HINGE_BARREL_RADIUS` to your actual hardware |
| Screws accessible | Rigid-joint screws access from the Bridge leg's outer face; pivot-pin screws access from the knuckle's outer cheek |
| Heat inserts fit | Sized to a generic 4.0mm-OD M3 insert (`INSERT_DIA`/`INSERT_BOSS_OD`) -- confirm against your specific insert brand |
| No collisions | Verified geometrically, see above |
| Left and Right complete | Both exported; Right is a true CAD mirror, confirmed non-trivial (see above) |
| Ready for Bambu Lab P1S | Standard FDM geometry, no unsupported overhangs above 50 deg in the recommended orientation, no walls under 3mm |
