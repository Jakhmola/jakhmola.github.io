// Seam 1 — build CLI (top seam): full build against fixture GitHub-API JSON,
// network stubbed; assert on the generated dist/ output.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { build, fixtureFetch } from '../src/build.js';
import { FORMS } from '../src/render.js';

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

let b; // one shared fixture-mode build for most assertions
before(async () => {
  b = await runBuild();
});
after(() => Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true }))));

test('renders hero, about, skills strip, contact links, and resume link from Seed Content', () => {
  assert.match(b.html, /<h1>Shubham Jakhmola<\/h1>/);
  assert.match(b.html, /AI Engineer/);
  assert.match(b.html, /I build AI systems that do real work/);
  assert.match(b.html, /id="about-h">About<\/h2>/);
  assert.match(b.html, /class="tags skills"/, 'the skills strip lives inside About');
  assert.match(b.html, /<li>PyTorch<\/li>/);
  assert.match(b.html, /href="resume\.pdf"/);
  assert.match(b.html, /mailto:j4khmola@gmail\.com/);
  assert.match(b.html, /https:\/\/github\.com\/Jakhmola/);
  assert.match(b.html, /https:\/\/www\.linkedin\.com\/in\/jakhmola/);
});

test('every visitor gets the content without JS: markup carries copy, not just a canvas', () => {
  // ADR 0001 in the front end — a blocked bundle or a dead GL context may not
  // cost the visitor the page. Content lives in HTML; app.js only adds motion.
  assert.match(b.html, /<canvas id="field"/);
  assert.match(b.html, /Retrieval-augmented search engine over document corpora/);
  assert.match(b.html, /<div id="boot" hidden>/, 'the loader is inert until JS unhides it');
});

/** The one blob of state the front end reads: formations, names, crystal seeds. */
function fieldData(html) {
  return JSON.parse(html.match(/id="field-data">(.*?)<\/script>/s)[1]);
}

test('each Featured Project carries a deterministic visual seed for the field', () => {
  const { seeds } = fieldData(b.html);
  assert.equal(seeds.length, 6, 'one seed per Featured Project');
  for (const s of seeds) {
    assert.ok(FORMS.includes(s.form), `${s.form} is a known form`);
    assert.ok(s.energy > 0 && s.energy <= 1, 'energy is normalised');
  }
});

test('renders Featured Projects in the Gallery in rank order with repo links', () => {
  const expected = [
    'career-ops',
    'coding_agent',
    'rag-search-engine',
    'Brain-Tumor-Segmentation',
    'automated-ticketing-system',
    'interview-coach',
  ];
  const positions = expected.map((n) =>
    b.html.indexOf(`<a class="orb-a" href="https://github.com/Jakhmola/${n}">`),
  );
  for (const [i, pos] of positions.entries()) {
    assert.ok(pos !== -1, `${expected[i]} has a Gallery entry`);
    assert.match(b.html, new RegExp(`<span class="orb-name">${expected[i]}</span>`));
    if (i > 0) assert.ok(pos > positions[i - 1], `${expected[i]} renders after ${expected[i - 1]}`);
  }
});

test('skills strip includes languages/topics derived from Featured Projects', () => {
  assert.match(b.html, /<li>medical imaging<\/li>/, 'featured topic surfaces, dashes humanized');
  assert.match(b.html, /<li>Jupyter Notebook<\/li>/, 'featured language surfaces');
});

