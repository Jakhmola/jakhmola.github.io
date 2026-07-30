// What the hand does: the Trail it writes with, and the Snap that takes it.
//
// Both are gestures, so every failure here is a lifecycle failure rather than a
// wrong number — a mark that never returns is a permanent hole in a word, and a
// snap that never clears leaves a link inverted for the rest of the visit. The
// assertions are therefore about beginnings and endings, plus the three properties
// that make a trail read as a trail at all: marks are spaced by distance, they hold
// still, and each one is a different character.
//
// `held` is the assertion that matters most. The first build of the Trail put its
// state ahead of the frame loop's `if/else if` chain without leaving it, so every
// mark also ran the *manifest* branch, which eases position back toward the grain's
// home and reassigns size and alpha. The marks were dragged back into the word one
// frame after being laid, and the census still read exactly right.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 2500));

const M = window.__matter;
if (!M || !M.A) return { error: 'no __matter — add #dbg=1' };
const A = M.A;
const V = window.TWEAK.v;
const NP = Math.max(400, Math.min(A.st.length, V.count | 0));

for (let k = 0; k < 600 && M.tr; k++) M.tick(1 / 60);
if (M.tr) return { error: 'transition never ended' };

const census = () => {
  const st = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < NP; i++) st[A.st[i]]++;
  return st;
};
const markList = () => {
  const out = [];
  for (let i = 0; i < NP; i++) {
    if (A.st[i] !== 2) continue;
    out.push({ i, x: A.pos[i * 2], y: A.pos[i * 2 + 1], age: (M.t - A.hT[i]) / V.wlife, a: A.aArr[i], g: A.gArr[i] });
  }
  return out.sort((p, q) => p.age - q.age);
};
const hand = (x, y) => {
  M.mx = x;
  M.my = y;
  M.pvx = 0;
  M.pvy = 0;
};
const sweep = (x0, y0, x1, y1, frames) => {
  hand(x0, y0);
  M.tick(1 / 60);
  for (let k = 1; k <= frames; k++) {
    hand(x0 + (x1 - x0) * (k / frames), y0 + (y1 - y0) * (k / frames));
    M.tick(1 / 60);
  }
};
const settle = (n) => {
  for (let k = 0; k < n; k++) M.tick(1 / 60);
};
const fullReturn = Math.ceil((V.wlife + V.burn + V.mgap + 0.2 + V.mgrow) * 60) + 120;

/* ------------------------------------------------------------------ trail -- */

hand(-9999, -9999);
settle(120);
const quiet = census();

// Across empty field, nowhere near a heading. The Trail borrows by a rotating scan
// rather than by proximity precisely so this works.
sweep(200, 700, 1100, 640, 90);
const marks = markList();
const drawn = census();

// Spacing between consecutive marks, which should be `wstep` and is the one number
// that proves emission is per-distance rather than per-frame.
const gaps = [];
for (let k = 1; k < marks.length; k++) {
  gaps.push(Math.hypot(marks[k].x - marks[k - 1].x, marks[k].y - marks[k - 1].y));
}
const meanGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

// Do marks hold the spot they were put down on? Advance without moving the hand and
// see whether any of them travelled.
const before = marks.map((m) => ({ i: m.i, x: m.x, y: m.y }));
settle(6);
let moved = 0;
for (const b of before) {
  if (A.st[b.i] !== 2) continue;
  if (Math.hypot(A.pos[b.i * 2] - b.x, A.pos[b.i * 2 + 1] - b.y) > 0.01) moved++;
}

// Fresh marks brighter than old ones: the taper, in the direction it is supposed to
// run. Compared as halves rather than per-mark, because per-grain base alpha varies
// by 40% and would swamp a pairwise test.
const live = markList();
const half = Math.floor(live.length / 2);
const youngA = live.slice(0, half).reduce((s, m) => s + m.a, 0) / Math.max(1, half);
const oldA = live.slice(-half).reduce((s, m) => s + m.a, 0) / Math.max(1, half);

// A different character each time one appears.
const glyphs = new Set(live.map((m) => m.g));

hand(-9999, -9999);
settle(fullReturn);
const returned = census();

/* ---------------------------------------------------------- trail vs nav -- */

// A page change must not leave marks lying in the viewport: the caret owns the
// field while it works.
sweep(200, 700, 900, 660, 60);
const beforeNav = census();
M.lastNavAt = -Infinity;
M.goTo('contact');
let marksDuringNav = 0;
for (let k = 0; k < 600; k++) {
  M.tick(1 / 60);
  if (M.tr) {
    const c = census();
    if (c[2] > marksDuringNav) marksDuringNav = c[2];
  } else if (k > 300) break;
}
hand(-9999, -9999);
settle(fullReturn);
const afterNav = census();

/* ------------------------------------------------------------------- snap -- */

