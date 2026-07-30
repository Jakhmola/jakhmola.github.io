// Seam 3 — derivation: the blocks a Project Row carries, read off frozen real
// READMEs rather than off strings written to please the parser.
//
// That distinction is the whole point of this file. The first cut of the
// extractor passed every hand-written fixture and returned nothing at all from
// the live account, because GitHub serves some of these READMEs with CRLF and JS
// will not let `.` cross a `\r`. A test suite made of tidy literals would have
// shipped it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { schematic, layout, decisions, figures, stack, derive } from '../src/derive.js';

const md = (name) => readFile(new URL(`./fixtures/readmes/${name}.md`, import.meta.url), 'utf8');

test('a Mermaid flowchart becomes a graph, and the hub keeps every edge', async () => {
  const g = schematic(await md('interview-coach'));
  assert.equal(g.origin, 'mermaid flowchart');
  // Two flowcharts in this README: a visitor journey first, the system second.
  // The Schematic is the system.
  assert.equal(g.heading, 'Architecture');
  assert.equal(g.nodes.length, 7);
  assert.equal(g.edges.length, 6);
  assert.ok(g.nodes.includes('React + TS UI (Vite)'), '<br/> is a space, not a tag');
  // The edge from the front end to the API is written `UI["..."] -->|JWT| API`,
  // so the id and the arrow are not adjacent. Reading edges off the raw body
  // dropped exactly this one, leaving the UI node connected to nothing.
  const first = g.edges.find((e) => e.from === 0);
  assert.equal(first.to, 1);
  assert.equal(first.label, 'JWT · SSE');
});

test('an ASCII arrow chain becomes a pipeline, and box art is refused', async () => {
  const g = schematic(await md('rag-search-engine'));
  assert.equal(g.origin, 'ascii pipeline');
  // This README ships hand-aligned box art under `## Architecture` *and* a clean
  // chain under `### Search Pipeline`. The chain is the one that parses; the box
  // art must not be half-read into nonsense.
  assert.equal(g.heading, 'Search Pipeline');
  assert.equal(g.nodes[0], 'Query');
  assert.equal(g.nodes.at(-1), 'Response');
  // The chain runs over two source lines and is one chain.
  assert.equal(g.nodes.length, 7);
  assert.ok(!g.nodes.some((n) => /[┌└│┐]/.test(n)), 'no box-drawing survives into a label');
});

test('a vertical pipeline keeps its edge labels', async () => {
  const g = schematic(await md('behavioral-biometric-identification'));
  assert.equal(g.heading, 'Pipeline');
  assert.equal(g.nodes.length, 4);
  assert.deepEqual(
    g.edges.map((e) => e.label),
    [
      'PySpark ingestion + deduplication',
      'StandardScaler + Mutual Information (top 200)',
      'GridSearchCV hyperparameter tuning',
    ],
  );
});

test('a README with no diagram yields no Schematic, and nothing stands in for one', async () => {
  for (const name of ['Brain-Tumor-Segmentation', 'coding_agent', 'automated-ticketing-system']) {
    assert.equal(schematic(await md(name)), null, `${name} has no diagram to lift`);
    assert.equal(derive({ name, readme: await md(name) }).plan, null);
  }
});

test('a chain is laid out down the page and a hub across it', async () => {
  const chain = layout(schematic(await md('rag-search-engine')));
  const hub = layout(schematic(await md('interview-coach')));
  assert.equal(chain.axis, 'down');
  assert.equal(hub.axis, 'across');
  // Laid out across, the seven-node chain came to 864px, and scaled into a
  // ~700px card that puts a 10px mono label at 8px -- under the ramp's smallest
  // step. Down the page it fits any card at its authored size.
  assert.ok(chain.width < 260, `chain is narrow, got ${chain.width}`);
  assert.ok(hub.width > chain.width, 'a hub is wider than it is tall');
  for (const plan of [chain, hub]) {
    for (const n of plan.nodes) {
      assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y), 'every node is placed');
      assert.ok(n.lines.length >= 1 && n.lines.length <= 3, 'labels wrap, capped at three lines');
    }
  }
});

