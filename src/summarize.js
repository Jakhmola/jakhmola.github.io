// Summaries for Featured Projects via the free GitHub Models endpoint.
// Cached by README content hash; per ADR 0001 the LLM is never load-bearing:
// any failure degrades to the cached Summary, then the raw GitHub description.

import { createHash } from 'node:crypto';

const ENDPOINT = 'https://models.github.ai/inference/chat/completions';
const MODEL = 'openai/gpt-4o-mini';

const PROMPT =
  'You write portfolio copy for a software engineer. Given a GitHub repository README, ' +
  'write exactly two plain-English sentences for a recruiter: what the project does and ' +
  'what is technically notable about it. No markdown, no hype, no first person. ' +
  'Then on a final line by itself write "FORM: x", where x is whichever single word from ' +
  'lattice, helix, shell, bloom, ring, drift best suits the project\'s character. ' +
  'The form line is optional decoration for the site; never let it change the two sentences.';

/** Visual seed vocabulary shared with render.js — anything else is ignored. */
const FORMS = new Set(['lattice', 'helix', 'shell', 'bloom', 'ring', 'drift']);

/** Split the model's reply into prose and an optional form word. */
export function parseReply(raw) {
  const text = String(raw || '').trim();
  const m = text.match(/^\s*FORM:\s*([a-z]+)\s*$/im);
  const form = m && FORMS.has(m[1].toLowerCase()) ? m[1].toLowerCase() : undefined;
  const summary = text.replace(/^\s*FORM:.*$/im, '').trim();
  return { summary, form };
}

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
  const { summary, form } = parseReply(data.choices?.[0]?.message?.content);
  if (!summary) throw new Error('GitHub Models returned no content');
  return { summary, form };
}

/** Cached visual seeds, by repo full_name. Absent entries fall back to repo identity. */
export function formsFor(featured, cache) {
  const forms = {};
  for (const repo of featured) {
    const form = cache[repo.full_name]?.form;
    if (form) forms[repo.full_name] = form;
  }
  return forms;
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
      const { summary, form } = await callModel(repo, { fetchImpl, token });
      cache[repo.full_name] = form ? { hash, summary, form } : { hash, summary };
      summaries[repo.full_name] = summary;
    } catch (err) {
      log(`summarize: falling back for ${repo.full_name}: ${err.message}`);
      summaries[repo.full_name] = cached?.summary || fallback;
    }
  }
  return summaries;
}
