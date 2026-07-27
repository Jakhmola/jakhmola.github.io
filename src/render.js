// Renders the whole site as one static HTML page via template literals.
// All content is present without JavaScript; semantic HTML5 throughout.
// The WebGL field in app.js is a layer over this markup, never a replacement
// for it — per ADR 0001 a failed asset may not cost the visitor the content.

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
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#05070a"/><circle cx="16" cy="16" r="9" fill="none" stroke="#6f8cff" stroke-width="1.25" opacity=".55"/><circle cx="16" cy="16" r="3.5" fill="#9fd8ff"/></svg>`,
  );

/** The direction contract. Emitted into the markup so it survives the build. */
const CONTRACT = `
  THESIS: A portfolio that computes itself in front of you. It refuses the terminal-green
  developer page, the neural-net node canvas, and the static hero image faking a 3D scene.
  OWN-WORLD: Ink-black ground (#05070A), one GPU particle field carrying thin-film
  iridescence as its only colour, Archivo variable holding every level of hierarchy through
  weight and width alone. Tabular figures. No monospace, no gradient text, no cards.
  STORY: A visitor watches a GitHub account become a portfolio, reads six projects the
  machine chose and wrote, and leaves able to describe what they saw.
  FIRST VIEWPORT: Full-bleed canvas. The overture flashes every repository name in rapid
  succession while the field assembles from dispersal into the account's disc, which then
  holds the right of frame. Copy owns the left: the real build stamp as a kicker, the name
  at display scale under it, role and pitch beneath, scroll cue centred at the foot.
  FORM: Category canon, played straight — the standing door, taken twice, so convention is
  the commitment and igloo.inc plus lusion.co set the craft bar. Staging: overture flicker.
  Seed 14deebc4.
`;

/** Skills strip = Seed Content skills ∪ Featured Projects' languages and topics. */
export function deriveSkills(config, featured) {
  const skills = [...config.skills];
  const seen = new Set(skills.map((s) => s.toLowerCase()));
  const add = (raw) => {
    if (!raw) return;
    const label = raw.includes('-') ? raw.replaceAll('-', ' ') : raw;
    if (seen.has(label.toLowerCase()) || seen.has(raw.toLowerCase())) return;
    seen.add(label.toLowerCase());
    skills.push(label);
  };
  for (const repo of featured) {
    add(repo.language);
    for (const topic of repo.topics || []) {
      if (!topic.startsWith('portfolio-')) add(topic);
    }
  }
  return skills;
}

