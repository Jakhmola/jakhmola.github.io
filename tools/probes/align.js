// Does the point cloud sit on the words it was cut from?
//
// The sampler measures every `.mt` once and the grains are then drawn where that
// measurement said the ink was -- for good, unless something notices the layout
// moved. This probe is what notices in CI: for every heading on every page it
// reports the top the sample was cut at against the top the element is at now.
// Anything but ~0 means the field is a band off its own text, which is the one
// failure that makes the whole site look broken while every number inside it is
// still correct.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 3000));

const M = window.__matter;
if (!M || !M.tg) return { error: 'no __matter — add #dbg=1' };

const out = {
  boot: !!document.getElementById('boot'),
  vp: innerWidth + 'x' + innerHeight,
  face: document.fonts ? document.fonts.check('700 140px Archivo') : null,
  mono: document.fonts ? document.fonts.check('500 26px "JetBrains Mono"') : null,
  ro: M.nRO,
  rm: M.nRM || 0,
  worst: 0,
  pages: {},
};
for (const pg of ['home', 'exp', 'proj', 'contact']) {
  const sec = document.getElementById('pg-' + pg);
  // Every page but the current one is `visibility:hidden`, which still lays out.
  out.pages[pg] = (M.tg[pg] || []).map((tg) => {
    const now = tg.el.getBoundingClientRect();
    const d = Math.round(now.top - tg.top);
    if (Math.abs(d) > Math.abs(out.worst)) out.worst = d;
    // The ink box, not the layout box. A `nowrap; fit-content` span runs well
    // past its last stroke, and coverage measured over that dead space is a
    // measurement of the gap rather than of the word.
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let k = 0; k < tg.n; k++) {
      const px = tg.pts[k * 2];
      const py = tg.pts[k * 2 + 1];
      if (px < x0) x0 = px;
      if (px > x1) x1 = px;
      if (py < y0) y0 = py;
      if (py > y1) y1 = py;
    }
    return {
      t: (tg.el.textContent || '').trim().slice(0, 14),
      cut: Math.round(tg.top),
      now: Math.round(now.top),
      drift: d,
      n: tg.n,
      box: [x0, y0, x1, y1].map(Math.round),
    };
  });
  // The DOM text every heading has to beat, loudest first.
  //
  // The bar used to be the *quietest* copy on the page, and that was a bar the
  // headings could not lose against: a 54px heading built from matter measured
  // against a 12px label. What a visitor's eye actually competes against is the
  // loudest thing near it, so the three largest blocks are reported and the
  // heading has to clear the top of that list, not the bottom.
  const copies = (M.copies[pg] || [])
    .map((el) => ({ el, fs: parseFloat(getComputedStyle(el).fontSize) || 0 }))
    .sort((a, b) => b.fs - a.fs)
    .slice(0, 3);
  for (const c of copies) {
    const r = c.el.getBoundingClientRect();
    out.pages[pg].push({
      t: 'dom:' + (c.el.textContent || '').trim().slice(0, 12),
      box: [r.left, r.top, r.right, r.bottom].map(Math.round),
      n: 0,
      fs: Math.round(c.fs),
    });
  }
  void sec;
}
return out;
