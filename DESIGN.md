---
name: Shubham Jakhmola — Matter
description: One cyan signal on instrument black, where every large heading is drawn from a conserved particle buffer and nothing else is ever colored.
colors:
  instrument-black: "#0a0c0e"
  cold-start: "#07090b"
  panel-slate: "#0a0d10"
  phosphor: "#e8edef"
  signal-cyan: "#67e8f9"
  # Every ink below is an alpha of Phosphor, derived in the stylesheet with
  # color-mix from one knob each. The resolved default is the normative value.
  ink-85: "rgba(232, 237, 239, 0.85)"
  ink-65: "rgba(232, 237, 239, 0.65)"
  ink-62: "rgba(232, 237, 239, 0.62)"
  ink-55: "rgba(232, 237, 239, 0.55)"
  ink-40: "rgba(232, 237, 239, 0.4)"
  hairline: "rgba(232, 237, 239, 0.14)"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(52px, 7.9vw, 120px)"
    fontWeight: 700
    fontStretch: "expanded"
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  statement:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(38px, 6vw, 84px)"
    fontWeight: 700
    fontStretch: "expanded"
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(34px, 4.4vw, 54px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  figure:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "42px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  marker:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "clamp(64px, 8vw, 120px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  address:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "clamp(18px, 3vw, 28px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "clamp(22px, 2.2vw, 27px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  tagline:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "clamp(13px, 1.45vw, 18px)"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.14em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  # The remaining steps in use. Named roles above carry family and weight;
  # these are size-only rungs of the same ramp. The ramp is closed: every
  # font-size in the stylesheet resolves to one of these values.
  scale:
    display-narrow: "clamp(26px, 8.6vw, 120px)"
    subtitle: "16.5px"
    tagline-narrow: "16px"
    brand: "14px"
    body-sm: "13px"
    meta: "12px"
    hud: "11.5px"
    caption: "11px"
    micro: "10px"
rounded:
  none: "0"
  window: "10px"
  pill: "20px"
  full: "50%"
spacing:
  chrome: "3.2vw"
  gutter: "8vw"
  stack: "4.5vh"
  block: "2.6vh"
components:
  tag:
    textColor: "{colors.ink-55}"
    rounded: "{rounded.pill}"
    padding: "2px 9px"
  tag-current:
    textColor: "{colors.signal-cyan}"
    rounded: "{rounded.pill}"
    padding: "2px 9px"
  nav-link:
    textColor: "{colors.phosphor}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 10px"
  nav-link-active:
    textColor: "{colors.signal-cyan}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 10px"
  project-row:
    textColor: "{colors.phosphor}"
    rounded: "{rounded.none}"
    padding: "0 6px 14px"
  hud:
    textColor: "{colors.ink-55}"
    typography: "{typography.label}"
    padding: "15px 3.2vw"
  sigil:
    backgroundColor: "{colors.signal-cyan}"
    rounded: "{rounded.none}"
    width: "28px"
    height: "40px"
  boot-window:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.phosphor}"
    rounded: "{rounded.window}"
    width: "min(480px, 90vw)"
  tweak-panel:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.phosphor}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    width: "min(340px, 100vw)"
  tweak-tab:
    textColor: "{colors.ink-55}"
    rounded: "{rounded.none}"
    padding: "14px 7px"
  tape-rail:
    backgroundColor: "{colors.hairline}"
    rounded: "{rounded.none}"
    height: "1px"
  tape-tick:
    textColor: "{colors.ink-55}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "13px 10px 0 0"
  tape-tick-current:
    textColor: "{colors.signal-cyan}"
    rounded: "{rounded.none}"
    padding: "13px 10px 0 0"
---

# Design System: Shubham Jakhmola — Matter

## Overview

**Creative North Star: "Deliberate Machinery"**

A system that conserves its own material and moves it with intent. Not decoration, not chaos. Cold, precise, slightly alive. The governing illusion is that the same matter has been on screen the whole time — and every visual decision either supports that illusion or is cut.

The illusion is now told as destruction rather than as transport. Matter does not fly from one page's letterforms into the next: the caret sweeps a page and everything it passes over **burns out as a code character**, and it sweeps the next page **typing each slot back into existence** — a character that licks through a few glyphs and settles into flesh. The conservation claim is unchanged and still literally true, because the grain that manifests into a slot is the same buffer entry that vacated it. What changed is which of the two truths the visitor is shown: a machine writing, rather than a courier carrying.

The surface is almost entirely absent. One near-black field, one cyan, and type. There are no images, no illustrations, no gradients on content, no decorative shapes; the only things that move are the particles, the caret that drives them, and copy fading in behind it. This is not minimalism as a style choice — image and video generation are unavailable to this project, so everything must be computed in the browser or authored by hand. The restraint is a production fact that became the identity.

The register is instrumentation rather than editorial. Monospace carries everything the machine says about itself: the clock, the page counter, the year markers, the repo names, the boot log. The proportional face is reserved for the two things a person says: the name and the headings. When the system speaks as a machine it is mono; when it speaks as Shubham it is Archivo. Nothing else is added.

**Key Characteristics:**

- Exactly one chromatic value in the entire system
- Square by default; the boot window is the only rounded surface
- No shadows on content — depth comes from a radial vignette and from the matter's own lit surface
- Type is either large enough to be built from matter (≥26px) or small enough to be DOM text; nothing sits in between
- Every page fills the viewport exactly once and never scrolls
- Every value in this document is a control a visitor can move — see The Tweak Layer. What is written here is the **default** state of the system, and defaults are the part that was measured

## Colors

A single cold cyan against a near-black instrument field, with every other value an alpha of the same off-white ink.

### Primary

- **Signal Cyan** (#67e8f9): The only hue in the system, and the color every particle is drawn in. Used for the caret, the current nav item, the year markers, the current-epoch tags, the contact email, and the second line of the contact headline. Its scarcity is what makes the matter read as a single substance.

### Neutral

- **Instrument Black** (#0a0c0e): The page field. Never lightened for "sections"; there are no sections, only pages.
- **Cold Start** (#07090b): One step darker than the page, used only for the boot backdrop, so the boot terminal reads as being *in front of* the site rather than part of it.
- **Panel Slate** (#0a0d10): The boot window's own surface — the only raised material in the system.
- **Phosphor** (#e8edef): Primary text and the base of every neutral below it.
- **Ink 85%** (rgba(232, 237, 239, 0.85)): The boot log, and only the boot log — the machine's own voice, a step under Phosphor because it is a transcript, not the page.
- **Ink 65%** (rgba(232, 237, 239, 0.65)): The inline link rows.
- **Ink 62%** (rgba(232, 237, 239, 0.62), `--dim`): Body copy, project descriptions, and the contact footer. 6.69:1.
- **Ink 55%** (rgba(232, 237, 239, 0.55)): The quietest *text* in the system — source links, tag labels, the HUD strip, the boot title and hint. 5.46:1.
- **Ink 40%** (rgba(232, 237, 239, 0.4), `--dimmer`): Non-text only. 3.39:1 is under AA, so it carries the middle boot dot and the empty-state index and never a word someone has to read.
- **Hairline** (`--line-strong` 18% / `--line` 14% / `--line-soft` 10%): Rules, borders, and the boot window's edge — brightest on the chip outlines, faintest on the project dividers. Never darker; separation is by contrast, never by a drawn box. Three alphas down from four: the 15% epoch rule now sits on `--line`, because a fourth step that differed by one percent was a token nobody could see.

**Every neutral is a `color-mix` of `--ink`.** The six alphas above are percentages the panel writes, and the colors themselves are derived — so moving the ink moves the whole set with it, and no neutral can drift out of relation to the field it sits on. This is The Alpha, Not Grey, Rule enforced by construction rather than by discipline. The three hairlines are one knob: `--line-a`, times 1.3 and 0.72.

**The AA Floor Rule.** Ink 55% is the darkest a *word* is ever set in. Anything quieter is furniture — a dot, a rule, an index. The three elements that broke this (the contact footer at 3.39:1, the boot title at 3.99:1, the boot hint at 2.86:1) each read as "deliberately quiet" and were each simply unreadable; quiet is a job for size and placement, not for alpha below the threshold.

### Named Rules

**The One Hue Rule.** The system has exactly one chromatic value. Every other color is a neutral or an alpha of the ink. A second hue breaks the claim that all matter on screen is the same matter. The rule has no exceptions, including borrowed chrome: the boot window quotes an OS titlebar, but its three dots are ink alphas (`--dim`, `--dimmer`, `--line`), not red/amber/green. They are window furniture, not status lights, and they are the first thing a visitor sees — a saturated trio there would spend the single-cyan reveal before the site has drawn a single grain.

**The Specular Ceiling Rule.** This is what replaced The Additive Ceiling Rule. Signal Cyan is `rgb(0.404, 0.910, 0.976)`, so red is the channel with room to climb: push a grain's luminance past roughly 2.4 and red reaches green, and the pixel stops being cyan. The One Hue Rule breaks in the rendered output while every value in the stylesheet still complies.

What changed is where that pressure comes from. Under `blendFunc(SRC_ALPHA, ONE)` it came from **stacking**, and density was the lever that had to be held. The blend is now `SRC_ALPHA, ONE_MINUS_SRC_ALPHA`: a grain occludes the grains behind it instead of adding to them, so no amount of crowding can core the field out. The only thing that can now is a **specular highlight** on a single grain — ambient plus diffuse plus specular plus rim, on one sprite, exceeding the ceiling on its own.

That is a different rule with a different remedy. Density is no longer the lever; `spec`, `shin`, `rim` and `bright` are. And unlike stacking, a small amount of it is correct: a lit solid with no blown highlight anywhere does not read as lit.

Last measured at 1440×900 (`node tools/coverage.mjs`), share of each heading's ink box that has gone achromatic: `SHUBHAM` 0.70%, `JAKHMOLA` 0.80%, the Epoch years 0.50–0.69%, the Epoch titles 0.52–0.56%, Projects 0.39%, the contact statement 0.30–0.48%. Nothing here is a violation; the figure to watch is whether any heading crosses ~2%, which would mean the key light, not the density, has been pushed too far.

The year figures rose from 0.18–0.45% to 0.50–0.69% when they moved to Marker scale, and that is the expected direction rather than a drift: a larger mark on a coarser lattice wears larger sprites, and a lit solid with no blown highlight anywhere does not read as lit. `NOW` used to be the highest on the site at 1.20% because it was the smallest box and one highlight was a large share of it; at Marker scale it is 0.60%, so growing the mark bought headroom rather than spending it.

Note that **coverage is not the same lever as brightness**, and note also that the coverage numbers themselves changed meaning when the blend did. Under additive blending "lit" measured accumulated glow, and the name's 21% was a smear at 30%. Under solid alpha it measures **painted area** — so the name's 48% today is not comparable to that 21%, and is not a regression. See The Name Reads First Rule for what the number has to clear now.

**The Name Reads First Rule.** The name is the one heading a visitor must be able to read, and it is held to that by measurement, not intent. It rests at a larger grain than anything else (`heroS`, against every other heading's `restS`), and the sampler never thins it when the budget gets tight. The bar is **lit coverage inside its own ink box**, which must stay above the site's own body copy on the same page.

The measurement is taken over the **ink box** — the extent of the sampled point cloud — not the layout box, because a `nowrap; fit-content` span runs well past its last stroke and coverage over that dead space measures the gap rather than the word.

**It takes two numbers, and getting that wrong nearly cost the material its light.** `lit` is the share of the box carrying signal. `p95` is the 95th-percentile luminance inside it — how bright the mark actually gets. A first pass compared *mean* luminance over lit pixels and concluded matter was systematically dimmer than the DOM text beside it (matter 103–147, DOM 178–199), which read as a serious defect. It is an artifact of the metric: a solid DOM glyph is at full ink over nearly every lit pixel, so its mean sits near its peak, while a field of discrete anti-aliased sprites spends most of its lit pixels on soft edges. Comparing means says matter is dimmer when what it really is, is **sparser**. Chasing that phantom by raising `amb`, `bright` and `rim` bought 20 points of mean and pushed the name's achromatic core from 0.7% to 2.9% — past The Specular Ceiling — for nothing.

Measured at 1440×900 with `node tools/coverage.mjs`, every matter heading against the **loudest** DOM text on its page:

| view | heading | grains | lit | p95 | loudest DOM text | lit | p95 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| home | `SHUBHAM` | 2,127 | 49.9% | 245 | pitch block, 15px | 18.1% | 153 |
| home | `JAKHMOLA` | 2,148 | 45.8% | 244 | pitch block, 15px | 18.1% | 153 |
| exp:0 | `2019` | 890 | 36.8% | 244 | epoch body block | 12.6% | 154 |
| exp:0 | Engineering foundations | 5,229 | 37.0% | 242 | epoch body block | 12.6% | 154 |
| exp:1 | `2021` | 888 | 35.9% | 243 | epoch body block | 13.8% | 154 |
| exp:1 | Deep learning research | 4,720 | 35.7% | 243 | epoch body block | 13.8% | 154 |
| exp:2 | `2023` | 913 | 37.3% | 244 | epoch body block | 12.2% | 154 |
| exp:2 | Applied ML systems | 4,176 | 36.4% | 243 | epoch body block | 12.2% | 154 |
| exp:3 | `NOW` | 857 | 46.8% | 244 | epoch body block | 13.7% | 154 |
| exp:3 | LLM agents & retrieval | 4,540 | 35.4% | 243 | epoch body block | 13.7% | 154 |
| proj | Projects | 794 | 29.9% | 242 | repo names, 27px | 3.1–5.6% | 239 |
| contact | Let's build | 2,019 | 41.1% | 243 | email, 28px | 26.1% | 249 |
| contact | something real. | 3,179 | 37.2% | 242 | email, 28px | 26.1% | 249 |

Matter reaches the same luminance as the type beside it (242–245 against 153–249) and carries two to nine times the ink. The bar is cleared on both counts, and the comparison is now against the loudest element rather than the quietest — the earlier version compared a 54px heading to a 12px label, which is a bar a heading cannot lose against. `tools/probes/align.js` emits the three largest copy blocks per view so the rule is capable of failing.

**The probe names its subjects from the field, not from a list, and that is a rule now.** `align.js` iterated a hard-coded `['home','exp','proj','contact']` and read `M.tg['exp']`. The day the Experience page became a tape that key stopped existing — four `exp:N` views replaced it — and the tool reported zero headings for the page that had just been rewritten, silently. It reads `Object.keys(M.tg)` instead. A check that enumerates its own subjects goes quiet exactly when the thing it checks changes shape.

**The old open finding is half closed.** Experience used to carry 2,140 grains against home's 4,250 and was, with Projects, where the system's own claim was least visible. On the tape it carries **5,000–6,100 in a single Epoch** and is now the densest view on the site. Projects still carries 794 against home's 4,275: only `.mt` headings are matter and that page has exactly one. Not a regression, and not fixable inside the renderer.

**Coverage alone was never the bar, and reading it as one is how the name got smeared once already.** Held to coverage only, the answer is always to grow the sprite until the letterform fills in — and at that point the strokes close into cotton wool that measures higher and reads as nothing. The bar is coverage *and* The Grain Ratio Rule, together, checked on the rendered page.

**The Monochrome Matter Rule.** Every particle is drawn with the same uniform color. An `.accent` class on Matter Text has no effect in the matter reading — it only colors the calm reading. Never design a variant whose idea depends on two colors of matter.

**The Alpha, Not Grey, Rule.** Secondary text is the ink color at reduced alpha, never a separately chosen grey. This keeps every neutral related to the field it sits on.

## Typography

**Display Font:** Archivo (with system-ui, sans-serif)
**Body Font:** Archivo (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, Menlo, monospace)

**Character:** A grotesk cut for signage and small print, paired with a monospace that does the machine's talking. The pairing is a person and an instrument in conversation; the tension between them is the whole voice.

**Axes:** Archivo is loaded as a variable font over `wdth 100..125, wght 500..700` — the two widths and two weights the system uses, and nothing else. Width is a deliberate lever, not a decorative one: see The Two Widths Rule.

**The panel's width slider is clamped to the loaded axis, and that is a rule, not a limitation.** It used to run 62–150% against a font fetched over `100..125`, so both ends of its travel were the browser synthesising an instance that was never downloaded — a control that appeared to work and was inventing glyphs. Widening the slider means widening the font request in the same change. The `Loud` preset, which asked for 138%, now asks for 125%.

### Hierarchy

Everything at or above 26px is built from matter; everything below it is DOM text. The matter set is **Display, Statement, Headline and Marker** — four roles. Tagline, Address and Title were demoted to DOM text (see each), which fixed a real defect in each case and freed roughly half the particle budget for the name. The 26px Floor now has no exceptions in either direction.

**Figure left the matter set when the Experience page became a tape.** The year it carried is now Marker on the tape and Figure only in the calm reading, so Figure is the one rung on the ramp that no longer draws a grain anywhere. It stays because the calm document still sets four year markers in it.

- **Display** (700, expanded, clamp(52px, 7.9vw, 120px), 1.02): The name, and only the name. Two lines, tight tracking, widest width in the system. The cap is 120px rather than a rounder 140px because expanded glyphs run ~27% wider — see The Sigil Budget Rule. Below 820px it becomes **Display-narrow** (700, *normal* width, clamp(26px, 8.6vw, 120px)) — the ramp's only responsive width change, argued at The Two Widths Rule. The 26px floor binds below a 302px viewport and exists so the clamp has one; every real phone reads off the `8.6vw` middle.
- **Statement** (clamp(38px, 6vw, 84px), 1.05, -0.03em): Two things. The contact headline, at 700 and **expanded** — the largest type on the site after the name, and the only place two lines carry different colors in the calm reading. And the Epoch title on the tape, at 700 and **normal width**, where one Epoch owns the viewport and its title is the second mark the caret writes. The size rung is shared; the width axis is not, so The Two Widths Rule is untouched — see it for why the tape does not get the wide cut.
- **Headline** (700, clamp(34px, 4.4vw, 54px), 1.1): **Repo names on the Projects index**, at normal width. No page heading is built from matter any more: "Experience" and "Projects" are both calm-reading furniture, because on the tape and on the index the page is named by the nav and the HUD, and each was ~800–1,000 grains spent restating what two other elements already said. Headline is the smallest rung that clears The 26px Floor at every width the matter reading runs at — 34px at its own minimum — which is why the repo names could come up to it when they could not stay at Title. Not expanded: The Two Widths Rule reserves that for the two things a person says outright, and a repo name is neither. See The Plate Fits By Measurement Rule.
- **Marker** (mono, 700, clamp(64px, 8vw, 120px), 1): The Epoch year on the tape, and the largest mono in the system. Always Signal Cyan. Floored at 64px rather than at the 26px matter floor because a Marker any smaller is Figure again, and capped at 120px so it never outgrows the name. It exists because on the tape the year is not a label beside a column — it is the mark that says where the read head is, and at 42px it could not carry that. The move from a 2px to a 3px lattice is what fixed the year figures being the least legible marks on the site: p95 went 227–235 → 243–244 and `2023` stopped being ambiguous.
- **Figure** (mono, 700, 42px, 1): Epoch year markers, **calm reading only**. Always Signal Cyan.
- **Address** (mono, 700, clamp(18px, 3vw, 28px)): The contact email. **DOM text, not matter.** It computed below the 26px floor at every width from 821 to 866px, and as Matter Text it inherited `opacity: 0`, which composited away its own focus ring — the site's primary call to action was a focusable element that a keyboard user could neither read nor see focused. It is Signal Cyan at 13.52:1 and clickable at every width.
- **Title** (mono, 700, clamp(22px, 2.2vw, 27px)): **The fallback rung for a repo name too long to be Matter Text**, and nothing else. DOM text. Repo names were set in it outright, and there it did not resolve: it computes below 26px at every width from 821 to 1181px — 22px at 1024px — and five of them measured 1.03:1 against the field while spending roughly a third of the grain budget. The fix was not a bigger mono, which would have made repo names the largest mono on the site; it was Archivo at Headline, which clears the floor everywhere and carries a 35-character name inside the track mono at 27px could not. This rung survives because the build still needs somewhere to put a name past 45 characters — see The Plate Fits By Measurement Rule.
- **Tagline** (mono, 500, clamp(13px, 1.45vw, 18px), 0.14em): The role line under the name. **DOM text, not matter.** At its former fixed 26px it was both the widest element in the home column at every width under ~1500px and 53px wider than the viewport below 878px, where `overflow: hidden` silently cut the end of the line. Scaling it fixes both, and puts it below the floor. It steps to 16px below 820px.
- **Subtitle** (700, 16.5px): Epoch titles. The first rung below the floor.
- **Body** (500, 15px, 1.7): Pitch and about copy. **Body-sm** (13px, 1.55–1.6) carries project descriptions, epoch bodies, and inline link rows.
- **Brand** (700, 14px, 0.07em, uppercase): The wordmark only.
- **Label** (mono, 400, 12.5px): Navigation and the boot log. **Meta** (12px) covers page-head notes, project indices, and source links; **HUD** (11.5px, uppercase) the bottom strip; **Caption** (11px) the footer, boot title, and boot hint; **Micro** (10px) tag text.

### Named Rules

**The Closed Ramp Rule.** The ramp above is the complete set of sizes in the system — 22 steps, every one of them in use. A new size is a system change, not a local decision: add it to `typography.scale` in this file's frontmatter or reuse an existing rung. The design hook enforces this, so an undocumented literal will be flagged on the next edit.

**The Contour Rule.** Every heading keeps its whole contour and thins only the interior — to 69%. A silhouette is what makes a letterform legible; the fill is only weight, and weight is the cheap thing to buy back with grain size. When a page outgrows the budget it is the interior that is cut, never the outline, and never the name at all.

**The lattice is per heading, derived from its own size:** `clamp(round(fontSize / gridk), 2, 8)`, at `gridk` 36. So the name at 114px samples on a 3px grid and a 54px heading on a 2px one, and both land at a comparable number of grains across their own strokes — measured at 5.3 for Archivo at either size, and 2.5–3.5 for JetBrains Mono, which is lower because its strokes really are thinner. The grid answers to ink, not to point size.

This replaced one uniform 2px grid for the whole page, which was itself a fix for `fontSize / 14`. The uniform grid was right about the failure it was fixing — size is not what decides how many grains a letterform *needs* — and wrong to conclude that size therefore should not enter at all. What a stroke needs is a fixed number of grains across its width; the font size is how you find that, not what you spend.

Floored at 2 because below that the sprite falls under a device pixel at any grain size that keeps The Grain Ratio Rule, and the row renders as a smudge rather than as grains.

Per-page grain counts at 1440×900 and the default 9,000 budget: home ~4,250, contact ~5,150, experience ~5,100–6,150 per Epoch view, projects ~7,150 — the last of these at the 80% cap, so the index is the one page the sampler actually thins. **Approximate on purpose** — interior thinning is a coin flip per cell, so the figures move by a few dozen between runs and quoting them to the unit implies a determinism the sampler does not have. An earlier draft of this file quoted two different exact pairs for the same measurement, which is what that costs.

Nothing is held back any more. A flat 380 grains used to be reserved for the idle hourglass on top of the 80% cap; nothing idles anywhere now, and grains a page has no room for simply stay gone. At the default budget the cap bound and the reserve was inert, which is how it survived the rewrite — but below a 1,900 budget it took over, and the slider goes to 1,200.

**The Grain Ratio Rule.** A grain sprite must stay near its sample spacing. Push it much past ~2× and neighbouring sprites merge before the eye resolves either, so the letterform reads as a brush stroke rather than as matter, and the extra coverage is spent on a halo outside the stroke.

The ratio is now maintained by construction rather than by discipline: a slot carries the lattice it was cut on, and a grain landing there takes its sprite size from that lattice. So a heading sampled at 2px and one sampled at 3px wear proportionally sized grains automatically, and the three knobs — `grain`, `heroS`, `restS` — scale that relationship rather than setting it. Before this, the name on a 3px grid wore sprites sized for a 2px one and rendered as a skeleton.

Measured on the name: a 3px lattice, `baseS` 2.55–3.75, `heroS` 1.05, `grain` 1.75 and near-gain ~1.14 give a sprite of roughly **6.6px on a 3px grid — 2.2×**, right at the documented edge. It reads as discrete matter rather than as a stroke, and the reason it survives the edge is that the lit forms do not fill their own sprite: the `surface` form falls off from 0.55 of the radius, and the `chip` is a bowtie inside a square. A hard disc at 2.2× would merge. Change any of the three and re-measure the rendered page; do not re-derive it.

**One ratio for every heading, and hierarchy from type size.** `restS` was 0.75 against the name's `heroS` 1.05, which put every non-hero heading at 1.55× its own lattice while the name sat at 2.2×. That is the ratio rule applied unevenly, and it showed: Experience and Projects measured ~20% lit and rendered as a scatter of dust rather than as letterforms, and the year figures were the least legible marks on the site — `2023` was genuinely ambiguous. `restS` is 1.0, which puts them at 2.0× and closes their strokes: Experience 20.6% → 30.3% lit, Projects 20.1% → 29.5%, the year figures 28–35% → 39–51%, with achromatic coring still under 0.5%. The name still dominates by being 114px against 54px, which is what should be carrying that job.

**The rule governs motion as well as size, and in the same units.** How far a grain may travel from its home is bounded by the same spacing that bounds how large it may draw: past it, the grain has left its own place in the letterform. So `wob` and `flow` are multiples of the grain's own sample spacing, not pixel counts — `flow` was 4px, which is a third of a stroke on the name's 3px lattice and most of a stroke on a 42px figure's 2px one, and no single pixel value can be right for both. Measured over twelve seconds by `tools/probes/life.js`: worst-case drift **2.49px on a 3px lattice** with nobody pointing at the page, against 5.65px before. A hand may pull a grain half again as far, because that displacement *is* the effect and the visitor is causing it deliberately; the probe checks both bars separately and fails on either.

**The Plate Fits By Measurement Rule.** The Projects index is five repo names built from matter, and that reverses an earlier measurement — so it holds by a newer one, not by preference. Four things were measured on the rendered page, at 821, 900, 1024, 1280, 1440, 1920 and 2560px:

- **Advance.** Archivo 700 at normal width runs at most **0.522em per character** over the alphabet repo names use. The stylesheet sizes each name with `min(Headline, track / (chars × 0.522))`, where the build writes the character count onto the row. It is a worst case on purpose: a mostly-lowercase name measures nearer 0.45em and renders smaller than it had to, which costs a few percent of size and can never overflow. Overflow is the failure that matters — `.mt` is nowrap at `fit-content`, so a name past its track is sampled past the edge of the page and then drawn off it, silently, behind `overflow: hidden`.
- **Track.** The name is offered the page column less the row's own chrome: **84px** (12px padding, the 52px index column, the 20px gap), and 72px where the index column narrows. Measured at 617px of track at 821, 776 at 1024, 1096 at 1440 and above.
- **Floor.** The binding width is 821px, the narrowest the matter reading runs at, where Headline computes to 36.1px. The longest name in the account — `behavioral-biometric-identification`, 35 characters — takes 522px of 606px there and sizes down to 33.1px. At the 26px floor the track admits **45 characters**, which is where `MATTER_NAME_MAX` sits; past it the build hands the name back to DOM text at Title. Nothing is demoted today, but the featured set is chosen nightly by a job with nobody watching.
- **Coverage.** At the default budget the index asks for more than the 80% cap and is thinned to it. It still clears The Name Reads First Rule with room: the five names measure **28–41% lit** with p95 237–239, against the loudest DOM text on that page at 0.42–3.88%. That puts them in the Epoch-title band and below the name, which is the hierarchy the page wants.

`tools/probes/plate-fit.js` is the check: one line per name, no track overflow, nothing under the floor, no horizontal document overflow, and a card that leaves an outside to click.

**The Schematic Costs No Grain Rule.** A project's Schematic is drawn as *drafting* — hairline dashed edges, solid slab nodes, mono labels — as inline SVG generated at build time, never as Matter Text. Three consequences, and all three are the reason: the home page's claim that every glyph on screen is conserved matter stays literally true; a raised card costs nothing against the grain budget the index is already at the cap of; and the calm reading gets a real diagram with no JavaScript. The drawing is laid out along the axis its author drew it along — a chain runs top to bottom, anything else is layered left to right — because a seven-node chain laid out across came to 864px, and scaled into a card that puts a 10px mono label at 8px, under the ramp's smallest step.

**The 26px Floor.** Type below roughly 26px cannot be built from matter: the lattice floors at 2px, and a stroke that thin leaves no room under it. Anything smaller must be DOM text. This is a hard constraint of the renderer, not a preference — and CSS specificity is the usual way it gets violated, since any rule that shrinks a Matter Text element below the floor silently dissolves it.

**The Two Faces Rule.** Archivo speaks as Shubham; JetBrains Mono speaks as the machine. A third face is never added, and neither face crosses into the other's role.

**The Two Widths Rule.** Archivo runs at its normal width everywhere except the two things a person says outright — the name and the contact statement — which run at `font-stretch: expanded` (the `wdth 125` end of the axis). Wide is reserved for those two; a third expanded element dilutes the signal. Because width inherits, it is set once on `.name` and `.ct` and reaches the `.mt` spans the sampler measures. The sampler must set it separately as a keyword: the canvas `font` shorthand silently drops stretch, and the computed `125%` is rejected by `ctx.fontStretch`, so a width set only in the shorthand would render normal-width particles under expanded DOM text.

The rule has exactly one exception, and it is a phone. `SHUBHAM` and `JAKHMOLA` are single tokens, so no wrapping strategy can rescue them — below 820px the expanded name did not fit any viewport, and `overflow-wrap: anywhere` only converted the overflow into `SHUB / HAM / JAKH / MOLA`. The ~27% the width axis costs *is* the entire deficit, so below 820px the name drops to normal width at `clamp(26px, 8.6vw, 120px)`. Verified: one line per span, zero horizontal overflow, at every width from 320px up. Given a real choice between the width axis and a readable name, the name wins — that is The Name Reads First Rule applied to the one axis that can pay for it.

**The Sigil Budget Rule.** On the home page the name and the sigil share one flex row that is allowed to wrap, and a wrap breaks the one-viewport rule — the sigil drops to its own line and the composition collapses. The budget is `min(1180, 84vw) − 180 − min(5vw, 96)`, and the row fits only while

    max(tagline width, name width) ≤ that budget

**The binding element is whichever of those two is wider, and it is not always the name.** The rule previously measured only the name and was wrong in both directions because of it: the row wrapped at every width from 821px to 1279px, and again at every width from 2820px up. Two causes, both now fixed and both worth keeping in mind:

- **Below ~1500px the tagline binds.** At a fixed `26px` with `0.14em` tracking and `white-space: nowrap` it measured **808px at every viewport width** — it never responded to anything, so it, not the name, set the column width. It is now `clamp(13px, 1.45vw, 18px)`, which also puts it below the matter floor; see Tagline.
- **Above ~2800px the gap binds.** `.page-in` stops growing at 1180px while a bare `5vw` gap keeps going, so past 2820px the gap ate the name's budget. The gap is now `min(5vw, 96px)`, which stops growing at the same point the container does.

An expanded Display line measures roughly `7.16 × font-size` (verified: 120px renders 859.3px). Display is `clamp(52px, 7.9vw, 120px)` rather than `8vw` so the inequality also holds at 821px, the tightest point.

Any change to the display size, the tagline size, the sigil's `180px`, the gap cap, or the `1180px` container cap must be re-measured — not re-derived — at **821, 1024, 1279, 1920 and 3440px**. The previous version of this rule named its binding viewports confidently and its own arithmetic predicted the 1024px failure, which shipped anyway. Measure the rendered page.

Last measured across 320 / 360 / 390 / 480 / 680 / 820 / 821 / 900 / 1024 / 1152 / 1200 / 1279 / 1440 / 1920 / 2560 / 2820 / 3440: the row holds at every width from 820px up, each name span occupies exactly one line, and `documentElement.scrollWidth` never exceeds the viewport. Below 820px the row wraps by design — that is the calm stacked reading, not the failure this rule guards.

**Two caveats on how any of that is re-measured.** `tools/bench.mjs` clamps the browser window to a **500px minimum width**, so `--size 320x800` silently yields a 500px viewport: nothing under 500px is reproducible with the shipped harness, and the sub-500 figures above came from a device-emulation pass that is not in the repo. It also loses 87px of height to absent browser chrome, so every figure labelled 1440×900 in this document is a 1440×813 viewport. Neither affects a rule that binds on width above 500px; both matter to anyone re-running the numbers.

**The Nowrap Rule.** Matter Text is measured as a single line. Every `.mt` element is `white-space: nowrap; width: fit-content` in the matter reading, because the sampler rasterizes one line of text at the element's computed font. A heading that wraps will sample wrong.

## Layout

Each page is exactly one viewport: `position: fixed; inset: 0`, vertically centred content, `8vw` side gutters (`6vw` under 820px), and page chrome pinned at `3.2vw` inline padding. Only one page is visible at a time; the others stay laid out at `visibility: hidden` so the sampler can measure them, which is why pages are never toggled with `display: none`.

Content stacks in a single column with a `4.5vh` rhythm between major blocks and `2.6vh` within them. The Projects page is a `52px 1fr` row grid: index, body, source link.

**The Experience page is a tape, and it is the only page with a state.** One Epoch owns the viewport — Marker year, Statement title, an inline facts register, body copy at a 62ch measure, tags — over a track pinned above the HUD. The other Epochs are `position: absolute; inset: 0` at the same box and `visibility: hidden`, never `display: none`, for exactly the reason pages are: the sampler has to keep measuring them. All four therefore occupy one box, so changing Epoch changes which point cloud is manifested and never the layout the clouds were cut from.

The four-equal-column grid it replaced (`repeat(auto-fit, minmax(210px, 1fr))`) survives as the calm reading, which is the reading where showing every Epoch at once is right.

Below 820px the whole model is abandoned. The calm reading takes over: static positioning, `9vh` page padding, a sticky translucent nav, hairline dividers between pages, and normal document scroll. This is not a breakpoint adjustment; it is the other site.

### Named Rules

**The No Scrollbar Rule.** Neither click nor scroll gesture ever reveals a scrollbar in the matter reading. Both advance a page instead. If content does not fit a viewport, the content is cut, not the constraint.

**The Measure-Once Rule.** Element positions are sampled on load, on resize, and on page change — never per frame. Any layout idea that would require continuous measurement is out.

## Elevation & Depth

The system is flat on content. No card has a shadow, no surface is lifted, and no element uses a background lighter than the page to suggest a plane. Depth is atmospheric on the page and literal in the matter: a fixed two-stop radial vignette darkens the frame and lifts the centre, and the letterforms are lit solids.

**A letterform is a lit slab, not a stencil.** At sample time the heading's occupancy is blurred into a height field, three box passes wide. Its **gradient** is the letterform's own surface normal at each grain; its **value** is depth into the stroke, 0 at the contour and 1 at the spine. Those two numbers are real geometry rather than decoration, and one field feeds all of it: extrusion, camera parallax, near-gain, rim light and crevice shade. Four floats a grain, and no per-frame geometry at all.

Everything the material does follows from them. Diffuse and specular are computed once per grain in the vertex stage — 1/40th the work of doing it per fragment, and the normal is constant across a 3px sprite anyway. Rim light fires only on steep normals, so a contour catches light while the spine stays matte, which is the cheapest honest signal that a form has thickness. The camera leans across the extruded depth, so spine and contour separate by parallax — the one cue a flat sticker can never produce.

Depth is scaled by the type size it came from (`shade × fontSize / 120`), because a 42px figure and a 114px name cannot be extruded by the same pixel count without the small one separating into two ghosts of itself.

**The Smallest Mark Bounds the Parallax Rule.** Extrusion and camera lean are single uniforms applied to every grain, so their budget is set by the *smallest* thing built from matter, never the largest. The depth scaling above is what buys the headroom: because the shear a grain receives is proportional to the size of the heading it belongs to, the corner mark and the year figures cannot be wobbled by a value chosen for the name.

**The Hand Has To Be Attributable Rule.** A word answers a hand near it — grains lean toward it, swell and brighten, and a share of them reach for it. That response is worth nothing unless the visitor can tell it is *theirs*, and it is competing against the word's own idle shimmer for the same channel. Two things nearly lost it. The falloff was `(1 − d/r)²`, which puts almost the whole response inside the first fifth of the radius; and the idle terms were large enough (4px of flow on a 3px lattice) that everything past ~40px sat inside the shimmer's own variance. It is linear now, and the idle floor is a third of what it was.

Measured by `tools/probes/life.js`, which isolates the aura by taking the hand away and advancing a *tenth* of a frame — the idle terms move by almost nothing in 1.6ms, and the aura is assigned rather than eased, so what is left is the aura alone at one instant:

| distance from the hand | grains | brightening |
| --- | --- | --- |
| 0–60px | 368 | +14.8% |
| 60–120px | 820 | +8.8% |
| 120–180px | 1,029 | +2.6% |
| past 167px | — | none, by construction |

The structure is what matters more than the figures: the aura is a **coherent regional** lift over hundreds of grains, while the ember is **incoherent per-grain** noise on independent phases. A signal that is smaller per grain than the noise still reads, as long as it is the only one of the two that is spatially organised.

**The Trail.** The hand writes with the word. Every `wstep` pixels of travel, one grain leaves a heading, appears under the pointer as a code character, holds the spot it was put down on, and burns home into its own slot — wearing a different character each time it goes and each time it comes back. It is the third thing the hand does to matter, after the aura and the reach, and unlike either of those it works with the hand nowhere near a heading.

Four decisions carry it, and each one is the answer to a way the first build was wrong:

- **A mark holds still.** It records where the hand *was*, not where it is, and that is the whole difference between a trail and a wake: a line is only legible as a movement if its marks stay where the movement put them. The first build of this let its state fall through the frame loop's chain into the *manifest* branch, which eases position back toward the grain's home — so every mark was dragged into the word one frame after being laid, while the census read exactly right.
- **Emission is per distance, never per frame.** Spacing is then a property of the gesture rather than of the refresh rate: a slow hand lays a dense line, a fast one a sparse one, and a hand held still lays nothing at all. It is also interpolated across each frame's segment, because a hand crosses 50px in a frame easily and putting that frame's three marks at one point is a clump rather than a line.
- **Marks are borrowed by a rotating scan, not from under the hand.** Taking the nearest eligible grain gouges whichever letter the pointer is near and leaves the hole there; rotating spreads the cost over the whole word, where at these counts it is invisible. It is also what lets the trail exist over empty field, which a proximity pick cannot do.
- **Full size at once, tapering after.** The fat end of the trail is the end the hand is at, so a still frame says which way it went. The first build ramped marks in over a fifth of their life — 160ms — which put the smallest marks at the head and read as a trail pointing backwards.

**Nothing new arrives on screen, and that is measured rather than asserted.** `tools/probes/fill.js` reports the same `drawn` count with no marks as with fourteen: a mark is a grain the word is currently missing, and what it costs is only the difference between its sprite and the settled one it replaced. Marks are handed back in bulk at the start of a transition, before the Caret schedules a slot — the Caret owns the field while it works, and a mark lying in the viewport through a page change belongs to a gesture that is over.

**Measured at 1440×900:** a hand held still costs nothing at all, because emission is per pixel of travel — 0 marks, 0.35 overdraw, which is the hand-parked figure with no trail in it. Swept, it peaks at 14 marks and 0.40, so the whole effect adds **0.05** overdraw, under a quarter of what the idle field costs.

Exactly one real shadow exists in the system, and it belongs to the boot terminal.

### Shadow Vocabulary

- **Boot lift** (`box-shadow: 0 30px 90px color-mix(in srgb, var(--cold) 60%, transparent)`): The boot window only. Its job is to push the terminal in front of the site during the ~1.2s before the site exists. Derived from Cold Start rather than from black, so it repalettes with the field instead of staying a hard-coded shadow the panel cannot reach.

### Named Rules

**The One Shadow Rule.** The boot window is the only elevated surface. Content is flat, always. Adding a shadow to a project row or an epoch card is a system violation, not a refinement.

**The Glow Is Earned Rule.** Brightness is a property of the material — a lit surface catching a key light — never a CSS glow, blur, or filter on content. It was previously earned by particle density under additive blending; under solid alpha a grain occludes rather than adds, so density now reads as **weight** and the light does the brightening. Both readings satisfy the rule; neither permits a `filter`.

## Shapes

Square by default. Content has no corner radius at all — project rows, epoch cards, and page containers are unrounded and mostly unbordered, separated by 1px hairlines rather than by drawn boxes.

Three exceptions, each earned: tech tags are full pills (20px) because they are labels rather than surfaces; the boot window is softly rounded (10px) because it is a terminal quoting an OS convention; and the boot-bar dots are circles (50%).

The one recurring silhouette is the hourglass — two triangles meeting at a slight waist. It is the site's mark and a CSS clip-path in **both** readings, never an image file, at three sizes:

| where | size |
| --- | --- |
| home page, matter reading | 180×260 |
| home page, calm reading | 120×180 |
| home page, below 820px | 84×126 |
| corner, every page | 28×40 |

The matter reading gets the largest because it has a whole viewport to itself and no copy below the fold competing for the eye.

It used to be traced by whichever grains were idle between pages, and that state no longer exists — matter burns out and re-manifests in place rather than being parked anywhere. That is the better trade twice over: the particle hourglass was the one element that ever measured brighter than the name, and the CSS mark was already authored for the calm reading.

**Its fill alpha is not scale-invariant, and it gets two knobs for that reason.** The corner mark reads as a wordmark companion at 28%; the home mark is forty times the area, and the same fill there is a slab of Signal Cyan roughly a third the size of the name — exactly what The Name Reads First Rule exists to stop. It is 16%.

### Named Rules

**The Square-By-Default Rule.** New surfaces get `0` radius. A radius must be argued for from an existing exception, not chosen for softness.

**The Hairline, Not Box, Rule.** Separate with a 1px hairline at 10–15% ink. Never enclose content in a full border.

## Components

### Navigation

- **Style:** Fixed top bar, no background and no border in the matter reading; `pointer-events: none` on the bar with `auto` restored on links, so the particle field stays interactive underneath.
- **Typography:** Mono, 12.5px, lowercase. The brand mark is 14px, 700, uppercase, with `.SYS` at 50% opacity.
- **States:** Inactive links sit at 75% opacity; the active link carries `aria-current="page"`, full opacity, Signal Cyan. The calm reading never runs that code — `matter.js` returns before it — so there the active link is marked from the URL with `:has(#pg-x:target)`. It marks on click, not on scroll; a scroll-spy would mean shipping a second script to a reading that exists because scripts may not run.
- **Hover:** Text scrambles through `!<>-_/[]{}=+*^?#$%&@01` and resolves left to right over 550ms. This is the site's only hover flourish and it belongs to links exclusively.
- **Mobile:** Becomes a sticky translucent bar with a blur and a hairline bottom border, wrapping to two rows.

**The 44px Thumb Rule.** Below 820px every link is a touch target and gets `padding-block: 14px`. Padding, not `min-height`, so the text keeps its baseline inside the row it belongs to. All eighteen links on the calm reading failed this before it was written down, none of them by more than a few pixels of padding — it is the kind of thing that is invisible on a desk and constant on a phone.

**14px of padding carries a *mono* line to 44–45px, and only a mono one.** The rule was written from the eleven links that share JetBrains Mono, where `normal` line-height resolves to ~1.32em: 12px → 16 + 28 = 44, 12.5px → 45, 13px → 45. The wordmark is the one link in the list set in the display face, and Archivo's `normal` at 14px resolves to a 15px box — so it measured **43px, one pixel under, at every width below 820px**, silently, for as long as the rule existed. It carries an explicit `line-height: calc(17 / 14)` rather than a second padding value, so the arithmetic is the same for all eighteen. Six of them sit at exactly 44px, which is on the boundary with no margin; a font-size change anywhere in that list has to be re-measured, not re-derived.

### Chips

- **Style:** Full pill (20px), transparent background, 1px border at 18% ink, mono 10px at 55% ink, `2px 9px` padding.
- **State:** The current epoch's tags switch to Signal Cyan text with a 50%-alpha cyan border. There is no filled or selected variant; these are read-only labels.

### Project Row

- **Corner Style:** None.
- **Structure:** `52px 1fr` grid — cyan mono index, then a single column holding name, description and source link, baseline-aligned. The source link used to occupy a third `auto` column pinned to the right rail, where it sat 418px from the description it belonged to at 1920px and, below 820px, dropped to a row closer to the divider than to its own content. Proximity is the only thing binding a link to its subject here; the rail bought nothing at any width.
- **Border:** Hairline bottom rule at 10% ink; the last row drops it.
- **Padding:** `0 6px 14px`.
- **Empty state:** With zero featured repos the list renders one `.project.empty` row — a dimmed `/--` index, one line saying the API came back with nothing, and the GitHub link. The build runs unattended on a nightly cron against a live API, so this is a state the site ships in.
- **Note:** The repo name is DOM text. See Title under Typography.

### The Tape

The Experience page, and the only sequence inside a page in the system.

- **Structure:** one Epoch per viewport, over a track pinned above the HUD. The track is a hairline at 10% ink with one tick per Epoch, and the current Epoch's **run** — its own tick to the next one's — filled at 18% cyan.
- **The ticks are placed by real time, not evenly.** Each sits at its own start year, normalised against a span whose right edge is the month the site was last rebuilt. So the gap between two ticks is how long that period lasted, and the open Epoch's run grows on its own between rebuilds rather than waiting for someone to edit a number. This is the one fact a timeline exists to carry and the one the four-column layout threw away: `2019 → 2021` and `2023 → NOW` rendered as the same `2.4vw` gap.
- **An Epoch change is a page change.** The point clouds are keyed by *view* rather than by page — `home`, `exp:0…3`, `proj`, `contact` — so `sampleAll` cuts one cloud per Epoch and `startTr` burns the old view's slots out and types the new view's in. There is no second code path, no second choreography, and the Epoch change costs what a page change costs: **1.73 overdraw against the page change's 1.71**.
- **Gesture:** nested. All five input paths funnel through one `nav(dir)`, which walks the view list instead of the page list — so a wheel on Experience steps to the next Epoch and, once the tape runs out, the same gesture continues to Projects. Clicking a tick jumps to it. Digits still jump pages directly, which is the unconditional way out.
- **States:** playing (before any input), driven (after), and parked on the last Epoch.
- **Below 820px it does not exist.** The calm reading shows every Epoch at once, so the track would offer a choice between things already on screen, and its four tab stops would do nothing. `display: none` rather than hiding, so they leave the tab order.
- **Rule:** the tape never scrolls, never wraps, and never changes page by itself.

**The Views, Not Pages, Rule.** The sampling unit is the view and the navigational unit is the page, and they stopped being the same thing here. The reason is the grain budget, and it is not a small margin: sampled into one shared table the four Epochs ask for **22,118 grains** — 2.46× the 9,000 budget, and above the 22,000-grain buffer ceiling. Keyed per view the worst Epoch asks for **6,116**, nothing is truncated anywhere, and the page went from the sparsest to the densest on the site. Anything that adds a sequence inside a page adds views, not a second renderer.

**The Playback Hands Over Rule.** The tape plays itself forward once, on a 6s dwell, and the first deliberate input takes it for the rest of the visit — not for the rest of the page, and not until a timer resumes. A timer that resumed would keep taking the tape back off the visitor, and then nothing on the page is attributable to them, which is the argument The Hand Has To Be Attributable Rule makes about the aura applied to time instead of to space.

Deliberate means **acted, not present**: `pointerdown`, a key, a wheel, a touch. A pointer crossing the field is someone watching, and the material answering a hand is not a request to stop the recording — so `pointermove` does not take it.

Playback is armed on *arriving* at the tape rather than once at startup, because the visitor almost always arrives by the same wheel that would otherwise have taken it before they ever saw it move. It parks on the last Epoch and stops: it does not wrap round to the first, and it does not carry on to Projects. Finite, self-terminating, and stopped by any interaction is also the shape that needs no pause control bolted onto it.

### Boot Terminal

- **Style:** A macOS-convention window — traffic-light dots, a mono title, a log body at 12.5px with 2.1 line-height — on a backdrop one step darker than the page.
- **Behavior:** Three log lines land at 120/500/880ms; the slide-out starts at 1250ms on a `cubic-bezier(.76, 0, .24, 1)` over 700ms and the node is removed at 2050ms. Any input skips it immediately. Quote the 2.05s, not the 1.25s — the earlier number is when the exit begins, and the doc read as if it were when the gate is gone.
- **Copy:** The unit count in the ledger line is interpolated from `N`, never typed. A boot screen that states a number the code contradicts is the one lie the audience can catch with devtools open.
- **Rule:** It is a gate in front of content and must never behave like one.

### Tweak Panel

- **Tab:** A hairline tab pinned to the right edge at 50% height, mono 10px uppercase with 0.18em tracking, set vertically (`writing-mode: vertical-rl`). It sits at z-index 95 — above the HUD, under the boot terminal, so it never appears before the site does. Below 820px it becomes a horizontal chip at the bottom right.
- **Panel:** `min(340px, 100vw)`, full height, Panel Slate at 96% with a 14px blur, one hairline left border, square. Eleven `<details>` groups, first open. Full-width on a phone.
- **Rows:** Label at Ink 62%, live value readout in Signal Cyan with tabular figures, control below spanning the row. `accent-color: var(--accent)` on the native range and checkbox — no custom slider is drawn.
- **Header:** `save` (cyan outline), `reset`, close. An unsaved change lights a 5px cyan dot next to the wordmark; Save clears it and flips its own label to `saved` for a beat.
- **Presets:** Eight pills — Default, Amber, Phosphor, Bone, Dense, Sparse, Loud, Quiet. A preset is a whole state, not a patch: keys it omits go back to their default, so picking two in a row gives the second rather than a mixture.
- **Rule:** It skins itself from the tokens it edits. A separate palette for the panel would mean two design systems in one file, and the second one would rot.

### Caret

The read/write head that drives every transition, drawn as the thing it actually is: a text caret. A Signal Cyan bar on a 2D canvas above the particle field, spanning the full height of the type it is working on (`h × 2`, where `h` is roughly half the line) and `h × 0.12` wide, so it scales with the heading rather than sitting at one size. It tilts into its own horizontal velocity. Solid while it consumes, travels or emits; parked, it step-blinks on a 1s cycle at 55% duty — the same blink as the `▮` in the boot log. When idle it parks 14px past the last stroke of the last heading, like a caret at the end of a line.

**On the tape it parks on the track**, at the Epoch it has just written, instead of 14px past the last stroke. This is the one place in the system where the pointer metaphor and the timeline metaphor are the same object: where the read head rests *is* the position on the recording, so a second drawn playhead would be repeating what the caret already says. It still sweeps the year and the title on the way in — only where it comes to rest has changed. The knob is `tapeHead`.

**It schedules rather than carries.** Nothing follows it across the viewport. Sweeping a heading, it hands every slot it passes over a time to burn out; sweeping the next page's heading, it hands every slot a time to be typed back in. The choreography is therefore entirely in the timeline, not in the physics, and the transition costs no per-frame work beyond one comparison per grain.

It also stops being responsible for finishing. The last few characters go on settling into flesh behind it after it has parked, which is what the tail of a sentence being typed looks like.

The bar carries no grain-flow indicator. The characters burning out or manifesting under it already say which direction the work is going, and a second signal on a 4px bar is noise.

**The mouse pointer is the system arrow.** No custom cursor canvas, no `cursor: none`. The Caret is the only drawn pointer on this site; a second one competing with it is one pointer too many.

**It does not follow the hand.** The Caret marks where the machine last wrote — the end of the last heading — and it stays there between transitions. A read/write head that chases the mouse is a cursor: a different object with a different job, and having the one impersonate the other cost the transition its anchor and read as the caret wandering off. The hand has its own two answers, below, and neither is the Caret.

### Snap

The pointer is absorbed by what it is over. On `pointerenter` of any interactive text — the `[data-scramble]` set: the nav, the brand, and every source and social link — the element fills with a block of ink from its leading edge, its label knocks out to the field colour, and the arrow stops being drawn on it. There is no cursor there any more, because the element became the cursor. Leaving reverses it and the block wipes back out.

**`cursor: none` is scoped to the snapped element and never to the page.** The system arrow is still the pointer everywhere else. What dissolves is the pointer *on the thing that has taken it*, which is the whole of the effect and none of the cost — or the accessibility loss — of a site-wide custom cursor.

The fill is a pseudo-element rather than a background, so `--snap-pad` can extend it past the label without touching layout: a nav link that gained real padding on hover would shove the three links beside it. It wipes in on `scaleX` rather than fading, because a block that fades reads as a highlight while a block that is drawn reads as the machine taking the word — the same claim the scramble on that element is already making.

It is driven from the frame loop as one interpolated custom property, not by a CSS transition on hover. Three of the four element groups in this set already own their own `transition` lists at higher specificity, so a transition declared here would either lose to them or clobber the reveal. One number written as a property beats every stylesheet rule and fights none of them.

**A snapped target is not also a quiet one.** Nav links rest at 75% opacity and that alpha applies to the whole element, fill included — so the first build produced a grey block with grey text in it. Snapped, they go to full.

### Lean

The same `[data-scramble]` set leans toward the hand: the element translates by 15% of the pointer's offset from its own centre, on a 10/s response, which settles in about a third of a second. Inside a nav link that is at most about four pixels of travel. Critically damped, with no overshoot — the elastic ease this effect is usually built with reads as jelly, and this system is cold and precise.

**It is written to `translate`, never to `transform`.** `.copy` owns `transform` for its reveal and the transition assigns `transform: none` to those elements directly, so a lean written there would be wiped mid-hover on some elements and would wipe the reveal on others. The two properties compose, and the panel already proves the pattern one level up: it translates `.topnav` clear of itself while the links inside keep their own transforms. The inline style is removed rather than left at `0px 0px` when a lean returns home, so an element nobody is touching carries nothing from this.

Refused while the panel is open, because the panel has translated the whole nav 340px clear of itself and every rect cached in here is wrong by that much. That is The Panel Owns The Gesture Rule applied to a measurement rather than to a scroll.

## The Tweak Layer

Everything above is the default state of a system a visitor can take apart. `static/tweak.js` ships a panel — a hairline tab on the right edge, `T` to toggle — with 149 controls over fourteen groups, in the order the material is understood in:

**Palette · Type · Matter · Material · Life · Reach · Trail · Throw · Return · Motion · Tape · Plate · Layout · System**

— what it is made of, what it is made of visually, what it does when nobody is there, what it does when a hand is near, what a hand writes with it, what a hand does to it, how it comes back, the page change, the recording, the index and what rises out of it, the page, the machine. Save writes to `localStorage`; Reset restores exactly what this document describes.

Plate carries nine: the raise, the card's two insets and its fill, how far the index comes apart and how much the row being read holds together, the Schematic's grown scale and edge alpha, and whether a hover forms a specimen at all. Two of them are read by matter.js rather than written to a custom property, because grains come apart in the frame loop and not in the stylesheet.

Tape carries seven: whether the recording plays itself, the Epoch dwell, the Marker scale, the track's offset, its tick height and run fill, and whether the caret parks on the track. Two of them re-measure rather than resolving on the next frame — the tick height and the head's parked position are the same number, and the park is only recomputed on a transition, so without it the head would sit at the old tick height until the visitor happened to navigate.

**`SCHEMA` in tweak.js is the source of truth for every default in the system, and this file is its prose.** A control declares its key, its type, the custom property or data attribute it writes, and which expensive thing matter.js has to redo when it moves (`uniform`, `atlas`, `resample`, `count`, `blend`, `dpr`, `font`, `reload`). Adding a knob is one line; the storage, the row, the live preview and the re-measure are already there.

The panel is instrumentation, not a second design: it borrows the site's own tokens, so it re-skins itself as it is used, and it is drawn in mono at label size with hairline separators like every other thing the machine says about itself.

### Named Rules

**The Every Knob Rule.** Anything added to this system ships with its control in the same change. A hard-coded literal in `static/style.css` or `static/matter.js` is now a defect on its own — not because the value is wrong, but because it is the one value a visitor cannot reach. Colors, sizes, weights, tracking, leading, radii, rhythm, durations, particle counts, grain sizes, blend modes, glyph sets: each one is either a token in `:root` that the schema writes, or a key in `T` that the frame loop reads.

**The Defaults Are The Measured Set Rule.** The One Hue Rule, The Specular Ceiling, The Grain Ratio Rule and The Name Reads First Rule were all established by measuring the rendered page, and they hold at the defaults. The panel can leave all four behind — a second hue is one color picker away, and `grain` at 6 on a 1px lattice is cotton wool. That is the point of it, and it is not a licence to ship a new default without re-measuring. **A default changes only with a fresh measurement; a slider changes with a drag.**

The measurement is a command, not a judgement call: `node tools/coverage.mjs` screenshots every page and reports lit and cored coverage per heading, and `node tools/bench.mjs probe dist/index.html tools/probes/fill.js` reports what the frame costs. Anything imported from elsewhere has to be re-measured *here* — the reach radius arrived from the lab at 5 and had to be cut to 2.2, because on this page 5 radii is the entire name and the word vanished under its own filaments.

**The Reach Is The Fill Rate Rule.** The particle budget is not what costs the frame. `gl.POINTS` sprites are square, so a grain that reaches pays for the whole diagonal *squared* — one grain mid-throw is 50px across where a settled one is 9px. Measured overdraw per device pixel at 1440×900: idle 0.22, hand parked 0.35, hand sweeping a Trail 0.40, page change 1.71, mid-throw 2.52; four times each of those at a 2× pixel ratio, so the page change costs ~6.8× overdraw and ~32M fragments a frame on a real machine.

**The Standing Cost Is Not The Peak Cost Rule.** The page change is allowed to be the most expensive thing here because it lasts 1.9 seconds and it is the thing people replay. A cost that never ends has to be judged against a different number: a new standing cost is measured against `idle` (0.22), and a new peak against `nav` (1.71).

The Trail passes this by not being a standing cost at all. Emission is per pixel of travel, so a hand resting on the page lays nothing and pays nothing, and the 0.05 it adds exists only while the hand is moving — which is also the only time anyone is looking at it. An earlier design carried grains along with the pointer instead, and that version *was* standing: it cost 0.04 for as long as a hand sat anywhere near a word, forever, for something a still frame could barely show.

Both of those rows are `fill.js`'s business and neither transfers off a headless box as an fps figure. What made them trustworthy was measuring on an intact field: the wake rows were first taken after the mid-throw sweep, and 50 carried grains appeared to cost 0.93 overdraw with a 52px widest sprite — an arithmetic impossibility, and the tell that two thousand still-loose thrown grains were being priced as the wake. Every row now reports `drawn` for that reason.

That is inside what the adaptive downscale can rescue — a first transition that misses ~48fps caps the pixel ratio at 1 and takes four fifths of the cost back — but it is the number to watch, and it lives in the Reach group. Doubling `sreach` roughly quadruples the worst case. Re-measure with `tools/probes/fill.js` after any change there, not after a change to `count`.

**The Reload-Free Rule.** A control takes effect on the frame after it moves. Three cannot: the reading (`auto`/`matter`/`calm`) and the boot terminal are decided before the panel exists, so they persist and reload. Everything else — including the particle budget, which is why the buffer is allocated once at a 22,000-grain ceiling and drawn to a live `NP` — resolves live.

**The Panel Owns The Gesture Rule.** The matter site navigates on wheel, arrow keys, digits and swipe. While the panel is open it sets `data-tw="open"` on `<html>` and matter.js refuses **three of the four** — because a panel you cannot scroll without changing page is not a panel.

Digits stay live, and the exception is the rule's own argument taken seriously: it is about scrolling, and a digit is not a scroll. Nearly every control in the panel affects matter that appears on exactly one page, so refusing all four made the instrument unable to inspect the thing it instruments. The nav bar also translates clear of the panel while it is open, since the panel is pinned to the edge the nav lives on and was clipping the first link in half.

**The Font Picker Exception.** The Two Faces Rule ends at this panel. Ten display faces and six monos are selectable, injected from the font CDN on first use; a face change repaints the glyph atlas and re-samples every heading once `document.fonts.ready` settles, because a point cloud measured against a fallback is a point cloud of the wrong shape. The rule still governs the *design*: Archivo and JetBrains Mono are the two faces the system ships as, and a third face is never added to the default.

## Do's and Don'ts

### Do:

- **Do** keep Signal Cyan (#67e8f9) as the only hue. If a variant needs a second color, it needs a different idea.
- **Do** keep Matter Text at 26px or larger, and check the computed size rather than the authored rule — a more specific selector elsewhere is the usual way this breaks.
- **Do** separate content with 1px hairlines at 10–15% ink.
- **Do** express secondary text as an alpha of Phosphor (#e8edef), not as a chosen grey.
- **Do** let mono speak for the machine (HUD, years, repo names, links, boot log) and Archivo speak for the person (name, headings).
- **Do** design both readings. Anything added to the matter site must also make sense in the calm scrolling document, because the same markup serves both.
- **Do** ship a control with anything new, in the same change. One line in `SCHEMA` — see The Every Knob Rule.
- **Do** re-measure before changing a default. A slider is free; a default is a claim.
- **Do** add a *view* rather than a second renderer when something needs to sequence inside a page. The caret, the schedule and the budget all already work per view — see The Views, Not Pages, Rule.
- **Do** make a measurement tool name its subjects from the field. `align.js` listed its own pages and went silent on the one that changed shape.
- **Do** give a new hand response that falls off with distance the radius the hand already has (`repelR × sreach`). The aura and the reach share the same 167px, and a third circle would make the hand's influence a set of unrelated ones instead of one field. The Trail is exempt because it has no falloff — it is emitted by travel, not by proximity, which is why it works over empty field.

### Don't:

- **Don't** add a shadow to content. The boot window is the only elevated surface in the system.
- **Don't** introduce a corner radius on a content surface; square is the default and the three exceptions are already spent.
- **Don't** use a CSS glow, blur, or `filter` to brighten something. Brightness belongs to the material — a lit surface catching a key light — and is earned there.
- **Don't** add a third typeface, or move a role from one face to the other.
- **Don't** rely on a color difference *within* matter — every particle renders in the same uniform color regardless of the element's CSS.
- **Don't** introduce an image, illustration, gradient fill, or texture. Generated assets are unavailable to this project and the identity is built on that absence.
- **Don't** write a literal size, color, duration, or particle constant into `style.css` or `matter.js`. If it is worth choosing, it is worth exposing; if it is not worth exposing, it should not be a magic number either.
- **Don't** let a page scroll or reveal a scrollbar in the matter reading.
- **Don't** let anything change page on its own. The tape advances an Epoch by itself and stops at the last one; that is the whole of what may move without being asked.
- **Don't** space a sequence evenly when the intervals mean something. The tape's ticks are placed by real years, and the gap between two of them is the fact the page is there to carry.
- **Don't** write a hover or pointer offset to `transform`. `.copy` owns `transform` for its reveal and the transition assigns `transform: none` to those elements directly. Use the standalone `translate` property, which composes with it — see Lean.
- **Don't** draw a second pointer. The Caret is not one — it stays where the machine last wrote. The hand is answered by the Trail it writes and the Snap that absorbs it, and neither is an object following the cursor. A blob, a ring, a trailing dot or a full-viewport blend-mode layer is one pointer too many, and the last of those costs a compositing readback every frame besides.
