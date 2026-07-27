// Procedural formations. Every position on screen is computed here from real
// repo data or from a project's visual seed — nothing is loaded, sampled, or
// photographed. Each generator fills a Float32Array of count*3 in place.

const TAU = Math.PI * 2;

/** Deterministic PRNG so a formation is identical on every rebuild. */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/** Box-Muller, for cluster jitter that reads organic rather than uniform. */
function gauss(rand) {
  const u = Math.max(rand(), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * rand());
}

/**
 * The whole account: one slow disc, a cluster per repository, cluster mass
 * proportional to its rank score. This is the overture and the hero.
 */
export function nebula(arr, count, repos) {
  const rand = rng(0x9e3779b9);
  const n = Math.max(repos.length, 1);
  // sqrt flattens the score spread: the top repo leads without swallowing the
  // disc, which would collapse the whole field into one saturated core.
  const weights = repos.map((r) => Math.sqrt(Math.max(r.score || 1, 0.5)));
  const total = weights.reduce((a, b) => a + b, 0) || 1;

  // Clusters ride a loose two-arm spiral so the disc has structure, not soup.
  const centers = repos.map((_, i) => {
    const t = i / n;
    const arm = i % 2 ? 0 : Math.PI;
    const a = t * 4.6 + arm;
    const r = 3 + t * 8.5;
    return [Math.cos(a) * r, (rand() - 0.5) * 1.6, Math.sin(a) * r * 0.85];
  });
  if (!centers.length) centers.push([0, 0, 0]);

  let p = 0;
  const halo = Math.floor(count * 0.14);
  for (let i = 0; i < count; i++) {
    if (i < halo) {
      // A thin outer haze so the disc has atmosphere and no hard edge.
      const a = rand() * TAU;
      const r = 6 + rand() * 12;
      arr[p++] = Math.cos(a) * r;
      arr[p++] = gauss(rand) * 1.5;
      arr[p++] = Math.sin(a) * r * 0.85;
      continue;
    }
    let pick = rand() * total;
    let ci = 0;
    while (ci < weights.length - 1 && (pick -= weights[ci]) > 0) ci++;
    const c = centers[ci] || centers[0];
    const spread = 0.5 + (weights[ci] / total) * 2.4;
    arr[p++] = c[0] + gauss(rand) * spread;
    arr[p++] = c[1] + gauss(rand) * spread * 0.22;
    arr[p++] = c[2] + gauss(rand) * spread;
  }
  return arr;
}

/**
 * FLOW — directed laminar streams: a funnel that narrows along its length and
 * resolves into `knots` dense survivors. Twenty million records a day arriving
 * as one intake and leaving as a small number of tables worth reading.
 */
export function stream(arr, count, knots = 6) {
  const rand = rng(0x51ed2701);
  let p = 0;
  for (let i = 0; i < count; i++) {
    const t = Math.pow(rand(), 0.75); // bias toward the wide intake
    const z = -8 + t * 15;
    const squeeze = Math.pow(1 - t, 1.7);
    const radius = 0.35 + squeeze * 6.5;
    const a = rand() * TAU + t * 5.5; // twist along the run
    if (t > 0.86) {
      // Past the ranking, particles collapse onto the surviving knots.
      const k = i % knots;
      const ka = (k / knots) * TAU;
      const kr = 2.4;
      arr[p++] = Math.cos(ka) * kr + gauss(rand) * 0.34;
      arr[p++] = Math.sin(ka) * kr * 0.55 + gauss(rand) * 0.34;
      arr[p++] = z + gauss(rand) * 0.5;
    } else {
      arr[p++] = Math.cos(a) * radius + gauss(rand) * 0.18;
      arr[p++] = Math.sin(a) * radius * 0.7 + gauss(rand) * 0.18;
      arr[p++] = z;
    }
  }
  return arr;
}

// Gielis superformula — one equation, a different solid for every project.
// Exported because the crystal mesh is triangulated from this same equation:
// the point cloud and the solid are two readings of one surface, not two systems.
export function superR(angle, m, n1, n2, n3) {
  const t = (m * angle) / 4;
  const a = Math.pow(Math.abs(Math.cos(t)), n2);
  const b = Math.pow(Math.abs(Math.sin(t)), n3);
  const r = Math.pow(a + b, -1 / n1);
  return Number.isFinite(r) ? Math.min(r, 6) : 0;
}

