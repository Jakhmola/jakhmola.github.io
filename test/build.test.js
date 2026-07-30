// Seam 1 — build CLI (top seam): full build against fixture GitHub-API JSON,
// network stubbed; assert on the generated dist/ output.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { build, fixtureFetch } from '../src/build.js';

const FIXTURES = fileURLToPath(new URL('./fixtures', import.meta.url));
const NOW = Date.parse('2026-06-10T00:00:00Z');
const tmpDirs = [];

async function runBuild(fetchImpl = (url) => fixtureFetch(FIXTURES, url)) {
  const dir = await mkdtemp(path.join(tmpdir(), 'portfolio-build-'));
  tmpDirs.push(dir);
  const outDir = path.join(dir, 'dist');
  const cachePath = path.join(dir, 'summaries.json');
  await build({ outDir, cachePath, fetchImpl, now: NOW, token: 'test-token', log: () => {} });
  const html = await readFile(path.join(outDir, 'index.html'), 'utf8');
  return { outDir, cachePath, html };
}

// A Project Row's name is Matter Text at the Headline rung, or DOM text when it
// is too long for one -- so tests ask for the tag by name, not by class.
const nameTag = (n) => new RegExp(`<h3 class="(?:mt|copy) pname" style="--ch:${n.length}">${n}</h3>`);
// Everything one row renders, so a block can be asserted present on the repo
// whose README supports it and absent on the one whose README does not.
const rowOf = (html, n) =>
  html.split('<li class="project"').find((chunk) => chunk.includes(`>${n}</h3>`)) || '';

let b; // one shared fixture-mode build for most assertions
before(async () => {
  b = await runBuild();
});
after(() => Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true }))));

test('renders the four pages, name, epochs, and contact links from Seed Content', () => {
  for (const id of ['pg-home', 'pg-exp', 'pg-proj', 'pg-contact']) {
    assert.match(b.html, new RegExp(`id="${id}"`), `${id} section exists`);
  }
  // The space between the spans is load-bearing: without it the accessible name
  // of the <h1> is "SHUBHAMJAKHMOLA". Flex layout drops it, so it costs nothing.
  assert.match(b.html, /<h1 class="name"><span class="mt">SHUBHAM<\/span> <span class="mt">JAKHMOLA<\/span><\/h1>/);
  assert.match(b.html, /AI ENGINEER — AGENTS · RAG · DEEP LEARNING/);
  assert.match(b.html, /I build LLM systems that ship/);
  assert.match(b.html, /Deep learning research/, 'experience epoch renders');
  assert.match(b.html, /<li>PyTorch<\/li>/, 'epoch tags render');
  assert.match(b.html, /Let&#39;s build/);
  assert.match(b.html, /href="resume\.pdf"/);
  assert.match(b.html, /mailto:j4khmola@gmail\.com/);
  assert.match(b.html, /https:\/\/github\.com\/Jakhmola/);
  assert.match(b.html, /https:\/\/www\.linkedin\.com\/in\/jakhmola/);
});

test('renders Featured Projects in rank order with source links', () => {
  const expected = [
    'rag-search-engine',
    'coding_agent',
    'Brain-Tumor-Segmentation',
    'automated-ticketing-system',
    'interview-coach',
  ];
  const positions = expected.map((n) => b.html.search(nameTag(n)));
  for (const [i, pos] of positions.entries()) {
    assert.ok(pos !== -1, `${expected[i]} has a project row`);
    assert.match(b.html, new RegExp(`href="https://github\\.com/Jakhmola/${expected[i]}"`));
    if (i > 0) assert.ok(pos > positions[i - 1], `${expected[i]} renders after ${expected[i - 1]}`);
  }
});

test('only Featured Projects reach the page; everything else is left to GitHub', () => {
  assert.match(b.html, /all repos on github/, 'the outbound link stands in for the rest-list');
  assert.ok(!b.html.includes('Super-Mario-AI'), 'ranked-out original not rendered');
  assert.ok(
    !b.html.includes('behavioral-biometric-identification'),
    'ranked-out original not rendered',
  );
  assert.ok(!b.html.includes('career-ops'), 'untagged fork never rendered');
  assert.ok(!b.html.includes('freeCodeCamp-boilerplate'), 'fork never rendered');
  assert.ok(!b.html.includes('scratch-experiments'), 'portfolio-hide never rendered');
  assert.ok(!b.html.includes('Jakhmola/Jakhmola"'), 'profile repo never rendered');
});

test('the page is complete and calm without JS: no hidden-by-default content', () => {
  assert.match(b.html, /document\.documentElement\.className='matter'/, 'mode probe present');
  assert.ok(!/style="[^"]*(display:\s*none|opacity:\s*0)/.test(b.html), 'nothing inline-hidden');
  assert.match(b.html, /class="copy about calm-only"/, 'long-form about survives for no-JS readers');
  assert.match(b.html, /I&#39;m an AI engineer focused on the practical end/);
});

test('LLM unavailable (fixture mode): cards fall back to raw descriptions, build still succeeds', () => {
  assert.match(b.html, /Retrieval-augmented search engine over document corpora/);
});

test('LLM success: Summary text renders and the cache file is written', async () => {
  const fetchImpl = async (url, init) => {
    if (String(url).startsWith('https://models.github.ai/')) {
      const { name } = JSON.parse(init.body).messages[1].content.match(/Repository: (?<name>\S+)/).groups;
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: `Two-sentence summary of ${name}.` } }] }) };
    }
    return fixtureFetch(FIXTURES, url);
  };
  const built = await runBuild(fetchImpl);
  assert.match(built.html, /Two-sentence summary of rag-search-engine\./);
  const cache = JSON.parse(await readFile(built.cachePath, 'utf8'));
  assert.equal(
    cache['Jakhmola/rag-search-engine'].summary,
    'Two-sentence summary of rag-search-engine.',
  );
});

