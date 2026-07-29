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
    textColor: "{colors.ink-62}"
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
---

# Design System: Shubham Jakhmola — Matter

## Overview

**Creative North Star: "Deliberate Machinery"**

A system that conserves its own material and moves it with intent. Not decoration, not chaos. Cold, precise, slightly alive. The governing illusion is that the same matter has been on screen the whole time — grains are moved between letterforms, never created and never destroyed — and every visual decision either supports that illusion or is cut.

The surface is almost entirely absent. One near-black field, one cyan, and type. There are no images, no illustrations, no gradients on content, no decorative shapes; the only things that move are the particles, the caret that drives them, and copy fading in behind it. This is not minimalism as a style choice — image and video generation are unavailable to this project, so everything must be computed in the browser or authored by hand. The restraint is a production fact that became the identity.

The register is instrumentation rather than editorial. Monospace carries everything the machine says about itself: the clock, the page counter, the year markers, the repo names, the boot log. The proportional face is reserved for the two things a person says: the name and the headings. When the system speaks as a machine it is mono; when it speaks as Shubham it is Archivo. Nothing else is added.

**Key Characteristics:**

- Exactly one chromatic value in the entire system
- Square by default; the boot window is the only rounded surface
- No shadows on content — depth comes from a radial vignette and additive particle glow
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

**The Additive Ceiling Rule.** Signal Cyan is `rgb(0.404, 0.910, 0.976)` in linear terms, and particles are drawn with `blendFunc(SRC_ALPHA, ONE)`. Green and blue therefore saturate after roughly one layer while red keeps climbing, so anywhere grains stack past about **2.4× coverage the field cores out to achromatic white** — which breaks the One Hue Rule in the rendered output even though every value in the stylesheet is compliant. Density is the lever that has to be held: the name rests at `alpha 0.82`, and every matter heading is re-measured after any change to grain count, size, or alpha — measured, not reasoned about.

Last measured at 1440×900: name 0.02%, Experience 0.00%, Projects 0.09%, contact statement 0.01–0.03%, year markers 0.00%. The idle sigil measures 0.88%, down from 1.67% but still the only element with a visible achromatic core; it remains the one open violation, and it is the decoration rather than a word.

Note that **coverage is not the same lever as brightness.** The name previously measured 30.4% lit and read as a smear; it now measures 21.1% and reads as discrete matter. Coverage bought past the point where sprites merge buys blur, not legibility — see The Grain Ratio Rule.

**The Name Reads First Rule.** The name is the one heading a visitor must be able to read, and it is held to that by measurement, not intent. It is exempt from budget thinning and rests at a larger grain than anything else — the settings are commented at the `heroG` branch in `matter.js`. The bar is **lit coverage inside its own bounding box**, which must stay above the site's real DOM body text.

Measured at 1440×900 against the tagline's 11.33%: `SHUBHAM` 23.06%, `JAKHMOLA` 22.24%, whole name box 21.08%. The idle sigil sits at 8.06%, so the decoration no longer out-measures the name — which it did, at 19.59:1 contrast against the name's 1.04:1, before this rule existed.

**Coverage alone was never the bar, and reading it as one is how the name got smeared.** Held to coverage only, the answer was to grow the sprite until the letterform filled in; at `2.2 × baseS` on a 3px grid each grain spanned four to eight grid cells and the strokes closed into cotton wool that measured 30.4% and read as nothing. The bar is coverage *and* The Grain Ratio Rule together.

**The Monochrome Matter Rule.** Every particle is drawn with the same uniform color. An `.accent` class on Matter Text has no effect in the matter reading — it only colors the calm reading. Never design a variant whose idea depends on two colors of matter.

**The Alpha, Not Grey, Rule.** Secondary text is the ink color at reduced alpha, never a separately chosen grey. This keeps every neutral related to the field it sits on.

## Typography

**Display Font:** Archivo (with system-ui, sans-serif)
**Body Font:** Archivo (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, Menlo, monospace)

