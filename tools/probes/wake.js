// Does the hand pick matter up, hold onto it on a leash, and give all of it
// back? The wake is the first state that exists only while a visitor is doing
// something, so every one of its failures is a leak rather than a wrong number:
// a grain that never releases is a hole in the word that stays there, and a
// grain still chasing the pointer through a page change is the one thing on
// screen not answering to the caret.
//
// So this asserts the lifecycle rather than measuring a look. Five things, in
// the order they can break:
//
//   quiet      — nobody pointing, nothing carried
//   pickup     — a hand on the word carries some of it, inside the cap
//   leash      — no carried grain is ever further from home than the felt radius
//   release    — hand gone, and after one full return every grain is settled again
//   transition — a page change takes the field back, mid-carry, and keeps it
//
// The fill cost of all this is fill.js's business, not this probe's.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 2500));

const M = window.__matter;
if (!M || !M.A) return { error: 'no __matter — add #dbg=1' };

const A = M.A;
const V = window.TWEAK.v;
const NP = Math.max(400, Math.min(A.st.length, V.count | 0));

// The panel ships the wake off, which is the whole point of the measurement
// gate. Turn it on here rather than in the defaults, so this probe keeps
// working whichever way that decision lands.
V.wake = true;

const tether = V.repelR * V.sreach;
const census = () => {
  const st = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < NP; i++) st[A.st[i]]++;
  return st;
};
// The furthest any carried grain currently is from its own letterform, and the
// worst that figure has been over every frame this probe has driven.
let leash = 0;
const drift = () => {
  let worst = 0;
  for (let i = 0; i < NP; i++) {
    if (A.st[i] !== 2) continue;
    const dx = A.pos[i * 2] - A.homeX[i];
    const dy = A.pos[i * 2 + 1] - A.homeY[i];
    const d = Math.hypot(dx, dy);
    if (d > worst) worst = d;
  }
  if (worst > leash) leash = worst;
  return worst;
};
const step = (n) => {
  for (let k = 0; k < n; k++) {
    M.tick(1 / 60);
    drift();
  }
};
const hand = (x, y) => {
  M.mx = x;
  M.my = y;
  M.pvx = 0;
  M.pvy = 0;
};

for (let k = 0; k < 600 && M.tr; k++) M.tick(1 / 60);
if (M.tr) return { error: 'transition never ended' };
hand(-9999, -9999);
step(180);

const quiet = census();

// A hand put down in the middle of the name and held still. Still enough that
// nothing tears -- `Throw` needs the gate speed and this has no velocity at all
// -- so everything loose after this is the wake and only the wake.
const tg = M.tg[M.cur][0];
const cx = (tg.l + tg.r) / 2;
hand(cx, tg.cy);
step(90);
const parked = census();

// Then dragged, well past the leash, which is what makes grains let go: the
// pickup radius keeps collecting new ones ahead of the hand while the ones
// behind it run out of tether.
let dragged = parked;
for (let k = 0; k < 120; k++) {
  hand(cx + (k / 120) * tether * 3, tg.cy);
  M.tick(1 / 60);
  drift();
  const c = census();
  if (c[2] > dragged[2]) dragged = c;
}

// Hand taken away. One full return is delay + burn + gap + manifest, and the
// grain with the worst luck on each of those waits longer than the nominal sum,
// so this is generous rather than exact.
hand(-9999, -9999);
const returnFrames = Math.ceil((V.delay * 1.4 + V.burn + V.mgap + 0.2 + V.mgrow) * 60) + 120;
step(returnFrames);
const released = census();

// A page change while the hand is still holding matter. The caret owns the field
// while it works, so state 2 has to be empty for every frame of it.
hand(cx, tg.cy);
step(90);
const beforeNav = census();
M.lastNavAt = -Infinity;
M.goTo('contact');
// Sampled only while the caret is actually working. Once the transition ends the
// hand is still lying on the page, so pickup resuming is correct behaviour and
// not a leak -- the first run of this asserted on it and read 84 carried grains
// several hundred frames after the caret had parked.
let carriedDuringNav = 0;
for (let k = 0; k < 600; k++) {
  M.tick(1 / 60);
  if (M.tr) {
    const c = census();
    if (c[2] > carriedDuringNav) carriedDuringNav = c[2];
  } else if (k > 300) break;
}
hand(-9999, -9999);
step(returnFrames);
const afterNav = census();

const pass = {
  quiet: quiet[2] === 0,
  pickup: parked[2] > 0 && parked[2] <= V.wn,
  // One frame of overshoot is legal: release fires when the leash is exceeded,
  // and the grain is measured before the frame it is released on.
  leash: leash <= tether * 1.05,
  cap: dragged[2] <= V.wn * 1.2,
  release: released[2] === 0 && released[0] > NP * 0.4,
  navClean: carriedDuringNav === 0 && afterNav[2] === 0,
};

return {
  np: NP,
  tether: +tether.toFixed(1),
  cap: V.wn,
  note: 'st rows are [settled, loose, carried, -, burning, gone, manifesting]',
  quiet,
  parked,
  draggedPeakCarried: dragged[2],
  released,
  beforeNav,
  carriedDuringNav,
  afterNav,
  worstLeash: +leash.toFixed(1),
  pass,
  ok: Object.values(pass).every(Boolean),
};
