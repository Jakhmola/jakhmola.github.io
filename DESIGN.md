---
name: Shubham Jakhmola — Self-Rebuilding Portfolio
description: Ink-black scroll narrative where one GPU particle field carries all the colour and Archivo variable carries all the hierarchy.
colors:
  ink: "#05070a"
  ink-lift: "#0b0f16"
  bright: "#f2f6ff"
  text: "#ccd4e2"
  muted: "#8e9ab0"
  line: "#1b2230"
  accent: "#9fd8ff"
  accent-deep: "#6f8cff"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 10vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.045em"
    fontVariation: "width 118%"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 4.4vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.038em"
    fontVariation: "width 110%"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5.6vw, 4rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.04em"
    fontVariation: "width 114%"
  figure:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.5rem)"
    fontWeight: 200
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontVariation: "width 115%"
    fontFeature: "tabular-nums"
  lede:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1.4vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
    fontFeature: "tabular-nums"
  subtitle:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 2.4vw, 1.6rem)"
    fontWeight: 300
    lineHeight: 1.6
    letterSpacing: "-0.01em"
    fontVariation: "width 105%"
  small:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: "0.2em"
rounded:
  hairline: "2px"
  pill: "999px"
spacing:
  s1: "0.375rem"
  s2: "0.75rem"
  s3: "1.25rem"
  s4: "2rem"
  s5: "3rem"
  s6: "4.5rem"
  s7: "7rem"
  edge: "clamp(1.25rem, 5vw, 5rem)"
components:
  button-pill:
    textColor: "{colors.accent}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.4rem"
    typography: "{typography.body}"
  button-pill-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.4rem"
  chip-tag:
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.7rem"
  link-out:
    textColor: "{colors.accent}"
    rounded: "0"
    padding: "0 0 2px"
  list-row:
    textColor: "{colors.text}"
    rounded: "0"
    padding: "{spacing.s3} 0"
  list-row-hover:
    textColor: "{colors.bright}"
  skip-link:
    backgroundColor: "{colors.ink-lift}"
    textColor: "{colors.bright}"
    rounded: "0"
    padding: "{spacing.s2} {spacing.s3}"
  boot-overture:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bright}"
    rounded: "0"
---

# Design System: Shubham Jakhmola — Self-Rebuilding Portfolio

## Overview

**Creative North Star: "The Instrument Room"**

The page behaves like a dark instrument room with one live readout in it. Everything structural is ink and hairline: no panels, no cards, no chrome. The only thing that moves and the only thing with hue is a single GPU particle field of 48k–170k points that reorganises itself once per scroll beat, and a thin iridescent accent family borrowed from that field for links and figures. Colour is scarce because the field is the colour.

Density is low and deliberate. Each beat owns a full viewport (`min-height: 100svh`), so a visitor sees exactly one formation and one block of copy at a time. Copy holds the left of the frame; the field is staged to its right by world-space offsets and only there. Text sits on ink with a gradient scrim between it and the field, so generated copy of any length stays legible over whatever the field happens to be doing.

Everything visual is computed at runtime. The build ships no images and no video: grain is an inline SVG `feTurbulence` filter, the particle sprite is a shader falloff, the favicon is an inline SVG data URI. The confirmed rejections are the ones the world was built against — terminal-green developer chrome, node-and-edge "neural net" canvases, and a static hero image faking a 3D scene.

**Key Characteristics:**
- One typeface (Archivo variable), one ground (ink), one moving element (the field).
- Hierarchy from weight (200–700) and width (105–118%), never from a second family.
- No box shadows anywhere; depth is atmospheric, from scrim, vignette, grain and camera perspective.
- Beats are one-per-viewport at every width.
- Zero shipped raster assets; every visual is generated.

## Colors

A near-black ground with a cool blue-grey text ramp and a single iridescent accent family lifted from the field's thin-film palette.

### Primary
- **Film Cyan** (`{colors.accent}`): The one accent that appears in flat UI. Links, the role line under the name, the featured-beat index number, the pill button's stroke and label, the boot progress bar, the focus ring. It is the light end of the field's own iridescence pulled onto the page.
- **Film Indigo** (`{colors.accent-deep}`): The deep end of the same family. Used only for text selection and the favicon's outer ring — never for body text or borders.

### Neutral
- **Ink** (`{colors.ink}`): The page ground, the overture ground, and the fill of every scrim stop. Also the text colour on a filled accent surface.
- **Ink Lift** (`{colors.ink-lift}`): The single raised tone in the system, used for the skip link only. It is the whole surface ramp; there is no third step.
- **Signal White** (`{colors.bright}`): Reserved for the level a beat is about — the name, section headings, project titles, pipeline figures, and the hover state of any interactive text.
- **Read Grey** (`{colors.text}`): Default body and prose colour, and the resting colour of list rows.
- **Quiet Grey** (`{colors.muted}`): Labels, kickers, tags, stats, secondary descriptions, and the colophon. Every uppercase micro-label is this colour.
- **Hairline** (`{colors.line}`): Every rule and border in the system — list dividers, tag outlines, the skip link's edge, the progress bar's track.

