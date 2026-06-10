// Ranking: a pure function from a repo list to an ordered Featured/rest split.
// Repos are expected to carry a `readme` string (raw markdown, '' when absent).

export const FEATURE_TOPIC = 'portfolio-feature'; // Topic Override: pin into Featured
export const HIDE_TOPIC = 'portfolio-hide'; // Topic Override: remove from the site

const topics = (repo) => repo.topics || [];

/** Score a repo on README depth, description presence, recency, and stars. */
export function scoreRepo(repo, now = Date.now()) {
  const readmeDepth = Math.min((repo.readme || '').length / 3000, 1) * 40;
  const description = repo.description ? 15 : 0;
  // Missing/invalid pushed_at scores zero recency rather than poisoning the sort with NaN.
  const pushedAt = new Date(repo.pushed_at || 0).getTime() || 0;
  const ageDays = (now - pushedAt) / 86_400_000;
  const recency = Math.exp(-Math.max(ageDays, 0) / 180) * 30;
  const stars = (Math.min(repo.stargazers_count || 0, 50) / 50) * 15;
  return readmeDepth + description + recency + stars;
}

/**
 * Filter and rank repos into { featured, rest }.
 * - The profile repo and `portfolio-hide` repos never appear (`portfolio-hide` beats everything).
 * - Forks never appear unless they carry `portfolio-feature` (PRD amendment: an explicit
 *   feature override beats the fork exclusion — e.g. career-ops is fork-flagged).
 * - `portfolio-feature` repos are always Featured (overrides beat score).
 * - Featured = top `featuredCount` by score (plus all pinned), score-ordered.
 */
export function rankRepos(repos, { profileRepo, featuredCount = 6, now = Date.now() } = {}) {
  const visible = repos.filter(
    (r) =>
      !topics(r).includes(HIDE_TOPIC) &&
      (!r.fork || topics(r).includes(FEATURE_TOPIC)) &&
      r.name.toLowerCase() !== (profileRepo || '').toLowerCase(),
  );

  const scored = visible
    .map((r) => ({ ...r, score: scoreRepo(r, now) }))
    .sort((a, b) => b.score - a.score);

  const featuredSet = new Set(scored.filter((r) => topics(r).includes(FEATURE_TOPIC)));
  for (const repo of scored) {
    if (featuredSet.size >= featuredCount) break;
    featuredSet.add(repo);
  }

  return {
    featured: scored.filter((r) => featuredSet.has(r)),
    rest: scored.filter((r) => !featuredSet.has(r)),
  };
}