export const PRESETS = {
  lattice: { m: 8, n1: 0.62, n2: 0.62, n3: 0.62 },
  shell: { m: 6, n1: 0.34, n2: 1.7, n3: 1.7 },
  bloom: { m: 12, n1: 0.38, n2: 1.15, n3: 1.15 },
  ring: { m: 4, n1: 1.25, n2: 0.85, n3: 0.85 },
  drift: { m: 3, n1: 0.22, n2: 1.65, n3: 1.65 },
};

/** One project, as a solid. `seed` is { form, energy, spin } from render.js. */
export function projectForm(arr, count, seed) {
  if (seed.form === 'helix') return helix(arr, count, seed);
  const preset = PRESETS[seed.form] || PRESETS.shell;
  const rand = rng(0xc2b2ae35 ^ Math.round(seed.energy * 1e6));
  const scale = 2.6 + seed.energy * 1.5;
  const thickness = 0.08 + seed.energy * 0.22;

  let p = 0;
  for (let i = 0; i < count; i++) {
    const theta = (rand() - 0.5) * TAU;
    const phi = (rand() - 0.5) * Math.PI;
    const r1 = superR(theta, preset.m, preset.n1, preset.n2, preset.n3);
    const r2 = superR(phi, preset.m, preset.n1, preset.n2, preset.n3);
    const shell = 1 + gauss(rand) * thickness;
    arr[p++] = r1 * Math.cos(theta) * r2 * Math.cos(phi) * scale * shell;
    arr[p++] = r2 * Math.sin(phi) * scale * shell;
    arr[p++] = r1 * Math.sin(theta) * r2 * Math.cos(phi) * scale * shell;
  }
  return arr;
}

function helix(arr, count, seed) {
  const rand = rng(0x27d4eb2f);
  const turns = 3 + Math.round(seed.energy * 4);
  const radius = 2.4 + seed.energy;
  const strands = 2;
  let p = 0;
  for (let i = 0; i < count; i++) {
    const t = rand();
    const strand = i % strands;
    const a = t * TAU * turns + (strand / strands) * Math.PI;
    const wobble = 1 + gauss(rand) * 0.09;
    arr[p++] = Math.cos(a) * radius * wobble;
    arr[p++] = (t - 0.5) * 9.5 * seed.spin;
    arr[p++] = Math.sin(a) * radius * wobble;
  }
  return arr;
}

/**
 * TYPE — the one behaviour where particles become letterforms, and the name is
 * the only string it is ever used for. The text is drawn once to an offscreen
 * canvas and particles are distributed over the lit pixels, so the field spells
 * the name in exactly the Archivo it is about to hand it over to.
 *
 * `layout` is measured off the live element by typeLayout() in main.js: the
 * canvas size in CSS pixels (px, py), the same rectangle in world units (w, h)
 * about a centre (cx, cy), and the element's own line boxes in canvas-local
 * coordinates. Trusting the browser's measurements rather than re-deriving
 * them is what keeps the particles on top of the type they replace.
 */
