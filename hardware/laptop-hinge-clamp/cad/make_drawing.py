"""
Generates a basic multi-view drawing sheet (SVG + PDF) for the Left
assembly: front / top / right projections, an isometric of the open pose,
and a title block listing the key parameters and hardware.

This is a *reference/fit-check* drawing (silhouette projections with a
parameter table), not a fully GD&T-toleranced production drawing -- see
docs/README.md for that limitation. It's still useful for a first test
print and for communicating the design intent.

Run: python3 make_drawing.py
"""
import os
import re
import cadquery as cq
import model as M
import params as P
from build import as_compound

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DRAWINGS = os.path.join(ROOT, "drawings")

SHEET_W, SHEET_H = 1400, 780
VIEW_OPTS = dict(showHidden=False, strokeWidth=0.35)


def render_view(shape, direction, out_path):
    cq.exporters.export(shape, out_path, opt={**VIEW_OPTS, "projectionDir": direction})
    with open(out_path) as f:
        svg = f.read()
    m = re.search(r'<svg[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"', svg)
    w, h = (float(m.group(1)), float(m.group(2))) if m else (400, 400)
    inner = re.search(r"<svg[^>]*>(.*)</svg>", svg, re.S).group(1)
    return inner, w, h


def scaled_group(inner_svg, src_w, src_h, x, y, box_w, box_h, label):
    scale = min(box_w / src_w, box_h / src_h) * 0.88
    tx = x + (box_w - src_w * scale) / 2
    ty = y + (box_h - src_h * scale) / 2
    return f'''
  <g>
    <rect x="{x}" y="{y}" width="{box_w}" height="{box_h}" fill="none" stroke="#888" stroke-width="1"/>
    <text x="{x + 8}" y="{y + 18}" font-family="monospace" font-size="14" fill="#333">{label}</text>
    <g transform="translate({tx},{ty}) scale({scale})">
      {inner_svg}
    </g>
  </g>'''


