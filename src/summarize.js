// Summaries for Featured Projects via the free GitHub Models endpoint.
// Cached by README content hash; per ADR 0001 the LLM is never load-bearing:
// any failure degrades to the cached Summary, then the raw GitHub description.

import { createHash } from 'node:crypto';

const ENDPOINT = 'https://models.github.ai/inference/chat/completions';
const MODEL = 'openai/gpt-4o-mini';

const PROMPT =
  'You write portfolio copy for a software engineer. Given a GitHub repository README, ' +
  'write exactly two plain-English sentences for a recruiter: what the project does and ' +
  'what is technically notable about it. No markdown, no hype, no first person.';

export const readmeHash = (readme) => createHash('sha256').update(readme).digest('hex');

async function callModel(repo, { fetchImpl, token }) {
  const res = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'jakhmola.github.io-build',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: `Repository: ${repo.name}\n\nREADME:\n${repo.readme.slice(0, 12_000)}` },
      ],
      max_tokens: 160,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`GitHub Models ${res.status}`);
  const data = await res.json();
  const summary = data.choices?.[0]?.message?.content?.trim();
  if (!summary) throw new Error('GitHub Models returned no content');
  return summary;
}

/**
 * Produce a Summary for each Featured Project. Mutates `cache` (an object keyed
 * by repo full_name → { hash, summary }) so the caller can persist it. NEVER throws.
 */
export async function summarizeFeatured(featured, cache, { fetchImpl = fetch, token, log = console.error } = {}) {
  const summaries = {};
  for (const repo of featured) {
    const fallback = repo.description || '';
    if (!repo.readme) {
      summaries[repo.full_name] = fallback;
      continue;
    }
    const hash = readmeHash(repo.readme);
    const cached = cache[repo.full_name];
    if (cached && cached.hash === hash && cached.summary) {
      summaries[repo.full_name] = cached.summary;
      continue;
    }
    try {
      const summary = await callModel(repo, { fetchImpl, token });
      cache[repo.full_name] = { hash, summary };
      summaries[repo.full_name] = summary;
    } catch (err) {
      log(`summarize: falling back for ${repo.full_name}: ${err.message}`);
      summaries[repo.full_name] = cached?.summary || fallback;
    }
  }
  return summaries;
}
