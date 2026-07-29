---
target: the shipped matter system
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-07-29T21-34-35Z
slug: static-matter-js
---
Method: dual-agent (A: abcc5c4facb406cf0 · B: a3b2c3ad813737f04)

Target: the shipped matter system — `static/matter.js`, `static/tweak.js`, `static/style.css`. **Experience** surface.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Reaching page 4 is silent — no edge cue, no scrollbar to imply an end; input during a transition is dropped without acknowledgment. |
| 2 | Match System / Real World | 3 | Machine metaphor is coherent; `epochs` still makes a reader decode. `GMT+5:30 IN` fixed this pass. |
| 3 | User Control and Freedom | 2 | `replaceState` with no `popstate` — four pages leave zero history entries, so Back exits the site. |
| 4 | Consistency and Standards | 3 | Contact is centred while the other three share the 8vw rail, with no named rule covering it. Modifier hijacking fixed this pass. |
| 5 | Error Prevention | 2 | A stray trackpad flick changes page with no Back, no scrollbar and no undo. |
| 6 | Recognition Rather Than Recall | 2 | Nothing states that wheel / arrows / digits / swipe navigate; `T` is documented only inside the panel `T` opens. |
| 7 | Flexibility and Efficiency | 3 | Five nav paths, 120 controls, 8 presets, localStorage — every shortcut undiscoverable. |
| 8 | Aesthetic and Minimalist Design | 3 | One hue, closed ramp, no content shadows. The 180×260 home hourglass still reads flatter than its corner sibling. |
| 9 | Error Recovery | 3 | Calm-site handoff, adaptive downscale, real empty state. A slider dragged into cotton wool has only a global Reset. |
| 10 | Help and Documentation | 2 | The panel's per-group notes are real inline documentation; the site's own navigation model has none. |
| **Total** | | **26/40** | **Acceptable, upper end** |

No heuristic scored `n/a`: 7 applies (five nav paths, 120 controls, presets, persistence) and 10 applies because the panel is documented while the navigation is not.

## Design Specificity Verdict

**Authored for this product, and not transferable.** Composition, interaction language and material are all specific. The caret that *schedules* rather than carries — handing each slot a burn-out time and a manifest time, then ceasing to be responsible for finishing — is the strongest idea on the site, and it is one where the cheap implementation is also the more expressive one. The conservation claim in the copy is literally true of the buffer.

**Deterministic scan:** 2 findings, both `warning`. `design-system-font` at `static/tweak.js` is a **false positive** — the extracted token is the literal `${q}` template placeholder in `ensureFont()`, not a family; the face lists are exactly what The Font Picker Exception declares. `em-dash-overuse` was **partly real**: of 14 marks, 3 were the `--:--:--` clock and 4 chrome separators, but all four epoch bodies did share one `clause — clause` construction. Two changed punctuation only; now 12 marks, 5 of them prose, a third of the rule's threshold.

**Visual overlays:** not available. No interactive browser automation in this environment, so no user-visible overlay was produced; all evidence came from the project's own headless harness.

## Overall Impression

The transition is the best thing here and it earns the craft bar — the caret typing the name into existence, characters cycling glyphs and settling, is the frame that gets screen-recorded. The single biggest opportunity was never the spectacle: it was that three of four pages delivered you to a heading rendered as dust. Fixed this pass by applying one grain ratio to all matter.

## What's Working

1. **The caret as scheduler, not courier.** Affordable (one comparison per grain, no per-frame geometry, nothing following it across the viewport) *and* more expressive than carrying. Those two usually trade against each other.
2. **The calm reading is a different site, not a stripped one.** Same HTML serves reduced-motion, no-WebGL, no-JS and <820px, with long-form copy the matter reading does not carry, and `:has(:target)` marking the nav so it ships no script at all.
3. **The system measures itself.** `coverage.mjs`, `probes/fill.js`, `probes/life.js` and a DESIGN.md that records numbers and names its own open findings. It is why the reach was cut from the lab's 5 radii to 2.2 on measurement rather than taste — and why the mean-luminance phantom below was caught before it shipped.

## Priority Issues

### [P1] Back exits the site — OPEN, needs a product decision
`endTr` uses `history.replaceState` with no `pushState`, `popstate` or `hashchange` listener anywhere, so four pages leave zero history entries. Back is the most-used recovery key on the web and here it leaves.
**Why it matters:** compounds Error Prevention — a stray trackpad flick changes page and there is no way back to where you were.
**Fix:** `pushState` + a `popstate` listener calling `goTo`. Not applied: a wheel flick would then create a history entry per gesture, which is very likely why `replaceState` was chosen. This is a product call about whether the four pages are history.
**Suggested command:** `/impeccable harden`

