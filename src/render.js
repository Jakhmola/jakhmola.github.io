// Renders the whole site as one static HTML page via template literals.
//
// Class contract for anything inside a <section class="page">: `.mt` = drawn by
// the particle system, `.copy` = DOM text the transition fades in and out.
// Everything visible needs one of the two. A bare element is fine on the calm
// reading and wrong on the matter one, where the outgoing page stays visible
// until the transition ends and only `.copy` gets hidden -- so it burns through
// the incoming page at full opacity for the whole 1.7s.
//
// Two readings of the same markup:
//   - no JS / reduced motion / no WebGL -> a plain, calm, scrolling document.
//   - otherwise -> matter.js adds `.matter` to <html> and the same sections
//     become four fixed pages whose headings are built from GPU particles.
// Everything a reader needs is in the HTML either way.

import { derive } from './derive.js';

export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const e = escapeHtml;

const FAVICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0a0c0e"/><path d="M16 5 6 5 16 15.4 26 5Zm0 22 10 0L16 16.6 6 27Z" fill="#67e8f9"/></svg>`,
  );

// Decides the calm/matter split before first paint, so the boot terminal and the
// hidden headings never flash on machines that will never run the matter system.
//
// Deliberately does NOT test width. The viewport is not final when a <head>
// script runs -- a tiling compositor sizes the window after parsing begins, so
// innerWidth reads the pre-resize value and the matter site would never start on
// a machine that ends up plenty wide. Width is decided reactively instead, by
// the same media query the stylesheet uses.
const MODE_PROBE = `try{
if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&document.createElement('canvas').getContext('webgl'))
document.documentElement.className='matter';
}catch(err){}`;

const PAGES = [
  { id: 'home', label: 'index' },
  { id: 'exp', label: 'experience' },
  { id: 'proj', label: 'projects' },
  { id: 'contact', label: 'contact' },
];

function navLinks() {
  return PAGES.map(
    (p) =>
      `        <a id="nl-${p.id}" href="#pg-${p.id}" data-nav="${p.id}" data-scramble>${p.label}</a>`,
  ).join('\n');
}

// An Epoch runs from its own start to the next one's; the last one is open and
// runs to the present. Derived rather than stored, so there is exactly one date
// per Epoch to keep true and no pair that can contradict itself.
function spanLabel(ep, i, all, nowYear) {
  const end = i + 1 < all.length ? all[i + 1].start : null;
  return `${ep.start} → ${end ?? 'present'}`;
}

// The facts register. Anything absent is omitted rather than rendered empty --
// an Epoch is a period first, and only some of them are also a job.
function facts(ep, i, all, nowYear) {
  const rows = [
    ['Span', spanLabel(ep, i, all, nowYear)],
    ['Role', ep.role],
    ['Org', ep.employer],
    ['Place', ep.location],
  ].filter(([, v]) => v);
  // Each pair is wrapped, because the two readings group them differently: rows
  // in the calm document, an inline run on the tape. A bare dt/dd sequence can
  // be laid out as one or the other, never as both.
  return `<dl class="facts">${rows
    .map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`)
    .join('')}</dl>`;
}

// `data-ep` is the tape's index: matter.js keys one sampled view per Epoch off
// it, so an Epoch change runs the same burn-out/manifest schedule a page change
// does. The `.mt` pair (year, title) is what the caret rewrites; everything
// else is `.copy` and fades.
function epoch(ep, i, all, nowYear) {
  // `role="tabpanel"` and `aria-labelledby` are added by matter.js rather than
  // written here: the tablist they belong to is matter-reading furniture, and a
  // tabpanel with no tablist anywhere is a lie the calm document would be
  // telling a screen reader.
  return `        <article class="epoch${ep.current ? ' now' : ''}" id="ep-${i}" data-ep="${i}">
          <div class="rule copy"></div>
          <p class="mt year">${e(ep.year)}</p>
          <h3 class="mt etitle">${e(ep.title)}</h3>
          <div class="copy ebody">
            ${facts(ep, i, all, nowYear)}
            <p>${e(ep.body)}</p>
            <ul class="tags">${(ep.tags || []).map((t) => `<li>${e(t)}</li>`).join('')}</ul>
          </div>
        </article>`;
}

// The track, spaced by real time rather than evenly: each tick sits at its own
// start, and the right edge is now. The gap between two ticks is therefore the
// length of an Epoch, which is the one fact a timeline exists to carry and the
// one the previous four-column layout threw away.
//
// Matter reading only -- the calm document shows every Epoch at once, so a
// control for choosing between them would select something already on screen.
function tape(eps, nowYear) {
  const t0 = eps[0].start;
  const span = Math.max(1, nowYear - t0);
  const at = (y) => (((y - t0) / span) * 100).toFixed(3);
  return `        <div class="tape matter-only">
          <div class="tape-rail" aria-hidden="true"></div>
          <div class="tape-ticks" role="tablist" aria-label="Epoch">