**Character:** A grotesk cut for signage and small print, paired with a monospace that does the machine's talking. The pairing is a person and an instrument in conversation; the tension between them is the whole voice.

**Axes:** Archivo is loaded as a variable font over `wdth 100..125, wght 500..700` — the two widths and two weights the system uses, and nothing else. Width is a deliberate lever, not a decorative one: see The Two Widths Rule.

### Hierarchy

Everything at or above 26px is built from matter; everything below it is DOM text. The matter set is **Display, Statement, Headline and Figure** — four roles, down from eight. Tagline, Address and Title were demoted to DOM text (see each), which fixed a real defect in each case and freed roughly half the particle budget for the name. The 26px Floor now has no exceptions in either direction.

- **Display** (700, expanded, clamp(52px, 7.9vw, 120px), 1.02): The name, and only the name. Two lines, tight tracking, widest width in the system. The cap is 120px rather than a rounder 140px because expanded glyphs run ~27% wider — see The Sigil Budget Rule. Below 820px it becomes **Display-narrow** (700, *normal* width, clamp(26px, 8.6vw, 120px)) — the ramp's only responsive width change, argued at The Two Widths Rule. The 26px floor binds below a 302px viewport and exists so the clamp has one; every real phone reads off the `8.6vw` middle.
- **Statement** (700, expanded, clamp(38px, 6vw, 84px), 1.05, -0.03em): The contact headline — the largest type on the site after the name, and the only place two lines carry different colors in the calm reading.
- **Headline** (700, clamp(34px, 4.4vw, 54px), 1.1): Page headings — "Experience", "Projects".
- **Figure** (mono, 700, 42px, 1): Epoch year markers. Always Signal Cyan.
- **Address** (mono, 700, clamp(18px, 3vw, 28px)): The contact email. **DOM text, not matter.** It computed below the 26px floor at every width from 821 to 866px, and as Matter Text it inherited `opacity: 0`, which composited away its own focus ring — the site's primary call to action was a focusable element that a keyboard user could neither read nor see focused. It is Signal Cyan at 13.52:1 and clickable at every width.
- **Title** (mono, 700, clamp(22px, 2.2vw, 27px)): Repo names on the Projects page. **DOM text, not matter.** It computes below 26px at every width from 821 to 1181px — 22px at 1024px — and there it did not resolve: five of them measured 1.03:1 against the field while spending roughly a third of the grain budget. Raising the floor instead would have made repo names the largest mono on the site, which is not the hierarchy the page wants.
- **Tagline** (mono, 500, clamp(13px, 1.45vw, 18px), 0.14em): The role line under the name. **DOM text, not matter.** At its former fixed 26px it was both the widest element in the home column at every width under ~1500px and 53px wider than the viewport below 878px, where `overflow: hidden` silently cut the end of the line. Scaling it fixes both, and puts it below the floor. It steps to 16px below 820px.
- **Subtitle** (700, 16.5px): Epoch titles. The first rung below the floor.
- **Body** (500, 15px, 1.7): Pitch and about copy. **Body-sm** (13px, 1.55–1.6) carries project descriptions, epoch bodies, and inline link rows.
- **Brand** (700, 14px, 0.07em, uppercase): The wordmark only.
- **Label** (mono, 400, 12.5px): Navigation and the boot log. **Meta** (12px) covers page-head notes, project indices, and source links; **HUD** (11.5px, uppercase) the bottom strip; **Caption** (11px) the footer, boot title, and boot hint; **Micro** (10px) tag text.

### Named Rules

**The Closed Ramp Rule.** The ramp above is the complete set of sizes in the system — 22 steps, every one of them in use. A new size is a system change, not a local decision: add it to `typography.scale` in this file's frontmatter or reuse an existing rung. The design hook enforces this, so an undocumented literal will be flagged on the next edit.

**The Contour Rule.** Every heading samples on the same **2px grid**, keeps its whole contour, and thins only the interior — to 37%. The grid used to scale with font size (`fontSize / 14`, clamped 3–6px) and that spent the budget exactly backwards: a 54px heading got a 4px grid and 280 grains, too few to resolve into a word, while the name got a 3px grid and enough sprite overlap to close shut. Size is not what decides how many grains a letterform needs.

