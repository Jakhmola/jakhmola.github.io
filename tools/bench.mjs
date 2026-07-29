// Headless rig for the matter system: run a probe inside a real built page, or
// screenshot one at an exact simulation moment.
//
// Everything here exists because the matter system cannot be unit tested -- it
// is a GPU frame loop over a DOM that has to be laid out for its numbers to
// mean anything. So the check is: load the real page in the real browser, ask
// it a question, and read the answer back.
//
//   node tools/bench.mjs probe dist/index.html tools/probes/census.js --size 1440x900
//   node tools/bench.mjs shot  lab-blend.html  out.png --size 1440x900 --hash 't0=3.2'
//
// Virtual time advances timers and promises but barely ticks rAF, so a probe
// may await fonts and layout, and a shot aims at a frame with #t0= instead.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROME = '/usr/bin/chromium';
const SCRATCH = process.env.CLAUDE_JOB_DIR ? join(process.env.CLAUDE_JOB_DIR, 'tmp') : tmpdir();

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i > 0 ? process.argv[i + 1] : dflt;
}

const [, , cmd, target, out] = process.argv;
const [w, h] = arg('size', '1440x900').split('x').map(Number);
const hash = arg('hash', '');
const vt = +arg('vt', 12000);

// SwiftShader, always. A headless box has no GPU and a silent fallback to no
// WebGL at all would read as "the matter system is broken" rather than "there
// is no card here".
const FLAGS = [
  '--headless=new',
  '--no-sandbox',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--enable-unsafe-swiftshader',
  '--allow-file-access-from-files',
  `--window-size=${w},${h}`,
];

const run = (extra, url) =>
  execFileSync(CHROME, [...FLAGS, ...extra, url], {
    encoding: 'utf8',
    maxBuffer: 256 << 20,
    stdio: ['ignore', 'pipe', 'ignore'],
  });

if (cmd === 'probe') {
  // The probe is appended to a copy of the real page rather than injected into
  // it, because file:// has no other seam and the copy is thrown away anyway.
  // Relative hrefs still have to resolve, so the copy sits beside the original.
  const src = readFileSync(target, 'utf8');
  const probe = readFileSync(out, 'utf8');
  const tmp = resolve(target, '..', `.bench-${process.pid}.html`);
  // The sentinel is assembled at runtime so the literal never appears in the
  // shim's own source. --dump-dom returns script text too, and a probe that
  // fails to report would otherwise "succeed" by matching its own marker.
  const shim = `<pre id="bench" style="display:none"></pre><script>
    (async () => {
      const M = '@' + '@';
      const say = (v) => { document.getElementById('bench').textContent =
        M + JSON.stringify(v) + M; };
      try { say(await (async () => { ${probe} })()); }
      catch (e) { say({ error: String(e && e.stack || e) }); }
    })();
  </script>`;
  writeFileSync(tmp, src.replace('</body>', shim + '</body>'));
  try {
    const dom = run(['--dump-dom', `--virtual-time-budget=${vt}`], 'file://' + tmp + (hash && '#' + hash));
    const m = /<pre id="bench"[^>]*>@@([\s\S]*?)@@<\/pre>/.exec(dom);
    // Virtual time freezes the wall clock and starves rAF, so a probe that
    // awaits either never finishes. That is what this almost always means.
    if (!m) throw new Error('probe never reported — it threw, or it awaited rAF/wall-clock under virtual time');
    console.log(JSON.stringify(JSON.parse(m[1]), null, 2));
  } finally {
    execFileSync('rm', ['-f', tmp]);
  }
} else if (cmd === 'shot') {
  // A screenshot has to wait on real frames, so it gets wall-clock time and the
  // page is expected to have scrubbed itself to the wanted moment via #t0=.
  const prof = mkdtempSync(join(SCRATCH, 'chrome-'));
  run(
    [`--screenshot=${resolve(out)}`, '--virtual-time-budget=1', `--user-data-dir=${prof}`, '--timeout=20000'],
    'file://' + resolve(target) + (hash && '#' + hash),
  );
  console.log(out);
} else {
  console.error('usage: bench.mjs probe <page.html> <probe.js> | shot <page.html> <out.png>');
  process.exit(1);
}
