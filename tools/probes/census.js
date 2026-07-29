// Grain census: what lab-blend's sampler would produce from the real site's
// headings, page by page. This is the number the whole integration is budgeted
// against, and it cannot be derived from the lab -- the lab measures a type
// ramp, the site measures four pages of real copy at real clamp() sizes.
//
// Counts are computed, not sampled: interior thinning is a coin flip per cell,
// so reporting `edge + fill * interior` is both reproducible and more useful --
// it prices every fill setting from one pass.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

const PAGES = ['home', 'exp', 'proj', 'contact'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const off = document.createElement('canvas');
const ox = off.getContext('2d', { willReadFrequently: true });

// One rasterization per heading, reused across every gridk in the sweep: the
// pixels do not change, only the lattice laid over them.
function raster(el) {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const fs = parseFloat(cs.fontSize);
  const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (r.width < 2 || !txt) return null;
  const pad = 6;
  const cw = Math.ceil(r.width) + pad * 2;
  const ch = Math.ceil(r.height) + pad * 2;
  off.width = cw;
  off.height = ch;
  ox.fillStyle = '#e8edef';
  ox.textBaseline = 'middle';
  ox.textAlign = 'left';
  try {
    ox.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    ox.fontStretch = parseFloat(cs.fontStretch) > 100 ? 'expanded' : 'normal';
  } catch (e) {
    /* Safari < 17.4 bakes tracking into the measured box */
  }
  ox.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
  ox.fillText(txt, pad, ch / 2);
  return { fs, cw, ch, txt, family: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
    a: ox.getImageData(0, 0, cw, ch).data };
}

// The lab's lattice, exactly: spacing from the heading's own size, floored at 2
// so the sprite never falls under a device pixel, and the contour always kept.
function lattice(R, gridk) {
  const G = clamp(Math.round(R.fs / gridk), 2, 8);
  const gw = Math.ceil(R.cw / G);
  const gh = Math.ceil(R.ch / G);
  const occ = new Uint8Array(gw * gh);
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const px = x * G;
      const py = y * G;
      occ[y * gw + x] = px < R.cw && py < R.ch && R.a[(py * R.cw + px) * 4 + 3] > 120 ? 1 : 0;
    }
  let edge = 0;
  let interior = 0;
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      if (!occ[y * gw + x]) continue;
      const i = y * gw + x;
      if (!occ[i - 1] || !occ[i + 1] || !occ[i - gw] || !occ[i + gw]) edge++;
      else interior++;
    }
  return { G, edge, interior };
}

const heads = [];
for (const pg of PAGES) {
  const sec = document.getElementById('pg-' + pg);
  if (!sec) continue;
  for (const el of sec.querySelectorAll('.mt')) {
    const R = raster(el);
    if (R) heads.push({ pg, R, text: R.txt.slice(0, 22) });
  }
}

const GRIDK = [28, 32, 36, 44, 52];
const FILL = [0.35, 0.5, 0.69, 1];
const at = (gk, fl) => {
  const per = {};
  for (const hd of heads) {
    const L = lattice(hd.R, gk);
    per[hd.pg] = (per[hd.pg] || 0) + L.edge + Math.round(L.interior * fl);
  }
  return per;
};

// The buffer is allocated once for the worst page, so the worst page is the
// only number that sizes it.
const sweep = {};
for (const gk of GRIDK)
  for (const fl of FILL) {
    const per = at(gk, fl);
    sweep[`gridk=${gk} fill=${fl}`] = { ...per, worst: Math.max(...Object.values(per)) };
  }

// What actually governs legibility is how many grains lie across a stroke, not
// how the grid compares to the font size. For a long stroke of width w sampled
// at spacing G the interior/edge ratio is (w/G - 2)/2, so the count of cells
// across the stroke falls straight out of the two numbers already counted.
// A heavy face at 84px and a light mono at 42px should NOT get the same grid --
// grain density follows ink, not point size.
const across = (L) => +(2 * (L.interior / Math.max(1, L.edge)) + 2).toFixed(2);

return {
  reading: document.documentElement.className || '(calm)',
  viewport: [innerWidth, innerHeight],
  archivoLoaded: document.fonts ? document.fonts.check('700 120px Archivo') : null,
  monoLoaded: document.fonts ? document.fonts.check('700 42px "JetBrains Mono"') : null,
  headings: heads.map((hd) => {
    const L = lattice(hd.R, 36);
    return { pg: hd.pg, text: hd.text, family: hd.R.family, fs: Math.round(hd.R.fs),
      grid: L.G, edge: L.edge, interior: L.interior, across: across(L),
      // Stroke width in px, implied by the lattice. Face-dependent, which is
      // the whole point: it is what the grid should be answering to.
      stroke: +(across(L) * L.G).toFixed(1) };
  }),
  // The same per-heading picture across the gridk range, so the rule is picked
  // from how consistently strokes are covered rather than from a total.
  byGridk: Object.fromEntries(
    GRIDK.map((gk) => [
      gk,
      heads.map((hd) => {
        const L = lattice(hd.R, gk);
        return { text: hd.text.slice(0, 14), fs: Math.round(hd.R.fs), G: L.G, across: across(L) };
      }),
    ]),
  ),
  sweep,
};
