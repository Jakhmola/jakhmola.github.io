// Fill rate, the number that actually decides whether the new material is
// affordable. Grain count is not the risk -- the census already showed the new
// sampler is cheaper in grains than today's budget. The risk is fragment work:
// gl.POINTS sprites are square, so cost grows with the square of sprite size,
// and a stretch tail grows the sprite by its whole reach.
//
// This is arithmetic over the census, not a benchmark. A headless box has only
// swiftshader, and a software rasterizer's fps says nothing about a laptop's --
// but shaded fragments per frame is the same number on both.
//
//   node tools/fillrate.mjs <census.json>

import { readFileSync } from 'node:fs';

const c = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const PAGES = ['home', 'exp', 'proj', 'contact'];

// Today, from tweak.js SCHEMA. The name samples on its own grain size; every
// other heading is restS. Sprite is aSize * grain * dpr * persp.
const OLD = { grid: 2, fill: 0.37, grain: 2.3, heroS: 1.05, restS: 0.75, dpr: 2,
  baseS: 3.7, depth: 0.36 };
// lab-blend's measured set. Sprite is s0 * grain * near, s0 following the
// heading's own grid, and near from depth into the stroke.
const NEW = { gridk: 36, fill: 0.69, grain: 1.75, dpr: 2, s0k: 1.05, persp: 0.34,
  ssize: 3, str: 0.82, sreach: 5, r: 76 };

// Mean of persp over grains: aShade runs 0 at the contour to 1 at the spine and
// the field is contour-heavy, so 0.42 rather than 0.5.
const meanShade = 0.42;

const perHeading = c.headings.map((h) => {
  // Old: one uniform 2px lattice for every heading, so its counts have to be
  // rescaled from the census lattice by the ratio of cell areas.
  const scale = (h.grid * h.grid) / (OLD.grid * OLD.grid);
  const oldEdge = h.edge * (h.grid / OLD.grid);   // contour is a line: scales linearly
  const oldInterior = h.interior * scale;          // interior is an area
  const oldN = oldEdge + oldInterior * OLD.fill;
  const hero = h.pg === 'home';
  const oldPx = OLD.baseS * (hero ? OLD.heroS : OLD.restS) * OLD.grain * OLD.dpr *
    (1 - meanShade * OLD.depth);

  const newN = h.edge + h.interior * NEW.fill;
  const newBasePx = h.grid * NEW.s0k * NEW.grain * NEW.dpr * (1 + meanShade * NEW.persp);

  // The sprite spans grain -> reach point, so its cost is (base + reach)^2 --
  // and the reach is NOT the aura radius. It is distance-to-cursor times a
  // falloff that is zero at both ends, so it peaks somewhere in the middle.
  // Maximized numerically rather than by hand, because the settled and loose
  // paths fall off differently and the algebra is where the first estimate
  // went wrong by a factor of ten.
  const auraR = NEW.r * NEW.sreach;
  let loosePx = 0;
  let settledPx = 0;
  for (let d = 1; d < auraR; d++) {
    const f = (1 - d / auraR) * NEW.str;
    // Loose: anchor moves by the full (cursor - grain) vector scaled by f.
    loosePx = Math.max(loosePx, newBasePx * NEW.ssize + d * f * NEW.dpr);
    // Settled taffy: a softer f^2 falloff at half strength, and the sprite
    // grows toward symbol size by the same factor.
    const taffy = (1 - d / auraR) ** 2 * 0.5 * NEW.str;
    settledPx = Math.max(settledPx, newBasePx * (1 + taffy * (NEW.ssize - 1)) + d * taffy * NEW.dpr);
  }
  // The shader clamps gl_PointSize to 300. Every estimate has to respect it or
  // it prices fragments the GPU is never asked to shade.
  const CLAMP = 300;
  return { ...h, oldN, oldPx, newN,
    newBasePx: Math.min(CLAMP, newBasePx),
    loosePx: Math.min(CLAMP, loosePx),
    settledPx: Math.min(CLAMP, settledPx) };
});

const sum = (a) => a.reduce((s, v) => s + v, 0);
const fmt = (n) => (n / 1e6).toFixed(1) + 'M';

console.log(`viewport ${c.viewport.join('x')}   screen = ${fmt(c.viewport[0] * c.viewport[1] * OLD.dpr ** 2)} px\n`);
console.log('page      grains old/new     shaded px/frame old      new idle      new worst');
console.log('-'.repeat(78));

