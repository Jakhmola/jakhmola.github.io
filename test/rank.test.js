// Seam 2 — ranking: pure-function tests on the fixture repo list.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { rankRepos } from '../src/rank.js';

const NOW = Date.parse('2026-06-10T00:00:00Z');
const fixtures = JSON.parse(await readFile(new URL('./fixtures/repos.json', import.meta.url), 'utf8'));

// Attach READMEs the way the build does (long readme = full depth score).
async function loadRepos() {
  const repos = structuredClone(fixtures);
  for (const repo of repos) {
    repo.readme = await readFile(new URL(`./fixtures/readmes/${repo.name}.md`, import.meta.url), 'utf8').catch(() => '');
  }
  return repos;
}

const opts = { profileRepo: 'Jakhmola', featuredCount: 6, now: NOW };
const names = (list) => list.map((r) => r.name);

test('forks, the profile repo, and portfolio-hide repos never appear', async () => {
  const { featured, rest } = rankRepos(await loadRepos(), opts);
  const all = [...names(featured), ...names(rest)];
  assert.ok(!all.includes('freeCodeCamp-boilerplate'), 'fork excluded');
  assert.ok(!all.includes('Jakhmola'), 'profile repo excluded');
  assert.ok(!all.includes('scratch-experiments'), 'portfolio-hide excluded');
  // career-ops is fork-flagged on the live API (parent deleted) and carries no
  // portfolio-feature topic, so the amended fork rule excludes it -- which is
  // exactly how it left the Featured set, with no code change.
  assert.ok(!all.includes('career-ops'), 'untagged fork excluded');
  assert.equal(all.length, 7);
});

test('portfolio-feature pins a low-scoring repo into Featured', async () => {
  const { featured } = rankRepos(await loadRepos(), opts);
  assert.ok(names(featured).includes('interview-coach'));
});

test('featured are score-ordered: recent, starred, documented work first', async () => {
  const { featured } = rankRepos(await loadRepos(), opts);
  assert.deepEqual(names(featured), [
    'rag-search-engine',
    'coding_agent',
    'Brain-Tumor-Segmentation',
    'automated-ticketing-system',
    'interview-coach',
    'behavioral-biometric-identification',
  ]);
});

test('featured/rest split respects featuredCount; rest holds the remainder', async () => {
  const { featured, rest } = rankRepos(await loadRepos(), opts);
  assert.equal(featured.length, 6);
  assert.deepEqual(names(rest), ['Super-Mario-AI']);
});

test('pinned repos can exceed featuredCount', async () => {
  const repos = (await loadRepos()).map((r) => ({ ...r, topics: [...(r.topics || []), 'portfolio-feature'] }));
  const { featured, rest } = rankRepos(repos, { ...opts, featuredCount: 2 });
  // 7 originals + the two now-pinned forks (amended rule); profile repo and
  // portfolio-hide still out.
  assert.equal(featured.length, 9, 'every pinned repo is featured even above the cap');
  assert.equal(rest.length, 0);
});

// PRD amendment: forks are excluded unless they carry `portfolio-feature`;
// `portfolio-hide` still beats everything (e.g. career-ops is fork-flagged).
const fork = (over = {}) => ({
  name: 'fork-repo',
  full_name: 'Jakhmola/fork-repo',
  html_url: 'https://github.com/Jakhmola/fork-repo',
  description: 'An active project GitHub flags as a fork',
  fork: true,
  topics: [],
  language: 'Python',
  stargazers_count: 0,
  pushed_at: '2026-06-01T10:00:00Z',
  readme: '',
  ...over,
});

test('portfolio-feature rescues a fork into Featured; untagged forks stay excluded', async () => {
  const repos = [...(await loadRepos()), fork({ topics: ['portfolio-feature'] })];
  const { featured, rest } = rankRepos(repos, opts);
  assert.ok(names(featured).includes('fork-repo'), 'fork + portfolio-feature is Featured');
  assert.ok(!names(rest).includes('fork-repo'));
  assert.ok(
    ![...names(featured), ...names(rest)].includes('freeCodeCamp-boilerplate'),
    'fork without the topic remains excluded',
  );
});

test('portfolio-hide beats portfolio-feature, even on a fork', async () => {
  const repos = [...(await loadRepos()), fork({ topics: ['portfolio-feature', 'portfolio-hide'] })];
  const { featured, rest } = rankRepos(repos, opts);
  assert.ok(![...names(featured), ...names(rest)].includes('fork-repo'));
});

test('a repo missing pushed_at ranks with zero recency instead of a NaN score', async () => {
  const repos = (await loadRepos()).map((r) =>
    r.name === 'rag-search-engine' ? { ...r, pushed_at: undefined } : r,
  );
  const { featured, rest } = rankRepos(repos, opts);
  for (const r of [...featured, ...rest]) assert.ok(Number.isFinite(r.score), `${r.name} score is finite`);
  assert.equal([...featured, ...rest].length, 7, 'the repo still appears');
});

test('rankRepos does not mutate its input', async () => {
  const repos = await loadRepos();
  const before = JSON.stringify(repos);
  rankRepos(repos, opts);
  assert.equal(JSON.stringify(repos), before);
});
