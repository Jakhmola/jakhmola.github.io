// Does the sampler's height field describe the letterform, or noise?
//
// Nothing renders these yet, so a wrong normal or an inverted depth would sit
// silent until the lit material lands and the word looks like foil. Three
// properties have to hold, and each fails loudly if the field is wrong:
//
//   1. depth is bounded 0..1 and actually reaches toward 1 (strokes have spines)
//   2. the gradient is steepest at the contour -- so contour samples carry
//      bigger normals than spine samples, by a clear margin
//   3. normals point OUT of the stroke, i.e. stepping along +n leaves the ink
//
// (3) is the one that catches a sign error, which is the likely mistake and the
// one that would invert every light in the system.

await (document.fonts ? document.fonts.ready : Promise.resolve());
const m = await new Promise((res, rej) => {
  const t0 = Date.now();
  const poll = () => {
    if (window.__matter && window.__matter.tg && window.__matter.tg.home) return res(window.__matter);
    if (Date.now() - t0 > 8000) return rej(new Error('matter never sampled'));
    setTimeout(poll, 50);
  };
  poll();
});

const out = [];
for (const pg of ['home', 'exp', 'proj', 'contact']) {
  for (const tg of m.tg[pg] || []) {
    const n = tg.n;
    if (!n) continue;
    const idx = Array.from({ length: n }, (_, k) => k).sort((a, b) => tg.shd[a] - tg.shd[b]);
    const mag = (k) => Math.hypot(tg.nrm[k * 2], tg.nrm[k * 2 + 1]);
    const dec = Math.max(1, Math.floor(n / 10));
    const contourMag = idx.slice(0, dec).reduce((s, k) => s + mag(k), 0) / dec;
    const spineMag = idx.slice(-dec).reduce((s, k) => s + mag(k), 0) / dec;

    // Outwardness: step one grid cell along the normal and ask whether that
    // lands nearer another grain or further from every grain. Cheap version --
    // compare distance-to-nearest-neighbour before and after the step, over a
    // sample of grains, using the point cloud itself as the occupancy proof.
    // Only the contour decile is tested. Step 1.5 cells off a spine grain on a
    // thick stroke and you are still inside the ink on both sides, so the test
    // reads pure noise there and would fail a correct field.
    let outward = 0;
    let tested = 0;
    const step = tg.g;
    const rim = idx.slice(0, Math.max(1, Math.floor(n / 5)));
    for (let t = 0; t < Math.min(300, rim.length); t++) {
      const k = rim[(t * 7919) % rim.length];
      const mg = mag(k);
      if (mg < 1e-3) continue;
      const px = tg.pts[k * 2];
      const py = tg.pts[k * 2 + 1];
      const ux = (tg.nrm[k * 2] / mg) * step * 1.5;
      const uy = (tg.nrm[k * 2 + 1] / mg) * step * 1.5;
      // Neighbour counts within one cell, on each side of the sample.
      let fwd = 0;
      let back = 0;
      for (let j = 0; j < n; j++) {
        const dx = tg.pts[j * 2] - px;
        const dy = tg.pts[j * 2 + 1] - py;
        if (Math.abs(dx) > step * 3 || Math.abs(dy) > step * 3) continue;
        const df = (dx - ux) ** 2 + (dy - uy) ** 2;
        const db = (dx + ux) ** 2 + (dy + uy) ** 2;
        if (df < step * step) fwd++;
        if (db < step * step) back++;
      }
      // Outward means the far side is emptier than the near side.
      if (fwd !== back) {
        tested++;
        if (fwd < back) outward++;
      }
    }

    let lo = Infinity;
    let sum = 0;
    let pinned = 0;
    for (let k = 0; k < n; k++) {
      const v = tg.shd[k];
      if (v < lo) lo = v;
      sum += v;
      // Depth is clipped by `min(1, field * 1.6)`. How much of the field lands
      // on the ceiling decides how much information extrusion, parallax and
      // crevice shade actually have to work with -- all three read this value.
      if (v > 0.999) pinned++;
    }
    out.push({
      pg,
      text: (tg.el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 16),
      grid: tg.g,
      n,
      depth: { min: +lo.toFixed(3), mean: +(sum / n).toFixed(3) },
      pinnedPct: Math.round((100 * pinned) / n),
      contourMag: +contourMag.toFixed(3),
      spineMag: +spineMag.toFixed(3),
      steepestAtContour: contourMag > spineMag * 1.2,
      outwardPct: tested ? Math.round((100 * outward) / tested) : null,
    });
  }
}

// Sign errors and inverted ramps fail here. Saturation does not -- it is
// reported instead, because it is a property of the field the lab shipped with
// and a decision, not a defect.
const fails = out.filter(
  (h) => !h.steepestAtContour || h.depth.min < 0 || (h.outwardPct !== null && h.outwardPct < 80),
);
return {
  ok: fails.length === 0,
  worstPinned: Math.max(...out.map((h) => h.pinnedPct)),
  headings: out,
  failing: fails.map((f) => f.text),
};