${eps
  .map((ep, i) => {
    const end = i + 1 < eps.length ? eps[i + 1].start : nowYear;
    return `            <button type="button" class="tick" role="tab" data-ep="${i}" id="tk-${i}" aria-controls="ep-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? '0' : '-1'}" style="--at:${at(ep.start)}%;--run:${(((end - ep.start) / span) * 100).toFixed(3)}%"><span class="tick-y">${e(ep.year)}</span></button>`;
  })
  .join('\n')}
          </div>
        </div>`;
}

// Every summary-less repo emitting one identical sentence reads as a bug rather
// than a fallback. The API already returns the two facts that tell them apart.
function fallbackBlurb(repo) {
  const facts = [repo.language, repo.stargazers_count ? `${repo.stargazers_count} stars` : null]
    .filter(Boolean)
    .join(' · ');
  return facts
    ? `${facts}. No summary yet — the README is on GitHub.`
    : 'No summary yet — the README is on GitHub.';
}

// The Schematic, drawn as drafting rather than as Matter Text: hairline edges,
// solid nodes, mono labels. Nothing here is built from particles, so the card
// costs nothing against the grain budget and the home page's claim that every
// glyph is conserved matter stays literally true.
//
// SVG rather than a canvas because the drawing is static once derived: it is in
// the HTML at build time, so the calm reading gets a real diagram for free, it
// needs no JS, and it scales with the type instead of against it. `--sw` carries
// the natural width so the stylesheet can enlarge it inside a raised card
// without re-deriving anything.
function schematicSvg(plan, graph) {
  const pad = 3;
  const w = plan.width + pad * 2;
  const h = plan.height + pad * 2;
  const at = (v) => Math.round(v * 10) / 10;
  const nodes = plan.nodes
    .map((n) => {
      const lines = n.lines
        .map(
          (line, i) =>
            `<tspan x="${at(n.x + pad + n.slab + plan.fs * 0.7)}" y="${at(
              n.y + pad + plan.lineH * (i + 0.72),
            )}">${e(line)}</tspan>`,
        )
        .join('');
      return (
        `<rect class="sn" x="${at(n.x + pad)}" y="${at(n.y + pad)}" width="${n.slab}" height="${at(n.h)}"/>` +
        `<text class="st">${lines}</text>`
      );
    })
    .join('');
  const edges = plan.edges
    .map((edge) => {
      const line = `<polyline class="se" points="${edge.pts
        .map(([x, y]) => `${at(x + pad)},${at(y + pad)}`)
        .join(' ')}"/>`;
      if (!edge.lines.length) return line;
      const label = edge.lines
        .map(
          (l, i) =>
            `<tspan x="${at(edge.lx + pad)}" y="${at(
              edge.ly + pad + edge.lineH * (i - (edge.lines.length - 1) / 2) + plan.fs * 0.34,
            )}">${e(l)}</tspan>`,
        )
        .join('');
      return line + `<text class="sl">${label}</text>`;
    })
    .join('');
  // `role="img"` with one label, rather than leaving a screen reader to walk
  // twenty loose <tspan>s in layout order and reassemble the pipeline itself.
  const spoken = graph.nodes.join(' → ');
  return (
    `<svg class="schem-svg" style="--sw:${w}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"` +
    ` role="img" aria-label="${e(`${graph.heading}: ${spoken}`)}">${edges}${nodes}</svg>`
  );
}

