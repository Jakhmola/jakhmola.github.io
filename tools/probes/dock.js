// Does the caret go to the word under the hand, and does it come back?
//
// Asserted on the caret canvas rather than on state, because every way this can
// fail leaves the state looking correct: a dock target computed in CSS pixels and
// drawn in device pixels puts the bar at half the offset, the blink can mean the
// bar is simply never up when a still is taken, and a caret that travels but is
// clipped by its own canvas is invisible while `cpos` reads perfect. So this
// counts lit pixels in a box around where the bar is supposed to be.
//
// The bar is up 55% of a blink cycle, so every measurement is the best of a
// window of frames rather than one instant.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 2500));

const M = window.__matter;
if (!M || !M.A) return { error: 'no __matter — add #dbg=1' };
const V = window.TWEAK.v;
V.caretDock = true;

for (let k = 0; k < 600 && M.tr; k++) M.tick(1 / 60);
if (M.tr) return { error: 'transition never ended' };

// The canvas is sized in device pixels and the field is measured in CSS ones.
const scale = M.caret.width / M.ccw;
const cx = M.cctx;

// Lit pixels inside a box centred on a CSS-pixel point. Generous on width so a
// bar a few pixels off still counts -- this is asking "is the caret here", not
// "is it at exactly this subpixel".
function litAt(x, y, hw, hh) {
  const px = Math.max(0, Math.round((x - hw) * scale));
  const py = Math.max(0, Math.round((y - hh) * scale));
  const pw = Math.min(M.caret.width - px, Math.round(hw * 2 * scale));
  const ph = Math.min(M.caret.height - py, Math.round(hh * 2 * scale));
  if (pw <= 0 || ph <= 0) return 0;
  const d = cx.getImageData(px, py, pw, ph).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
  return n;
}
// The most the bar is ever lit over a blink cycle's worth of frames.
function peakAt(x, y, hw, hh, frames) {
  let best = 0;
  for (let k = 0; k < (frames || 80); k++) {
    M.tick(1 / 60);
    const n = litAt(x, y, hw, hh);
    if (n > best) best = n;
  }
  return best;
}

const link = document.querySelector('.navlinks a[data-scramble]') || document.querySelector('[data-scramble]');
if (!link) return { error: 'no [data-scramble] element on the page' };
const fire = (type, el) => {
  const ev = typeof PointerEvent === 'function' ? new PointerEvent(type, { bubbles: false }) : new Event(type);
  el.dispatchEvent(ev);
};

const park = { x: M.park.x, y: M.park.y };
const atParkFirst = peakAt(park.x, park.y, 12, 40);

fire('pointerenter', link);
const dock = M.dock ? { x: M.dock.x, y: M.dock.y, h: +M.dock.h.toFixed(1) } : null;
const r = link.getBoundingClientRect();
// Travel, then measure. caretDockMs is a time constant, so three of them is
// where it has arrived for any purpose a visitor can see.
for (let k = 0; k < Math.ceil((V.caretDockMs * 3) / 1000 / (1 / 60)); k++) M.tick(1 / 60);
const atLink = dock ? peakAt(dock.x, dock.y, 10, 16) : 0;
const atParkWhileDocked = peakAt(park.x, park.y, 12, 40);

fire('pointerleave', link);
for (let k = 0; k < 120; k++) M.tick(1 / 60);
const atParkAfter = peakAt(park.x, park.y, 12, 40);
const atLinkAfter = dock ? peakAt(dock.x, dock.y, 10, 16) : 0;

// A transition owns the caret, so a hover during one must not take it.
M.lastNavAt = -Infinity;
M.goTo('exp');
M.tick(1 / 60);
fire('pointerenter', link);
const dockDuringTr = M.dock;
for (let k = 0; k < 600 && M.tr; k++) M.tick(1 / 60);
for (let k = 0; k < 60; k++) M.tick(1 / 60);

// A real selection hides the parked caret; the browser's own caret is the one the
// visitor is driving, and two of them is one too many.
const target = document.querySelector('#pg-exp .copy, #pg-exp p, .copy, p');
let selHides = null;
if (target && target.firstChild) {
  const range = document.createRange();
  range.selectNodeContents(target);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  // `selectionchange` is queued, not synchronous. Reading M.selecting on the next
  // line reads it before the event has fired, which is what the first run of this
  // did -- it reported a live selection and a caret that had ignored it.
  await new Promise((r) => setTimeout(r, 0));
  M.tick(1 / 60);
  // Read while the selection is still up. The first run of this put it in the
  // result object at the bottom, by which point the range had been cleared and it
  // truthfully reported false about a moment that had passed.
  const wasSelecting = M.selecting;
  const p2 = { x: M.park.x, y: M.park.y };
  const during = peakAt(p2.x, p2.y, 12, 40);
  const selText = String(sel).length;
  sel.removeAllRanges();
  await new Promise((r) => setTimeout(r, 0));
  M.tick(1 / 60);
  const after = peakAt(p2.x, p2.y, 12, 40);
  selHides = { selecting: wasSelecting, selectedChars: selText, litWhileSelecting: during, litAfter: after };
}

const pass = {
  parkedCaretIsDrawn: atParkFirst > 0,
  dockTargetPastLabel: !!dock && dock.x > r.right && Math.abs(dock.y - (r.top + r.height / 2)) < 1,
  drawnAtLabel: atLink > 0,
  leftPark: atParkWhileDocked === 0,
  cameHome: atParkAfter > 0 && atLinkAfter === 0,
  refusedDuringTransition: dockDuringTr === null,
  selectionHidesIt: !selHides || (selHides.selecting && selHides.litWhileSelecting === 0 && selHides.litAfter > 0),
};

return {
  label: link.textContent.trim(),
  labelRect: { right: +r.right.toFixed(1), mid: +(r.top + r.height / 2).toFixed(1), h: +r.height.toFixed(1) },
  dock,
  park: { x: +park.x.toFixed(1), y: +park.y.toFixed(1) },
  lit: { atParkFirst, atLink, atParkWhileDocked, atParkAfter, atLinkAfter },
  selHides,
  pass,
  ok: Object.values(pass).every(Boolean),
};