### [P1] Matter is measurably dimmer than DOM text — NOT A DEFECT (metric artifact)
Recorded because it is the most expensive thing verified this pass. Mean-over-lit-pixels favours a solid glyph over a sprite field structurally. At p95, matter reaches 227–244 against DOM's 239–249 with four to nine times the ink. Chasing the phantom via `amb`/`bright`/`rim` pushed the name's achromatic core to 2.9%, past The Specular Ceiling, for nothing. `tools/lit.py` reports `p95` now.

### [P1] One grain ratio was not applied to all matter — FIXED
`restS` 0.75 put non-hero headings at 1.55× their lattice while the name sat at 2.2×. Experience and Projects rendered as dust at ~20% lit; `2023` was ambiguous. At `restS` 1.0 they sit at 2.0× and their strokes close: Experience 30.4%, Projects 30.1%, year figures 49–57%, coring under 0.5%.

### [P2] The hand was not attributable — FIXED
`(1 − d/r)²` falloff put almost the whole aura inside the first fifth of the radius, under the idle shimmer's own variance. Linear now, over a third of the idle floor: +14.8% / +8.8% / +2.6% by ring.

### [P2] Motion was in pixels, not lattice units — FIXED
4px of flow is a third of a stroke on the name's 3px lattice and most of one on a 2px heading's. Worst-case drift was 5.65px on a 3px lattice, past `life.js`'s own stated bar. Now 2.49px, and the probe has an `ok` gate so the bar can fail.

### [P2] The panel disabled and occluded all navigation — FIXED
Digits stay live (the rule is an argument about scrolling; a digit is not a scroll) and the nav translates clear of the panel.

### [P2] `Cmd/Ctrl+1–4` navigated the site — FIXED
Modified keys return early.

### [P3] Projects carries 792 grains against home's 4,247 — OPEN
Only `.mt` headings are matter and that page has one. Not fixable inside the renderer; it is a content-structure question.
**Suggested command:** `/impeccable shape`

### [P3] The boot terminal spends ~2s of a stated 5s patience budget — OPEN
Followed by ~0.3s where the field carries only nav, HUD and hourglass. The first cyan a visitor sees is a shell prompt, not a grain.
**Suggested command:** `/impeccable quieter`

## Persona Red Flags

**Accessibility-dependent keyboard / screen-reader user.** Back exits the site. Arrows navigate globally with no `ev.target` check, so tabbing to `resume.pdf` and pressing ArrowDown changes page while focus stays on a link inside a now-hidden section — focus is never moved into the new page. No skip link. The interaction model is undocumented. **Credit where due:** `.mt` is real DOM text at `opacity: 0` so headings read normally; `#pg-live` announces page changes because the visible HUD is `aria-hidden`; reduced-motion gets the whole calm document; the email was deliberately demoted from matter to DOM text because matter's `opacity: 0` composited away its own focus ring. All eighteen touch targets now clear 44px.

**Primary audience — designer/developer from a shared link, laptop, twelve tabs.** Half the patience budget goes before the argument starts. Replay attempts are silently swallowed while `tr` is live and again for `navLock`. They will click TWEAK, and the second preset pill is `Amber` — one click from replacing the single-hue identity the site just spent five seconds establishing. `Cmd+1` no longer moves the page.

**Recruiter/sourcer (explicitly not optimised for).** Role, email and resume are one click from home and contact, two from exp and proj. The year figures — the first thing this reader looks for — were the least legible marks on the site and are now 49–57% lit.

## Minor Observations

- Contact is centred; the other three share the 8vw left rail. No named rule covers the axis change.
- The 180×260 home hourglass at 16% cyan still reads flatter than the 28×40 corner mark at 28%; its two 1px caps read as unrelated rules.
- `NOW` cores at 2.27%, fractionally over the watch line — it is the smallest ink box on the site, so one specular highlight is a large share of it. Recorded, not chased.
- The boot window's shadow is one 8-bit step over a ~200px falloff and will band on a dark panel.
- Below 820px the tagline orphans a middot at the head of line 2.
- `str` gates *which* grains reach and how far, under one label.
- `tools/bench.mjs` clamps the window to a 500px width floor, so DESIGN.md's "verified from 320px up" claims are not reproducible with the shipped harness. Now recorded there.

## Questions to Consider

1. The resting page is measurably less matter than the transition. Is "settling into flesh" the right end state, or should a settled word keep more of what the caret just gave it?
2. Three of four pages have a heading already stated by the nav, the HUD and the URL. What is a matter heading *for* on those pages?
3. The panel is the strongest evidence on the site that a real system is running, and it is the one surface that breaks navigation. What if it were page 05 / 05?
4. The first 2.05s are a costume terminal in front of a system that genuinely is a machine, rebuilt nightly from an API. Does the fake boot make the real machinery believable, or spend the credibility it would have earned on its own?