// The facts register, reusing the Epoch component verbatim -- same markup, same
// stylesheet, same rows-or-inline-run behaviour on the two readings.
//
// Stars are printed at zero rather than omitted. The omit-when-absent rule an
// Epoch follows is about fields that do not apply; a star count of nought
// applies, and a portfolio that prints only its flattering fields is the kind a
// reader checks once and stops trusting.
function projFacts(repo) {
  const rows = [
    ['Language', repo.language],
    ['Mass', repo.size ? `${(repo.size / 1024).toFixed(1)} MB` : null],
    ['Opened', (repo.created_at || '').slice(0, 10) || null],
    ['Pushed', (repo.pushed_at || '').slice(0, 10) || null],
    ['Stars', String(repo.stargazers_count ?? 0)],
  ].filter(([, v]) => v);
  return `<dl class="facts">${rows
    .map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`)
    .join('')}</dl>`;
}

// Above this many characters a repo name cannot be Matter Text, and the row
// keeps the DOM-text treatment it has always had.
//
// Measured, not guessed. Archivo 700 at normal width runs at most 0.522em per
// character over the alphabet repo names actually use; 820px is the binding
// viewport, because it is the narrowest the matter reading runs at and the name
// track offers 623px there. At The 26px Floor that admits 623 / (26 * 0.522) =
// 45 characters. The longest name in this account is 35, so nothing is demoted
// today -- but the featured set is chosen by a nightly job with nobody watching,
// and a name that overran would be sampled past the edge of its own column.
const MATTER_NAME_MAX = 45;

// The source link sits under the description, not in a right rail: at 1920 the rail
// put it 418px from the text it belonged to, and below 820px it landed closer
// to the divider than to its own row.
//
// ponytail: not the whole row as one <a>. That would swallow text selection of
// the description, and the link is now adjacent to it anyway.
//
// The row is the Plate. Its name is the only element large enough to be built
// from grain; everything else it carries lives in `.plate`, which the calm
// reading shows outright and the matter reading raises on a click. Nothing in
// `.plate` is marked `.copy`, because on the matter reading it is `display:none`
// until raised and so is never in flight during a page transition -- see the
// class contract at the top of this file, and the lowering matter.js does on nav.
function projectRow(repo, summary, index) {
  const n = String(index + 1).padStart(2, '0');
  const d = derive(repo);
  const matterName = repo.name.length <= MATTER_NAME_MAX;
  const blocks = [];

  blocks.push(`<p class="pdesc">${e(summary || repo.description || fallbackBlurb(repo))}</p>`);

  if (d.plan) {
    blocks.push(
      `<figure class="schem">${schematicSvg(d.plan, d.schematic)}` +
        `<figcaption>parsed &middot; ${e(d.schematic.origin)}, verbatim from &ldquo;${e(
          d.schematic.heading,
        )}&rdquo;</figcaption></figure>`,
    );
  }

  blocks.push(projFacts(repo));

  if (d.stack.length) {
    blocks.push(
      `<ul class="tags">${d.stack
        .map((s) => `<li${s.kind === 'language' ? ' class="lang"' : ''}>${e(s.label)}</li>`)
        .join('')}</ul>`,
    );
  }

  if (d.decisions.length) {
    blocks.push(
      `<dl class="calls"><dt class="blk-h">Decisions</dt>${d.decisions
        .map((c) => `<div><dt>${e(c.term)}</dt><dd>${e(c.gloss)}</dd></div>`)
        .join('')}</dl>`,
    );
  }

  if (d.figures.length) {
    blocks.push(
      `<div class="figs"><p class="blk-h">Reported</p><ul>${d.figures
        .map((f) => `<li>${e(f.text)}</li>`)
        .join('')}</ul></div>`,
    );
  }

  blocks.push(`<a class="psrc" href="${e(repo.html_url)}" data-scramble>source &#8599;</a>`);

  return `        <li class="project" data-proj="${index}">
          <span class="copy pnum">/${n}</span>
          <div class="pbody">
            <h3 class="${matterName ? 'mt' : 'copy'} pname" style="--ch:${repo.name.length}">${e(repo.name)}</h3>
            <div class="plate" id="plate-${index}">
              ${blocks.join('\n              ')}
            </div>
          </div>
        </li>`;
}

