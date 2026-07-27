// Build entry point: fetch repos -> filter/rank -> summarize Featured -> render dist/.
// Usage:
//   node src/build.js                      live build (GITHUB_TOKEN optional locally)
//   node src/build.js --fixtures <dir>     offline build from fixture JSON (no network)

import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { fetchRepos, fetchReadme } from './github.js';
import { FEATURE_TOPIC, rankRepos } from './rank.js';
import { summarizeFeatured } from './summarize.js';
import { renderPage } from './render.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    // A fallback marks the file as expendable (e.g. the Summary cache): missing OR
    // corrupted, the build degrades instead of failing. No fallback = fail loudly.
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

/** A fetch stub that serves fixture files instead of the network (and fails LLM calls). */
export async function fixtureFetch(dir, url) {
  const respond = (status, body) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(body),
    text: async () => body,
  });
  const u = String(url);
  let m;
  if (/\/users\/[^/]+\/repos/.test(u)) {
    const page = Number(new URL(u).searchParams.get('page') || 1);
    return respond(200, page === 1 ? await readFile(path.join(dir, 'repos.json'), 'utf8') : '[]');
  }
  if ((m = u.match(/\/repos\/[^/]+\/([^/]+)\/readme/))) {
    try {
      return respond(200, await readFile(path.join(dir, 'readmes', `${m[1]}.md`), 'utf8'));
    } catch {
      return respond(404, '');
    }
  }
  return respond(503, '{"error":"no network in fixture mode"}'); // GitHub Models etc.
}

export async function build({
  outDir = path.join(ROOT, 'dist'),
  configPath = path.join(ROOT, 'site.config.json'),
  cachePath = path.join(ROOT, '.cache', 'summaries.json'),
  staticDir = path.join(ROOT, 'static'),
  fetchImpl = fetch,
  token = process.env.GITHUB_TOKEN,
  now = Date.now(),
  log = console.error,
} = {}) {
  const config = await readJson(configPath);

  const repos = await fetchRepos(config.githubUser, { fetchImpl, token });
  // Skip README fetches for forks — unless `portfolio-feature` rescues one (PRD amendment).
  const candidates = repos.filter((r) => !r.fork || (r.topics || []).includes(FEATURE_TOPIC));
  for (const repo of candidates) {
    repo.readme = await fetchReadme(repo.full_name, { fetchImpl, token });
  }
  const { featured, rest } = rankRepos(candidates, {
    profileRepo: config.githubUser,
    featuredCount: config.featuredCount,
    now,
  });

  const cache = await readJson(cachePath, {});
  const summaries = await summarizeFeatured(featured, cache, { fetchImpl, token, log });
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify(cache, null, 2));

  await mkdir(outDir, { recursive: true });
  await cp(staticDir, outDir, { recursive: true });
  await writeFile(
    path.join(outDir, 'index.html'),
    // `rest` is still ranked but no longer rendered: the four-page design has no
    // room for it, and the Projects page links out to the full GitHub account.
    renderPage({ config, featured, summaries, builtAt: new Date(now) }),
  );

  log(`build: ${featured.length} featured, ${rest.length} ranked out -> ${outDir}`);
  return { featured, rest, summaries };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fixtureFlag = process.argv.indexOf('--fixtures');
  const opts = {};
  if (fixtureFlag !== -1) {
    const dir = path.resolve(process.argv[fixtureFlag + 1] || path.join(ROOT, 'test', 'fixtures'));
    opts.fetchImpl = (url) => fixtureFetch(dir, url);
    opts.cachePath = path.join(ROOT, '.cache', 'summaries-fixture.json');
  }
  build(opts).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
