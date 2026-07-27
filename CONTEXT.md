# Portfolio

A zero-maintenance personal portfolio site for Shubham Jakhmola's AI job search, hosted free on GitHub Pages and rebuilt automatically from his GitHub account.

## Language

**Scheduled Rebuild**:
The nightly process that fetches all of Shubham's public repos, regenerates the site, and redeploys it. The only way the site's content changes.
_Avoid_: sync, refresh, manual update

**Project Row**:
The rendered unit on the Projects page representing one GitHub repo (index, name, Summary, source link).
_Avoid_: card, repo entry, tile

**Featured Project**:
A repo whose auto-rank score (or a `portfolio-feature` topic) earns it a Project Row. Everything else is ranked out and never reaches the page — the Projects page links to the GitHub account instead. Forks and the profile repo are never shown.
_Avoid_: pinned repo, highlight

**Matter**:
The single 6,000-particle buffer that draws every large heading. Sized once, never reallocated, and conserved across pages: grains are moved, never created or destroyed.
_Avoid_: particles (too generic), effect

**Matter Text**:
A heading marked `.mt`, laid out by the browser for measurement but painted by Matter rather than the text renderer. Must stay above ~26px or it cannot resolve.
_Avoid_: headline, particle text

**Caret**:
The read/write head that drives a transition — it consumes the outgoing page's Matter Text, carries the grains, and emits them into the incoming page's letterforms.
_Avoid_: cursor, pointer (that means the mouse)

**Calm Site**:
The same HTML read as a plain scrolling document, served to visitors with no JS, reduced motion, no WebGL, or a narrow viewport. A different, quiet site — not a degraded animation.
_Avoid_: fallback, no-JS mode (too narrow: it is also the mobile and reduced-motion site)

**Epoch**:
One period on the Experience page (year, title, body, tech tags). Hand-authored Seed Content, not derived from repos.
_Avoid_: job, role, timeline entry

**Topic Override**:
A GitHub repo topic (`portfolio-feature` / `portfolio-hide`) that forces a repo into or out of the featured set, beating the auto-rank score and (for `portfolio-feature`) the fork exclusion.

**Summary**:
The recruiter-oriented two-sentence text on a Project Card, written by an LLM from the repo's README during the Scheduled Rebuild and cached until the README changes.
_Avoid_: description (that means the raw GitHub description field, used only as fallback)

**Seed Content**:
The only hand-authored material on the site: name, tagline, pitch, about, Epochs, contact links, and the resume PDF. Written once; everything else is generated.
_Avoid_: site content, copy (too broad)