test('a cyclic diagram terminates instead of hanging the nightly build', () => {
  const cycle = { nodes: ['a', 'b', 'c'], edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 0 }] };
  const plan = layout(cycle);
  assert.equal(plan.nodes.length, 3);
});

test('decisions are the README’s own lead-ins, from bullets and never from tables', async () => {
  const t = decisions(await md('automated-ticketing-system'));
  assert.equal(t.length, 3, 'capped at three');
  assert.equal(t[0].term, 'LLM-Powered Slot Extraction');
  assert.match(t[1].gloss, /≥85% aggregate confidence are auto-closed/);

  // A backticked lead-in counts as much as a bolded one.
  const c = decisions(await md('coding_agent'));
  assert.equal(c[0].term, 'llama.cpp');
  assert.match(c[0].gloss, /^serves the local GGUF model/);

  // behavioral-biometric-identification's `### Feature Engineering` is a
  // three-column table of counts. Read as decisions it produced "Statistical →
  // 198 | Mean, std, ..." -- a column boundary rendered as a sentence, and a
  // duplicate of the stack block besides.
  const bio = decisions(await md('behavioral-biometric-identification'));
  assert.ok(!bio.some((d) => /^\d+ \|/.test(d.gloss)), 'no table row read as a pair');
});

test('figures are only what a README states, and a name is not a number', async () => {
  const f = figures(await md('behavioral-biometric-identification'));
  assert.ok(f.length >= 3);
  assert.ok(
    f.some((x) => /94\.7%/.test(x.text)),
    'the headline accuracy is reported',
  );
  // `Result for proposed 3D U-Net model on testing data :` carries a digit and no
  // measurement. So does `Qwen3-8B`. Neither is a figure.
  const bt = figures(await md('Brain-Tumor-Segmentation'));
  assert.equal(bt.length, 0, 'a caption with a digit in a model name is not a figure');
});

test('stack chips take the value column of a stack table, all of it or none', async () => {
  const rag = stack({ language: 'Python', topics: [] }, await md('rag-search-engine')).map((s) => s.label);
  assert.equal(rag[0], 'Python', 'the repo language leads');
  assert.ok(rag.includes('FastAPI') && rag.includes('Uvicorn'), 'a comma-separated column is a list');
  // interview-coach writes `| FastAPI + LangGraph | Auth, sessions, and the
  // multi-agent interview loop |`. Two of those three fragments look exactly like
  // chips; taking them shipped `Auth` and `sessions` as stack entries.
  const ic = stack({ language: 'TypeScript', topics: [] }, await md('interview-coach')).map((s) => s.label);
  assert.ok(!ic.includes('Auth') && !ic.includes('sessions'), 'a sentence column is not a list');
  // A table's header row names its columns.
  assert.ok(!ic.includes('Role') && !rag.includes('Technology'), 'header rows are not chips');
  // Paths and filenames are repo layout, not components.
  assert.ok(!rag.some((c) => /[/\\]/.test(c) || /\.(json|py|txt)$/i.test(c)));
});

test('topics lead the chips when a repo carries them', async () => {
  const s = stack({ language: 'Python', topics: ['rag', 'search', 'portfolio-feature'] }, '');
  assert.deepEqual(s.map((x) => x.label), ['rag', 'search', 'Python']);
  assert.ok(!s.some((x) => /^portfolio-/.test(x.label)), 'a Topic Override is machinery, not a chip');
});

test('an empty or absent README derives nothing and throws nothing', () => {
  for (const readme of ['', undefined, null]) {
    const d = derive({ name: 'x', language: null, topics: [], readme });
    assert.deepEqual(d, { schematic: null, plan: null, stack: [], decisions: [], figures: [] });
  }
});
