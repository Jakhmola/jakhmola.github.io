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

let b; // one shared fixture-mode build for most assertions
before(async () => {
  b = await runBuild();
});
after(() => Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true }))));

test('renders hero, about, skills strip, contact links, and resume link from Seed Content', () => {
  assert.match(b.html, /\$ whoami/);
  assert.match(b.html, /<h1>Shubham Jakhmola<\/h1>/);
  assert.match(b.html, /AI Engineer/);
  assert.match(b.html, /I build AI systems that do real work/);
  assert.match(b.html, /cat about\.txt/);
  assert.match(b.html, /ls skills\//);
  assert.match(b.html, /<li>PyTorch<\/li>/);
  assert.match(b.html, /href="resume\.pdf"/);
  assert.match(b.html, /mailto:j4khmola@gmail\.com/);
  assert.match(b.html, /https:\/\/github\.com\/Jakhmola/);
  assert.match(b.html, /https:\/\/www\.linkedin\.com\/in\/jakhmola/);
});

test('renders Featured Project Cards in rank order with repo links', () => {
  const expected = [
    'career-ops',
    'coding_agent',
    'rag-search-engine',
    'Brain-Tumor-Segmentation',
    'automated-ticketing-system',
    'interview-coach',
  ];
  const positions = expected.map((n) => b.html.indexOf(`<h3><a href="https://github.com/Jakhmola/${n}">`));
  for (const [i, pos] of positions.entries()) {
    assert.ok(pos !== -1, `${expected[i]} has a Project Card`);
    if (i > 0) assert.ok(pos > positions[i - 1], `${expected[i]} renders after ${expected[i - 1]}`);
  }
});

test('skills strip includes languages/topics derived from Featured Projects', () => {
  assert.match(b.html, /<li>medical imaging<\/li>/, 'featured topic surfaces, dashes humanized');
  assert.match(b.html, /<li>Jupyter Notebook<\/li>/, 'featured language surfaces');
});

test('non-featured originals appear only in the compact rest-list; excluded repos nowhere', () => {
  assert.match(b.html, /ls projects\/ --all/);
  assert.match(b.html, /<li><a href="https:\/\/github\.com\/Jakhmola\/Super-Mario-AI">Super-Mario-AI<\/a>/);
  assert.match(b.html, /behavioral-biometric-identification/);
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
  assert.match(built.html, /<h3><a href="https:\/\/github\.com\/Jakhmola\/rescued-fork">/);
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
