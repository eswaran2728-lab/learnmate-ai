"""Render colored preview images of the trophy from the per-body STLs."""
import glob
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import trimesh
from matplotlib.collections import PolyCollection

HERE = os.path.dirname(os.path.abspath(__file__))
BODY = os.path.join(HERE, "output", "bodies")
colors = json.load(open(os.path.join(BODY, "colors.json")))


def load_bodies():
    out = []
    for f in sorted(glob.glob(os.path.join(BODY, "*.stl"))):
        name = os.path.splitext(os.path.basename(f))[0]
        m = trimesh.load(f, force="mesh")
        rgb = np.array(colors.get(name, (128, 128, 128))) / 255.0
        out.append((name, m, rgb))
    return out


def render(ax, bodies, proj, light=np.array([0.3, 0.35, 0.9])):
    """proj: (i, j, k) column indices for (screen-x, screen-y, depth)."""
    ix, iy, iz = proj
    polys, faceco, depth = [], [], []
    light = light / np.linalg.norm(light)
    for name, m, rgb in bodies:
        v = m.vertices
        n = m.face_normals
        shade = 0.55 + 0.45 * np.clip(n @ light, 0, 1)
        tris = v[m.faces]
        z = tris[:, :, iz].mean(axis=1)
        for k in range(len(m.faces)):
            if n[k][iz] <= 0.02:  # backface cull
                continue
            polys.append(tris[k][:, [ix, iy]])
            faceco.append(np.clip(rgb * shade[k], 0, 1))
            depth.append(z[k])
    order = np.argsort(depth)
    pc = PolyCollection([polys[i] for i in order],
                        facecolors=[faceco[i] for i in order],
                        edgecolors="none")
    ax.add_collection(pc)
    ax.autoscale()
    ax.set_aspect("equal")
    ax.set_facecolor("#202020")


bodies = load_bodies()
fig, axes = plt.subplots(1, 3, figsize=(20, 10))
render(axes[0], bodies, (0, 1, 2))                      # front (look down -Z)
axes[0].set_title("FRONT")
render(axes[1], bodies, (2, 1, 0))                      # side (look down -X)
axes[1].set_title("SIDE (from +X)")

# assembled: shift part A down is not needed - already modeled assembled
partA = [(n, m, c) for n, m, c in bodies if n.startswith("PartA")]
render(axes[2], partA, (0, 1, 2))
axes[2].set_title("PART A ONLY - FRONT")
for a in axes:
    a.set_xticks([]), a.set_yticks([])
plt.tight_layout()
plt.savefig(os.path.join(HERE, "output", "preview.png"), dpi=110,
            facecolor="#303030")
print("saved preview.png")
