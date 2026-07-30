// Does the tape navigate the way the brief says, and does it say so out loud?
//
// Four things this is capable of failing on, each a real defect that a
// screenshot cannot see:
//
//   1. Nested advance. One step forward from the last Epoch has to leave for
//      Projects, and one step back from the first has to leave for Home. Get
//      either wrong and the visitor is trapped on the Experience page.
//   2. Exactly one Epoch visible. All four are laid out at the same box so the
//      sampler can measure them, so a stale `visibility` leaves two Epochs of
//      copy printed over each other.
//   3. The announcement. The HUD is aria-hidden, so an Epoch change is a content
//      change that only #pg-live reports. Silence there means a screen reader
//      hears nothing at all when the page rewrites itself.
//   4. The tab strip agrees with the field. `aria-selected` and the visible
//      Epoch are set from one call and must never disagree.
//
// Transitions are advanced by hand: virtual time starves rAF, so the frame loop
// never runs here and `endTr` would never fire on its own.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 2500));

const M = window.__matter;
if (!M || !M.A) return { error: 'no __matter — add #dbg=1' };

const $ = (id) => document.getElementById(id);
const settle = () => {
  for (let k = 0; k < 900 && M.tr; k++) M.tick(1 / 60);
  return !M.tr;
};

// The cooldown is a wall-clock gate and no wall clock passes under virtual time,
// so every step after the first would be swallowed by it.
window.TWEAK.v.navLock = 0;

const shot = (label) => {
  const arts = [...document.querySelectorAll('#pg-exp .epoch')];
  const vis = arts.filter((a) => getComputedStyle(a).visibility === 'visible').map((a) => +a.dataset.ep);
  const ticks = [...document.querySelectorAll('.tick')]
    .filter((t) => t.getAttribute('aria-selected') === 'true')
    .map((t) => +t.dataset.ep);
  return {
    label,
    view: M.cur,
    visibleEpochs: vis,
    selectedTicks: ticks,
    hud: ($('hud-page') || {}).textContent || '',
    live: ($('pg-live') || {}).textContent || '',
    // Only the current page may take a pointer; a hidden page that still does is
    // an invisible click target over the whole viewport.
    interactivePages: ['home', 'exp', 'proj', 'contact'].filter(
      (p) => $('pg-' + p).style.pointerEvents === 'auto',
    ),
  };
};

const step = (dir, label) => {
  const key = dir > 0 ? 'ArrowDown' : 'ArrowUp';
  dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  settle();
  return shot(label);
};

const trace = [];
M.goTo('exp:0');
settle();
trace.push(shot('start'));
for (let i = 0; i < 3; i++) trace.push(step(1, `forward ${i + 1}`));
// The fourth step forward is the one that has to leave the tape.
trace.push(step(1, 'forward past the last Epoch'));
trace.push(step(-1, 'back into the tape'));
// And walk all the way back out the front.
for (let i = 0; i < 3; i++) trace.push(step(-1, `back ${i + 1}`));
trace.push(step(-1, 'back past the first Epoch'));

const views = trace.map((t) => t.view);
const singleEpoch = trace
  .filter((t) => String(t.view).startsWith('exp:'))
  .every((t) => t.visibleEpochs.length === 1 && t.visibleEpochs[0] === +t.view.slice(4));
const ticksAgree = trace
  .filter((t) => String(t.view).startsWith('exp:'))
  .every((t) => t.selectedTicks.length === 1 && t.selectedTicks[0] === +t.view.slice(4));
// Consecutive values, not distinct ones. A screen reader does not re-announce a
// live region that was set to the string it already holds, and the walk revisits
// Epochs on the way back -- so "all ten differ" would be the wrong bar and
// "no step is silent" is the right one.
const announced = trace.every((t, i) => t.live && (i === 0 || t.live !== trace[i - 1].live));
const onePage = trace.every((t) => t.interactivePages.length === 1);

// Playback, checked directly: `armTape` refuses under a debug URL on purpose (a
// capture has to be deterministic), so the flag is set by hand and only the
// scheduling decision is under test. The one that matters is the last Epoch --
// the tape must park there rather than wrap to 2019 or carry on to Projects.
window.TWEAK.v.tapeMs = 50;
M.goTo('exp:1');
settle();
M.tapeLive = true;
M.cueTape('exp:1');
const cuedMidTape = M.tapeT !== null;
M.cueTape('exp:' + (M.slots && Object.keys(M.slots).filter((k) => k.startsWith('exp:')).length - 1));
const cuedAtEnd = M.tapeT !== null;
const liveAtEnd = M.tapeLive;
M.tapeLive = true;
M.cueTape('proj');
const cuedOffTape = M.tapeT !== null;
M.stopTape();

return {
  views,
  expectedViews: ['exp:0', 'exp:1', 'exp:2', 'exp:3', 'proj', 'exp:3', 'exp:2', 'exp:1', 'exp:0', 'home'],
  nestedAdvance: JSON.stringify(views) ===
    JSON.stringify(['exp:0', 'exp:1', 'exp:2', 'exp:3', 'proj', 'exp:3', 'exp:2', 'exp:1', 'exp:0', 'home']),
  singleEpochVisible: singleEpoch,
  ticksAgreeWithField: ticksAgree,
  everyStepAnnounced: announced,
  onlyCurrentPageInteractive: onePage,
  tape: {
    cuesMidTape: cuedMidTape,
    parksAtLastEpoch: !cuedAtEnd && !liveAtEnd,
    neverCuesOffTape: !cuedOffTape,
  },
  trace,
};
