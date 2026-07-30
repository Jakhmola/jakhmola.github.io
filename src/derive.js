// The blocks a Project Row carries, derived from what the build already holds:
// the repo object the API returned and the README it fetched anyway. No network,
// no model, no state -- pure functions over a markdown string.
//
// Every extractor answers `null` or `[]` rather than guessing. A project with no
// diagram in its README gets no Schematic; it does not get a decorative one, and
// it is not padded with prose. Product Principle 3 -- evidence over inventory --
// applies inside a project as well as across them, and the absences a portfolio
// invents are the ones a reader checks first.
//
// Three shapes of diagram occur in this account, and all three are the author's
// own architecture in his own words:
//
//   1. a Mermaid `flowchart` with labelled edges          (interview-coach)
//   2. an arrow chain on one logical line   (rag-search-engine, jakhmola.github.io)
//   3. a vertical pipeline: node lines separated by labelled `↓` arrows
//                                        (behavioral-biometric-identification)
//
// ponytail: the LLM rung of the extraction ladder is deliberately absent. Three
// of the account's READMEs parse for free today and the rest omit the block,
// which is the honest outcome. Reading prose with a model is the upgrade path
// when omitting costs too much, and it would inherit ADR 0001 -- the LLM is
// never load-bearing, so a Schematic could never depend on it either.

/** Arrow separators seen in this account, longest alternatives first. */
const ARROW = /(?:-{1,2}>|─+>|={1,2}>|→|➜|➔)/;
const ARROW_SPLIT = new RegExp(`\\s*${ARROW.source}\\s*`);
// Box-drawing art is a diagram someone aligned by hand at a column, not a chain.
// It parses into nonsense under an arrow split, so it is rejected outright rather
// than half-read -- rag-search-engine ships one of these *and* a clean chain two
// headings later, and the clean one is the whole reason this matters.
const BOX_ART = /[┌┐└┘├┤┬┴┼│╔╗╚╝║═]/;

