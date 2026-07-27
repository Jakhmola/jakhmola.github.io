# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences read the same single page at two different depths, recruiter-first:

- **Recruiters and sourcers** arriving from a LinkedIn profile, an application, or a DM, skimming for about 30 seconds to answer "is this person an AI engineer, and is there a resume?" They must extract role, stack, and the resume link without scrolling carefully.
- **AI/ML hiring managers and engineers** who continue past the skim and judge the actual work: what was built, what architecture was chosen, whether the repos hold up. They follow links out to GitHub.

The page must survive the skim and reward the deeper read. Neither audience is served by a version that only works for the other.

## Product Purpose

A zero-maintenance personal portfolio for Shubham Jakhmola's AI job search, at https://jakhmola.github.io.

Success is **memorability, not immediate conversion**: this is the durable link Shubham points people at from LinkedIn, applications, and messages, and it has done its job when the visitor remembers him afterward. Email, resume download, and repo clicks are all real and must stay easy to reach, but no single one of them is the success metric the site is tuned for.

## Positioning

The site is itself an instance of the work it describes. A **Scheduled Rebuild** regenerates the entire page nightly from the GitHub API — ranking repos by a pure score, summarizing READMEs with an LLM, redeploying to Pages — so the portfolio of an engineer who builds shipping agents and pipelines is maintained by exactly such a pipeline. A hand-authored portfolio cannot truthfully make that claim, and it goes stale the day it is written.

## Operating Context

- The visitor arrives from an outbound link (LinkedIn, an application, a DM), not from search or browsing. There is one page and no navigation destination beyond it.
- The site's content changes only through the Scheduled Rebuild: a GitHub Actions job on a daily cron (`17 4 * * *`), plus `workflow_dispatch` and any push to `main`. Nothing is edited on the live site by hand.
- Shubham steers the site from GitHub rather than from code: the `portfolio-feature` and `portfolio-hide` repo topics are **Topic Overrides** that force a repo into or out of the featured set.
- The nightly job runs unattended. A rebuild that fails silently leaves stale content up with no one watching.

## Capabilities and Constraints

**What the build does.** Fetches public repos from the GitHub API → filters (forks and the `Jakhmola/Jakhmola` profile repo excluded, Topic Overrides applied) → ranks by a pure function over README depth, description presence, push recency, and stars → the top 6 become **Featured Projects** with full **Project Cards**, the remainder render as a compact list → LLM writes a two-sentence recruiter-oriented **Summary** per Featured Project → renders one static HTML page → deploys `dist/` to GitHub Pages.

**No generated assets.** Image and video generation are unavailable to this project. Every visual must be computed in the browser — shaders, procedural geometry, and type — or authored by hand. No photographs, no stock imagery, no pre-rendered video standing in for a real-time scene. This is a hard production constraint and it shapes the design, not just the asset list.

**Delivery.** Static GitHub Pages, deployed from the Actions artifact. npm dependencies and a bundler are permitted (the front end needs Three.js and GSAP); the nightly Action installs, builds, and deploys. The build must be genuinely good on a mid-range phone, within a strict performance budget, rather than degrading to a static apology.

**Technical facts of the current implementation:**

- Node ≥ 20. The page is rendered from template literals in `src/render.js`.
- All content is present in the HTML at build time.
- Summaries come from the free GitHub Models endpoint using the workflow's own `GITHUB_TOKEN`, cached in `.cache/summaries.json` keyed by README content hash.
- Tests (`node --test`) run fully offline against fixtures; `node src/build.js --fixtures test/fixtures` builds offline.

**Hard constraint (per ADR 0001).** The LLM is never load-bearing. Any LLM failure falls back to the cached Summary, then the raw GitHub description. The rebuild may never fail because the LLM did.

**Undecided.** No accessibility standard has been declared binding, and no target-role, seniority, or geography focus has been fixed. Future work should not invent either.

## Brand Commitments

- Name and role as stated in `site.config.json`: Shubham Jakhmola, AI Engineer.
- **Vocabulary is binding.** `CONTEXT.md` defines the project's language and the terms to avoid: Scheduled Rebuild (not sync/refresh/manual update), Project Card (not repo entry/tile), Featured Project (not pinned repo/highlight), Topic Override, Summary (a "description" means only the raw GitHub field used as fallback), Seed Content. Use these terms in code, docs, and UI copy.
- Voice in the existing **Seed Content** is first-person, plain, and concrete about what was built — no superlatives, no adjective stacking.
- **Standing preference: the category standard, played straight.** Offered a dealt, non-obvious visual world twice, Shubham chose the convention door both times. Future visual work executes the category canon at full fidelity — no irony, no quirk smuggled in — rather than reaching for an unexpected world. This is a durable preference, not a one-off.
- **The craft bar is igloo.inc and lusion.co.** Named by Shubham as the sites this should sit alongside: scroll-driven real-time WebGL, cinematic camera and choreography, shader-grade material. Their finish level is the standard the work is measured against.

## Evidence on Hand

Real:

- `static/resume.pdf` — the actual resume.
- Public GitHub repos, fetched live: coding agent, RAG search engine, automated ticketing system, Super Mario RL, brain-tumor segmentation, career-ops. Fixture copies of their READMEs live in `test/fixtures/readmes/`.
- Real contact endpoints: j4khmola@gmail.com, github.com/Jakhmola, linkedin.com/in/jakhmola.
- Hand-written hero, pitch, about, and skills copy in `site.config.json` (**Seed Content** — the only hand-authored material besides the resume).
- `docs/adr/0001-scheduled-rebuild-from-github-api.md` and `CONTEXT.md` record the architecture decision and vocabulary.

Absent — must never be fabricated: no employers, job titles, dates, or tenure; no testimonials, references, or client names; no metrics, benchmarks, accuracy numbers, model scores, user counts, or traffic figures; no awards, press, certifications, or degrees; no star counts beyond what the API returns. **Every claim on the site must trace to a real repo, the resume, or Seed Content Shubham wrote.** This is the user's one explicitly non-negotiable rule, and it has teeth in practice: a prior commit stripped project claims from the pitch once they no longer held up.

## Product Principles

1. **The work leads, without compromise.** Both audiences still arrive — the recruiter skimming and the engineer reading — but when the immersive experience and the 30-second skim conflict, the experience wins. Shubham would rather be unforgettable to the people who stay than merely convenient to everyone.
2. **Memorable over transactional.** The site is a durable impression Shubham links to, not a funnel. Do not sacrifice distinctiveness to chase a click.
3. **Only what is true.** Every claim traces to a real repo, the resume, or Shubham's own words. No invented evidence, ever.
4. **The site proves its own thesis.** It is an artifact of the automated, shipping-oriented engineering it describes; changes should keep that self-evident rather than merely stated.
5. **Zero upkeep, unattended.** Anything that requires a human to remember to update it, or that can fail the nightly rebuild, is a defect.