### Field Palette (generated, not a token)
The particle field's colour comes from a cosine thin-film ramp in the vertex shader: base `vec3(0.20, 0.34, 0.62)` with amplitude `vec3(0.22, 0.20, 0.24)` and per-channel phase offsets `(0.50, 0.62, 0.78)`. Phase-offset, not amplitude-scaled, so it travels indigo → cyan → steel → violet like an oil film instead of riding one hue at different brightnesses. Points draw with additive blending at `0.30` peak alpha; the red base is held low on purpose, because letting it climb averages dense cores to white and destroys the iridescence.

### Named Rules
**The Borrowed Hue Rule.** Flat UI colour is drawn from the field's own palette or it is not used. Cyan and indigo are the entire chromatic vocabulary; no green, no amber, no red — not even for state.

**The One Ramp Rule.** Text uses exactly four steps — bright, text, muted, and accent for links. If a new level of emphasis seems necessary, change weight or width instead of adding a fifth colour.

**The Cool-Only Rule.** Every neutral in the file is blue-shifted. A pure-grey or warm-grey neutral reads as a foreign body against the ink ground and the field behind it.

## Typography

**Display Font:** Archivo variable, self-hosted at `fonts/archivo-var.woff2` (weight 100–900, width 62–125%), preloaded, `font-display: swap`
**Body Font:** Archivo variable — the same file
**Label/Mono Font:** None. There is no monospace face in this project.

**Character:** A single grotesque asked to do everything. Display sizes run heavy and slightly wide (700 / 118%) with tight negative tracking; figures run thin and wider still (200 / 115%); micro-labels run semibold, small, uppercase and widely tracked. The contrast between 200 and 700 at the same width does the work a second family usually does.

### Hierarchy
- **Display** (700, `clamp(2.75rem, 10vw, 6rem)`, 0.94): The name in the hero, and nothing else. Balanced wrapping.
- **Headline** (600, `clamp(1.9rem, 4.4vw, 3.25rem)`, 1.04): Beat headings, capped at 22ch so they break into two or three short lines.
- **Title** (600, `clamp(2rem, 5.6vw, 4rem)`, 0.98): Featured project names. Wraps anywhere, because repository names are machine-supplied and may be long and unbroken.
- **Figure** (200, `clamp(2.25rem, 5vw, 3.5rem)`, 1): Pipeline counts. Thin and wide, tabular, the visual opposite of the display weight.
- **Lede** (400, `clamp(1.0625rem, 1.4vw, 1.1875rem)`, 1.6): The first paragraph of a beat and every LLM-written project summary, capped at 66ch.
- **Body** (400, `1.0625rem`, 1.6): Prose, capped at 66ch. Tabular figures are on globally at the `body` level.
- **Label** (600, `0.6875rem`, `0.2em`, uppercase): Kickers, beat markers, figure captions, the scroll cue (`0.24em`) and the overture's leading label (`0.75rem` / `0.22em`).

The hero role line and the closing statement are the system's one soft voice: 300 weight, 105–112% width, negative tracking, at `clamp(1.125rem, 2.4vw, 1.6rem)` and `clamp(1.75rem, 5vw, 3.25rem)` respectively.

### Named Rules
**The One Voice Rule.** Archivo is the only family in the project. New hierarchy comes from weight (200–700) and width (105–118%); a second family is never the answer.

**The No-Terminal Rule.** No monospace anywhere, including code-adjacent content, repository names, and timestamps. Tabular figures handle numeric alignment instead.

**The Flat-Ink Rule.** Type is a single flat colour. No gradient text, no text shadow, no stroke. Iridescence belongs to the field, not to the letterforms.

**The Machine-Copy Rule.** Every string on the page can be machine-generated and arbitrarily long. Headings cap at 22ch, prose at 66ch, and any element that can receive a repository name sets `overflow-wrap: anywhere`.

## Layout

A vertical stack of full-viewport beats. Each `.beat` is `min-height: 100svh`, vertically centred, padded `--s7` block / `--edge` inline (`clamp(1.25rem, 5vw, 5rem)`), with an inner column capped at 78rem (68rem for the hero) and centred. Measure caps do the real narrowing: 66ch for prose and ledes, 22ch for headings, 54rem for the ranked list, 52ch for the colophon.

Spacing is a seven-step scale (0.375 / 0.75 / 1.25 / 2 / 3 / 4.5 / 7 rem) — roughly a 1.5× rhythm. Micro-gaps inside a component use s1–s2, gaps between elements in a beat use s3–s4, and s5–s7 separates blocks and beats.