A silhouette is what makes a letterform legible; the fill is only weight, and weight is the cheap thing to buy back with grain size. Contour-first costs about a third of a solid 2px grid, so every page fits the same 9,000-grain budget: home 6,265, contact 3,888, experience 1,881, projects 675. Measured lift at 1440×900 — Experience 3.81% → 16.89%, Projects 3.34% → 15.98%, "something real." 2.56% → 19.04%, the year markers roughly tripled.

The cost is paid by the idle hourglass, which now gets 2,735 grains on the home page instead of 4,414 and measures 8.06% against its old 11.62%. That is the correct direction: the decoration must not out-measure the name.

**The Grain Ratio Rule.** A grain sprite must stay near its sample spacing. Much past ~2× and neighbouring sprites merge before the eye resolves either, so the letterform reads as a brush stroke rather than as matter, and the extra coverage is spent on a halo outside the stroke. `GRAIN`, `HERO_S` and `REST_S` in `matter.js` are the three constants that set this, and they are only meaningful relative to the 2px grid The Contour Rule fixes. Change one and re-measure the rendered page; do not re-derive it.

**The 26px Floor.** Type below roughly 26px cannot be built from matter: a 2px grid leaves no room under its own strokes. Anything smaller must be DOM text. This is a hard constraint of the renderer, not a preference — and CSS specificity is the usual way it gets violated, since any rule that shrinks a Matter Text element below the floor silently dissolves it.

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

**The Nowrap Rule.** Matter Text is measured as a single line. Every `.mt` element is `white-space: nowrap; width: fit-content` in the matter reading, because the sampler rasterizes one line of text at the element's computed font. A heading that wraps will sample wrong.

## Layout

Each page is exactly one viewport: `position: fixed; inset: 0`, vertically centred content, `8vw` side gutters (`6vw` under 820px), and page chrome pinned at `3.2vw` inline padding. Only one page is visible at a time; the others stay laid out at `visibility: hidden` so the sampler can measure them, which is why pages are never toggled with `display: none`.

Content stacks in a single column with a `4.5vh` rhythm between major blocks and `2.6vh` within them. The Experience page is the one grid — four equal epoch columns via `repeat(auto-fit, minmax(210px, 1fr))`. The Projects page is a `52px 1fr auto` row grid: index, body, source link.

Below 820px the whole model is abandoned. The calm reading takes over: static positioning, `9vh` page padding, a sticky translucent nav, hairline dividers between pages, and normal document scroll. This is not a breakpoint adjustment; it is the other site.

### Named Rules

**The No Scrollbar Rule.** Neither click nor scroll gesture ever reveals a scrollbar in the matter reading. Both advance a page instead. If content does not fit a viewport, the content is cut, not the constraint.

**The Measure-Once Rule.** Element positions are sampled on load, on resize, and on page change — never per frame. Any layout idea that would require continuous measurement is out.

## Elevation & Depth

The system is flat on content. No card has a shadow, no surface is lifted, and no element uses a background lighter than the page to suggest a plane. Depth is atmospheric instead: a fixed two-stop radial vignette darkens the frame and lifts the centre, and the particles themselves are drawn with additive blending so density reads as luminosity. Where grains crowd — the hourglass waist, a letter's stem — the field brightens on its own.

**The matter field itself has thickness.** Every grain carries a fixed depth in [-1, 1] — a property of the grain, not of the page it currently spells, so the same slab re-forms through every transition. One factor derived from it drives grain size (±36%), brightness (far grains dim to 81%), and a parallax shear that follows the pointer across the viewport. Nothing else in the system is three-dimensional; this is not a plane being tilted but the only depth the design has, and it is why the name reads as a quantity of material rather than as a stencil.