const rows = {};
for (const pg of PAGES) {
  const hs = perHeading.filter((h) => h.pg === pg);
  if (!hs.length) continue;
  const oldN = sum(hs.map((h) => h.oldN));
  const newN = sum(hs.map((h) => h.newN));
  const oldA = sum(hs.map((h) => h.oldN * h.oldPx ** 2));
  const newIdle = sum(hs.map((h) => h.newN * h.newBasePx ** 2));
  // The aura is 380px in radius -- wider than any heading on this site is tall,
  // and wider than the name is half-long. So there is no honest "fraction of
  // grains in range" discount: a cursor parked mid-word has essentially the
  // whole heading inside its aura. Worst case is every grain at once.
  const worstSettled = sum(hs.map((h) => h.newN * h.settledPx ** 2));
  const worstLoose = sum(hs.map((h) => h.newN * h.loosePx ** 2));
  rows[pg] = { oldN, newN, oldA, newIdle, worst: Math.max(worstSettled, worstLoose), worstSettled, worstLoose };
  console.log(
    `${pg.padEnd(9)} ${String(Math.round(oldN)).padStart(6)}/${String(Math.round(newN)).padEnd(7)} ` +
      `${fmt(oldA).padStart(16)} ${fmt(newIdle).padStart(12)} ${fmt(Math.max(worstSettled,worstLoose)).padStart(14)}`,
  );
}

const worstPage = Object.entries(rows).sort((a, b) => b[1].newIdle - a[1].newIdle)[0];
const screen = c.viewport[0] * c.viewport[1] * OLD.dpr ** 2;
console.log('\n' + '-'.repeat(78));
console.log(`worst page (idle):   ${worstPage[0]}  ${Math.round(worstPage[1].newN)} grains`);
console.log(`  overdraw vs screen: old ${(worstPage[1].oldA / screen).toFixed(1)}x   ` +
  `new ${(worstPage[1].newIdle / screen).toFixed(1)}x   ` +
  `new worst ${(worstPage[1].worst / screen).toFixed(1)}x`);
console.log(`  new/old idle ratio: ${(worstPage[1].newIdle / worstPage[1].oldA).toFixed(2)}x`);
console.log(`\nbuffer: MAXN must cover ${Math.max(...Object.values(rows).map((r) => Math.round(r.newN)))} ` +
  `grains (worst page) + headroom`);
const floats = 13;
console.log(`upload: ${Math.round(worstPage[1].newN)} x ${floats} floats = ` +
  `${Math.round((worstPage[1].newN * floats * 4) / 1024)}KB/frame  ` +
  `(today ${Math.round((9000 * 5 * 4) / 1024)}KB at 9,000 live)`);

// Which scenario is actually expensive decides what has to be re-defaulted.
console.log('\nworst case, by scenario (multiples of screen):');
for (const [pg, r] of Object.entries(rows))
  console.log(`  ${pg.padEnd(9)} settled taffy ${(r.worstSettled / screen).toFixed(1)}x` +
    `   loose reach ${(r.worstLoose / screen).toFixed(1)}x`);

// The stretch parameters came from the lab, where they were tuned for feel on a
// page with no budget. Solve for what the site can actually afford instead of
// guessing: the reach radius is the dominant term, since it enters squared.
const cost = (sreach, ssize, str) => {
  let worst = 0;
  for (const pg of PAGES) {
    const hs = perHeading.filter((h) => h.pg === pg);
    if (!hs.length) continue;
    const auraR = NEW.r * sreach;
    let a = 0;
    for (const h of hs) {
      const base = h.newBasePx;
      let loose = 0;
      for (let d = 1; d < auraR; d++)
        loose = Math.max(loose, base * ssize + d * (1 - d / auraR) * str * NEW.dpr);
      a += h.newN * Math.min(300, loose) ** 2;
    }
    worst = Math.max(worst, a);
  }
  return worst / screen;
};

console.log('\nloose-reach worst case vs screen, by reach radius x symbol size (str=0.82):');
const SR = [1, 1.5, 2, 2.5, 3, 4, 5];
const SS = [1.5, 2, 2.5, 3];
console.log('  sreach ' + SS.map((s) => `ssize=${s}`.padStart(10)).join(''));
for (const sr of SR)
  console.log(`  ${String(sr).padEnd(7)}` +
    SS.map((ss) => (cost(sr, ss, NEW.str).toFixed(1) + 'x').padStart(10)).join(''));
console.log(`\n  today's peak for reference: ${(worstPage[1].oldA / screen).toFixed(2)}x screen`);
