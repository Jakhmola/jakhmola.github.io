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
  torn,
  nav,
};
