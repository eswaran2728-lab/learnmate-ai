# Hardware List (Bill of Materials)

Per side (Left **or** Right). Double every quantity below for a full
Left + Right repair.

| # | Item | Qty | Spec | Used for |
|---|------|-----|------|----------|
| 1 | M3 brass heat-set insert | 4 | ⌀4.0 mm OD (standard, e.g. Boyard/Ruthex M3x5.7mm) | 2x Base Clamp rigid mount, 2x Bridge pivot-flange retaining pin |
| 2 | M3x20 socket-head cap screw | 4 | DIN 912 / ISO 4762, A2 stainless or black oxide steel | 2x Bridge -> Base Clamp (rigid), 2x Bridge -> Screen Clamp (pivot pin) |
| 3 | M3 washer (optional) | 2-4 | Standard M3 flat washer | Under pivot-pin screw heads, for a smoother bearing face |
| 4 | TPU or adhesive foam pad | 4 pieces | ~1.0 mm thick, cut to the pad-recess footprint (see below) | Anti-slip / anti-scratch pad in each clamp's inner jaw faces |
| 5 | Printed parts | 3 | See exports/ -- Base Clamp, Screen Clamp, Bridge (2 legs) | The repair bracket itself |

## Notes

- **Insert/screw count matches the brief exactly**: 4 inserts + 4 M3x20
  screws total per side. Two fasteners are pure **rigid bolts** (Bridge to
  Base Clamp); the other two are **retaining pins** for the pivot bearing
  (Bridge to Screen Clamp) -- see `docs/README.md` for why the pivot joint
  is a printed clevis bearing, not a screw doing the rotating.
- **Screw length**: M3x20 is sized for the default `PIVOT_OFFSET_X = 15mm`
  in `cad/params.py`. If you increase that offset during test-fitting, the
  rigid-joint screw may need to lengthen too (M3x25) -- the pivot-pin screw
  length is independent of this and stays at M3x20.
- **Pad recess footprint**: roughly `(JAW_DEPTH - WALL_THK - 4mm)` long by
  `0.6 x CLAMP_WIDTH` wide, 1.0mm deep, on the two inner jaw faces of each
  clamp (see `channel_block()` in `cad/model.py`). Cut TPU sheet or 3M-style
  adhesive foam to fit; this both protects the shell finish and adds a
  light interference grip.
- A small bead of thin CA glue (cyanoacrylate) in the channel, in addition
  to the interference fit, is a common and recommended extra security
  measure for these repairs -- no additional screws are used for this.
