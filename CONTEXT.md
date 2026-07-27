# Portfolio

A zero-maintenance personal portfolio site for Shubham Jakhmola's AI job search, hosted free on GitHub Pages and rebuilt automatically from his GitHub account.

## Language

**Scheduled Rebuild**:
The nightly process that fetches all of Shubham's public repos, regenerates the site, and redeploys it. The only way the site's content changes.
_Avoid_: sync, refresh, manual update

**Project Beat**:
The rendered unit on the site representing one Featured Project: a full-viewport
section (name, Summary, tech, links) paired with one formation of the particle
field. Renamed from "Project Card" when the site stopped using cards.
_Avoid_: card, repo entry, tile

**Beat**:
Any full-viewport section of the scroll journey — hero, pipeline, a Project Beat,
skills, more, about, contact. Each beat owns exactly one formation of the field.

**Field**:
The GPU particle system behind the page. One system throughout; it morphs between
formations on beat change. Always additive — it never carries content of its own.
_Avoid_: background, canvas, animation

**Featured Project**:
A repo whose auto-rank score (or a `portfolio-feature` topic) earns it a full Project Card; non-featured repos appear only in a compact list. Forks and the profile repo are never shown.
_Avoid_: pinned repo, highlight

**Topic Override**:
A GitHub repo topic (`portfolio-feature` / `portfolio-hide`) that forces a repo into or out of the featured set, beating the auto-rank score and (for `portfolio-feature`) the fork exclusion.

**Summary**:
The recruiter-oriented two-sentence text on a Project Card, written by an LLM from the repo's README during the Scheduled Rebuild and cached until the README changes.
_Avoid_: description (that means the raw GitHub description field, used only as fallback)

**Seed Content**:
The only hand-authored material on the site: hero/about copy, skills supplements, contact links, and the resume PDF. Written once; everything else is generated.
_Avoid_: site content, copy (too broad)
