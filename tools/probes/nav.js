// Does a page change conserve its matter, and does it finish?
//
// The lifecycle is destructive on screen and conservative in the machine: a
// grain burns out, its slot stays open, and the same buffer entry manifests
// back into it. Two ways that can go wrong, neither visible in a still -- a
// grain stuck part-way through the cycle because nothing rescheduled it, and a
// page that ends up carrying the wrong amount of matter.
//
// So walk the pages, drive each transition to its end by hand, let the tail
// settle, and take a census. The bar: settled == what this page has room for,
// every other travelling state empty, and the total unchanged at every step.

await (document.fonts ? document.fonts.ready : Promise.resolve());
await new Promise((r) => setTimeout(r, 2500));

const M = window.__matter;
if (!M || !M.A) return { error: 'no __matter — add #dbg=1' };

const A = M.A;
const N = A.st.length;
const NP = Math.max(400, Math.min(N, window.TWEAK.v.count | 0));

const snap = () => {
  const st = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < N; i++) st[A.st[i]]++;
  return st;
};

// Run the clock until the field is quiet: no transition, and nothing left in a
// state that is on its way somewhere. Bounded, so a stuck grain reports as a
// stuck grain instead of hanging the probe.
const settle = (limit) => {
  for (let k = 0; k < limit; k++) {
    M.tick(1 / 60);
    if (M.tr) continue;
    const s = snap();
    if (s[1] === 0 && s[4] === 0 && s[6] === 0) return k;
  }
  return -1;
};

const out = { np: NP, alloc: N, steps: [] };
settle(1200);

for (const pg of ['exp', 'proj', 'contact', 'home', 'proj']) {
  // Force the full choreography rather than the rapid-nav path: under virtual
  // time the wall clock barely moves, so the gate would read every hop as a
  // burst and never exercise the caret sweep at all.
  M.lastNavAt = -Infinity;
  M.goTo(pg);
  const frames = settle(2400);
  const s = snap();
  out.steps.push({
    pg,
    frames,
    slots: M.slots[pg].n,
    want: Math.min(M.slots[pg].n, NP),
    settled: s[0],
    loose: s[1],
    burning: s[4],
    gone: s[5],
    manifesting: s[6],
    total: s.reduce((a, b) => a + b, 0),
  });
}

// The adaptive downscale: a first full transition that misses ~48fps has to cap
// the pixel ratio at 1 rather than cut the particle count, because the buffer is
// sized once. Driven at 30fps here, which is the condition it exists for.
M.perfChecked = false;
M.dprCap = null;
M.lastNavAt = -Infinity;
M.goTo('exp');
for (let k = 0; k < 300 && M.tr; k++) M.tick(1 / 30);
out.downscale = { fired: M.dprCap === 1, ratio: M.r.pixelRatio() };

out.ok = out.steps.every(
  (s) =>
    s.frames >= 0 &&
    s.loose === 0 &&
    s.burning === 0 &&
    s.manifesting === 0 &&
    s.settled === s.want &&
    s.total === N,
);
return out;
