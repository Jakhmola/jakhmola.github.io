// What the Experience tape costs, per view.
//
// The tape's whole reason for keying point clouds by view rather than by page is
// the grain budget: all four Epochs are laid out at the same box so the sampler
// can measure them, and if they all landed in one slot table the page would ask
// for roughly four times what it has. This reads the live tables and says
// whether that actually held.
//
// The pass/fail bar is the one the renderer enforces anyway -- `Math.min(sl.n,
// NP)` in startTr truncates past the budget, which cuts the spine and keeps the
// silhouette. A view over budget is not a crash, it is a heading quietly losing
// its interior, so the check is "does any view need more than the budget", not
// "did anything throw".

// A timer, not rAF: virtual time advances timers and starves rAF, so a probe
// that waits on a frame never reports. Waiting at all is the point -- `__matter`
// is published by a deferred script and this shim is inline, so it does not
// exist yet when the first line of this file runs.
await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 2500));

const M = window.__matter;
if (!M || !M.A) return { error: 'no __matter — add #dbg=1' };

const NP = Math.max(400, Math.min(22000, window.TWEAK.v.count | 0));
const views = Object.keys(M.slots || {});
const rows = views.map((v) => {
  const S = M.slots[v];
  const tgs = M.tg[v] || [];
  return {
    view: v,
    grains: S ? S.n : 0,
    // Over the budget the table is truncated rather than honoured, so this is the
    // share of the heading that would never be drawn.
    truncated: S && S.n > NP ? +(((S.n - NP) / S.n) * 100).toFixed(1) : 0,
    marks: tgs.map((t) => ({
      text: (t.el.textContent || '').trim().slice(0, 24),
      fs: +t.fs.toFixed(1),
      // The lattice the mark was cut on. A grain wears the sprite its own slot's
      // spacing asks for, so this is what The Grain Ratio Rule is measured against.
      lattice: t.g,
      grains: t.n,
    })),
  };
});

const exp = rows.filter((r) => r.view.startsWith('exp:'));
const worst = rows.reduce((a, b) => (b.grains > a.grains ? b : a), rows[0]);
// What the page would have cost if every Epoch had been sampled into one table --
// the number the view split exists to avoid.
const naive = exp.reduce((s, r) => s + r.grains, 0);

return {
  size: `${innerWidth}x${innerHeight}`,
  budget: NP,
  rows,
  epochs: exp.length,
  worstView: worst.view,
  worstGrains: worst.grains,
  tapeNaiveTotal: naive,
  tapeWorstEpoch: exp.reduce((m, r) => Math.max(m, r.grains), 0),
  anyTruncated: rows.filter((r) => r.truncated > 0).map((r) => r.view),
  pass: rows.every((r) => r.truncated === 0),
};
