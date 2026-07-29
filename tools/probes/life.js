// Is settled matter alive, and does it stay where it was put?
//
// The two failure modes of the idle layer are opposites and both are invisible
// in a still: a word that has gone inert (every term zeroed by a bad default),
// and a word that walks off its own letterforms because something in there
// accumulates instead of offsetting. So drive the field by hand for twelve
// seconds -- far longer than any of the periods involved -- and report the
// alpha swing and the worst distance any settled grain reached from its home.
//
// The bar: swing well above 0, drift under a grain's own sample spacing.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 2500));

const M = window.__matter;
if (!M || !M.A) return { error: 'no __matter — add #dbg=1' };
// Virtual time starves rAF, so the opening transition is still in flight no
// matter how long this waits. Drive it home by hand instead.
for (let k = 0; k < 600 && M.tr; k++) M.tick(1 / 60);
if (M.tr) return { error: 'transition never ended' };

const A = M.A;
const n = 4000;

// Two passes: the field with nobody pointing at it, then the same field with a
// hand parked one aura-radius out. The first is what a visitor looking at the
// page sees, and the number that must stay small; the second prices what the
// pointer is allowed to add on top.
function run(mx, my) {
  M.mx = mx;
  M.my = my;
  M.mvx = 0;
  M.mvy = 0;
  let aLo = Infinity;
  let aHi = -Infinity;
  let drift = 0;
  let settled = 0;
  // Grains land at the caret and spring home over the following second; that
  // arrival is not drift and must not be measured as it.
  for (let k = 0; k < 120; k++) M.tick(1 / 60);
  for (let step = 0; step < 720; step++) {
    M.tick(1 / 60);
    for (let i = 0; i < n; i++) {
      if (A.st[i] !== 1) continue;
      if (step === 0) settled++;
      if (A.aArr[i] < aLo) aLo = A.aArr[i];
      if (A.aArr[i] > aHi) aHi = A.aArr[i];
      const dx = A.pos[i * 2] - A.homeX[i];
      const dy = A.pos[i * 2 + 1] - A.homeY[i];
      const d = Math.hypot(dx, dy);
      if (d > drift) drift = d;
    }
  }
  return {
    settled,
    alphaLo: +aLo.toFixed(3),
    alphaHi: +aHi.toFixed(3),
    swing: +(aHi - aLo).toFixed(3),
    maxDrift: +drift.toFixed(2),
  };
}

// The name's own middle, and a point 200px above it -- outside the pointer's
// own radius, inside the aura's.
const tg = M.tg[M.cur][0];
const cx = (tg.l + tg.r) / 2;
return { untouched: run(-9999, -9999), aura: run(cx, tg.cy - 200) };