The field is fixed and full-bleed at `z-index: 0`, the scrim at 1, `main` at 2, the overture at 30, the skip link at 40. Composition is horizontal, not layered: copy owns the left column and the field is offset to the right by per-beat world-space offsets (`ox` 2.2–6.5, `oy` −0.8–1.4) multiplied by a lane factor `clamp((innerWidth − 720) / 560, 0, 1)`. Below roughly 1280px the lane factor falls off; at the narrow end the field recentres under the copy, its opacity drops to `0.5 + lane * 0.5`, and the scrim flips from a left-weighted horizontal wash to a top-and-bottom vertical one.

Two breakpoints exist: 62rem, where the scrim becomes directional, and 46rem, where beat padding drops to `--s6`, the ranked-list rows collapse from a two-column grid (`minmax(9rem, 18rem) 1fr`) to a single column, and the beat link row wraps.

### Named Rules
**The One Beat One Formation Rule.** A beat owns a full viewport at every width. Two beats must never share a screen, because the field renders one formation at a time and a split screen would show the visitor the wrong project's shape.

**The Left-Column Rule.** Copy owns the left of the frame at every beat. The field is staged into whatever free width remains on the right, never behind the reading path when there is somewhere else for it to go.

**The Additive Layer Rule.** All copy exists in the server-rendered HTML. `html.gl` is added by script after boot and only ever adds motion — no content, no layout, and no legibility depends on WebGL or on the bundle loading at all.

## Elevation & Depth

There is not one `box-shadow` in the project, and there should not be. Surfaces do not stack; the system has exactly one lifted tone (`{colors.ink-lift}`, on the skip link) and everything else sits directly on ink. Depth is atmospheric and comes from four generated sources: the scrim's layered vignette and directional wash, a 14%-opacity `overlay`-blended SVG turbulence grain over the whole viewport, the field's own depth fade (points darken and shrink over 26 world units, alpha scaled by `1 - depth * 0.62`), and per-beat camera dollying between z 9.5 and z 16.

Separation between text blocks is done with hairline rules in `{colors.line}` and with whitespace from the spacing scale. Focus is a 2px accent outline at 3px offset, with a 2px radius — the only ring in the system.

### Named Rules
**The No-Shadow Rule.** Nothing in flat UI casts a shadow. If an element needs to separate from its background, use a hairline rule, a step of the spacing scale, or the scrim — never a drop shadow, and never a blurred glow behind text.

**The Scrim-Not-Panel Rule.** Contrast over the field is protected by the full-viewport scrim, not by giving a text block its own background. Any element that needs protection belongs inside the copy column, where the scrim already covers it.

## Shapes

Two radii and nothing between them: a full pill (999px) for the two enclosed interactive shapes (the resume button and the tag chips), and 2px on the focus ring. Every other box in the system is a true rectangle with no radius at all — the skip link, the overture, list rows.

Borders are always 1px and always hairline-coloured, except the pill button, which is stroked in accent, and inline contact links, which sit on a 35%-alpha accent underline. Underlines are 1px with a 0.25em offset; `.link-out` uses a `currentColor` bottom border with 2px of padding rather than a text decoration, so the rule stays put while colour animates.

The recurring geometry is the closed procedural solid: project formations are generated from the Gielis superformula (`lattice` m8, `shell` m6, `bloom` m12, `ring` m4, `drift` m3, plus a two-strand `helix`), each rendered as a thin shell of points. Every beat that is not a project gets a spatial figure instead — a two-arm spiral disc for the account, a narrowing funnel that resolves into knots for the pipeline, a flat wide scatter for the also-rans, a settled plane for the close.

## Components

### Buttons
- **Shape:** Full pill (999px).
- **Primary (`.btn`):** Ghost by default — transparent, 1px accent stroke, accent label, 600 weight, `0.7rem 1.4rem`. Used only for the resume link, in the hero nav and the footer nav.
- **Hover:** Fills with accent, label flips to ink. 180ms ease-out on background and colour only.
- **There is no filled-at-rest button.** The ghost pill is the entire button vocabulary.

### Chips
- **Style (`.tags li`):** 1px hairline outline, pill, muted label at 0.8125rem, `0.3rem 0.7rem`, on the ink ground.
- **State:** Static. Chips are read-only metadata — repository languages and topics, and the skills strip. They are never selected, never filterable, and never carry accent.

### Cards / Containers
None. The system has no card. Grouping is done by beat, by hairline rule, and by measure cap. A bordered or filled box around a content group is out of the world.

