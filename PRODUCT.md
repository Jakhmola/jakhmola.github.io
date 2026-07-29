# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: a fellow designer or developer arriving from a shared link.** They came for the craft. They will replay the page transition two or three times before reading anything, then skim the work. Patient with spectacle for about five seconds, then they want substance. On a laptop, with a dozen other tabs open.

**Secondary, and explicitly not optimised for: recruiters and sourcers.** A shared link still reaches them, so role, email, and the resume must be reachable within one interaction from any page. They are not the audience the site is tuned for, and no design decision is settled by appealing to them.

This ordering was confirmed on 2026-07-28 and reverses the earlier recruiter-first record. When the two audiences conflict, the primary wins.

## Product Purpose

A self-rebuilding personal site for Shubham Jakhmola at https://jakhmola.github.io.

**The site is the portfolio piece; the work is evidence, not the pitch.** Success is being distinctive enough that designers and developers share it — someone posting a screen recording of the transition, then clicking into a project. Memorability, not conversion. Email, resume, and repo links are real and must stay easy to reach, but none of them is the metric the site is tuned for.

## Positioning

The site is an instance of the work it describes, in two ways that a neighbouring portfolio cannot truthfully copy:

- **It maintains itself.** A Scheduled Rebuild regenerates the whole page nightly from the GitHub API — ranking repos by a pure score, summarizing READMEs with an LLM, redeploying to Pages. A hand-authored portfolio goes stale the day it is written.
- **It conserves its own material.** Every large heading is drawn from one particle buffer that is never reallocated; navigating moves the same grains from one page's letterforms into the next. The claim in the copy ("every glyph on screen is conserved matter, never created twice") is literally true of the implementation.

## Operating Context

- The visitor arrives from an outbound link (a share, an application, a DM), not from search or browsing.
- **Four pages, no scroll-driven narrative.** Navigation is by click, scroll gesture, arrow keys, or number keys; all advance, none reveal a scrollbar.
- The site's content changes only through the Scheduled Rebuild: a GitHub Actions job on a daily cron (`17 4 * * *`), plus `workflow_dispatch` and any push to `main`. Nothing is edited on the live site by hand.
- Shubham steers content from GitHub rather than from code: the `portfolio-feature` and `portfolio-hide` repo topics are Topic Overrides that force a repo into or out of the featured set.
- The nightly job runs unattended. A rebuild that fails silently leaves stale content up with no one watching.

## Capabilities and Constraints

**What the build does.** Fetches public repos from the GitHub API → filters (forks and the `Jakhmola/Jakhmola` profile repo excluded, Topic Overrides applied) → ranks by a pure function over README depth, description presence, push recency, and stars → the top 5 become Featured Projects and reach the page → LLM writes a two-sentence Summary per Featured Project → renders one static HTML page → deploys `dist/` to GitHub Pages.

**Evidence over inventory (confirmed 2026-07-28).** Only Featured Projects reach the page; ranked-out repos are left to the outbound GitHub link, and the long-form about copy appears only in the calm reading. This is a deliberate product constraint, not a content gap. The work on screen is evidence; the account is the catalogue.

**Two readings of one page.** The same HTML serves a calm scrolling document (no JS, reduced motion, no WebGL, or a viewport under 820px) and the four-page matter site. The calm reading is a first-class deliverable — a different, quiet site, not a degraded animation. Everything a reader needs is in the HTML either way.

**Zero runtime dependencies, no bundler.** The front end is hand-written ES modules and hand-rolled WebGL1 served as static files. This replaced an earlier plan that assumed Three.js and GSAP. Adding a runtime dependency is a real decision, not a default.

**No generated assets.** Image and video generation are unavailable to this project. Every visual is computed in the browser — shaders, procedural geometry, and type — or authored by hand. No photographs, no stock imagery, no pre-rendered video standing in for a real-time scene. This is a hard production constraint and it shapes the design, not just the asset list.

**Performance is the named failure mode.** A mid-range laptop must hold 60fps during the transition, and the transition is the thing people replay. This outranks visual density. One particle buffer, one draw call, sized once; no allocation during a transition; no per-frame `getBoundingClientRect`; phase timing integrated on clamped `dt` so a throttled tab cannot skip the choreography.

**Type below ~26px cannot be built from matter.** The sample grid is `fontSize / 14` clamped to 3–6px, and finer type has no room for a grid finer than its own strokes. Small copy is DOM text. This is a hard content constraint, not a preference.

**Technical facts of the current implementation:**

- Node ≥ 20. The page is rendered from template literals in `src/render.js`.
- All content is present in the HTML at build time.
- Summaries come from the free GitHub Models endpoint using the workflow's own `GITHUB_TOKEN`, cached in `.cache/summaries.json` keyed by README content hash.
- Tests (`node --test`) run fully offline against fixtures; `node src/build.js --fixtures test/fixtures` builds offline.

**Hard constraint (per ADR 0001).** The LLM is never load-bearing. Any LLM failure falls back to the cached Summary, then the raw GitHub description. The rebuild may never fail because the LLM did.

**Undecided.** No accessibility standard has been declared binding. No target-role, seniority, or geography focus has been fixed. Future work should not invent either.

## Brand Commitments

- Name and role as stated in `site.config.json`: Shubham Jakhmola, AI Engineer.
- **Vocabulary is binding.** `CONTEXT.md` defines the project's language and the terms to avoid: Scheduled Rebuild (not sync/refresh/manual update), Project Row (not card/tile), Featured Project (not pinned repo/highlight), Topic Override, Summary (a "description" means only the raw GitHub field used as fallback), Seed Content, Matter, Matter Text, Caret, Calm Site, Epoch. Use these terms in code, docs, and UI copy.
- Voice in the existing Seed Content is first-person, plain, and concrete about what was built — no superlatives, no adjective stacking.
- **The craft bar is igloo.inc and lusion.co.** Named by Shubham as the sites this should sit alongside: real-time WebGL, cinematic choreography, shader-grade material. Their finish level is the standard the work is measured against.

## Evidence on Hand

- Real public repos at https://github.com/Jakhmola, fetched live at build time. Featured set and Summaries are derived, never hand-written.
- `static/resume.pdf` — the real resume, shipped with the site.
- `test/fixtures/` — a frozen snapshot of the GitHub API response plus six real READMEs, for offline builds and tests.
- The design brief and v4 comp in the Claude Design project "Portfolio Website Redesign".

**Absences future work must not fabricate:** no testimonials, no customers, no benchmarks beyond what a repo README actually reports, no employer names or dates beyond what the Epochs already state, no traffic or engagement figures.

## Product Principles

1. **The site is the argument.** If a visitor remembers one thing, it should be the thing they watched happen, not a sentence they read.
2. **Nothing is maintained by hand.** Any feature that requires Shubham to remember to update it has failed, regardless of how good it looks.
3. **Evidence over inventory.** Show fewer things, in more depth, and link out for the rest.
4. **The calm reading is not a fallback.** It is the site for everyone whose machine or preferences rule out the matter system, and it is held to the same standard.
5. **Performance outranks density.** When a visual idea and 60fps conflict, the visual idea loses.

## Accessibility & Inclusion

No standard has been declared binding. Two product-specific requirements are settled regardless:

- `prefers-reduced-motion: reduce` gets the calm site — not a slower animation, and not a version with content missing.
- All content is present in the HTML without JavaScript. The matter system is an enhancement over a complete document, never the delivery mechanism for content.
