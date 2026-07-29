// Is settled matter alive, and does it stay where it was put?
//
// The two failure modes of the idle layer are opposites and both are invisible
// in a still: a word that has gone inert (every term zeroed by a bad default),
// and a word that walks off its own letterforms because something in there
// accumulates instead of offsetting. So drive the field by hand for twelve
// seconds -- far longer than any of the periods involved -- and report the
// alpha swing and the worst distance any settled grain reached from its home.
//
// The bar, and it is checked rather than eyeballed. Swing above 0.4, so the word
// is not inert. Then The Grain Ratio Rule applied to motion, in two strengths: a
// grain nobody is touching must stay inside its own sample spacing, because past
// that it has left its place in the letterform; a grain leaning toward a hand
// may go half again as far, because that displacement is the effect and the
// visitor is causing it deliberately.

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
  M.pvx = 0;
  M.pvy = 0;
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
      if (A.st[i] !== 0) continue;
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

// A hand sweeping through the name fast enough to tear it, then the field left
// alone to knit itself shut. What must come back is exactly what went loose:
// the same buffer entries, the same count, back on the same slots.
function throwAndHeal() {
  const tg = M.tg[M.cur][0];
  const before = [];
  for (let i = 0; i < n; i++) before.push(A.st[i] === 0 ? A.homeX[i] : NaN);
  let peak = 0;
  // Six frames of a 3000px/s sweep across the word, then nobody there at all.
  for (let k = 0; k < 6; k++) {
    M.mx = tg.l + ((tg.r - tg.l) * k) / 5;
    M.my = tg.cy;
    M.pvx = 3000;
    M.pvy = 0;
    M.tick(1 / 60);
    let loose = 0;
    for (let i = 0; i < n; i++) if (A.st[i] !== 0) loose++;
    if (loose > peak) peak = loose;
  }
  M.mx = -9999;
  M.my = -9999;
  M.pvx = 0;
  M.pvy = 0;
  // Long enough for loose -> burn-out -> gone -> manifest at any sane setting.
  let quiet = -1;
  for (let k = 0; k < 1200 && quiet < 0; k++) {
    M.tick(1 / 60);
    let busy = 0;
    for (let i = 0; i < n; i++) if (A.st[i] !== 0) busy++;
    if (!busy) quiet = k;
  }
  let moved = 0;
  for (let i = 0; i < n; i++) {
    if (!Number.isNaN(before[i]) && A.homeX[i] !== before[i]) moved++;
  }
  return { tore: peak, healedAfterFrames: quiet, slotsChanged: moved };
}

// Can a visitor tell the aura is theirs?
//
// The aura's whole job is attribution: the word has to visibly answer the hand,
// or two tweak groups and the system's fill-rate budget are spent on something
// nobody can connect to their own mouse. Comparing two separate runs cannot
// answer that, because the idle life differs between them by more than the aura
// does. So park the hand, settle, record every grain's alpha -- then take the
// hand away and advance a *tenth* of a frame. The idle terms move by almost
// nothing over 1.6ms; the aura is assigned rather than eased, so it drops in
// full. What is left is the aura alone, per grain, at the same instant.
function auraByRing() {
  const tg = M.tg[M.cur][0];
  const hx = (tg.l + tg.r) / 2;
  const hy = tg.cy;
  M.mx = hx;
  M.my = hy;
  M.pvx = 0;
  M.pvy = 0;
  for (let k = 0; k < 40; k++) M.tick(1 / 60);
  const held = new Float64Array(n);
  for (let i = 0; i < n; i++) held[i] = A.aArr[i];
  M.mx = -9999;
  M.my = -9999;
  M.tick(1 / 600);
  const R = 60;
  const sum = new Float64Array(7);
  const cnt = new Float64Array(7);
  for (let i = 0; i < n; i++) {
    if (A.st[i] !== 0 || A.aArr[i] < 1e-6) continue;
    const d = Math.hypot(A.homeX[i] - hx, A.homeY[i] - hy);
    const b = Math.min(6, (d / R) | 0);
    sum[b] += held[i] / A.aArr[i] - 1;
    cnt[b]++;
  }
  return Array.from(sum, (v, b) =>
    cnt[b] ? { upTo: (b + 1) * R + 'px', grains: cnt[b], lift: +((100 * v) / cnt[b]).toFixed(1) + '%' } : null,
  ).filter(Boolean);
}

// The name's own middle, and a point 200px above it -- outside the pointer's
// own radius, inside the aura's.
const tg = M.tg[M.cur][0];
const cx = (tg.l + tg.r) / 2;
const untouched = run(-9999, -9999);
const aura = run(cx, tg.cy - 200);
const wound = throwAndHeal();
const auraLift = auraByRing();
// The lattice these 4,000 grains were cut on. The probe scans the buffer's
// prefix, which on the home page is the two name spans.
const lattice = tg.g;
return {
  lattice,
  untouched,
  aura,
  auraLift,
  wound,
  ok:
    untouched.swing > 0.4 &&
    untouched.maxDrift < lattice &&
    aura.maxDrift < lattice * 1.5 &&
    wound.tore > 0 &&
    wound.healedAfterFrames >= 0 &&
    wound.slotsChanged === 0,
};
