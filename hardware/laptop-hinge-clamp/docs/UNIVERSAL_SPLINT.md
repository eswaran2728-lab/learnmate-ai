# Universal Lid Corner Splint

One design, no measurements required. This is the **recommended** repair
for the ASUS X541N-AGO280T described in this repo, and it supersedes the
pivoting clamp for that laptop. The pivoting design is kept in the repo
(`cad/model.py`) because it is the right answer for a *different* failure
mode — see "Which design do I want?" below.

## The problem this solves

The lid's plastic hinge boss cracked. The metal hinge bracket is still
there, still screwed to the lid — but the plastic that holds that bracket
has split, so the lid can no longer resist the hinge's twisting force.

**The hinge being stiff is the root cause, not a side detail.** A seized
hinge needs a lot of force to move. All of that force lands on one small
plastic boss. Eventually the plastic loses. That is what happened here.

## Why this design does not pivot

The obvious idea — an external bracket that pivots, bridging lid to base —
has a fatal flaw on this laptop.

Your laptop's hinge defines a rotation axis. If the repair bracket also
pivots, that is a **second hinge running in parallel** with the first. Two
parallel hinges must share the same axis exactly, or they fight each other
through the parts that connect them. There is no way to design around this;
it is geometry, not a tuning problem.

With a smooth hinge, a small misalignment just causes rubbing. With a
**stiff** hinge, the stiff steel mechanism always wins, and the printed
plastic part is what breaks — or it levers against the lid and extends the
crack.

So this design has no pivot at all. It is a rigid splint that clamps
across the crack and holds the broken boss to the rest of the lid. The
laptop's own hinge remains the only hinge. Nothing can fight anything.

That is also why it needs no measurements: there is no axis to align to.

## Fix the stiff hinge first

**This matters more than the printed part.** If the hinge stays seized,
the same force that cracked the lid will now attack the repair. In order
of preference:

1. **Free it up** — remove the hinge, clean out the dried grease, re-grease
   it, work it back and forth until it moves smoothly.
2. **Replace it** — X541 hinges are cheap and widely available (they fit
   the whole X541 / X540 / R541 / A541 / K541 family). This is the proper
   fix.
3. If neither is possible, this splint spreads load over ~90mm instead of
   one small boss, which is a genuine improvement — but a stiff hinge will
   keep working against it.

## How it works

Three things make one printed size fit many laptops:

1. **Oversized channel.** The slot is cut at `CHANNEL_OPENING` (16mm),
   comfortably larger than any lid it targets (5–13mm). Nothing has to be
   machined to your exact thickness.
2. **Pressure bar.** A separate flat plate fills the leftover gap. Print
   the thickness closest to your gap; several are provided.
3. **Set screws.** M3 screws in heat-set inserts push the bar down onto the
   lid. They provide the final clamping force and absorb the last
   millimetre or two, so the fit does not need to be exact.

It wraps the lid **corner** (an L in plan), not just one edge. Hinge torque
tries to peel that corner open, and gripping two edges resists that far
better than a straight bar along one edge.

Wiring gets round pass-throughs in the back wall, placed away from the
corner and cut only below the rear jaw so the part stays one solid piece.

## Fitting it

```
gap = 16.0 - (your lid thickness)
```

Pick the pressure bar that leaves roughly **0.5–2mm** for the screws to
take up. For the ASUS X541 (lid ~7.3mm) that is `gap = 8.7` → the **8mm
bar**, leaving 0.7mm of screw travel.

1. Free or replace the hinge first (see above).
2. Stick 1mm TPU or adhesive foam into the pad recesses — the shell's rear
   jaw and the bar's underside both have them. This protects the finish and
   adds grip.
3. Slide the shell over the lid corner so it spans the crack, with the
   short lip catching the outer bezel frame.
4. Drop the pressure bar into the channel on top of the lid.
5. Route any wiring through the pass-through holes — never pinched.
6. Install the heat-set inserts, then tighten the M3 set screws evenly,
   a little at a time, working across the part. Snug, not gorilla-tight —
   you are clamping plastic.
7. Close the lid and check the front lip does not press the keyboard. If it
   does, set `FRONT_LIP = 0.0` in `splint_params.py` and reprint; the rear
   jaw and set screws carry the load regardless.

## What was verified

`cad/check_splint.py`, run against the exported geometry:

- **Single solid** — an earlier version stranded a 118mm³ island at the
  corner because the cable relief cut severed the two legs. Caught and fixed.
- **No interference with the lid** at 5.0 / 7.3 / 10.0 / 13.0mm — 0.000mm³
  in every case, against a simulated lid *with a realistic rounded corner*.
- **Stack-up closes** across the full 5–13mm range with a bar available for
  each. An earlier version failed this: at 13mm the gap was 1.0mm but the
  thinnest bar was 2.0mm, so the design did not cover its own stated range.
  Caught and fixed by raising the channel to 16mm and adding a 10mm bar.
- **Opposite hand is a true CAD mirror** — volume preserved, centroid
  reflected, and the centroid sits 31.76mm off the mirror plane, proving
  the part is genuinely handed rather than symmetric.

## What was NOT verified

- **No physical test fit.** Every check above is geometry against geometry.
  It cannot tell you the splint clears your keyboard when closed, or that
  your crack is where the splint spans.
- **No stress analysis.** Wall thicknesses and fillets follow sound
  practice, and load is spread over ~90mm rather than one boss, but no FEA
  was run and cycle life is not predicted.
- **Lid thickness is inferred, not measured** — 7.3mm comes from the ASUS
  spec (28mm closed) minus your measured base (20.7mm). The oversized
  channel means this does not need to be exact, which is the point.

## Which design do I want?

| Situation | Use |
|---|---|
| Hinge still turns (even if stiff), plastic boss cracked | **This splint** — `cad/splint_model.py` |
| Hinge itself is destroyed / detached / sloppy, needs replacing as a mechanism | The pivoting clamp — `cad/model.py` — and only after measuring the hinge axis |

For this laptop, it is the first row.

## Print settings

Same as the rest of the repo: ABS or ASA preferred, PETG fine. 6 perimeter
walls, 80% gyroid infill, 0.20mm layers.

- **Shell** — print with the channel opening facing up (rear jaw on the
  bed). Load goes across layer lines rather than along them.
- **Pressure bars** — flat on the bed, no supports.

## Files

```
cad/splint_params.py   every dimension, all adjustable
cad/splint_model.py    geometry
cad/build_splint.py    regenerates all exports
cad/check_splint.py    the verification above
exports/universal_splint/
    left_splint_shell.stl/.step
    right_splint_shell.stl/.step
    {left,right}_pressure_bar_{2,4,6,8,10}mm.stl
```

## Hardware

Per corner:

| Item | Qty | Spec |
|---|---|---|
| M3 heat-set insert | 5 | ⌀4.0mm OD |
| M3 set screw / SHCS | 5 | M3x10–16, length to suit your gap |
| TPU sheet or adhesive foam | ~2 pieces | 1.0mm thick, cut to the pad recesses |
| Printed shell | 1 | left or right hand |
| Printed pressure bar | 1 | thickness per the formula above |
