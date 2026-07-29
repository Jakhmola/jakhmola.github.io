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

function epoch(ep) {
  return `        <article class="epoch${ep.current ? ' now' : ''}">
          <div class="rule copy"></div>
          <p class="mt year">${e(ep.year)}</p>
          <div class="copy">
            <h3>${e(ep.title)}</h3>
            <p>${e(ep.body)}</p>
            <ul class="tags">${(ep.tags || []).map((t) => `<li>${e(t)}</li>`).join('')}</ul>
          </div>
        </article>`;
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

// The source link sits under the description, not in a right rail: at 1920 the rail
// put it 418px from the text it belonged to, and below 820px it landed closer
// to the divider than to its own row.
//
// ponytail: not the whole row as one <a>. That would swallow text selection of
// the description, and the link is now adjacent to it anyway.
function projectRow(repo, summary, index) {
  const n = String(index + 1).padStart(2, '0');
  return `        <li class="project">
          <span class="copy pnum">/${n}</span>
          <div class="pbody">
            <h3 class="copy pname">${e(repo.name)}</h3>
            <span class="copy pdesc">${e(summary || repo.description || fallbackBlurb(repo))}</span>
            <a class="copy psrc" href="${e(repo.html_url)}" data-scramble>source &#8599;</a>
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
    <span id="hud-clock">GMT+5:30 IN --:--:--</span>
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

    <section id="pg-exp" class="page" aria-label="Experience">
      <div class="page-in">
        <div class="page-head">
          <h2 class="mt">Experience</h2>
          <p class="copy accent">${config.experience.length} epochs &middot; ${e(config.experience[0].year)} &rarr; now</p>
        </div>
        <div class="epochs">
${config.experience.map(epoch).join('\n')}
        </div>
      </div>
    </section>

    <section id="pg-proj" class="page" aria-label="Projects">
      <div class="page-in">
        <div class="page-head">
          <h2 class="mt">Projects</h2>
          <a class="copy" href="${e(config.github)}" data-scramble>all repos on github &#8599;</a>
        </div>
        <ul class="projects">
${featured.length ? featured.map((r, i) => projectRow(r, summaries[r.full_name], i)).join('\n') : emptyProjects(config)}
        </ul>
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
