from pathlib import Path

import numpy as np
from PIL import Image

src = Path(r"c:\project\cerrda\public\editorial\sheer-descent-abstract.png")
out = Path(r"c:\project\cerrda\public\editorial\sheer-descent-subject.png")

img = Image.open(src).convert("RGBA")
arr = np.array(img).astype(np.float32)
h, w = arr.shape[:2]
rgb = arr[..., :3]

# Background reference from edge bands (flat ivory panel)
edge = np.concatenate(
    [
        rgb[0:48, :, :].reshape(-1, 3),
        rgb[-48:, :, :].reshape(-1, 3),
        rgb[:, 0:48, :].reshape(-1, 3),
        rgb[:, -48:, :].reshape(-1, 3),
    ],
    axis=0,
)
bg = np.median(edge, axis=0)
print("bg", bg)

# Color distance to background
dist = np.linalg.norm(rgb - bg, axis=2)

# Soft keep: keep pixels that diverge from ivory (motif + structure + title)
# Title is dark — user asked only for subject motif; drop dark typography.
luma = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
chroma = rgb.max(axis=2) - rgb.min(axis=2)

# Motif strokes: warm beige, moderate distance from bg, not too dark
is_text = (luma < 120) & (dist > 40)
is_motif = (dist > 10) & ~is_text

# Soft alpha from distance for motif edges
alpha = np.clip((dist - 8) / 28, 0, 1)
alpha = np.where(is_motif, alpha, 0.0)
# Boost structural thin marks that are slightly darker gray-beige
alpha = np.where(
    (dist > 18) & ~is_text, np.maximum(alpha, np.clip((dist - 12) / 24, 0, 1)), alpha
)
alpha = np.where(is_text, 0.0, alpha)

# Clean tiny noise
from scipy import ndimage  # may miss

try:
    mask = alpha > 0.12
    mask = ndimage.binary_opening(mask, iterations=1)
    mask = ndimage.binary_closing(mask, iterations=1)
    # Keep largest connected components (motif + small secondary + axis)
    labeled, n = ndimage.label(mask)
    if n:
        sizes = ndimage.sum(mask, labeled, range(1, n + 1))
        keep_ids = [i + 1 for i, s in enumerate(sizes) if s >= max(80, 0.0003 * h * w)]
        keep = np.isin(labeled, keep_ids)
        alpha = np.where(keep, alpha, 0.0)
except Exception as e:
    print("scipy fallback:", e)

out_arr = arr.copy()
# Slightly deepen remaining subject against transparency for header readability
out_arr[..., 3] = (alpha * 255).astype(np.uint8)

# Crop to opaque content with padding
ys, xs = np.where(alpha > 0.15)
if len(xs) == 0:
    raise SystemExit("no subject found")
pad = 24
x0, x1 = max(0, xs.min() - pad), min(w, xs.max() + pad + 1)
y0, y1 = max(0, ys.min() - pad), min(h, ys.max() + pad + 1)
cropped = out_arr[y0:y1, x0:x1]

Image.fromarray(cropped.astype(np.uint8), "RGBA").save(out)
print(
    "saved",
    out,
    cropped.shape[1],
    "x",
    cropped.shape[0],
    "opaque%",
    float((alpha > 0.15).mean()),
)
