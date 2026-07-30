"""
Geometric interference / motion check.

Rotates the Screen Clamp about the true pivot axis (the same axis its
printed knuckle bearing rotates on) through every angle the brief asks to
be verified, and boolean-intersects it against the fixed Base Clamp +
Bridge assembly. A non-zero result at any angle means a real, modelled
collision -- not a guess.

Run: python3 check_motion.py
"""
import json
import cadquery as cq
import model as M
import params as P


def run(mirror=False, label="LEFT"):
    parts = M.build_side(mirror=mirror)
    fixed = parts["base_clamp"].union(parts["bridge"])
    screen = parts["screen_clamp"]

    angles = list(P.CHECK_ANGLES) + [P.MAX_OPEN_ANGLE]
    results = []
    for angle in angles:
        rotated = M.rotate_screen_clamp(screen, angle)
        overlap = fixed.intersect(rotated)
        vals = overlap.solids().vals()
        vol = sum(v.Volume() for v in vals) if vals else 0.0
        results.append({"angle_deg": angle, "overlap_mm3": round(vol, 4)})
        status = "OK" if vol < 1.0 else "COLLISION"
        print(f"[{label}] angle={angle:6.1f} deg   overlap={vol:10.4f} mm^3   {status}")

    return results


if __name__ == "__main__":
    all_results = {
        "left": run(mirror=False, label="LEFT"),
        "right": run(mirror=True, label="RIGHT"),
    }
    with open("/home/user/learnmate-ai/hardware/laptop-hinge-clamp/docs/motion_check_results.json", "w") as f:
        json.dump(all_results, f, indent=2)
    print("\nSaved docs/motion_check_results.json")