export function glyphs(arr, count, text, layout) {
  const cw = Math.max(Math.round(layout.px), 8);
  const ch = Math.max(Math.round(layout.py), 8);
  const cv = document.createElement('canvas');
  cv.width = cw;
  cv.height = ch;

  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.font = layout.font;
  if ('letterSpacing' in ctx) ctx.letterSpacing = layout.tracking;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Canvas cannot be told about a variable font's width axis — `font-stretch`
  // on the 2D context takes only the CSS keywords, so the display role's 118%
  // is silently dropped and the text comes out ~15% narrow. Rather than fight
  // that, measure the gap once and scale every line to the width the browser
  // actually gave it: one correction that covers the width axis, letter-spacing
  // rounding, and anything else the context quietly ignores.
  const words = String(text).split(/\s+/).filter(Boolean);
  const probe = ctx.measureText(words.join(' ')).width || 1;
  const k = layout.lines.reduce((a, b) => a + b.w, 0) / probe;

  let w = 0;
  for (const box of layout.lines) {
    // Greedy fitting against the browser's own line widths reproduces its break
    // decisions, so the particle name wraps exactly where the heading wraps.
    let line = '';
    while (w < words.length) {
      const next = line ? `${line} ${words[w]}` : words[w];
      if (line && ctx.measureText(next).width * k > box.w) break;
      line = next;
      w++;
    }
    if (!line && w < words.length) line = words[w++]; // a single word wider than its box
    if (!line) continue;

    const m = ctx.measureText(line);
    const asc = m.fontBoundingBoxAscent;
    const half = (box.h - (asc + m.fontBoundingBoxDescent)) / 2; // half-leading
    ctx.save();
    ctx.translate(box.x, box.y + half + asc);
    ctx.scale(m.width ? box.w / m.width : 1, 1);
    ctx.fillText(line, 0, 0);
    ctx.restore();
  }

  // One pass to collect coverage, then uniform picks from it — cheaper and far
  // more even than rejection-sampling against a shape this sparse.
  const data = ctx.getImageData(0, 0, cw, ch).data;
  const lit = [];
  for (let i = 3; i < data.length; i += 4) if (data[i] > 90) lit.push((i - 3) >> 2);
  if (!lit.length) return scatter(arr, count); // no face, no letterforms

  const rand = rng(0x1b873593);
  let p = 0;
  for (let i = 0; i < count; i++) {
    const idx = lit[(rand() * lit.length) | 0];
    const x = (idx % cw) + rand();
    const y = ((idx / cw) | 0) + rand();
    arr[p++] = layout.cx + (x / cw - 0.5) * layout.w;
    arr[p++] = layout.cy - (y / ch - 0.5) * layout.h;
    arr[p++] = gauss(rand) * 0.12; // a little depth, so it reads as matter not a decal
  }
  return arr;
}

/**
 * SEGMENT and ALIGN in one figure, because the bridge is one beat.
 *
 * A boundary runs through the cloud: below it everything the boundary rejected
 * lies flat as ground, above it the survivors cohere into crowns — the literal
 * shape of the canopy work. And every crown is sheared along one shared axis,
 * so the figure that survived being separated is also combed into agreement.
 * Segmentation and alignment are the same gesture seen from two ends.
 */
export function segment(arr, count) {
  const rand = rng(0x165667b1);
  const CROWNS = 14;
  // Crowns sit on a loose grid rather than at random, so the boundary reads as
  // a survey of a place and not as a spray.
  const centers = Array.from({ length: CROWNS }, (_, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    return [
      (col - 2) * 4.1 + (rand() - 0.5) * 1.6,
      0.5 + rand() * 1.5,
      (row - 1.2) * 4.4 + (rand() - 0.5) * 1.6,
    ];
  });

  const GROUND = 0.42; // what the boundary put down
  let p = 0;
  for (let i = 0; i < count; i++) {
    if (rand() < GROUND) {
      arr[p++] = (rand() - 0.5) * 24;
      arr[p++] = -3.1 + gauss(rand) * 0.16;
      arr[p++] = (rand() - 0.5) * 16;
      continue;
    }
    const c = centers[(rand() * CROWNS) | 0];
    // A flattened dome: crowns are wide and shallow seen from above.
    const a = rand() * TAU;
    const r = Math.sqrt(rand()) * (1.35 + rand() * 0.5);
    const dome = Math.cos((r / 1.85) * (Math.PI / 2));
    const x = c[0] + Math.cos(a) * r;
    const z = c[2] + Math.sin(a) * r;
    const y = c[1] + dome * 1.15 + gauss(rand) * 0.09;
    // The comb: one shared gradient leaning every crown the same way.
    arr[p++] = x + (y + 3.1) * 0.16;
    arr[p++] = y;
    arr[p++] = z + (y + 3.1) * 0.05;
  }
  return arr;
}

/** A wide, sparse, honest scatter — the field at rest, and the overture's start. */
export function scatter(arr, count) {
  const rand = rng(0x85ebca6b);
  let p = 0;
  for (let i = 0; i < count; i++) {
    arr[p++] = (rand() - 0.5) * 20;
    arr[p++] = gauss(rand) * 1.5;
    arr[p++] = (rand() - 0.5) * 14;
  }
  return arr;
}

/** The close: everything settles onto a calm horizon. */
export function horizon(arr, count) {
  const rand = rng(0xff51afd7);
  let p = 0;
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * 26;
    const z = (rand() - 0.5) * 18;
    const fall = Math.exp(-Math.abs(x) / 9);
    arr[p++] = x;
    arr[p++] = gauss(rand) * 0.28 * fall - 1.2;
    arr[p++] = z;
  }
  return arr;
}
