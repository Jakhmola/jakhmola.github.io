// Does the tape fit, at this width?
//
// Two ways it can fail, and both are silent:
//
//   1. An Epoch title is `.mt`, so The Nowrap Rule makes it one line at
//      `width: fit-content`. At Statement scale a long title can simply run past
//      the content column -- and because the matter reading has `overflow:
//      hidden` on the page, the end of the word is cut rather than wrapped. The
//      Sigil Budget Rule was written after exactly this failure on the home row.
//   2. One Epoch owns the viewport, so its whole stack -- year, title, facts,
//      body, tags -- plus the track has to clear the viewport height. Over it,
//      The No Scrollbar Rule means content is cut, not scrolled.
//
// Reported per Epoch, because the titles differ in length and the longest one is
// the binding case, not the first.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 2500));

const sec = document.getElementById('pg-exp');
const inner = sec.querySelector('.page-in');
const tape = sec.querySelector('.tape');
const col = inner.getBoundingClientRect();

const epochs = [...sec.querySelectorAll('.epoch')].map((art) => {
  const year = art.querySelector('.year');
  const title = art.querySelector('.etitle');
  const body = art.querySelector('.ebody');
  const tags = art.querySelector('.tags');
  const marks = [year, title].filter(Boolean).map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      text: (el.textContent || '').trim().slice(0, 26),
      fs: +parseFloat(cs.fontSize).toFixed(1),
      w: Math.round(r.width),
      // One line, or The Nowrap Rule is broken and the point cloud is the wrong
      // shape. Compared against the line box rather than a guess at leading.
      lines: Math.round(r.height / (parseFloat(cs.lineHeight) || parseFloat(cs.fontSize))),
      overflowsColumn: r.right > col.right + 1,
      pastColumnBy: Math.max(0, Math.round(r.right - col.right)),
    };
  });
  // The stack this Epoch actually occupies, top of the year to bottom of the tags.
  const top = Math.min(...[year, title, body].filter(Boolean).map((e) => e.getBoundingClientRect().top));
  const btm = Math.max(
    ...[title, body, tags].filter(Boolean).map((e) => e.getBoundingClientRect().bottom),
  );
  return {
    ep: +art.dataset.ep,
    marks,
    stackH: Math.round(btm - top),
    anyOverflow: marks.some((m) => m.overflowsColumn),
    anyWrapped: marks.some((m) => m.lines > 1),
  };
});

const tapeR = tape ? tape.getBoundingClientRect() : null;
// Everything an Epoch needs, against what a viewport has. The nav and the HUD are
// fixed chrome outside the flow, so the bar is the page box, not innerHeight.
const worstStack = Math.max(...epochs.map((e) => e.stackH));

return {
  size: `${innerWidth}x${innerHeight}`,
  column: { left: Math.round(col.left), right: Math.round(col.right), w: Math.round(col.width) },
  epochs,
  worstStack,
  tapeBottom: tapeR ? Math.round(tapeR.bottom) : null,
  // The document must never be able to scroll sideways in the matter reading.
  docScrollW: document.documentElement.scrollWidth,
  horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  anyTitleOverflows: epochs.some((e) => e.anyOverflow),
  anyMarkWrapped: epochs.some((e) => e.anyWrapped),
  stackFitsViewport: worstStack + (tapeR ? tapeR.height : 0) < innerHeight,
  pass:
    !epochs.some((e) => e.anyOverflow || e.anyWrapped) &&
    document.documentElement.scrollWidth <= innerWidth,
};
