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

test('renders the four pages, name, epochs, and contact links from Seed Content', () => {
  for (const id of ['pg-home', 'pg-exp', 'pg-proj', 'pg-contact']) {
    assert.match(b.html, new RegExp(`id="${id}"`), `${id} section exists`);
  }
  assert.match(b.html, /<h1 class="name"><span class="mt">SHUBHAM<\/span><span class="mt">JAKHMOLA<\/span><\/h1>/);
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
    'career-ops',
    'coding_agent',
    'rag-search-engine',
    'Brain-Tumor-Segmentation',
    'interview-coach',
  ];
  const positions = expected.map((n) => b.html.indexOf(`<h3 class="mt pname">${n}</h3>`));
  for (const [i, pos] of positions.entries()) {
    assert.ok(pos !== -1, `${expected[i]} has a project row`);
    assert.match(b.html, new RegExp(`href="https://github\\.com/Jakhmola/${expected[i]}"`));
    if (i > 0) assert.ok(pos > positions[i - 1], `${expected[i]} renders after ${expected[i - 1]}`);
  }
});

test('only Featured Projects reach the page; everything else is left to GitHub', () => {
  assert.match(b.html, /all repos on github/, 'the outbound link stands in for the rest-list');
  assert.ok(!b.html.includes('Super-Mario-AI'), 'ranked-out original not rendered');
  assert.ok(!b.html.includes('automated-ticketing-system'), 'ranked-out original not rendered');
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
  assert.match(built.html, /<h3 class="mt pname">rescued-fork<\/h3>/);
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

test('dist/ ships style.css, matter.js and resume.pdf alongside index.html', async () => {
  assert.ok((await stat(path.join(b.outDir, 'style.css'))).isFile());
  assert.ok((await stat(path.join(b.outDir, 'matter.js'))).isFile());
  assert.ok((await stat(path.join(b.outDir, 'resume.pdf'))).size > 0);
});

test('page carries title, description, and Open Graph meta tags', () => {
  assert.match(b.html, /<title>Shubham Jakhmola &mdash; AI Engineer<\/title>/);
  assert.match(b.html, /<meta name="description" content="I build LLM systems/);
  assert.match(b.html, /<meta property="og:title"/);
  assert.match(b.html, /<meta property="og:url" content="https:\/\/jakhmola\.github\.io"/);
  assert.match(b.html, /<link rel="icon" href="data:image\/svg\+xml,/);
});
