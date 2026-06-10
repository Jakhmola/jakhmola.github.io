# Site content is generated nightly from the GitHub API, never authored by hand

The portfolio must stay current with zero maintenance: Shubham pushes a repo, the site picks it up. We decided a GitHub Actions cron job rebuilds the whole site daily — fetching repos from the GitHub API, auto-ranking them (forks and the profile repo excluded, `portfolio-feature`/`portfolio-hide` topics override), summarizing READMEs with the free GitHub Models LLM (cached per README SHA, raw description as fallback), and deploying static HTML to GitHub Pages.

## Considered Options

- **Client-side fetch** — real-time but rate-limited (60 req/h per visitor IP), SEO-invisible, and can't run an LLM, so cards would show raw (often empty) descriptions.
- **Hand-curated content files** — highest quality copy, but every new project needs a manual edit, violating the zero-maintenance requirement.

## Consequences

- New work appears within 24h, not instantly. Acceptable; a `workflow_dispatch` trigger allows forcing an immediate rebuild.
- The only hand-authored content is a small seed config (hero/about copy, links) and the resume PDF.
- If GitHub Models is unavailable, the build must still succeed using cached summaries or raw descriptions — the rebuild may never fail because the LLM did.
