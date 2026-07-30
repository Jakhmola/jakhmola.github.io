// Shaded fragments per frame — the number that decides whether the material is
// affordable, and the only one that transfers off a headless box.
//
// A software rasterizer's fps says nothing about a laptop's, but fragments per
// frame is the same number on both. gl.POINTS sprites are square, so cost grows
// with the square of the sprite, and a grain that reaches grows its sprite by
// its whole reach — which is why the reach radius, not the grain count, is the
// fill-rate constraint of this system.
//
// This computes exactly what the vertex stage computes, off the live buffers,
// at whatever the knobs currently say. Reported against the viewport, so the
// figure to read is overdraw: how many times over the screen is painted.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 2500));

const M = window.__matter;
if (!M || !M.A) return { error: 'no __matter — add #dbg=1' };

const A = M.A;
const V = window.TWEAK.v;
const NP = Math.max(400, Math.min(A.st.length, V.count | 0));
const dpr = Math.min(devicePixelRatio || 1, V.dpr);
const screen = innerWidth * innerHeight * dpr * dpr;

function frags() {
  let total = 0;
  let peak = 0;
  let drawn = 0;
  for (let i = 0; i < NP; i++) {
    const j = i * 2;
    if (A.aArr[i] * V.bright < 0.012) continue;
    const near = 1 + A.shArr[i] * V.persp;
    const base = Math.max(1, A.sArr[i] * V.grain * near);
    const dx = A.anch[j] - A.pos[j];
    const dy = A.anch[j + 1] - A.pos[j + 1];
    const len = V.str > 0 ? Math.hypot(dx, dy) : 0;
    const px = Math.min(300, Math.max(1, (base + len) * dpr));
    const a = px * px;
    total += a;
    if (a > peak) peak = a;
    drawn++;
  }
  return {
    drawn,
    overdraw: +(total / screen).toFixed(2),
    mfrags: +(total / 1e6).toFixed(2),
    widestSprite: +Math.sqrt(peak).toFixed(1),
  };
}

const settleFor = (n) => {
  for (let k = 0; k < n; k++) M.tick(1 / 60);
};

for (let k = 0; k < 600 && M.tr; k++) M.tick(1 / 60);
settleFor(180);

const tg = M.tg[M.cur][0];
const cx = (tg.l + tg.r) / 2;

M.mx = -9999;
M.my = -9999;
settleFor(60);
const idle = frags();

// A hand parked in the middle of the name: every reaching grain at full strain,
// which is the worst standing case a visitor can produce without moving.
M.mx = cx;
M.my = tg.cy;
M.pvx = 0;
M.pvy = 0;
settleFor(60);
const parked = frags();

// The wake, priced before it exists. A carried grain is the loose state with a
// pointer-seeking force, so what it costs is the loose sprite plus the anchor
// the existing st=1 code already pulls toward the hand -- and frags() reads both
// straight off the buffers. So none of the seek needs modelling here: the wake's
// cost is entirely in the geometry it produces, and that geometry is a trail
// from the hand back to the tether edge.
//
// The tether is `repelR x sreach` -- the radius the hand is already felt within,
// the same one the aura and the reach filaments use. A full-length tail is
// therefore the most a wake can ever cost. Clustered at the hand it would be
// cheaper, because the anchor rule tapers to zero as a grain reaches it.
//
// Reported as `added`: the wake takes grains out of the word rather than
// creating any, so what it costs is the difference between a carried grain's
// sprite and the settled one it replaced, never the whole of it.
//
// Measured here, on the intact field `parked` left behind, and not after the
// mid-throw sweep below. The first run of this had it after, and 50 carried
// grains appeared to cost 0.93 overdraw with a widest sprite of 52px -- an
// arithmetic impossibility, and the tell that it was pricing two thousand
// still-loose thrown grains mid-decay. `drawn` is reported per row for that
// reason: a contaminated field shows up as a count that does not belong.
const tether = V.repelR * V.sreach;
const pool = [];
for (let i = 0; i < NP && pool.length < 800; i++) if (A.st[i] === 0) pool.push(i);
const wake = [];
for (const n of [50, 100, 200, 400, 800]) {
  const take = Math.min(n, pool.length);
  // Re-placed every round rather than accumulated, so every row is the same
  // tether-length trail at a different density -- which is the one variable
  // `wn` actually controls.
  for (let k = 0; k < take; k++) {
    const i = pool[k];
    const j = i * 2;
    A.st[i] = 1;
    A.hAt[i] = Infinity;
    A.vel[j] = 0;
    A.vel[j + 1] = 0;
    A.pos[j] = cx - (tether * k) / take;
    A.pos[j + 1] = tg.cy + ((k % 7) - 3) * 2;
  }
  settleFor(30);
  const f = frags();
  wake.push({
    carried: take,
    drawn: f.drawn,
    overdraw: f.overdraw,
    added: +(f.overdraw - parked.overdraw).toFixed(2),
    widestSprite: f.widestSprite,
  });
}
// Hand it all back, so the cases below are measured on an intact field.
for (const i of pool) {
  A.st[i] = 0;
  A.hAt[i] = Infinity;
  A.pos[i * 2] = A.homeX[i];
  A.pos[i * 2 + 1] = A.homeY[i];
}
settleFor(60);