const clean = (s) =>
  String(s || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Strip what is markup rather than content, and normalise line endings first.
//
// The CRLF pass is load-bearing, not tidiness: GitHub serves these READMEs with
// `\r\n`, JS treats `\r` as a line terminator so `.` will not cross it, and `$`
// without `m` sits after it. Every anchored line pattern below therefore matched
// nothing at all on a real README while passing against any hand-written test
// string -- which is exactly how it went unnoticed the first time.
const strip = (md) =>
  String(md || '')
    .replace(/\r\n?/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '');

/** Fenced blocks in document order, each tagged with the nearest heading above. */
function fences(md) {
  const out = [];
  let heading = '';
  let open = null;
  for (const line of strip(md).split('\n')) {
    const fence = /^\s*```(.*)$/.exec(line);
    if (open) {
      if (fence) {
        out.push({ lang: open.lang, heading: open.heading, body: open.lines.join('\n') });
        open = null;
      } else {
        open.lines.push(line);
      }
      continue;
    }
    if (fence) {
      open = { lang: fence[1].trim().toLowerCase(), heading, lines: [] };
      continue;
    }
    const h = /^(#{1,6})\s+(.*?)\s*#*$/.exec(line);
    if (h) heading = clean(h[2]);
  }
  return out;
}

/** Every heading with the body that follows it. Headings inside a fence are code. */
function sections(md) {
  const out = [];
  let cur = { heading: '', depth: 0, lines: [] };
  let fenced = false;
  for (const line of strip(md).split('\n')) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const h = fenced ? null : /^(#{1,6})\s+(.*?)\s*#*$/.exec(line);
    if (h) {
      out.push(cur);
      cur = { heading: clean(h[2]), depth: h[1].length, lines: [] };
    } else {
      cur.lines.push(line);
    }
  }
  out.push(cur);
  return out.map((s) => ({ ...s, body: s.lines.join('\n') }));
}

/* ------------------------------------------------------------ schematic -- */

/** A Mermaid `flowchart`/`graph` block: node declarations plus edges. */
function mermaidGraph(body) {
  if (!/^\s*(?:flowchart|graph)\b/m.test(body)) return null;
  const labels = new Map();
  const order = [];
  // `ID["label"]`, `ID(["label"])`, `ID[("label")]` and the unquoted forms. The
  // bracket *shape* is Mermaid's node-shape vocabulary and carries nothing this
  // drawing keeps, so every shape reduces to one slab.
  const NODE = /\b([A-Za-z][\w]*)\s*[[({]{1,2}\s*(?:"([^"]*)"|([^"[\](){}]*?))\s*[\])}]{1,2}/g;
  const declare = (id, label) => {
    if (!labels.has(id)) {
      labels.set(id, label || id);
      order.push(id);
    }
  };
  for (const m of body.matchAll(NODE)) declare(m[1], clean(m[2] ?? m[3]));
  // Edges are read off the body with every node *shape* collapsed to its bare id
  // first. Without that, `UI["React + TS UI"] -->|JWT| API[...]` loses its edge:
  // the id and the arrow are not adjacent, and that was the one edge in this
  // account's only hub diagram that connected the front end to everything else.
  const bare = body.replace(NODE, (_m, id) => ` ${id} `);
  const EDGE = /\b([A-Za-z][\w]*)\s*(?:-{2,}|={2,}|-\.-+)>\s*(?:\|([^|]*)\|\s*)?([A-Za-z][\w]*)/g;
  const edges = [];
  for (const m of bare.matchAll(EDGE)) {
    declare(m[1]);
    declare(m[3]);
    edges.push({ from: m[1], to: m[3], label: clean(m[2]) });
  }
  if (order.length < 2 || !edges.length) return null;
  const idx = new Map(order.map((id, i) => [id, i]));
  return {
    nodes: order.map((id) => labels.get(id)),
    edges: edges.map((e) => ({ from: idx.get(e.from), to: idx.get(e.to), label: e.label })),
  };
}

/** One logical chain of arrows, however many source lines it is spread over. */
function arrowChain(body) {
  if (BOX_ART.test(body)) return null;
  // Lines without an arrow are column-aligned annotations under the chain, not
  // links in it. jakhmola.github.io writes its own pipeline exactly that way.
  const chain = body
    .split('\n')
    .filter((l) => ARROW.test(l))
    .join(' ');
  const nodes = chain.split(ARROW_SPLIT).map(clean).filter(Boolean);
  if (nodes.length < 3) return null;
  return { nodes, edges: nodes.slice(1).map((_, i) => ({ from: i, to: i + 1, label: '' })) };
}

/** Node lines separated by labelled downward arrows. */
function verticalPipeline(body) {
  if (BOX_ART.test(body)) return null;
  const nodes = [];
  const edges = [];
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const arrow = /^[↓▼]+\s*(.*)$/.exec(line);
    if (arrow) {
      // Aimed at the node not yet read; dropped below if the block ends on an arrow.
      if (nodes.length) edges.push({ from: nodes.length - 1, to: nodes.length, label: clean(arrow[1]) });
      continue;
    }
    nodes.push(clean(line));
  }
  if (nodes.length < 3 || !edges.length) return null;
  return { nodes, edges: edges.filter((e) => e.to < nodes.length) };
}

// Which heading a diagram sits under decides which one to draw when a README
// ships more than one. interview-coach ships two Mermaid flowcharts -- a visitor
// journey first, the system second -- and the system is the Schematic.
const HEADING_RANK = [/architect/i, /pipeline/i, /how it works/i, /design|overview/i];

/**
 * The Schematic: a small directed graph lifted verbatim out of the README.
 * Returns `null` when the README does not contain one — which is most of them.
 */
export function schematic(readme) {
  const found = [];
  for (const f of fences(readme)) {
    const mermaid = f.lang === 'mermaid' || /^\s*(?:flowchart|graph)\b/m.test(f.body);
    const graph = (mermaid ? mermaidGraph(f.body) : null) || verticalPipeline(f.body) || arrowChain(f.body);
    if (!graph) continue;
    const rank = HEADING_RANK.findIndex((re) => re.test(f.heading));
    found.push({
      ...graph,
      heading: f.heading,
      origin: mermaid ? 'mermaid flowchart' : 'ascii pipeline',
      rank: rank < 0 ? HEADING_RANK.length : rank,
    });
  }
  if (!found.length) return null;
  // Stable: document order breaks a rank tie, so one README always yields the
  // same drawing between rebuilds.
  found.sort((a, b) => a.rank - b.rank);
  return found[0];
}

/* --------------------------------------------------------------- layout -- */

// Placed here rather than in the renderer because it is arithmetic over the
// graph, not markup, and both readings draw the same coordinates.
//
// Two shapes occur, and each is drawn along the axis its author drew it along:
//
//   - A *chain* -- every node with at most one edge in and one out -- runs top to
//     bottom, with each edge's label beside its own connector. This is how
//     behavioral-biometric-identification draws its pipeline in the README, and
//     it is also the only way a seven-node chain fits a card: laid out across,
//     rag-search-engine's came to 864px, and scaled into a ~700px card that puts
//     10px mono labels at 8px. Below the ramp's smallest step is not a label.
//
//   - Anything else is layered left to right by longest path from a source, so a
//     hub and its five dependents form two columns. interview-coach's
//     architecture diagram is the only one of these in the account.
//
// The lattice is the label's own font size throughout, so the drawing scales with
// the type rather than against it.
// JetBrains Mono's advance, in em. Measured off the rendered SVG at 0.6000 exactly
// -- it is a monospace, so there is one number and no distribution. Carried at 0.62
// on purpose: the stack falls back to `ui-monospace`/Menlo if the face has not
// arrived, and SVG clips whatever leaves the viewBox, so 3% of slack is the
// difference between a label that ends early and one that ends mid-word.
const CHAR_W = 0.62;

/** Wrap a label to `max` characters a line, on word boundaries where it can. */
function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(' ')) {
    if (!line) line = word;
    else if (line.length + 1 + word.length <= max) line += ' ' + word;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

const widest = (lines) => Math.max(...lines.map((l) => l.length));

/** Every node has at most one edge in and one out: a pipeline, not a graph. */
function isChain(graph) {
  const out = graph.nodes.map(() => 0);
  const into = graph.nodes.map(() => 0);
  for (const e of graph.edges) {
    out[e.from]++;
    into[e.to]++;
  }
  return out.every((v) => v <= 1) && into.every((v) => v <= 1);
}

/** A chain, top to bottom, each edge label beside its own connector. */
function layoutChain(graph, { fs, max, slab }) {
  const lineH = fs * 1.32;
  const charW = fs * CHAR_W;
  const indent = slab + fs * 0.9;
  const nodes = graph.nodes.map((label) => ({ lines: wrap(label, max), label, slab }));
  // A chain's edges are already in node order for both parsers, but ordering the
  // drawing off the node index rather than off the edge list keeps it right if a
  // README ever writes its arrows out of sequence.
  const after = new Map(graph.edges.map((e) => [e.from, e]));
  let y = 0;
  let width = 0;
  const edges = [];
  nodes.forEach((node, i) => {
    node.x = 0;
    node.y = y;
    node.h = lineH * node.lines.length;
    node.w = indent + widest(node.lines) * charW;
    width = Math.max(width, node.w);
    y += node.h;
    const edge = after.get(i);
    if (!edge || edge.to >= nodes.length) return;
    const lines = edge.label ? wrap(edge.label, max) : [];
    const gap = Math.max(fs * 1.9, lineH * lines.length + fs * 0.5);
    edges.push({
      pts: [[slab / 2, y + fs * 0.15], [slab / 2, y + gap - fs * 0.15]],
      lines,
      lx: indent,
      ly: y + gap / 2,
      lineH,
    });
    width = Math.max(width, indent + (lines.length ? widest(lines) * charW : 0));
    y += gap;
  });
  return { width: Math.ceil(width), height: Math.ceil(y), nodes, edges, fs, lineH, axis: 'down' };
}

/** Anything else: layered left to right by longest path from a source. */
function layoutLayered(graph, { fs, max, slab, gapX, gapY }) {
  const n = graph.nodes.length;
  const lineH = fs * 1.32;
  const charW = fs * CHAR_W;
  const preds = graph.nodes.map(() => []);
  for (const e of graph.edges) {
    if (e.from !== e.to && preds[e.to]) preds[e.to].push(e.from);
  }
  // Iterated n times rather than recursed: a README is hand-written, and a cycle
  // in one must not hang an unattended nightly build.
  const depth = graph.nodes.map(() => 0);
  for (let pass = 0; pass < n; pass++) {
    for (let i = 0; i < n; i++) {
      for (const p of preds[i]) depth[i] = Math.max(depth[i], depth[p] + 1);
    }
  }
  const cols = [];
  const nodes = new Array(n);
  graph.nodes.forEach((label, i) => {
    nodes[i] = { lines: wrap(label, max), label, slab };
    (cols[depth[i]] ||= []).push(i);
  });

  // Edge labels are wrapped before the columns are placed, because they ride the
  // gutter between two columns and the gutter has to be wide enough to hold the
  // widest of them. Sized from the default, a hub's five labels all landed in the
  // same 30px gap on top of each other *and* on top of the node text they pointed
  // at -- which is what an architecture diagram's labels are for.
  const eLines = graph.edges.map((e) => (e.label ? wrap(e.label, 14) : []));
  const eWidest = Math.max(0, ...eLines.map((l) => (l.length ? widest(l) : 0)));
  // Room for the widest label *and* for the dog-leg to pass to the left of it.
  const gx = Math.max(gapX, eWidest * charW + fs * 3);

  let x = 0;
  let height = 0;
  for (const col of cols) {
    const w = slab + fs * 0.9 + Math.max(...col.map((i) => widest(nodes[i].lines))) * charW;
    let span = -gapY;
    for (const i of col) {
      nodes[i].h = lineH * nodes[i].lines.length;
      nodes[i].w = w;
      nodes[i].x = x;
      span += nodes[i].h + gapY;
    }
    height = Math.max(height, span);
    x += w + gx;
  }
  // Columns centre against each other, so a hub's dependents sit either side of
  // it rather than hanging below.
  for (const col of cols) {
    const span = col.reduce((s, i) => s + nodes[i].h + gapY, -gapY);
    let y = (height - span) / 2;
    for (const i of col) {
      nodes[i].y = y;
      y += nodes[i].h + gapY;
    }
  }
  const edges = graph.edges
    .map((e, k) => ({ e, lines: eLines[k] }))
    .filter(({ e }) => e.from !== e.to && nodes[e.from] && nodes[e.to])
    .map(({ e, lines }) => {
      const a = nodes[e.from];
      const b = nodes[e.to];
      const x0 = a.x + a.w;
      const y0 = a.y + a.h / 2;
      const x1 = b.x;
      const y1 = b.y + b.h / 2;
      // An orthogonal dog-leg through the gutter: drafting, not a spline. Turned at
      // the near quarter rather than the middle, so the vertical run stays left of
      // the labels instead of through them.
      const mid = x0 + (x1 - x0) * 0.22;
      const straight = Math.abs(y1 - y0) < 0.5;
      const pts = straight ? [[x0, y0], [x1, y1]] : [[x0, y0], [mid, y0], [mid, y1], [x1, y1]];
      return {
        pts,
        lines,
        // Beside the edge's *target*, not at its midpoint. A hub's five legs share
        // one origin, so their midpoints cluster into a smudge -- but their targets
        // are a column, already spaced apart, and a label reads as belonging to the
        // node it names.
        lx: x1 - widest(lines.length ? lines : ['']) * charW - fs * 0.6,
        ly: y1 - ((lines.length - 1) * lineH) / 2,
        lineH,
      };
    });
  return {
    width: Math.ceil(x - gx),
    height: Math.ceil(height),
    nodes,
    edges,
    fs,
    lineH,
    axis: 'across',
  };
}

/** Place a Schematic's nodes and edges in a viewBox. */
export function layout(graph, { fs = 10, max = 24, slab = 3, gapX = 30, gapY = 13 } = {}) {
  if (!graph || !graph.nodes.length) return null;
  const opts = { fs, max, slab, gapX, gapY };
  return isChain(graph) ? layoutChain(graph, opts) : layoutLayered(graph, opts);
}

/* ------------------------------------------------------------- registers -- */

// A bullet that leads with an emphasised term and then explains it. This is the
// README's own emphasis, not an interpretation of it:
//
//   - **Term** — gloss        - **Term**: gloss        - **Term** is gloss
//   - `term` serves gloss
//
// Bullets only, never table rows. A two-column table of emphasised terms is a
// stack listing, and reading it as a set of decisions both misrepresents it and
// duplicates the block below -- which is exactly what the first cut of this did
// to behavioral-biometric-identification's feature-count table.
const LEAD = /^\s*[-*]\s+(?:\*\*(.+?)\*\*|`(.+?)`)\s*(?:[—–:-]\s*|(?=\w))(.+)$/;

const pick = (secs, res) =>
  res.flatMap((re) => secs.filter((s) => re.test(s.heading))).filter((s, i, a) => a.indexOf(s) === i);

/**
 * The decisions register: the README's own emphasised claims and what each one
 * resolves to, verbatim and capped. Omitted entirely when a README carries none.
 *
 * ponytail: `constraint → choice` as such needs a model to read prose. This is
 * the deterministic floor of the same block -- the author's own lead-in and his
 * own gloss on it -- and it is capped at three because the point of the block is
 * that it is short.
 */
export function decisions(readme, cap = 3) {
  const wanted = pick(sections(readme), [
    /architect|design|approach|how it works/i,
    /^features?$/i,
    /overview/i,
  ]);
  const seen = new Set();
  const out = [];
  for (const s of wanted) {
    for (const raw of s.body.split('\n')) {
      const m = LEAD.exec(raw);
      if (!m) continue;
      const term = clean(m[1] ?? m[2]);
      // `- **Ranking** is a pure function …` reads as `Ranking → is a pure
      // function` once the pair is set beside its own term, so the copula the
      // sentence needed and the pair does not is dropped.
      const gloss = clean(m[3]).replace(/^(?:is|are|was|were|does|do)\s+/i, '');
      // A gloss of a word or two is a label, not a decision.
      if (!term || gloss.split(' ').length < 5 || seen.has(term.toLowerCase())) continue;
      seen.add(term.toLowerCase());
      out.push({ term, gloss, from: s.heading });
      if (out.length >= cap) return out;
    }
  }
  return out;
}