**The Smallest Mark Bounds the Parallax Rule.** One uniform shears every grain, so the shear is bounded by the *smallest* thing built from matter, never the largest. At 3.6px it was 0.4% of the name's width and 13% of the 28px corner sigil, and it visibly wobbled the wordmark's companion mark. It is 2.6px.

Exactly one real shadow exists in the system, and it belongs to the boot terminal.

### Shadow Vocabulary

- **Boot lift** (`box-shadow: 0 30px 90px rgba(0, 0, 0, 0.6)`): The boot window only. Its job is to push the terminal in front of the site during the ~1.2s before the site exists.

### Named Rules

**The One Shadow Rule.** The boot window is the only elevated surface. Content is flat, always. Adding a shadow to a project row or an epoch card is a system violation, not a refinement.

**The Glow Is Earned Rule.** Brightness comes from particle density under additive blending, never from a CSS glow, blur, or filter on content.

## Shapes

Square by default. Content has no corner radius at all — project rows, epoch cards, and page containers are unrounded and mostly unbordered, separated by 1px hairlines rather than by drawn boxes.

Three exceptions, each earned: tech tags are full pills (20px) because they are labels rather than surfaces; the boot window is softly rounded (10px) because it is a terminal quoting an OS convention; and the boot-bar dots are circles (50%).

The one recurring silhouette is the hourglass — two triangles meeting at a slight waist. It is the site's mark, drawn from particles at 180×260 on the home page and 28×40 in the corner everywhere else, and rendered as a CSS clip-path in the calm reading. It is never an image file.

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

**The 44px Thumb Rule.** Below 820px every link is a touch target and gets `padding-block: 14px`, which is what carries a 17px line to 45px. Padding, not `min-height`, so the text keeps its baseline inside the row it belongs to. All eighteen links on the calm reading failed this before it was written down, none of them by more than a few pixels of padding — it is the kind of thing that is invisible on a desk and constant on a phone.

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

### Boot Terminal

- **Style:** A macOS-convention window — traffic-light dots, a mono title, a log body at 12.5px with 2.1 line-height — on a backdrop one step darker than the page.
- **Behavior:** Three log lines land at 120/500/880ms; the slide-out starts at 1250ms on a `cubic-bezier(.76, 0, .24, 1)` over 700ms and the node is removed at 2050ms. Any input skips it immediately. Quote the 2.05s, not the 1.25s — the earlier number is when the exit begins, and the doc read as if it were when the gate is gone.
- **Copy:** The unit count in the ledger line is interpolated from `N`, never typed. A boot screen that states a number the code contradicts is the one lie the audience can catch with devtools open.
- **Rule:** It is a gate in front of content and must never behave like one.

### Tweak Panel

- **Tab:** A hairline tab pinned to the right edge at 50% height, mono 10px uppercase with 0.18em tracking, set vertically (`writing-mode: vertical-rl`). It sits at z-index 95 — above the HUD, under the boot terminal, so it never appears before the site does. Below 820px it becomes a horizontal chip at the bottom right.
- **Panel:** `min(340px, 100vw)`, full height, Panel Slate at 96% with a 14px blur, one hairline left border, square. Six `<details>` groups, first open. Full-width on a phone.
- **Rows:** Label at Ink 62%, live value readout in Signal Cyan with tabular figures, control below spanning the row. `accent-color: var(--accent)` on the native range and checkbox — no custom slider is drawn.
- **Header:** `save` (cyan outline), `reset`, close. An unsaved change lights a 5px cyan dot next to the wordmark; Save clears it and flips its own label to `saved` for a beat.
- **Presets:** Eight pills — Default, Amber, Phosphor, Bone, Dense, Sparse, Loud, Quiet. A preset is a whole state, not a patch: keys it omits go back to their default, so picking two in a row gives the second rather than a mixture.
- **Rule:** It skins itself from the tokens it edits. A separate palette for the panel would mean two design systems in one file, and the second one would rot.

### Caret

