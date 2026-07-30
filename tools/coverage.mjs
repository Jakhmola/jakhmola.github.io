// The two measured rules, measured.
//
// The Name Reads First Rule and the ceiling that replaced The Additive Ceiling
// are both claims about the rendered page, and DESIGN.md says in as many words
// that they hold by measurement rather than by intent. This is the measurement:
// screenshot every page at a fixed viewport, take each heading's ink box from
// the sampler itself, and report what is actually lit inside it.
//
//   node tools/coverage.mjs [--size 1440x900]
//
// Two numbers per heading. `lit` is the share of pixels carrying any signal at
// all, which is the legibility bar: a heading has to beat the site's own body
// copy, reported alongside it as `copy:`. `cored` is the share that has stacked
// past the point where the cyan loses its hue and goes achromatic -- the One Hue
// Rule broken in the output while every value in the stylesheet still complies.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SCRATCH = process.env.CLAUDE_JOB_DIR ? join(process.env.CLAUDE_JOB_DIR, 'tmp') : tmpdir();
const size = process.argv.includes('--size')
  ? process.argv[process.argv.indexOf('--size') + 1]
  : '1440x900';
// Appended to every shot's hash. The two measured rules are claims about what is
// lit, and half of what lights this field is a response to a pointer -- so without
// a way to put a hand on the page, this tool can only ever measure the room with
// nobody in it. `--hash 'mx=500&my=340'` is how the aura, the reach and the wake
// get measured against The Name Reads First Rule at all.
const extra = process.argv.includes('--hash')
  ? '&' + process.argv[process.argv.indexOf('--hash') + 1]
  : '';
const dir = mkdtempSync(join(SCRATCH, 'cov-'));
const bench = new URL('bench.mjs', import.meta.url).pathname;
const run = (args) => execFileSync('node', [bench, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });

const boxes = JSON.parse(
  run(['probe', 'dist/index.html', new URL('probes/align.js', import.meta.url).pathname, '--size', size, '--hash', 'dbg=1']),
);

// The probe lays out under --dump-dom and the shot under --screenshot, and the
// two disagree on viewport height by the browser chrome the headless window
// does not draw. The page re-cuts itself for the shot; the boxes have to be
// re-read from that same frame, so scale them by the height ratio rather than
// trusting the probe's own numbers.
const [w, h] = size.split('x').map(Number);
const probeH = Number(boxes.vp.split('x')[1]);

const py = (v) => Math.round((v - probeH / 2) + h / 2);

const out = {};
for (const pg of Object.keys(boxes.pages)) {
  const png = join(dir, pg + '.png');
  run(['shot', 'dist/index.html', png, '--size', size, '--hash', `t0=3.5&pg=${pg}` + extra]);
  const rows = boxes.pages[pg].map((tg) => {
    const [x0, y0, x1, y1] = tg.box;
    return { t: tg.t, n: tg.n, box: [x0, py(y0), x1, py(y1)] };
  });
  writeFileSync(join(dir, pg + '.json'), JSON.stringify(rows));
  const res = execFileSync(
    'python3',
    [new URL('lit.py', import.meta.url).pathname, png, join(dir, pg + '.json')],
    { encoding: 'utf8' },
  );
  out[pg] = JSON.parse(res);
}
console.log(JSON.stringify({ size, out }, null, 2));
