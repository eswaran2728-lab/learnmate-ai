"""Build a multi-color 3MF from the per-body STLs.

Produces a standards-compliant 3MF (mm units) with one mesh object per color
body and a base-material per body, so Bambu Studio / PrusaSlicer / OrcaSlicer
import it as a multi-part object ready for AMS/MMU filament mapping.
"""
import glob
import json
import os
import zipfile

import numpy as np
import trimesh

HERE = os.path.dirname(os.path.abspath(__file__))
BODY = os.path.join(HERE, "output", "bodies")
OUT = os.path.join(HERE, "output", "trophy_multicolor.3mf")

colors = json.load(open(os.path.join(BODY, "colors.json")))

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>"""

RELS = """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/3D/3dmodel.model" Id="rel-1"
  Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>"""


def mesh_xml(obj_id, name, mesh, pid, pindex):
    v = mesh.vertices
    f = mesh.faces
    parts = [f'  <object id="{obj_id}" type="model" name="{name}" '
             f'pid="{pid}" pindex="{pindex}">\n   <mesh>\n    <vertices>']
    parts.extend(
        f'     <vertex x="{x:.4f}" y="{y:.4f}" z="{z:.4f}"/>'
        for x, y, z in v
    )
    parts.append('    </vertices>\n    <triangles>')
    parts.extend(
        f'     <triangle v1="{a}" v2="{b}" v3="{c}"/>'
        for a, b, c in f
    )
    parts.append('    </triangles>\n   </mesh>\n  </object>')
    return "\n".join(parts)


bodies = []
for fpath in sorted(glob.glob(os.path.join(BODY, "*.stl"))):
    name = os.path.splitext(os.path.basename(fpath))[0]
    m = trimesh.load(fpath, force="mesh")
    m.merge_vertices()
    bodies.append((name, m, colors[name]))

# material group (id 1): one base material per body
mats = []
for i, (name, _m, rgb) in enumerate(bodies):
    hexcol = "#{:02X}{:02X}{:02X}".format(*rgb)
    matname = name.split("_", 1)[1] if "_" in name else name
    mats.append(f'   <base name="{matname}" displaycolor="{hexcol}"/>')

objects, items = [], []
for i, (name, m, _rgb) in enumerate(bodies):
    oid = i + 2
    objects.append(mesh_xml(oid, name, m, pid=1, pindex=i))
    items.append(f'  <item objectid="{oid}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>')

model = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<model unit="millimeter" xml:lang="en-US" '
    'xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" '
    'xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">\n'
    ' <metadata name="Title">Sepang District Open Silambam Championship 2026 '
    '- Appreciation Award Trophy</metadata>\n'
    ' <metadata name="Application">build123d parametric generator</metadata>\n'
    ' <resources>\n'
    '  <basematerials id="1">\n' + "\n".join(mats) + '\n  </basematerials>\n'
    + "\n".join(objects) + '\n'
    ' </resources>\n'
    ' <build>\n' + "\n".join(items) + '\n </build>\n'
    '</model>\n'
)

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", CONTENT_TYPES)
    z.writestr("_rels/.rels", RELS)
    z.writestr("3D/3dmodel.model", model)

print(f"wrote {OUT} ({os.path.getsize(OUT)/1e6:.2f} MB, "
      f"{len(bodies)} color bodies)")

# sanity: reload with trimesh
scene = trimesh.load(OUT)
print("reload check:", len(scene.geometry), "geometries,",
      f"extents {scene.extents}")