test('a portfolio-feature fork gets a Project Card end to end (amended fork rule)', async () => {
  const fetchImpl = async (url) => {
    const res = await fixtureFetch(FIXTURES, url);
    if (!/\/users\/[^/]+\/repos/.test(String(url))) return res;
    const repos = await res.json();
    if (repos.length) {
      repos.push({
        name: 'rescued-fork',
        full_name: 'Jakhmola/rescued-fork',
        html_url: 'https://github.com/Jakhmola/rescued-fork',
        description: 'Fork-flagged but active original work',
        fork: true,
        topics: ['portfolio-feature'],
        language: 'Python',
        stargazers_count: 0,
        pushed_at: '2026-06-01T10:00:00Z',
      });
    }
    return { ok: true, status: 200, json: async () => repos };
  };
  const built = await runBuild(fetchImpl);
  assert.match(built.html, nameTag('rescued-fork'));
  assert.ok(!built.html.includes('freeCodeCamp-boilerplate'), 'untagged fork still excluded');
});

// The nightly cron is unattended: an API that answers with nothing is a state
// this page ships in, not a hypothetical.
test('zero Featured Projects renders an explained page, not an empty one', async () => {
  const fetchImpl = async (url) =>
    /\/users\/[^/]+\/repos/.test(String(url))
      ? { ok: true, status: 200, json: async () => [] }
      : fixtureFetch(FIXTURES, url);
  const built = await runBuild(fetchImpl);
  assert.ok(!built.html.includes('pname'), 'no project rows');
  assert.match(built.html, /Nothing came back from the API/, 'the void is explained');
  assert.match(built.html, /all repos on github/, 'and GitHub is still reachable');
});

test('a repo with no summary and no description still says something specific', async () => {
  const fetchImpl = async (url) => {
    const res = await fixtureFetch(FIXTURES, url);
    if (!/\/users\/[^/]+\/repos/.test(String(url))) return res;
    const repos = await res.json();
    return {
      ok: true,
      status: 200,
      json: async () => [
        ...repos,
        {
          name: 'blank-slate',
          full_name: 'Jakhmola/blank-slate',
          html_url: 'https://github.com/Jakhmola/blank-slate',
          description: '',
          fork: false,
          topics: ['portfolio-feature'],
          language: 'Rust',
          stargazers_count: 4,
          pushed_at: '2026-06-09T10:00:00Z',
        },
      ],
    };
  };
  const built = await runBuild(fetchImpl);
  assert.match(built.html, /Rust · 4 stars\. No summary yet/, 'fallback names the repo, not every repo');
});

test('a corrupted Summary cache degrades to a cold cache instead of failing the build', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'portfolio-build-'));
  tmpDirs.push(dir);
  const cachePath = path.join(dir, 'summaries.json');
  await writeFile(cachePath, '{"Jakhmola/rag-search-engine": {"hash": "truncated by actions/ca');
  const outDir = path.join(dir, 'dist');
  await build({
    outDir,
    cachePath,
    fetchImpl: (url) => fixtureFetch(FIXTURES, url),
    now: NOW,
    token: 'test-token',
    log: () => {},
  });
  const html = await readFile(path.join(outDir, 'index.html'), 'utf8');
  assert.match(
    html,
    /Retrieval-augmented search engine over document corpora/,
    'falls back to descriptions',
  );
  assert.deepEqual(Object.keys(JSON.parse(await readFile(cachePath, 'utf8'))), [], 'cache rewritten valid');
});

