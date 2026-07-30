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
The single particle buffer that draws every large heading — allocated once at a 22,000-grain ceiling, with 9,000 of them live at the default budget. Never reallocated, and conserved across pages: grains are moved, never created or destroyed.
_Avoid_: particles (too generic), effect

**Matter Text**:
A heading marked `.mt`, laid out by the browser for measurement but painted by Matter rather than the text renderer. Must stay above ~26px or it cannot resolve.
_Avoid_: headline, particle text

**Caret**:
The read/write head that drives a transition — it consumes the outgoing page's Matter Text, carries the grains, and emits them into the incoming page's letterforms. Between transitions it parks at the end of the last heading, or docks to the end of a link the hand is over. On the Tape it parks on the track instead, at the Epoch it has just written, where the head's position and the position on the recording are one fact.
_Avoid_: cursor, pointer (that means the mouse)

**Wake**:
The share of a heading's Matter that a nearby hand carries with it, on a leash one felt radius long, before it lets go and burns home into its own slot. The third thing a hand does to Matter, after the aura and the reach.
_Avoid_: trail, cursor effect, particles following the mouse

**Lean**:
The small pull a hand exerts on the interactive text under it — the element translates toward the pointer and springs back, critically damped.
_Avoid_: magnetic cursor (that names a component this project does not have), hover bounce

**Calm Site**:
The same HTML read as a plain scrolling document, served to visitors with no JS, reduced motion, no WebGL, or a narrow viewport. A different, quiet site — not a degraded animation.
_Avoid_: fallback, no-JS mode (too narrow: it is also the mobile and reduced-motion site)

**Epoch**:
One period on the Experience page (start year, marker, title, body, tech tags, and optionally a role, org and place). Hand-authored Seed Content, not derived from repos. A period first: an Epoch with no org is still an Epoch, which is why the facts register omits what is absent rather than rendering it empty.
_Avoid_: job, role, timeline entry

**Tape**:
The Experience page read as a recording: one Epoch owns the viewport, and the Caret is the head on a track whose ticks are placed by real years. Advancing an Epoch runs the same burn-out/manifest schedule a page change does.
_Avoid_: carousel, slider, timeline (the last is what it depicts, not what it is)

**View**:
The unit the field is sampled and scheduled in — `home`, `exp:0…3`, `proj`, `contact`. A page is what the nav, the HUD and the URL name; a view is what has a point cloud. They were the same thing until the Tape.
_Avoid_: slide, step, frame

**Topic Override**:
A GitHub repo topic (`portfolio-feature` / `portfolio-hide`) that forces a repo into or out of the featured set, beating the auto-rank score and (for `portfolio-feature`) the fork exclusion.

**Summary**:
The recruiter-oriented two-sentence text on a Project Card, written by an LLM from the repo's README during the Scheduled Rebuild and cached until the README changes.
_Avoid_: description (that means the raw GitHub description field, used only as fallback)

**Seed Content**:
The only hand-authored material on the site: name, tagline, pitch, about, Epochs, contact links, and the resume PDF. Written once; everything else is generated.
_Avoid_: site content, copy (too broad)
