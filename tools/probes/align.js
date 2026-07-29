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
    return {
      t: (tg.el.textContent || '').trim().slice(0, 14),
      cut: Math.round(tg.top),
      now: Math.round(now.top),
      drift: d,
      n: tg.n,
    };
  });
  void sec;
}
return out;
