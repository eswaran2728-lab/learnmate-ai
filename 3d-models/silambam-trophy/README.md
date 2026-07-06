# Sepang District Open Silambam Championship 2026 — Appreciation Award Trophy

Production-ready, parametric 3D-printable trophy generated from
`generate_trophy.py` (build123d). Matches the reference render: circular black
background with gold rim, gold Silambam martial-artist silhouette, crossed
wooden staffs with blue/red grips, laurel sprigs, curved gold crescent frames,
red rear accent panel, and a stepped base with embossed gold text plates.

## Dimensions

| Property        | Value                          |
|-----------------|--------------------------------|
| Overall height  | 250 mm (assembled)             |
| Base width      | 180 mm                         |
| Depth           | 50 mm (base), 15.5 mm (upper)  |

## Files (`output/`)

| File                        | Purpose                                        |
|-----------------------------|------------------------------------------------|
| `trophy_upper_part_A.stl`   | Upper decorative section (single fused solid)  |
| `trophy_base_part_B.stl`    | Lower base section (single fused solid)        |
| `trophy_full_assembly.stl`  | Complete assembled trophy (reference/display)  |
| `trophy.step`               | CAD assembly, all 9 color bodies as named solids |
| `trophy_multicolor.3mf`     | Multi-color 3MF — 9 separated color bodies with display colors, ready for AMS/MMU filament mapping |
| `bodies/*.stl`              | Each color body as an individual STL           |
| `preview.png`               | Rendered front/side previews                   |

All meshes are watertight/manifold (verified with trimesh), millimeter units.

## Color bodies (Bambu Studio / AMS mapping)

| Body                      | Filament color | Contents                                   |
|---------------------------|----------------|--------------------------------------------|
| `PartA_Black_Background`  | Black          | Circular background, neck, connector tenons |
| `PartA_Gold_Decor`        | Gold           | Rim, crescent frames, laurels, martial artist |
| `PartA_Red_AccentPanel`   | Red            | Angular rear accent panel                   |
| `PartA_Brown_Staffs`      | Brown          | Crossed Silambam staffs (9 mm dia)          |
| `PartA_Blue_LeftGrip`     | Blue           | Left staff grip                             |
| `PartA_Red_RightGrip`     | Red            | Right staff grip                            |
| `PartB_Black_Base`        | Black          | Stepped pedestal (with connector slots)     |
| `PartB_Gold_TextBorders`  | Gold           | All embossed text + border frames           |
| `PartB_Red_Ribbon`        | Red            | "19 JULY 2026" date ribbon                  |

Open `trophy_multicolor.3mf` in Bambu Studio → import all objects as one
plate → assign each body to an AMS slot. Black/Gold/Red/Blue/Brown = 5
filaments (red is reused for panel, ribbon and right grip).

## Connector system

- 2 rectangular tenons on Part A: **16 × 8 mm cross-section, 18 mm deep**,
  at X = ±25 mm, with 1.2 mm insertion chamfers.
- Matching slots in Part B top face with **0.25 mm clearance per side** and
  1.5 mm bottom clearance.
- Two widely-spaced tenons prevent rotation/wobble. Suitable for PLA and
  PETG; add a drop of CA glue for permanent assembly.

## Print settings (Bambu Lab P1S / A1 Mini)

- **Orientation:** both parts print lying on their flat backs — zero
  supports needed for Part A; Part B needs no supports either (slots print
  sideways as rectangular pockets, 8 mm bridges are trivial).
- Layer height: 0.16–0.20 mm
- Walls: 3 (≥ 3 mm wall spec met by geometry itself)
- Infill: 10–15 % gyroid (base is bulky — infill keeps it economical)
- Text is embossed 1.5 mm proud with ≥ 4 mm letter height — prints sharp
  with a 0.4 mm nozzle.
- A1 Mini (180×180 bed): Part B is exactly 180 mm wide — place diagonally,
  disable brim/skirt, or scale to 98 %.

## Design rules met

- Min wall 3 mm, min detail 2 mm (thinnest feature: 2.9 mm hand-stick radius
  ≈ 5.8 mm dia; embossed text 1.5 mm relief on solid backing)
- Staffs 9 mm dia (D-section, flat-seated on the background — no tangent
  line contact, no floating geometry)
- Laurel leaves 8 mm thick, silhouette 6 mm, crescent frames 10 mm,
  background plate 6 mm
- Every color body is an independent watertight solid; bodies meet
  face-to-face (no interpenetration, no gaps)

## Regenerating

```bash
pip install build123d trimesh networkx matplotlib manifold3d
python3 generate_trophy.py   # solids + STL + STEP
python3 make_3mf.py          # multi-color 3MF
python3 render_preview.py    # preview.png
```

All key dimensions are constants at the top of `generate_trophy.py`
(text content, sizes, connector fit, disc radius, tier layout).
