"""What is actually lit inside a box, and what has lost its hue.

Called by coverage.mjs, never on its own. `lit` counts any pixel carrying
signal above the field; `cored` counts the pixels where the cyan has stacked
past the point of being cyan -- red climbing to meet green and blue, which is
the One Hue Rule broken in the output rather than in the stylesheet.
"""

import json
import sys

from PIL import Image

png, boxes = sys.argv[1], sys.argv[2]
im = Image.open(png).convert('RGB')
W, H = im.size
px = im.load()

# The field is #0a0c0e under a vignette, so "lit" is anything meaningfully
# above it rather than anything non-zero.
FIELD = 22
# Signal Cyan is (103, 232, 249): red is the channel that has room to climb, and
# when it reaches four fifths of green the pixel is reading as white.
CORE = 0.8

def pct(hist, lit, q):
    want = lit * q
    seen = 0
    for v in range(256):
        seen += hist[v]
        if seen >= want:
            return v
    return 0


out = []
for row in json.load(open(boxes)):
    x0, y0, x1, y1 = row['box']
    x0 = max(0, x0)
    y0 = max(0, y0)
    x1 = min(W - 1, x1)
    y1 = min(H - 1, y1)
    total = max(1, (x1 - x0 + 1) * (y1 - y0 + 1))
    lit = 0
    cored = 0
    peak = 0
    hist = [0] * 256
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            r, g, b = px[x, y]
            if max(r, g, b) <= FIELD:
                continue
            lit += 1
            m = max(r, g, b)
            peak += m
            hist[m] += 1
            if g > 60 and r >= g * CORE:
                cored += 1
    o = {
        't': row['t'],
        'n': row['n'],
        'px': total,
        'lit': round(100 * lit / total, 2),
        # Mean luminance over the pixels that are lit, not over the box.
        'peak': round(peak / max(1, lit)),
        # And the 95th percentile, which is the number that actually compares
        # across two different kinds of mark. Solid DOM glyphs are at full ink
        # over nearly every lit pixel, so their *mean* is close to their peak;
        # discrete anti-aliased sprites spend most of their lit pixels on soft
        # edges, so their mean is far below theirs. Comparing means says matter
        # is dimmer when what it really is, is sparser.
        'p95': pct(hist, lit, 0.95),
    }
    # `cored` is only meaningful on matter. Achromatic DOM text is achromatic by
    # definition, so every pixel of it scores as cored and a 5% reading lands in
    # the same table as a 2% violation threshold, meaning nothing.
    if row['n']:
        o['cored'] = round(100 * cored / total, 2)
    out.append(o)
print(json.dumps(out))
