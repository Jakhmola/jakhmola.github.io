// GitHub REST API access for the Scheduled Rebuild. Zero dependencies: native fetch.

const API = 'https://api.github.com';

function headers(accept, token) {
  const h = { accept, 'user-agent': 'jakhmola.github.io-build' };
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

/** Fetch all public repos for a user (paginated). Throws on API errors — a
 *  broken GitHub API must fail the rebuild loudly (the last good deploy stays live). */
export async function fetchRepos(user, { fetchImpl = fetch, token } = {}) {
  const repos = [];
  for (let page = 1; ; page++) {
    const url = `${API}/users/${user}/repos?per_page=100&page=${page}`;
    const res = await fetchImpl(url, { headers: headers('application/vnd.github+json', token) });
    if (!res.ok) throw new Error(`GitHub API ${res.status} fetching ${url}`);
    const batch = await res.json();
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

/** Fetch a repo's README as raw markdown. Returns '' when the repo has none. */
export async function fetchReadme(fullName, { fetchImpl = fetch, token } = {}) {
  const url = `${API}/repos/${fullName}/readme`;
  const res = await fetchImpl(url, { headers: headers('application/vnd.github.raw+json', token) });
  if (res.status === 404) return '';
  if (!res.ok) throw new Error(`GitHub API ${res.status} fetching ${url}`);
  return res.text();
}