// The build runs unattended on a nightly cron against a live API. Zero featured
// repos is a production state, not a hypothetical, and the page it produced was
// an illegible heading over a void.
function emptyProjects(config) {
  return `        <li class="project empty">
          <span class="copy pnum">/--</span>
          <div class="pbody">
            <span class="copy pdesc">Nothing came back from the API on the last rebuild. The repositories are still there; this page just could not see them.</span>
            <a class="copy psrc" href="${e(config.github)}" data-scramble>github &#8599;</a>
          </div>
        </li>`;
}

export function renderPage({ config, featured, summaries, builtAt = new Date() }) {
  const [line1, line2] = config.contactHeadline;
  const [first, ...surname] = config.name.split(' ');
  // The tape's right edge is now, to the month, so the open Epoch's run grows on
  // its own between rebuilds instead of waiting for someone to edit a number.
  const nowYear = builtAt.getUTCFullYear() + builtAt.getUTCMonth() / 12;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(config.name)} &mdash; ${e(config.title)}</title>
  <meta name="description" content="${e(config.pitch)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${e(config.name)} &mdash; ${e(config.title)}">
  <meta property="og:description" content="${e(config.pitch)}">
  <meta property="og:url" content="${e(config.siteUrl)}">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#0a0c0e">
  <link rel="canonical" href="${e(config.siteUrl)}">
  <link rel="icon" href="${FAVICON}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..700&family=JetBrains+Mono:wght@400;500;700&display=swap">
  <link rel="stylesheet" href="style.css">
  <script>${MODE_PROBE}</script>
  <!-- Not deferred, and after the probe on purpose: tweak.js has to put saved
       values on :root before first paint, and it can override the probe's choice
       of reading. matter.js reads its knobs from the object it defines. -->
  <script src="tweak.js"></script>
  <script src="matter.js" defer></script>
</head>
<body>
  <div id="boot" aria-hidden="true">
    <div class="boot-win">
      <div class="boot-bar"><span class="d"></span><span class="d"></span><span class="d"></span><span class="boot-title">jakhmola.sys &mdash; v4</span></div>
      <div id="boot-log"></div>
    </div>
    <p class="boot-hint">any input skips &#9654;</p>
  </div>

  <div class="vignette" aria-hidden="true"></div>
  <canvas id="matter" aria-hidden="true"></canvas>
  <canvas id="caret-cv" aria-hidden="true"></canvas>
  <div id="hg-sigil" class="sigil" aria-hidden="true"></div>

  <nav class="topnav" aria-label="Sections">
    <a class="brand" href="#pg-home" data-nav="home" data-scramble>JAKHMOLA<span class="dim">.SYS</span></a>
    <div class="navlinks">