// The same thing again through the real implementation rather than forced states.
// The rows above price a tether-length trail at a density `wn` names; this prices
// what a hand actually produces, and it is the figure the default is set from.
// Two cases, because they are not the same: a hand held still carries whatever is
// eligible within the pickup radius, and a hand travelling keeps collecting ahead
// of itself while the tail behind it runs out of leash.
const wakeWas = V.wake;
V.wake = true;
M.carried = 0;
M.mx = cx;
M.my = tg.cy;
M.pvx = 0;
M.pvy = 0;
settleFor(90);
const wakeParked = { ...frags(), carried: M.carried };
let wakeDragged = wakeParked;
for (let k = 0; k < 150; k++) {
  M.mx = cx - tether + (k / 150) * tether * 2;
  M.my = tg.cy;
  M.pvx = 0;
  M.pvy = 0;
  M.tick(1 / 60);
  const f = frags();
  if (f.overdraw > wakeDragged.overdraw) wakeDragged = { ...f, carried: M.carried };
}
// Off, then wait out a full return, so nothing below is measured on a field that
// is still handing grains back.
V.wake = wakeWas;
M.mx = -9999;
M.my = -9999;
settleFor(Math.ceil((V.delay * 1.4 + V.burn + V.mgap + 0.2 + V.mgrow) * 60) + 120);

// Mid-throw: the frame just after a fast sweep, when loose grains are both at
// symbol size and streaking along their own velocity.
let torn = idle;
for (let k = 0; k < 8; k++) {
  M.mx = tg.l + ((tg.r - tg.l) * k) / 7;
  M.my = tg.cy;
  M.pvx = 3000;
  M.tick(1 / 60);
  const f = frags();
  if (f.overdraw > torn.overdraw) torn = f;
}

// A page change, sampled every frame. This is the case the named performance
// constraint is about -- it is the thing people replay -- and it is the one
// where the largest number of grains are at symbol size at once.
M.mx = -9999;
M.my = -9999;
M.pvx = 0;
M.pvy = 0;
settleFor(60);
M.lastNavAt = -Infinity;
M.goTo('contact');
let nav = frags();
for (let k = 0; k < 600; k++) {
  M.tick(1 / 60);
  const f = frags();
  if (f.overdraw > nav.overdraw) nav = f;
  if (!M.tr && k > 300) break;
}

return {
  np: NP,
  dpr,
  viewport: innerWidth + 'x' + innerHeight,
  // What a visitor at 2x actually pays. The probe box reports dpr 1, and the
  // cost is in device pixels, so it is four times this everywhere it matters.
  note: 'overdraw is per device pixel at the dpr reported above',
  idle,
  parked,
  wake,
  wakeParked,
  wakeDragged,
  torn,
  nav,
};