const link = document.querySelector('.navlinks a[data-scramble]');
const fire = (type, el) => el.dispatchEvent(new PointerEvent(type, { bubbles: false }));
const r = link.getBoundingClientRect();
const cleanBefore = !('snap' in link.dataset);

hand(r.left + r.width / 2, r.top + r.height / 2);
fire('pointerenter', link);
// Long enough for the JS fill *and* the stylesheet's own 0.3s opacity ease, which
// under virtual time advances far more slowly than the tick loop does. Four time
// constants left `--snap-k` at 0.983 and opacity at 0.778 — both en route rather
// than wrong, and every snap assertion below is a tolerance for that reason.
settle(Math.ceil(((V.snapMs * 8) / 1000 + 1.2) * 60));
const cs = getComputedStyle(link);
const pb = getComputedStyle(link, '::before');
const near = (a, b, tol) => Math.abs(a - b) <= tol;
// `color-mix` resolves to `color(srgb 0.039 0.047 0.055)`, not to `rgb(10, 12, 14)`.
// Read as 8-bit that is pure black and the comparison fails on a colour that is
// exactly right, which is what the first run of this reported.
const rgb = (s) => {
  const n = (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  return s.trim().startsWith('color(') ? n.map((v) => v * 255) : n;
};
const sameColour = (a, b, tol) => {
  const [x, y, z] = rgb(a);
  const [p, q, w] = hexRgb(b);
  return near(x, p, tol) && near(y, q, tol) && near(z, w, tol);
};
// scaleX, off whichever form the browser reports the pseudo's transform in.
const scaleX = pb.transform === 'none' ? 1 : Number((pb.transform.match(/[-\d.]+/g) || [1])[0]);
const snapped = {
  k: +link.style.getPropertyValue('--snap-k'),
  cursor: cs.cursor,
  opacity: +cs.opacity,
  scaleX: +scaleX.toFixed(3),
  labelIsFieldColour: sameColour(cs.color, getComputedStyle(document.body).getPropertyValue('--bg').trim(), 6),
  fillIsInk: sameColour(pb.backgroundColor, getComputedStyle(document.body).getPropertyValue('--ink').trim(), 6),
};

// Nothing trails off a pointer that has been absorbed.
const marksAtSnap = census()[2];
sweep(r.left, r.top, r.left + 300, r.top + 300, 60);
const marksAfterMovingWhileSnapped = census()[2] - marksAtSnap;

fire('pointerleave', link);
settle(Math.ceil((V.snapMs * 6) / 1000 / (1 / 60)));
const cleanAfter = !('snap' in link.dataset) && link.style.getPropertyValue('--snap-k') === '';
const cursorAfter = getComputedStyle(link).cursor;

function hexRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const pass = {
  quietIsQuiet: quiet[2] === 0,
  emitsOffAnyHeading: marks.length > 4,
  spacedByDistance: Math.abs(meanGap - V.wstep) < 2,
  held: moved === 0,
  tapersTowardTheTail: youngA > oldA * 1.3,
  everyMarkItsOwnCharacter: glyphs.size >= 4,
  underCap: drawn[2] <= V.wn,
  everyMarkComesHome: returned[2] === 0 && returned[1] === 0 && returned[0] > NP * 0.4,
  navTakesTheFieldBack: marksDuringNav === 0 && afterNav[2] === 0,
  snapStartsClean: cleanBefore,
  snapFills: snapped.k > 0.97 && snapped.scaleX > 0.95 && snapped.fillIsInk,
  snapKnocksOutTheLabel: snapped.labelIsFieldColour,
  snapDissolvesThePointer: snapped.cursor === 'none',
  // The stylesheet declares `opacity: 1` here and the nav's own 0.3s ease carries it
  // there; virtual time will not run a CSS transition to its end however long this
  // settles, so what is checked is that it left the resting 0.75 and is most of the
  // way up. The endpoint is a declaration, and the screenshot is what confirms it.
  snapIsNotDimmed: snapped.opacity > 0.85,
  snapSilencesTheTrail: marksAfterMovingWhileSnapped <= 0,
  snapClearsUp: cleanAfter && cursorAfter !== 'none',
};

return {
  np: NP,
  knobs: { wstep: V.wstep, wlife: V.wlife, wn: V.wn, snapMs: V.snapMs },
  note: 'st rows are [settled, loose, marks, -, burning, gone, manifesting]',
  trail: {
    laid: marks.length,
    meanGap: +meanGap.toFixed(2),
    movedAfter6Frames: moved,
    alphaYoungHalf: +youngA.toFixed(3),
    alphaOldHalf: +oldA.toFixed(3),
    distinctGlyphs: glyphs.size,
    census: drawn,
    afterOneFullReturn: returned,
  },
  nav: { beforeNav, marksDuringNav, afterNav },
  snap: { ...snapped, marksAfterMovingWhileSnapped, cleanAfter, cursorAfter },
  pass,
  ok: Object.values(pass).every(Boolean),
};