/** Stable 32-bit hash — the deterministic half of a project's visual seed. */
function hash32(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const FORMS = ['lattice', 'helix', 'shell', 'bloom', 'ring', 'drift'];

/**
 * A project's visual seed: which procedural form its particles take, and how
 * energetic it is. The LLM may name the form (see summarize.js); when it does
 * not, repo identity decides — deterministic, so a form never shifts under a
 * visitor just because a README was edited.
 */
export function visualSeed(repo, form) {
  const h = hash32(`${repo.full_name}|${repo.language || ''}`);
  return {
    form: FORMS.includes(form) ? form : FORMS[h % FORMS.length],
    energy: Number((0.35 + ((h >>> 8) % 1000) / 1000 / 1.55).toFixed(3)),
    spin: (h >>> 18) % 2 ? 1 : -1,
    hue: (h >>> 4) % 360,
  };
}

const tagsOf = (repo) =>
  [repo.language, ...(repo.topics || []).filter((t) => !t.startsWith('portfolio-'))]
    .filter(Boolean)
    .slice(0, 6);

/**
 * One Trajectory station. Deliberately the opposite of a Gallery entry: this
 * copy is hand-authored Seed Content and settled, where the Gallery is fetched
 * and re-ranked nightly. The contrast between the two is the point.
 */
function station(s) {
  const id = `t-${e(s.beat)}`;
  return `    <section class="beat station" id="${id}" data-beat="${e(s.beat)}" aria-labelledby="${id}-h">
      <div class="beat-inner">
        <p class="marker"><span class="marker-n">${e(s.n)}</span> <span class="marker-l">${e(s.label)}</span></p>
        ${
          s.heading
            ? `<h2 id="${id}-h">${e(s.heading)}</h2>`
            : `<h2 id="${id}-h" class="sr-only">${e(s.label)}</h2>`
        }
        <p class="org"><span class="org-n">${e(s.org)}</span> <span class="org-y">${e(s.years)}</span></p>
${s.paras.map((t) => `        <p class="lede">${e(t)}</p>`).join('\n')}
      </div>
    </section>`;
}

/**
 * One Featured Project in the Gallery. The name is the index and the link; the
 * detail below it is collapsed to the selected one under the stage, and simply
 * open for every project in the plain document.
 */
function galleryItem(repo, summary, index) {
  const tags = tagsOf(repo);
  const n = String(index + 1).padStart(2, '0');
  return `            <li class="orb" data-orb="${index}">
              <a class="orb-a" href="${e(repo.html_url)}">
                <span class="orb-n">${n}</span>
                <span class="orb-name">${e(repo.name)}</span>
              </a>
              <div class="orb-d"><div>
                <p class="orb-s">${e(summary || repo.description || 'See the repository for details.')}</p>
                <ul class="tags">
${tags.map((t) => `                  <li>${e(t)}</li>`).join('\n')}
                </ul>
              </div></div>
            </li>`;
}

export function renderPage({ config, featured, rest, summaries, forms = {}, builtAt = new Date() }) {
  const skills = deriveSkills(config, featured);
  const seeds = featured.map((r) => visualSeed(r, forms[r.full_name]));
  const stamp = builtAt.toISOString().slice(0, 16).replace('T', ' ');
  const considered = featured.length + rest.length;
  const summaryOf = (r) => summaries[r.full_name] || r.description || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(config.name)} &mdash; ${e(config.title)}</title>
  <meta name="description" content="${e(config.pitch)}">
  <meta name="theme-color" content="#05070a">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${e(config.name)} &mdash; ${e(config.title)}">
  <meta property="og:description" content="${e(config.pitch)}">
  <meta property="og:url" content="${e(config.siteUrl)}">
  <meta name="twitter:card" content="summary">
  <link rel="canonical" href="${e(config.siteUrl)}">
  <link rel="icon" href="${FAVICON}">
  <link rel="preload" href="fonts/archivo-var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="style.css">
  <script type="module" src="app.js"></script>
</head>
<!--
${CONTRACT.trim()}
-->
<body>
  <a class="skip" href="#hero">Skip to content</a>

  <div id="boot" hidden>
    <p class="boot-l">Scheduled Rebuild</p>
    <p class="boot-stamp"><span>${e(stamp)}</span> UTC</p>
    <p class="boot-name" aria-hidden="true">&nbsp;</p>
    <div class="boot-bar" role="progressbar" aria-label="Loading" aria-valuemin="0" aria-valuemax="100"><i></i></div>
    <p class="boot-n"><span class="boot-count">${considered}</span> repositories read</p>
  </div>

  <canvas id="field" aria-hidden="true"></canvas>
  <div id="veil" aria-hidden="true"></div>

  <script type="application/json" id="field-data">${JSON.stringify({
    clusters: [...featured, ...rest].map((r) => Math.round((r.score || 1) * 10) / 10),
    names: [...featured, ...rest].map((r) => r.name),
    featured: featured.length,
    seeds,
    // Hand-assigned seeds for the Acting station's solids, so the systems built
    // at work come out of the same equation as the repositories.
    acting: (config.trajectory || []).find((s) => s.beat === 'acting')?.seeds || [],
  }).replaceAll('<', '\\u003c')}</script>

  <main>
    <section class="beat" id="hero" data-beat="hero">
      <div class="beat-inner hero-inner">
        <p class="stamp">Rebuilt ${e(stamp)} UTC</p>
        <h1>${e(config.name)}</h1>
        <p class="role">${e(config.title)}</p>
        <p class="pitch">${e(config.pitch)}</p>
        <nav class="contact top" aria-label="Primary">
          <a class="btn" href="${e(config.resume)}">Resume</a>
          <a href="${e(config.github)}">GitHub</a>
          <a href="${e(config.linkedin)}">LinkedIn</a>
          <a href="mailto:${e(config.email)}">Email</a>
        </nav>
      </div>
      <p class="cue" aria-hidden="true">Scroll</p>
    </section>

    <h2 class="sr-only">Trajectory</h2>
${(config.trajectory || []).map(station).join('\n')}

    <section class="beat" id="gallery" data-beat="gallery" aria-labelledby="gallery-h">
      <div class="beat-inner">
        <p class="marker"><span class="marker-l">Gallery</span></p>
        <h2 id="gallery-h">Built in the open</h2>
        <ol class="gallery">
${featured.map((r, i) => galleryItem(r, summaryOf(r), i)).join('\n')}
        </ol>
        <p class="beat-links"><a class="link-out" href="${e(config.github)}">Everything else on GitHub</a><span class="stat"><span class="stat-n">${considered}</span> repositories read</span></p>
      </div>
    </section>

    <section class="beat" id="about" data-beat="about" aria-labelledby="about-h">
      <div class="beat-inner">
        <h2 id="about-h">About</h2>
        <p class="prose">${e(config.about)}</p>
        <ul class="tags skills">
${skills.map((s) => `          <li>${e(s)}</li>`).join('\n')}
        </ul>
      </div>
    </section>

    <footer class="beat" id="contact" data-beat="contact">
      <div class="beat-inner">
        <p class="outro">Available for AI engineering work.</p>
        <nav class="contact" aria-label="Contact">
          <a class="btn" href="${e(config.resume)}">Resume</a>
          <a href="${e(config.github)}">GitHub</a>
          <a href="${e(config.linkedin)}">LinkedIn</a>
          <a href="mailto:${e(config.email)}">${e(config.email)}</a>
        </nav>
        <p class="colophon">Generated ${e(stamp)} UTC by a scheduled rebuild from the GitHub API.
        Built with Three.js and GSAP; every visual on this page is computed, not photographed.</p>
      </div>
    </footer>
  </main>
</body>
</html>
`;
}