// A digit alone is not a figure: `3D U-Net` and `Qwen3-8B` are names. A figure
// carries a percentage, a unit, a decimal, or a count of at least two digits.
const MEASURED = /\d[.,]\d|\d\s*%|\b\d{2,}\b|\b\d+\s*(?:x|×|k|K|M|B|ms|s|Hz|kHz|GB|MB|KB|dim|fps)\b/;

/**
 * Figures the README states outright. Extraction, never generation: a line is
 * kept only when it already carries a measurement, and nothing here is computed,
 * rounded, compared or rephrased.
 */
export function figures(readme, cap = 5) {
  const wanted = pick(sections(readme), [
    /overview|metric/i,
    /key finding|result|performance|experiment/i,
  ]);
  const out = [];
  const seen = new Set();
  for (const s of wanted) {
    for (const raw of s.body.split('\n')) {
      if (/^\s*\|?[-\s|:]+\|?\s*$/.test(raw)) continue; // a table rule
      const cells = clean(raw.replace(/^\s*[-*]\s+/, '').replace(/^\s*\|/, '').replace(/\|\s*$/, ''));
      if (!MEASURED.test(cells) || cells.length < 8 || cells.length > 140) continue;
      if (/^(?:https?:|!\[|\[)/.test(cells) || /:$/.test(cells)) continue;
      const text = cells.replace(/\s*\|\s*/g, ' — ');
      if (seen.has(text)) continue;
      seen.add(text);
      out.push({ text, from: s.heading });
      if (out.length >= cap) return out;
    }
  }
  return out;
}

/**
 * The stack, as chips. Repo topics first because they are the author's own
 * labels, then the repo's primary language, then the components a stack-ish
 * section names in backticks.
 */
export function stack(repo, readme, cap = 9) {
  const out = [];
  const seen = new Set();
  const add = (label, kind) => {
    const key = String(label).toLowerCase();
    if (!label || seen.has(key) || out.length >= cap) return;
    seen.add(key);
    out.push({ label, kind });
  };
  for (const t of repo.topics || []) {
    if (!/^portfolio-(feature|hide)$/.test(t)) add(t, 'topic');
  }
  if (repo.language) add(repo.language, 'language');
  for (const s of pick(sections(readme), [/stack|requirement|technical detail|dependenc/i, /architect/i])) {
    for (const m of s.body.matchAll(/`([A-Za-z][\w.+#-]{1,28})`/g)) {
      // A path or a filename is a repo-layout detail, not a component.
      if (/[/\\]/.test(m[1]) || /\.(json|txt|ya?ml|md|py|js|ts|sh|env|csv|ipynb|pptx|pdf)$/i.test(m[1])) {
        continue;
      }
      add(m[1], 'component');
    }
    // A stack table lists its components in the value column, comma-separated
    // and unmarked -- `| **API** | FastAPI, Uvicorn, Pydantic |`.
    //
    // Taken all-or-nothing per row, because the identical column shape is also
    // how a README writes a *sentence* about a component: `| FastAPI +
    // LangGraph | Auth, sessions, and the multi-agent interview loop |` splits
    // into two things that look exactly like chips and one that does not, and
    // picking the two would ship `Auth` and `sessions` as stack entries. If any
    // part of the column fails, none of it was a list. Header rows are skipped
    // outright -- they name the columns, so they yield `Layer` and `Technology`.
    let afterRule = false;
    for (const row of s.body.split('\n')) {
      const cells = /^\s*\|(.+)\|\s*$/.exec(row);
      if (!cells) {
        afterRule = false;
        continue;
      }
      if (/^[-\s|:]+$/.test(cells[1])) {
        afterRule = true;
        continue;
      }
      if (!afterRule) continue;
      const value = clean(cells[1].split('|').slice(1).join(' '));
      if (!value) continue;
      const parts = value
        .split(/\s*[,/]\s*/)
        .map((p) => p.replace(/[.;:()]+$/, '').trim())
        .filter(Boolean);
      if (parts.length && parts.every((p) => /^[A-Za-z][\w.+#-]*(?: [\w.+#-]+)?$/.test(p) && p.length <= 22)) {
        for (const p of parts) add(p, 'component');
      }
    }
  }
  return out;
}

/** Every derived block for one Featured Project, in one call. */
export function derive(repo) {
  const readme = repo.readme || '';
  const graph = schematic(readme);
  return {
    schematic: graph,
    plan: layout(graph),
    stack: stack(repo, readme),
    decisions: decisions(readme),
    figures: figures(readme),
  };
}