### Navigation
- **Style:** A flat inline row of text links (`.contact`), gap `--s3 --s4`, wrapping. Appears twice — under the hero pitch and in the footer — with no fixed or sticky bar anywhere.
- **Default / hover:** Accent text on a 35%-alpha accent underline; on hover the underline goes to `currentColor`. The one pill button leads the row.
- **Skip link:** Parked at `top: -5rem`, drops to `--s3` on focus. Ink-lift ground, hairline border, bright label, 180ms ease-out.

### Ranked List
The one list-as-index pattern. Rows are separated by hairline top and bottom borders, laid out as a two-column baseline-aligned grid (name `minmax(9rem, 18rem)`, description `1fr`), padded `--s3` vertically with no horizontal padding so the rules run edge to edge of the 54rem column. Name in read grey, description in muted at 0.9375rem. Hover lifts the whole row to bright over 160ms; there is no background change and no indent.

### Overture
The signature component. A full-viewport ink panel over everything (`z-index: 30`), centred, that runs before the field is built — allocating and compiling up to 170k particles is the slow part, and a loader that appears after loading is done is not a loader. It shows an uppercase muted label, the real build timestamp at `clamp(1.75rem, 6vw, 3rem)` in weight 200 / width 112%, and then flashes every repository name the rebuild read at 78ms intervals in accent, over a 1px hairline track whose accent fill scales on `transform` (never width). It dismisses by fading opacity and visibility over 700ms. Reduced motion holds the panel for a fixed 500ms and never flashes names.

### Particle Field
The only moving surface. One `BufferGeometry` of 48k / 110k / 170k points by device tier (memory, cores, and the smaller viewport dimension), additively blended with depth test and depth write off, drawn from a procedural round falloff sprite — no texture is shipped. Position morphs on the GPU from `aFrom` to `aTo` with a per-particle delay and a simplex swirl that peaks mid-transit, so a beat change reads as matter reorganising rather than points teleporting. Beat transitions run 2.1–2.4s on `expo.out`; an interrupted morph freezes the field where it stands rather than popping. Point size is computed in world units (`uSize * uDpr * 22 / -mv.z`), clamped 1–44px, with smaller tiers given proportionally larger points so a phone keeps the same visual mass as a workstation. DPR is capped at 1.5–1.75. Ambient spin (0.014 rad/s) lives on a parent group so it never fights the per-beat rotation tweens.

### Named Rules
**The Computed-Visual Rule.** No raster or vector asset ships for decoration. Grain is an SVG turbulence filter, the point sprite is a shader falloff, the favicon is an inline SVG data URI, and every formation is generated from repository data or a deterministic seed.

**The Reduced-Motion Floor Rule.** Under `prefers-reduced-motion: reduce` all transitions collapse to 0.001ms, the field renders one static frame with drift at zero, and `#field` is shown at full opacity rather than hidden — the visitor loses the motion, never the image.

## Do's and Don'ts

### Do:
- **Do** give every new section a full viewport (`min-height: 100svh`), a `data-beat` kind, and an entry in the stage table with its own camera z, rotation, offsets and drift.
- **Do** build new hierarchy out of Archivo's weight (200–700) and width (105–118%) axes.
- **Do** cap prose at 66ch, headings at 22ch, and set `overflow-wrap: anywhere` on anything that can receive a machine-supplied repository name.
- **Do** keep new copy inside the scrimmed left column, where contrast against the field is already guaranteed.
- **Do** use the seven-step spacing scale and the `--edge` inline padding token; the scale is the rhythm.
- **Do** reserve `{colors.bright}` for the one thing a beat is about, and let everything else sit in read grey or muted.
- **Do** render every new element in server-side HTML first, and let the WebGL layer only add motion on top of it.
- **Do** animate with `transform` and `opacity`; the progress bar scales, it does not grow its width.
- **Do** generate any new visual — noise, sprite, icon, texture — rather than shipping a file for it.

### Don't:
- **Don't** introduce a second typeface, and specifically not a monospace one, anywhere on the page.
- **Don't** apply a gradient, shadow, stroke, or glow to text. The scrim's gradients and the field's iridescence are the world's own materials; letterforms stay flat single-colour.
- **Don't** add a `box-shadow`. Separate with a hairline rule, whitespace, or the scrim.
- **Don't** wrap content in a card, panel, or filled/bordered box. Beats and hairlines are the grouping devices.
- **Don't** add a colour outside the cool blue-grey ramp and the cyan/indigo accent family — including green, amber, or red for state.
- **Don't** let two beats share a viewport at any width; the field can only show one formation at a time.
- **Don't** put a second animated element on the page. The field is the only thing that moves besides copy entry and hover transitions.
- **Don't** stage the field over the reading column when there is free width to the right of it; scale offsets by the lane factor instead of hard-coding them.
- **Don't** gate any content on the WebGL layer, a font load, or a successful bundle fetch.
