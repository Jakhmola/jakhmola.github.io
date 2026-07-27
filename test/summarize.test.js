// Seam 3 — summarizer: LLM stubbed; cache behavior and fallbacks. Never throws.
import test from 'node:test';
import assert from 'node:assert/strict';

import { summarizeFeatured, readmeHash, parseReply, formsFor } from '../src/summarize.js';

const repo = (over = {}) => ({
  name: 'career-ops',
  full_name: 'Jakhmola/career-ops',
  description: 'Raw GitHub description',
  readme: '# career-ops\n\nLots of detail.',
  ...over,
});

function llmStub(reply = 'LLM summary.') {
  const stub = async () => {
    stub.calls++;
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: reply } }] }) };
  };
  stub.calls = 0;
  return stub;
}

const failingStub = () => {
  const stub = async () => {
    stub.calls++;
    return { ok: false, status: 503, json: async () => ({}), text: async () => 'down' };
  };
  stub.calls = 0;
  return stub;
};

const quiet = { log: () => {}, token: 't' };

test('fresh README calls the LLM and stores the result in the cache', async () => {
  const cache = {};
  const fetchImpl = llmStub();
  const summaries = await summarizeFeatured([repo()], cache, { ...quiet, fetchImpl });
  assert.equal(summaries['Jakhmola/career-ops'], 'LLM summary.');
  assert.equal(fetchImpl.calls, 1);
  assert.deepEqual(cache['Jakhmola/career-ops'], { hash: readmeHash(repo().readme), summary: 'LLM summary.' });
});

test('cache hit (same README hash) skips the LLM call', async () => {
  const cache = { 'Jakhmola/career-ops': { hash: readmeHash(repo().readme), summary: 'Cached summary.' } };
  const fetchImpl = llmStub();
  const summaries = await summarizeFeatured([repo()], cache, { ...quiet, fetchImpl });
  assert.equal(fetchImpl.calls, 0);
  assert.equal(summaries['Jakhmola/career-ops'], 'Cached summary.');
});

test('a changed README invalidates the cache and regenerates', async () => {
  const cache = { 'Jakhmola/career-ops': { hash: readmeHash('old readme'), summary: 'Stale summary.' } };
  const fetchImpl = llmStub('Fresh summary.');
  const summaries = await summarizeFeatured([repo()], cache, { ...quiet, fetchImpl });
  assert.equal(fetchImpl.calls, 1);
  assert.equal(summaries['Jakhmola/career-ops'], 'Fresh summary.');
  assert.equal(cache['Jakhmola/career-ops'].summary, 'Fresh summary.');
});

test('LLM failure falls back to the cached Summary even when stale', async () => {
  const cache = { 'Jakhmola/career-ops': { hash: readmeHash('old readme'), summary: 'Stale summary.' } };
  const summaries = await summarizeFeatured([repo()], cache, { ...quiet, fetchImpl: failingStub() });
  assert.equal(summaries['Jakhmola/career-ops'], 'Stale summary.');
});

test('LLM failure with no cache falls back to the raw description', async () => {
  const summaries = await summarizeFeatured([repo()], {}, { ...quiet, fetchImpl: failingStub() });
  assert.equal(summaries['Jakhmola/career-ops'], 'Raw GitHub description');
});

test('never throws, even when fetch itself rejects', async () => {
  const fetchImpl = async () => {
    throw new Error('network exploded');
  };
  const summaries = await summarizeFeatured([repo({ description: null })], {}, { ...quiet, fetchImpl });
  assert.equal(summaries['Jakhmola/career-ops'], '');
});

test('the optional FORM line is stripped from prose and kept as a visual seed', () => {
  assert.deepEqual(parseReply('One. Two.\nFORM: helix'), { summary: 'One. Two.', form: 'helix' });
  assert.deepEqual(parseReply('One. Two.'), { summary: 'One. Two.', form: undefined });
  // An invented form is discarded, never rendered, and never leaks into the copy.
  assert.deepEqual(parseReply('One. Two.\nFORM: pyramid'), { summary: 'One. Two.', form: undefined });
  assert.equal(parseReply('').summary, '');
});

test('a FORM line survives into the cache and out through formsFor', async () => {
  const cache = {};
  await summarizeFeatured([repo()], cache, { ...quiet, fetchImpl: llmStub('Prose here.\nFORM: ring') });
  assert.equal(cache['Jakhmola/career-ops'].summary, 'Prose here.');
  assert.deepEqual(formsFor([repo()], cache), { 'Jakhmola/career-ops': 'ring' });
  assert.deepEqual(formsFor([repo()], {}), {}, 'no cached form is not an error');
});

test('a repo with no README gets the raw description without an LLM call', async () => {
  const fetchImpl = llmStub();
  const summaries = await summarizeFeatured([repo({ readme: '' })], {}, { ...quiet, fetchImpl });
  assert.equal(fetchImpl.calls, 0);
  assert.equal(summaries['Jakhmola/career-ops'], 'Raw GitHub description');
});