def main():
    os.makedirs(DRAWINGS, exist_ok=True)
    parts = M.build_side(mirror=False)
    closed = as_compound([parts["base_clamp"], parts["bridge"], parts["screen_clamp"]])

    open_screen = M.rotate_screen_clamp(parts["screen_clamp"], 90.0)
    opened = as_compound([parts["base_clamp"], parts["bridge"], open_screen])

    tmp = "/tmp/_drawing_views"
    os.makedirs(tmp, exist_ok=True)

    front_svg, fw, fh = render_view(closed, (0, -1, 0), f"{tmp}/front.svg")
    top_svg, tw, th = render_view(closed, (0, 0, -1), f"{tmp}/top.svg")
    right_svg, rw, rh = render_view(closed, (-1, 0, 0), f"{tmp}/right.svg")
    iso_svg, iw, ih = render_view(closed, (1, -1, 1), f"{tmp}/iso.svg")
    open_svg, ow, oh = render_view(opened, (1, -1, 1), f"{tmp}/open90.svg")

    box_w, box_h = 430, 330
    margin = 30
    groups = [
        scaled_group(front_svg, fw, fh, margin, 60, box_w, box_h, "FRONT (looking along -Y)"),
        scaled_group(top_svg, tw, th, margin + box_w + 20, 60, box_w, box_h, "TOP (looking along -Z)"),
        scaled_group(right_svg, rw, rh, margin + 2 * (box_w + 20), 60, box_w, box_h, "RIGHT SIDE (looking along -X)"),
        scaled_group(iso_svg, iw, ih, margin, 60 + box_h + 30, box_w, box_h, "ISOMETRIC -- CLOSED (0 deg)"),
        scaled_group(open_svg, ow, oh, margin + box_w + 20, 60 + box_h + 30, box_w, box_h, "ISOMETRIC -- OPEN (90 deg)"),
    ]

    title_x = margin + 2 * (box_w + 20)
    title_y = 60 + box_h + 30
    title_block = f'''
  <g font-family="monospace" fill="#222">
    <rect x="{title_x}" y="{title_y}" width="{box_w}" height="{box_h}" fill="none" stroke="#888" stroke-width="1"/>
    <text x="{title_x+10}" y="{title_y+24}" font-size="16" font-weight="bold">LAPTOP HINGE REPAIR CLAMP</text>
    <text x="{title_x+10}" y="{title_y+44}" font-size="12">Left assembly -- Base Clamp / Bridge / Screen Clamp</text>
    <text x="{title_x+10}" y="{title_y+62}" font-size="11">Right assembly = true CAD mirror (see cad/model.py)</text>
    <line x1="{title_x+10}" y1="{title_y+72}" x2="{title_x+box_w-10}" y2="{title_y+72}" stroke="#aaa"/>
    <text x="{title_x+10}" y="{title_y+92}"  font-size="11">Clamp opening: {P.CLAMP_OPENING:.1f} mm ({P.MEASURED_THICKNESS} + {P.FIT_TOLERANCE} tol)</text>
    <text x="{title_x+10}" y="{title_y+108}" font-size="11">Overall width: {P.CLAMP_WIDTH:.0f} mm   Corner R: {P.CORNER_R:.0f} mm</text>
    <text x="{title_x+10}" y="{title_y+124}" font-size="11">Wall thickness: {P.WALL_THK:.0f} mm min   Bridge thk: {P.BRIDGE_THK:.0f} mm</text>
    <text x="{title_x+10}" y="{title_y+140}" font-size="11">Base jaw depth: {P.JAW_DEPTH:.0f} mm   Screen jaw depth: {P.SCREEN_LIP_DEPTH:.0f} mm</text>
    <text x="{title_x+10}" y="{title_y+156}" font-size="11">Pivot offset from face: {P.PIVOT_OFFSET_X:.0f} mm  (MEASURE and TUNE)</text>
    <text x="{title_x+10}" y="{title_y+172}" font-size="11">Hardware: 4x M3 heat-set insert, 4x M3x{P.SCREW_LENGTH:.0f} SHCS</text>
    <line x1="{title_x+10}" y1="{title_y+182}" x2="{title_x+box_w-10}" y2="{title_y+182}" stroke="#aaa"/>
    <text x="{title_x+10}" y="{title_y+200}" font-size="10" fill="#555">Reference / fit-check drawing (silhouette</text>
    <text x="{title_x+10}" y="{title_y+214}" font-size="10" fill="#555">projections), not a toleranced production dwg.</text>
    <text x="{title_x+10}" y="{title_y+228}" font-size="10" fill="#555">Verify all dims from a physical test fit before</text>
    <text x="{title_x+10}" y="{title_y+242}" font-size="10" fill="#555">a final production run. See docs/README.md.</text>
    <text x="{title_x+10}" y="{title_y+box_h-14}" font-size="10" fill="#555">Generated from cad/params.py + cad/model.py</text>
  </g>'''

    svg = f'''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{SHEET_W}" height="{SHEET_H}" viewBox="0 0 {SHEET_W} {SHEET_H}">
  <rect x="0" y="0" width="{SHEET_W}" height="{SHEET_H}" fill="white"/>
  <text x="{SHEET_W/2}" y="30" font-family="monospace" font-size="20" font-weight="bold" text-anchor="middle">
    Laptop Hinge Repair Clamp -- Reference Drawing (Left Assembly)
  </text>
  {''.join(groups)}
  {title_block}
</svg>'''

    out_svg = os.path.join(DRAWINGS, "hinge_clamp_drawing.svg")
    with open(out_svg, "w") as f:
        f.write(svg)
    print("wrote", out_svg)

    import cairosvg
    out_pdf = os.path.join(DRAWINGS, "hinge_clamp_drawing.pdf")
    cairosvg.svg2pdf(url=out_svg, write_to=out_pdf)
    print("wrote", out_pdf)


if __name__ == "__main__":
    main()