The read/write head that drives every transition, drawn as the thing it actually is: a text caret. A Signal Cyan bar on a 2D canvas above the particle field, spanning the full height of the type it is working on (`h × 2`, where `h` is roughly half the line) and `h × 0.12` wide, so it scales with the heading rather than sitting at one size. It tilts into its own horizontal velocity. Solid while it consumes, travels or emits; parked, it step-blinks on a 1s cycle at 55% duty — the same blink as the `▮` in the boot log. When idle it parks 14px past the last stroke of the last heading, like a caret at the end of a line.

The bar carries no grain-flow indicator. The particles streaming into or out of it already say which direction the work is going, and a second signal on a 4px bar is noise.

**The mouse pointer is the system arrow.** No custom cursor canvas, no `cursor: none`. The Caret is the only drawn pointer on this site; a second one competing with it is one pointer too many.

## The Tweak Layer

Everything above is the default state of a system a visitor can take apart. `static/tweak.js` ships a panel — a hairline tab on the right edge, `T` to toggle — with 84 controls over six groups: Palette, Type, Matter, Motion, Layout, System. Save writes to `localStorage`; Reset restores exactly what this document describes.

**`SCHEMA` in tweak.js is the source of truth for every default in the system, and this file is its prose.** A control declares its key, its type, the custom property or data attribute it writes, and which expensive thing matter.js has to redo when it moves (`uniform`, `atlas`, `resample`, `count`, `blend`, `dpr`, `font`, `reload`). Adding a knob is one line; the storage, the row, the live preview and the re-measure are already there.

The panel is instrumentation, not a second design: it borrows the site's own tokens, so it re-skins itself as it is used, and it is drawn in mono at label size with hairline separators like every other thing the machine says about itself.

### Named Rules

**The Every Knob Rule.** Anything added to this system ships with its control in the same change. A hard-coded literal in `static/style.css` or `static/matter.js` is now a defect on its own — not because the value is wrong, but because it is the one value a visitor cannot reach. Colors, sizes, weights, tracking, leading, radii, rhythm, durations, particle counts, grain sizes, blend modes, glyph sets: each one is either a token in `:root` that the schema writes, or a key in `T` that the frame loop reads.

**The Defaults Are The Measured Set Rule.** The One Hue Rule, the Additive Ceiling, The Grain Ratio Rule and The Name Reads First Rule were all established by measuring the rendered page, and they hold at the defaults. The panel can leave all four behind — a second hue is one color picker away, and `grain` at 6 on a 1px grid is cotton wool. That is the point of it, and it is not a licence to ship a new default without re-measuring. **A default changes only with a fresh measurement; a slider changes with a drag.**

**The Reload-Free Rule.** A control takes effect on the frame after it moves. Three cannot: the reading (`auto`/`matter`/`calm`) and the boot terminal are decided before the panel exists, so they persist and reload. Everything else — including the particle budget, which is why the buffer is allocated once at a 22,000-grain ceiling and drawn to a live `NP` — resolves live.

**The Panel Owns The Gesture Rule.** The matter site navigates on wheel, arrow keys, digits and swipe. While the panel is open it sets `data-tw="open"` on `<html>` and matter.js refuses all four, because a panel you cannot scroll without changing page is not a panel.

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

### Don't:

- **Don't** add a shadow to content. The boot window is the only elevated surface in the system.
- **Don't** introduce a corner radius on a content surface; square is the default and the three exceptions are already spent.
- **Don't** use a CSS glow, blur, or `filter` to brighten something. Luminosity is earned through particle density under additive blending.
- **Don't** add a third typeface, or move a role from one face to the other.
- **Don't** rely on a color difference *within* matter — every particle renders in the same uniform color regardless of the element's CSS.
- **Don't** introduce an image, illustration, gradient fill, or texture. Generated assets are unavailable to this project and the identity is built on that absence.
- **Don't** write a literal size, color, duration, or particle constant into `style.css` or `matter.js`. If it is worth choosing, it is worth exposing; if it is not worth exposing, it should not be a magic number either.
- **Don't** let a page scroll or reveal a scrollbar in the matter reading.