test('Trajectory stations render from Seed Content, in order, with employer and years', () => {
  const order = ['t-moving', 't-bridge', 't-acting'];
  const at = order.map((id) => b.html.indexOf(`id="${id}"`));
  for (const [i, pos] of at.entries()) {
    assert.ok(pos !== -1, `${order[i]} station renders`);
    if (i > 0) assert.ok(pos > at[i - 1], `${order[i]} follows ${order[i - 1]}`);
  }
  // The Trajectory is hand-authored and settled — it must precede the Gallery,
  // which is fetched and re-ranked nightly. The contrast is the structure.
  assert.ok(at[2] < b.html.indexOf('id="gallery"'), 'Trajectory precedes the Gallery');
  assert.match(b.html, /<span class="org-n">Golden Pegasus IT<\/span>/);
  assert.match(b.html, /<span class="org-y">2024–2025<\/span>/);
  assert.match(b.html, /Six hours became forty-five minutes\./);

  // Redaction policy: outcome numbers a non-specialist can read stay, model
  // metrics do not. A regression here means the copy drifted back to a resume.
  for (const jargon of ['macro-F1', 'WMAPE', 'MAPE', 'percentage points', 'F1 ']) {
    assert.ok(!b.html.includes(jargon), `${jargon} stays off the page`);
  }
});

test('the Gallery holds only Featured Projects; the rest are a count and a portal', () => {
  // Non-featured originals are no longer listed on the page: the portal to the
  // account plus the honest count of everything the rebuild read replaces the
  // old also-rans beat. They still steer the field and the overture.
  const { names } = fieldData(b.html);
  assert.ok(names.includes('Super-Mario-AI'), 'ranked-but-unfeatured repos still drive the field');
  assert.match(b.html, /class="link-out" href="https:\/\/github\.com\/Jakhmola"/, 'portal to the account');
  assert.match(b.html, /<span class="stat-n">8<\/span> repositories read/, 'the count stays honest');
  assert.ok(!b.html.includes('freeCodeCamp-boilerplate'), 'fork never rendered');
  assert.ok(!b.html.includes('scratch-experiments'), 'portfolio-hide never rendered');
  assert.ok(!b.html.includes('Jakhmola/Jakhmola"'), 'profile repo never rendered');
});

test('LLM unavailable (fixture mode): cards fall back to raw descriptions, build still succeeds', () => {
  assert.match(b.html, /Claude-Code-based job search operations system/);
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
  assert.match(built.html, /Two-sentence summary of career-ops\./);
  const cache = JSON.parse(await readFile(built.cachePath, 'utf8'));
  assert.equal(cache['Jakhmola/career-ops'].summary, 'Two-sentence summary of career-ops.');
});

test('a portfolio-feature fork gets a Featured section end to end (amended fork rule)', async () => {
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
  assert.match(built.html, /<a class="orb-a" href="https:\/\/github\.com\/Jakhmola\/rescued-fork">/);
  assert.match(built.html, /<span class="orb-name">rescued-fork<\/span>/);
  assert.ok(!built.html.includes('freeCodeCamp-boilerplate'), 'untagged fork still excluded');
});

test('a corrupted Summary cache degrades to a cold cache instead of failing the build', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'portfolio-build-'));
  tmpDirs.push(dir);
  const cachePath = path.join(dir, 'summaries.json');
  await writeFile(cachePath, '{"Jakhmola/career-ops": {"hash": "truncated by actions/ca');
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
  assert.match(html, /Claude-Code-based job search operations system/, 'falls back to descriptions');
  assert.deepEqual(Object.keys(JSON.parse(await readFile(cachePath, 'utf8'))), [], 'cache rewritten valid');
});

test('dist/ ships style.css and resume.pdf alongside index.html', async () => {
  assert.ok((await stat(path.join(b.outDir, 'style.css'))).isFile());
  assert.ok((await stat(path.join(b.outDir, 'resume.pdf'))).size > 0);
});

test('page carries title, description, and Open Graph meta tags', () => {
  assert.match(b.html, /<title>Shubham Jakhmola &mdash; AI Engineer<\/title>/);
  assert.match(b.html, /<meta name="description" content="I build AI systems/);
  assert.match(b.html, /<meta property="og:title"/);
  assert.match(b.html, /<meta property="og:url" content="https:\/\/jakhmola\.github\.io"/);
  assert.match(b.html, /<link rel="icon" href="data:image\/svg\+xml,/);
});
