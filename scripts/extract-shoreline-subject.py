from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage

src = Path(r"c:\project\cerrda\public\hero\shoreline.png")
out = Path(r"c:\project\cerrda\public\hero\shoreline-subject.png")

img = Image.open(src).convert("RGBA")
print("source", img.size)

session = new_session("u2net_human_seg")
cut = remove(img, session=session)
arr = np.array(cut)
alpha = arr[..., 3]

print("opaque% raw", float((alpha > 16).mean()), "alpha max", int(alpha.max()))

mask = alpha > 24
mask = ndimage.binary_closing(mask, structure=np.ones((5, 5)), iterations=2)
mask = ndimage.binary_fill_holes(mask)
mask = ndimage.binary_opening(mask, iterations=1)

labeled, n = ndimage.label(mask)
print("components", n)
if n:
    sizes = ndimage.sum(mask, labeled, range(1, n + 1))
    order = np.argsort(sizes)[::-1]
    print("sizes", [float(sizes[i]) for i in order[:6]])
    keep_ids = [int(order[0]) + 1]
    if len(order) > 1 and float(sizes[order[1]]) >= 0.12 * float(sizes[order[0]]):
        keep_ids.append(int(order[1]) + 1)
    print("keep", keep_ids)
    keep = np.isin(labeled, keep_ids)
    mask = keep

# Soft edge from the original rembg alpha, clipped to the cleaned silhouette.
soft = np.where(mask, alpha, 0)
arr[..., 3] = soft

# Zero RGB on fully transparent pixels so the PNG stays a true matte.
clear = arr[..., 3] == 0
arr[clear, :3] = 0

ys, xs = np.where(arr[..., 3] > 20)
if len(xs) == 0:
    raise SystemExit("no subject")

print("bbox", int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
h, w = arr.shape[:2]
pad = 20
x0, x1 = max(0, int(xs.min()) - pad), min(w, int(xs.max()) + pad + 1)
y0, y1 = max(0, int(ys.min()) - pad), min(h, int(ys.max()) + pad + 1)
cropped = arr[y0:y1, x0:x1]
# Extra transparent margin so mouse-driven particles do not pile into a rectangular frame.
margin = 110
ch, cw = cropped.shape[:2]
padded = np.zeros((ch + margin * 2, cw + margin * 2, 4), dtype=np.uint8)
padded[margin : margin + ch, margin : margin + cw] = cropped
Image.fromarray(padded, "RGBA").save(out)
print(
    "saved",
    out,
    padded.shape[1],
    "x",
    padded.shape[0],
    "opaque%",
    float((padded[..., 3] > 20).mean()),
)