${navLinks()}
    </div>
  </nav>

  <p class="hud" aria-hidden="true">
    <span id="hud-clock">IN · GMT+5:30 · --:--:--</span>
    <span id="hud-page">01 / 04 &mdash; INDEX</span>
    <span>v4.0 &mdash; &#8727; MATTER IS CONSERVED</span>
  </p>

  <!-- The HUD counter is decorative; this is how a page change is announced. -->
  <p id="pg-live" class="sr-only" aria-live="polite"></p>

  <main>
    <section id="pg-home" class="page" aria-label="Home">
      <div class="page-in">
        <div class="home-top">
          <div class="home-head">
            <p class="copy tagline">${e(config.tagline)}</p>
            <h1 class="name"><span class="mt">${e(first.toUpperCase())}</span> <span class="mt">${e(surname.join(' ').toUpperCase())}</span></h1>
          </div>
          <div id="hg-home" class="sigil lg" aria-hidden="true"></div>
        </div>
        <div class="home-foot">
          <p class="copy pitch">${e(config.pitch)}</p>
          <p class="copy about calm-only">${e(config.about)}</p>
          <p class="copy links">
            <a href="${e(config.github)}" data-scramble>github &#8599;</a>
            <a href="${e(config.linkedin)}" data-scramble>linkedin &#8599;</a>
            <a href="${e(config.resume)}" data-scramble>resume.pdf &#8599;</a>
          </p>
        </div>
      </div>
    </section>

    <!-- The page heading is calm-reading furniture. On the tape the page is
         named by the nav and the HUD, and one Epoch fills the viewport, so an
         "Experience" headline above it would be a Headline-sized hole in the
         composition and ~1,000 grains spent saying what two other elements
         already say. -->
    <section id="pg-exp" class="page" aria-label="Experience">
      <div class="page-in">
        <div class="page-head calm-only">
          <h2>Experience</h2>
          <p class="accent">${config.experience.length} epochs &middot; ${e(config.experience[0].year)} &rarr; now</p>
        </div>
        <div class="epochs">
${config.experience.map((ep, i) => epoch(ep, i, config.experience, nowYear)).join('\n')}
        </div>
${tape(config.experience, nowYear)}
      </div>
    </section>

    <!-- The page heading is calm-reading furniture here for the same reason it is
         on Experience: on the matter reading the page is named by the nav and the
         HUD, and the index *is* the five names. A "Projects" Headline above them
         would be a second Headline-sized mark competing with the one a visitor
         came to read, and ~800 grains spent saying what two other elements
         already say. The outbound GitHub link stays on both readings, because it
         is what stands in for every repo the ranking left off. -->
    <section id="pg-proj" class="page" aria-label="Projects">
      <div class="page-in">
        <div class="page-head">
          <h2 class="calm-only">Projects</h2>
          <a class="copy" href="${e(config.github)}" data-scramble>all repos on github &#8599;</a>
        </div>
        <ul class="projects">
${featured.length ? featured.map((r, i) => projectRow(r, summaries[r.full_name], i)).join('\n') : emptyProjects(config)}
        </ul>
        <!-- The open gesture is taught; the close gesture is taught once a plate
             is up. Esc stays wired and unadvertised -- a labelled way out reads
             as application chrome, and this page is meant to be walked into. -->
        <p id="plate-hint" class="copy matter-only phint" aria-hidden="true">click a name to raise its plate</p>
      </div>
    </section>

    <section id="pg-contact" class="page" aria-label="Contact">
      <div class="page-in center">
        <h2 class="ct"><span class="mt">${e(line1)}</span> <span class="mt accent">${e(line2)}</span></h2>
        <a class="copy email" href="mailto:${e(config.email)}">${e(config.email)}</a>
        <p class="copy links">
          <a href="${e(config.github)}" data-scramble>github &#8599;</a>
          <a href="${e(config.linkedin)}" data-scramble>linkedin &#8599;</a>
          <a href="${e(config.resume)}" data-scramble>resume.pdf &#8599;</a>
        </p>
      </div>
      <footer class="copy">
        <span>&copy; ${builtAt.getUTCFullYear()} ${e(config.name)}</span>
        <span class="accent">&#8631; rebuilt ${builtAt.toISOString().slice(0, 10)} from the GitHub API</span>
      </footer>
    </section>
  </main>
</body>
</html>
`;
}
