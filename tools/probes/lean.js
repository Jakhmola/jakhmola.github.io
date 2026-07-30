// Does the thing under the hand lean toward it, come back, and leave nothing
// behind — and does it stay out of the way of the two properties that already own
// these elements?
//
// The failure this exists for is not "it does not move". It is the collision: the
// reveal animates `transform` on `.copy` and endTr assigns `transform: none` to
// those same elements, so a lean written to `transform` looks perfect in isolation
// and silently destroys or is destroyed by the reveal. So this asserts on which
// property carries the offset, not only on whether the element moved.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 2500));

const M = window.__matter;
if (!M || !M.A) return { error: 'no __matter — add #dbg=1' };
const V = window.TWEAK.v;
V.lean = true;

for (let k = 0; k < 600 && M.tr; k++) M.tick(1 / 60);
if (M.tr) return { error: 'transition never ended' };

const fire = (type, el) => {
  const ev = typeof PointerEvent === 'function' ? new PointerEvent(type, { bubbles: false }) : new Event(type);
  el.dispatchEvent(ev);
};
const step = (n) => {
  for (let k = 0; k < n; k++) M.tick(1 / 60);
};
// The offset actually in effect, split by which property is carrying it.
const offsets = (el) => {
  const cs = getComputedStyle(el);
  return { translate: cs.translate, transform: cs.transform, inlineTranslate: el.style.translate, inlineTransform: el.style.transform };
};

const link = document.querySelector('.navlinks a[data-scramble]');
if (!link) return { error: 'no nav link' };
const r0 = link.getBoundingClientRect();
const before = offsets(link);

// A hand held well off one side of the label, so the pull has a direction a test
// can check the sign of rather than a magnitude it has to trust.
M.mx = r0.left + r0.width / 2 + 120;
M.my = r0.top + r0.height / 2 + 60;
fire('pointerenter', link);
step(60);
const leaning = { ...offsets(link), x: +M.lean.x.toFixed(2), y: +M.lean.y.toFixed(2) };
const r1 = link.getBoundingClientRect();

// Predicted from the knob, and asserted against, so a change to leanF that forgets
// this probe fails here rather than drifting quietly.
const want = { x: (M.mx - M.lean.cx) * V.leanF, y: (M.my - M.lean.cy) * V.leanF };

fire('pointerleave', link);
step(180);
const after = offsets(link);
const r2 = link.getBoundingClientRect();
const leanCleared = M.lean === null;

// The panel owns the gesture: it translates the whole nav clear of itself, so every
// rect cached in here would be wrong by 340px. A hover while it is open must not
// start a lean at all.
document.documentElement.dataset.tw = 'open';
fire('pointerenter', link);
step(30);
const duringPanel = { lean: M.lean, inlineTranslate: link.style.translate };
delete document.documentElement.dataset.tw;

// A `.copy` element is the one that matters: its reveal owns `transform`.
const copy = document.querySelector('#pg-home .copy[data-scramble]') || document.querySelector('.copy[data-scramble]');
let copySafe = null;
if (copy) {
  const cr = copy.getBoundingClientRect();
  const revealTransformBefore = getComputedStyle(copy).transform;
  M.mx = cr.left + cr.width / 2 + 90;
  M.my = cr.top + cr.height / 2;
  fire('pointerenter', copy);
  step(60);
  copySafe = {
    leanOnTranslate: copy.style.translate !== '' && copy.style.translate !== 'none',
    leanTouchedTransform: copy.style.transform !== '',
    revealTransformUnchanged: getComputedStyle(copy).transform === revealTransformBefore,
  };
  fire('pointerleave', copy);
  step(180);
}

const pass = {
  startsClean: before.inlineTranslate === '' || before.inlineTranslate === 'none',
  usesTranslateNotTransform: leaning.inlineTranslate !== '' && leaning.inlineTransform === '',
  pullsTowardTheHand: M.lean === null ? false : true,
  matchesTheKnob: Math.abs(leaning.x - want.x) < 0.6 && Math.abs(leaning.y - want.y) < 0.6,
  actuallyMoved: Math.abs(r1.left - r0.left) > 0.5,
  returnsHome: Math.abs(r2.left - r0.left) < 0.2 && leanCleared,
  leavesNoInlineStyle: after.inlineTranslate === '',
  refusedWhilePanelOpen: duringPanel.lean === null && duringPanel.inlineTranslate === '',
  copyRevealUntouched: !copySafe || (copySafe.leanOnTranslate && !copySafe.leanTouchedTransform && copySafe.revealTransformUnchanged),
};
// Recomputed here: `pullsTowardTheHand` above only proves a lean existed, and the
// sign is the part a wrong subtraction order would get backwards.
pass.pullsTowardTheHand = leaning.x > 0 && leaning.y > 0;

return {
  label: link.textContent.trim(),
  leanF: V.leanF,
  predicted: { x: +want.x.toFixed(2), y: +want.y.toFixed(2) },
  measured: { x: leaning.x, y: leaning.y },
  movedBy: +(r1.left - r0.left).toFixed(2),
  inline: { whileLeaning: leaning.inlineTranslate, whileLeaningTransform: leaning.inlineTransform || '(none)', afterRelease: after.inlineTranslate || '(none)' },
  copySafe,
  pass,
  ok: Object.values(pass).every(Boolean),
};
