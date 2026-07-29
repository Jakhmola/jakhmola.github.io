// Does the caret actually lean?
//
// `caretTilt` is a knob with a default and a documented behaviour, and for as
// long as both existed the bar drew perfectly upright: the local `const T` in
// drawCaret shadowed the module's knob object, so `T.caretTilt` was a property
// of a Number, CLAMP returned NaN, and `ctx.rotate(NaN)` is specified to do
// nothing at all. Nothing about that is visible in a screenshot -- an upright
// caret looks exactly like a caret whose tilt is switched off -- so the check
// has to watch the call.
//
// Records every rotation the caret asks for across a full sweep. The bar: at
// least one finite non-zero angle, none of them NaN, and every one inside the
// knob.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 2500));

const M = window.__matter;
if (!M || !M.cctx) return { error: 'no __matter — add #dbg=1' };

const seen = [];
const real = M.cctx.rotate.bind(M.cctx);
M.cctx.rotate = (a) => {
  seen.push(a);
  return real(a);
};

for (let k = 0; k < 600 && M.tr; k++) M.tick(1 / 60);
M.lastNavAt = -Infinity;
M.goTo('exp');
for (let k = 0; k < 600 && M.tr; k++) M.tick(1 / 60);

const limit = window.TWEAK.v.caretTilt;
const nan = seen.filter((a) => !Number.isFinite(a)).length;
const nonZero = seen.filter((a) => Number.isFinite(a) && a !== 0);
const over = nonZero.filter((a) => Math.abs(a) > limit + 1e-9).length;
return {
  knob: limit,
  rotations: seen.length,
  nan,
  leaned: nonZero.length,
  maxLean: nonZero.length ? +Math.max(...nonZero.map(Math.abs)).toFixed(4) : 0,
  overKnob: over,
  ok: seen.length > 0 && nan === 0 && nonZero.length > 0 && over === 0,
};