test('dist/ ships style.css, tweak.js, matter.js and resume.pdf alongside index.html', async () => {
  assert.ok((await stat(path.join(b.outDir, 'style.css'))).isFile());
  assert.ok((await stat(path.join(b.outDir, 'tweak.js'))).isFile());
  assert.ok((await stat(path.join(b.outDir, 'matter.js'))).isFile());
  assert.ok((await stat(path.join(b.outDir, 'resume.pdf'))).size > 0);
});

// Order is load-bearing three times over: tweak.js has to put saved values on
// :root before first paint, it can only override the probe's reading if it runs
// after it, and matter.js reads its knobs from the object tweak.js defines.
test('tweak.js loads undeferred, after the mode probe and before matter.js', () => {
  const probe = b.html.indexOf("document.documentElement.className='matter'");
  const tweak = b.html.indexOf('<script src="tweak.js"></script>');
  const matter = b.html.indexOf('<script src="matter.js" defer>');
  assert.ok(probe !== -1 && tweak !== -1 && matter !== -1, 'all three scripts present');
  assert.ok(probe < tweak && tweak < matter, 'probe -> tweak -> matter');
});

test('page carries title, description, and Open Graph meta tags', () => {
  assert.match(b.html, /<title>Shubham Jakhmola &mdash; AI Engineer<\/title>/);
  assert.match(b.html, /<meta name="description" content="I build LLM systems/);
  assert.match(b.html, /<meta property="og:title"/);
  assert.match(b.html, /<meta property="og:url" content="https:\/\/jakhmola\.github\.io"/);
  assert.match(b.html, /<link rel="icon" href="data:image\/svg\+xml,/);
});

// ---------------------------------------------------------------- the Plate --

test('a project name is Matter Text at the Headline rung, with its own length', () => {
  // `--ch` is what lets the stylesheet fit the rung to the name without
  // measuring text, which CSS cannot do.
  assert.match(b.html, /<h3 class="mt pname" style="--ch:17">rag-search-engine<\/h3>/);
  assert.match(b.html, /<h3 class="mt pname" style="--ch:26">automated-ticketing-system<\/h3>/);
});

// The featured set is chosen nightly with nobody watching, and `.mt` is nowrap at
// fit-content -- so a name past its track is sampled past the edge of the page and
// drawn off it. Past the measured limit the build hands the name back to DOM text.
test('a name too long for the rung falls back to DOM text instead of overflowing', async () => {
  const long = 'a-repository-name-of-quite-unreasonable-length-indeed';
  const fetchImpl = async (url) => {
    const res = await fixtureFetch(FIXTURES, url);
    if (!/\/users\/[^/]+\/repos/.test(String(url))) return res;
    const repos = await res.json();
    return {
      ok: true,
      status: 200,
      json: async () => [
        ...repos,
        {
          name: long,
          full_name: `Jakhmola/${long}`,
          html_url: `https://github.com/Jakhmola/${long}`,
          description: 'Long enough to lose the matter rung',
          fork: false,
          topics: ['portfolio-feature'],
          language: 'Python',
          stargazers_count: 0,
          pushed_at: '2026-06-09T10:00:00Z',
        },
      ],
    };
  };
  const built = await runBuild(fetchImpl);
  assert.ok(long.length > 45, 'the fixture name is past the measured limit');
  assert.match(built.html, new RegExp(`<h3 class="copy pname" style="--ch:${long.length}">${long}</h3>`));
  // And a name inside the limit is unaffected by its presence.
  assert.match(built.html, nameTag('rag-search-engine'));
});

test('the Schematic is derived, cited, drawn as drafting, and costs no grain', () => {
  const rag = rowOf(b.html, 'rag-search-engine');
  assert.match(rag, /<figure class="schem">/);
  assert.match(rag, /parsed &middot; ascii pipeline, verbatim from &ldquo;Search Pipeline&rdquo;/);
  // An <svg>, not a canvas and not Matter Text: it is in the HTML for the calm
  // reading, and nothing about it is built from particles.
  assert.match(rag, /<svg class="schem-svg" style="--sw:\d+" viewBox="0 0 \d+ \d+"/);
  assert.ok(!rag.includes('class="mt schem'), 'the drawing is never sampled');
  // One spoken label rather than twenty loose <tspan>s in layout order.
  assert.match(rag, /role="img" aria-label="Search Pipeline: Query → /);

  const ic = rowOf(b.html, 'interview-coach');
  assert.match(ic, /parsed &middot; mermaid flowchart, verbatim from &ldquo;Architecture&rdquo;/);
});

test('a sparse README ships sparse: blocks are omitted, never padded', () => {
  const bt = rowOf(b.html, 'Brain-Tumor-Segmentation');
  assert.ok(bt, 'the row exists');
  for (const cls of ['schem', 'calls', 'figs']) {
    assert.ok(!bt.includes(`class="${cls}"`), `no ${cls} invented for a README without one`);
  }
  // What it does have is what the API returned about it, and its own summary.
  assert.match(bt, /<dl class="facts">/);
  assert.match(bt, /U-Net, ResNet and VGG segmentation models on BraTS 2020/);
});

test('the facts register reuses the Epoch component and prints stars at zero', () => {
  const at = rowOf(b.html, 'automated-ticketing-system');
  assert.match(at, /<dl class="facts"><div><dt>Language<\/dt><dd>Python<\/dd><\/div>/);
  // A portfolio that prints only its flattering fields is one a reader checks
  // once and stops trusting.
  assert.match(at, /<dt>Stars<\/dt><dd>0<\/dd>/);
});

test('decisions and figures are verbatim, capped, and attributed to a row', () => {
  const at = rowOf(b.html, 'automated-ticketing-system');
  assert.match(at, /<dl class="calls"><dt class="blk-h">Decisions<\/dt>/);
  assert.match(at, /Tickets with ≥85% aggregate confidence are auto-closed/);
  assert.equal((at.match(/<dl class="calls">/g) || []).length, 1);
  const calls = at.match(/<dl class="calls">[\s\S]*?<\/dl>/)[0];
  assert.equal((calls.match(/<div><dt>/g) || []).length, 3, 'capped at three');

  // behavioral-biometric-identification is the account's figures block, and the
  // fixture ranking leaves it out at featuredCount 5 -- so the rendered shape is
  // asserted on the row that has one when the set changes, and the extraction
  // itself is covered directly in test/derive.test.js.
  for (const row of b.html.split('<li class="project"').slice(1)) {
    if (!row.includes('class="figs"')) continue;
    assert.match(row, /<p class="blk-h">Reported<\/p><ul><li>/);
  }
});

test('the plate is one addressable element per row, and the gesture is taught once', () => {
  // matter.js raises this element and points the name's aria-controls at it.
  for (let i = 0; i < 5; i++) assert.match(b.html, new RegExp(`<div class="plate" id="plate-${i}">`));
  assert.match(b.html, /id="plate-hint" class="copy matter-only phint"/);
  assert.match(b.html, /click a name to raise its plate/);
  // Esc stays unadvertised: a labelled way out reads as application chrome. Only
  // rendered text counts -- the source comment explaining the choice does not.
  const visible = b.html.replace(/<!--[\s\S]*?-->/g, '');
  assert.ok(!/\bEsc\b/i.test(visible), 'no Esc affordance is advertised');
});

// The Plate makes the index five names, so on the matter reading a "Projects"
// Headline would be a second Headline-sized mark competing with the one a visitor
// came to read -- and ~800 grains saying what the nav and the HUD already say.
test('the Projects heading is calm-reading furniture, and the outbound link is not', () => {
  assert.match(b.html, /<h2 class="calm-only">Projects<\/h2>/);
  assert.ok(!/<h2 class="mt">Projects/.test(b.html), 'no matter-built page heading');
  assert.match(b.html, /class="copy" href="https:\/\/github\.com\/Jakhmola" data-scramble>all repos on github/);
});

// The class contract at the top of src/render.js: on the matter reading the
// outgoing page stays visible for the whole transition and only `.copy` is
// hidden, so an unmarked element burns through the incoming page. Plate contents
// are exempt because the stylesheet keeps them `visibility: hidden` until raised
// and matter.js lowers any raised plate before starting a transition.
test('everything outside a plate carries a class from the contract', () => {
  const proj = b.html.slice(b.html.indexOf('id="pg-proj"'), b.html.indexOf('id="pg-contact"'));
  const index = proj.replace(/<div class="plate"[\s\S]*?\n            <\/div>/g, '');
  for (const tag of index.match(/<(?:h2|h3|p|span|a)\s[^>]*>/g) || []) {
    assert.match(tag, /class="[^"]*\b(?:mt|copy|calm-only)\b/, `unmarked in the index: ${tag}`);
  }
});
