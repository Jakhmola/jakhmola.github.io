// Does the Plate fit, at this width?
//
// The Projects index promotes repo names to Matter Text at the Headline rung, and
// that reverses an earlier measurement -- so it is held by a measurement too. Four
// ways it can fail, and every one of them is silent:
//
//   1. A name is `.mt`, so The Nowrap Rule makes it one line at `width:
//      fit-content`. Past its track it is sampled past the edge of the page and
//      then drawn off it, with `overflow: hidden` on the matter page hiding the
//      evidence. The featured set is chosen nightly by a job with nobody watching,
//      so this is a live risk and not a hypothetical.
//   2. A name that computes under The 26px Floor dissolves: the lattice floors at
//      2px and there is no room under a stroke that thin.
//   3. The index has to clear the viewport. Over it, The No Scrollbar Rule means
//      content is cut rather than scrolled.
//   4. A raised card has to leave an outside to click, because clicking the
//      outside is the only advertised way to lower it.
//
// Reported per row, because the names differ in length and the longest one is the
// binding case, not the first.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 2500));

const sec = document.getElementById('pg-proj');
const inner = sec.querySelector('.page-in');
const col = inner.getBoundingClientRect();
const rows = [...sec.querySelectorAll('.project[data-proj]')];

const names = rows.map((row) => {
  const el = row.querySelector('.pname');
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const fs = parseFloat(cs.fontSize);
  const matter = el.classList.contains('mt');
  return {
    text: (el.textContent || '').trim(),
    ch: +(el.style.getPropertyValue('--ch') || 0),
    matter,
    fs: +fs.toFixed(1),
    w: Math.round(r.width),
    // The track this name was offered, which is its own box's container.
    track: Math.round(el.parentElement.getBoundingClientRect().width),
    // One line, or the point cloud is the wrong shape for the word it was cut from.
    lines: Math.round(r.height / (parseFloat(cs.lineHeight) || fs)),
    overflowsTrack: r.right > el.parentElement.getBoundingClientRect().right + 1,
    // Matter Text below the floor dissolves; DOM text below it is simply DOM text.
    underFloor: matter && fs < 26,
  };
});

// The index's own footprint, top of the first name to the bottom of the last.
const top = Math.min(...rows.map((r) => r.getBoundingClientRect().top));
const btm = Math.max(...rows.map((r) => r.getBoundingClientRect().bottom));

// A raised card, measured rather than assumed: the same geometry a visitor gets.
const M = window.__matter;
let card = null;
if (M && M.plate) {
  M.plate.raise(rows.length - 1);
  const row = rows[rows.length - 1];
  const r = row.getBoundingClientRect();
  const cs = getComputedStyle(row);
  card = {
    box: [r.left, r.top, r.right, r.bottom].map(Math.round),
    // Read off the resolved insets, not off the rect against `innerHeight`. The
    // two do not agree here: a probe lays out under --dump-dom and reports an
    // `innerHeight` that `vh` does not resolve against, which reported the card
    // hanging 43px below a viewport it visibly sits inside. coverage.mjs carries
    // the same caveat for the same reason. The guarantee being checked is a
    // property of the insets anyway -- that every edge leaves an outside to click.
    insets: {
      top: Math.round(parseFloat(cs.top)),
      right: Math.round(parseFloat(cs.right)),
      bottom: Math.round(parseFloat(cs.bottom)),
      left: Math.round(parseFloat(cs.left)),
    },
    position: cs.position,
  };
  M.plate.lower();
}

const anyOverflow = names.some((n) => n.overflowsTrack);
const anyWrapped = names.some((n) => n.lines > 1);
const anyUnderFloor = names.some((n) => n.underFloor);
const cardHasOutside = !card || Object.values(card.insets).every((v) => v >= 8);

return {
  size: `${innerWidth}x${innerHeight}`,
  matterReading: document.documentElement.classList.contains('matter'),
  column: { left: Math.round(col.left), right: Math.round(col.right), w: Math.round(col.width) },
  names,
  indexH: Math.round(btm - top),
  indexFitsViewport: btm - top < innerHeight,
  card,
  docScrollW: document.documentElement.scrollWidth,
  horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  anyOverflow,
  anyWrapped,
  anyUnderFloor,
  cardHasOutside,
  pass:
    !anyOverflow &&
    !anyWrapped &&
    !anyUnderFloor &&
    cardHasOutside &&
    document.documentElement.scrollWidth <= innerWidth,
};
