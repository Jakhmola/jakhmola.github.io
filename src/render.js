// Renders the whole site as one static HTML page via template literals.
// All content is present without JavaScript; semantic HTML5 throughout.

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
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0d1117"/><text x="5" y="22" font-family="monospace" font-size="15" fill="#7ee787">&gt;_</text></svg>`,
  );

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

function projectCard(repo, summary) {
  const tags = [repo.language, ...(repo.topics || []).filter((t) => !t.startsWith('portfolio-'))]
    .filter(Boolean)
    .slice(0, 6);
  return `<article class="card">
        <h3><a href="${e(repo.html_url)}">${e(repo.name)}</a></h3>
        <p class="summary">${e(summary || repo.description || 'See the repository for details.')}</p>
        <ul class="tags">
${tags.map((t) => `          <li>${e(t)}</li>`).join('\n')}
        </ul>
        <p class="card-links"><a href="${e(repo.html_url)}">view source &rarr;</a>${
          repo.stargazers_count ? `<span class="stars">&#9733; ${repo.stargazers_count}</span>` : ''
        }</p>
      </article>`;
}

function restItem(repo) {
  return `        <li><a href="${e(repo.html_url)}">${e(repo.name)}</a>${
    repo.description ? ` <span class="dim">&mdash; ${e(repo.description)}</span>` : ''
  }</li>`;
}

export function renderPage({ config, featured, rest, summaries, builtAt = new Date() }) {
  const skills = deriveSkills(config, featured);
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
  <link rel="canonical" href="${e(config.siteUrl)}">
  <link rel="icon" href="${FAVICON}">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <header class="hero">
      <div class="term">
        <div class="term-bar" aria-hidden="true">
          <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
          <span class="term-title">shubham@jakhmola.github.io:~</span>
        </div>
        <div class="term-body">
          <p class="prompt" aria-hidden="true">$ whoami<span class="cursor"></span></p>
          <h1>${e(config.name)}</h1>
          <p class="role">${e(config.title)}</p>
          <p class="pitch">${e(config.pitch)}</p>
          <nav class="contact" aria-label="Contact">
            <a class="btn" href="${e(config.resume)}">resume.pdf</a>
            <a href="${e(config.github)}">github</a>
            <a href="${e(config.linkedin)}">linkedin</a>
            <a href="mailto:${e(config.email)}">${e(config.email)}</a>
          </nav>
        </div>
      </div>
    </header>

    <section id="about">
      <h2><span class="prompt" aria-hidden="true">$ </span>cat about.txt</h2>
      <p>${e(config.about)}</p>
    </section>

    <section id="skills">
      <h2><span class="prompt" aria-hidden="true">$ </span>ls skills/</h2>
      <ul class="tags skills">
${skills.map((s) => `        <li>${e(s)}</li>`).join('\n')}
      </ul>
    </section>

    <section id="projects">
      <h2><span class="prompt" aria-hidden="true">$ </span>ls projects/ --featured</h2>
      <div class="cards">
${featured.map((r) => projectCard(r, summaries[r.full_name])).join('\n')}
      </div>
    </section>
${
  rest.length
    ? `
    <section id="more">
      <h2><span class="prompt" aria-hidden="true">$ </span>ls projects/ --all</h2>
      <ul class="rest">
${rest.map(restItem).join('\n')}
      </ul>
    </section>
`
    : ''
}
    <footer>
      <nav class="contact" aria-label="Contact">
        <a href="${e(config.resume)}">resume</a>
        <a href="${e(config.github)}">github</a>
        <a href="${e(config.linkedin)}">linkedin</a>
        <a href="mailto:${e(config.email)}">email</a>
      </nav>
      <p class="dim">Generated ${builtAt.toISOString().slice(0, 10)} by a scheduled rebuild from the GitHub API &mdash; this site updates itself.</p>
    </footer>
  </main>
</body>
</html>
`;
}
