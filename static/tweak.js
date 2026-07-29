// The tweak panel: every value the design is made of, exposed as one control.
//
// Loaded synchronously in <head>, before matter.js and before first paint, for
// two reasons: saved values must be on :root before anything is drawn (a flash
// of the default palette is worse than no panel at all), and matter.js reads
// its knobs from `window.TWEAK.v` at boot.
//
// SCHEMA below is the single source of truth. A control declares where its value
// goes -- a CSS custom property, a data attribute, or nothing but a name that
// matter.js reads -- and this file's ~80 lines of plumbing handle the rest:
// storage, the UI row, live preview, and the notification matter.js needs to
// re-measure. Adding a knob is one line in SCHEMA. See The Every Knob Rule.

(() => {
  'use strict';

  const KEY = 'jsys.tweak.v1';
  const root = document.documentElement;

  /* --------------------------------------------------------------- fonts -- */

  // `q` is the Google Fonts query for the family, injected on first use. A family
  // with no `q` is already on the machine and costs nothing.
  const DISPLAY_FONTS = [
    { v: 'archivo', l: 'Archivo', s: "'Archivo', system-ui, sans-serif", q: 'Archivo:wdth,wght@100..125,500..700' },
    { v: 'grotesk', l: 'Space Grotesk', s: "'Space Grotesk', system-ui, sans-serif", q: 'Space+Grotesk:wght@400..700' },
    { v: 'inter', l: 'Inter', s: "'Inter', system-ui, sans-serif", q: 'Inter:wght@300..800' },
    { v: 'plex', l: 'IBM Plex Sans', s: "'IBM Plex Sans', system-ui, sans-serif", q: 'IBM+Plex+Sans:wght@300;400;500;600;700' },
    { v: 'bricolage', l: 'Bricolage Grotesque', s: "'Bricolage Grotesque', system-ui, sans-serif", q: 'Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800' },
    { v: 'syne', l: 'Syne', s: "'Syne', system-ui, sans-serif", q: 'Syne:wght@400..800' },
    { v: 'anton', l: 'Anton', s: "'Anton', system-ui, sans-serif", q: 'Anton' },
    { v: 'fraunces', l: 'Fraunces (serif)', s: "'Fraunces', Georgia, serif", q: 'Fraunces:opsz,wght@9..144,300..900' },
    { v: 'system', l: 'System UI', s: 'system-ui, -apple-system, sans-serif' },
    { v: 'serif', l: 'System serif', s: 'Georgia, "Times New Roman", serif' },
  ];

  const MONO_FONTS = [
    { v: 'jetbrains', l: 'JetBrains Mono', s: "'JetBrains Mono', ui-monospace, Menlo, monospace", q: 'JetBrains+Mono:wght@400;500;700' },
    { v: 'plexmono', l: 'IBM Plex Mono', s: "'IBM Plex Mono', ui-monospace, monospace", q: 'IBM+Plex+Mono:wght@400;500;600;700' },
    { v: 'spacemono', l: 'Space Mono', s: "'Space Mono', ui-monospace, monospace", q: 'Space+Mono:wght@400;700' },
    { v: 'dm', l: 'DM Mono', s: "'DM Mono', ui-monospace, monospace", q: 'DM+Mono:wght@300;400;500' },
    { v: 'redhat', l: 'Red Hat Mono', s: "'Red Hat Mono', ui-monospace, monospace", q: 'Red+Hat+Mono:wght@300..700' },
    { v: 'sysmono', l: 'System mono', s: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  ];

  // Eight cells of the atlas. Eight, always: the shader indexes a fixed 9-cell
  // strip, so a set is cycled to length rather than changing the atlas geometry.
  const GLYPH_SETS = [
    { v: 'terminal', l: 'Terminal', c: '01>${}*;' },
    { v: 'binary', l: 'Binary', c: '01' },
    { v: 'hex', l: 'Hex', c: '0123456789ABCDEF' },
    { v: 'punct', l: 'Punctuation', c: '.·:;,`\'"' },
    { v: 'math', l: 'Math', c: '+-=/\\<>~' },
    { v: 'blocks', l: 'Blocks', c: '▚▞▘▝░▒▓█' },
    { v: 'kana', l: 'Katakana', c: 'アイウエオカキク' },
    { v: 'name', l: 'Initials', c: 'SJKMHAUB' },
    { v: 'custom', l: 'Custom…', c: '' },
  ];

  /* -------------------------------------------------------------- schema -- */

  // t: range | color | select | bool | text
  // css:  the custom property the value is written to (with `u` as its unit)
  // attr: a data-* attribute on <html>, for CSS that switches rather than scales
  // fx:   what matter.js has to redo -- uniform | resample | atlas | count |
  //       blend | dpr | font | reload. Absent = read live in the frame loop.
  const SCHEMA = [
    {
      g: 'Palette',
      note: 'One hue, and the ink every neutral is an alpha of.',
      c: [
        { k: 'accent', t: 'color', d: '#67e8f9', css: '--accent', fx: 'uniform', l: 'Signal' },
        { k: 'bg', t: 'color', d: '#0a0c0e', css: '--bg', l: 'Field' },
        { k: 'ink', t: 'color', d: '#e8edef', css: '--ink', l: 'Ink' },
        { k: 'panel', t: 'color', d: '#0a0d10', css: '--panel', l: 'Panel (boot)' },
        { k: 'cold', t: 'color', d: '#07090b', css: '--cold', l: 'Boot backdrop' },
        { k: 'inkA', t: 'range', d: 85, min: 30, max: 100, step: 1, u: '%', css: '--ink-a', l: 'Ink · transcript' },
        { k: 'linkA', t: 'range', d: 65, min: 25, max: 100, step: 1, u: '%', css: '--link-a', l: 'Ink · links' },
        { k: 'dimA', t: 'range', d: 62, min: 25, max: 100, step: 1, u: '%', css: '--dim-a', l: 'Ink · body' },
        { k: 'quietA', t: 'range', d: 55, min: 20, max: 100, step: 1, u: '%', css: '--quiet-a', l: 'Ink · quiet' },
        { k: 'dimmerA', t: 'range', d: 40, min: 10, max: 100, step: 1, u: '%', css: '--dimmer-a', l: 'Ink · furniture' },
        { k: 'lineA', t: 'range', d: 14, min: 2, max: 60, step: 1, u: '%', css: '--line-a', l: 'Hairlines' },
        { k: 'vig', t: 'range', d: 1, min: 0, max: 2, step: 0.05, css: '--vig', l: 'Vignette' },
      ],
    },
    {
      g: 'Type',
      note: 'Archivo speaks as a person, the mono as the machine.',
      c: [
        { k: 'fontDisplay', t: 'select', d: 'archivo', opts: DISPLAY_FONTS, css: '--display', fx: 'font', l: 'Display face' },
        { k: 'fontMono', t: 'select', d: 'jetbrains', opts: MONO_FONTS, css: '--mono', fx: 'font', l: 'Mono face' },
        { k: 'fs', t: 'range', d: 1, min: 0.7, max: 1.6, step: 0.01, css: '--fs', fx: 'resample', l: 'Scale · all type' },
        { k: 'kDisplay', t: 'range', d: 1, min: 0.4, max: 1.8, step: 0.01, css: '--k-display', fx: 'resample', l: 'Scale · name' },
        { k: 'kStatement', t: 'range', d: 1, min: 0.4, max: 1.8, step: 0.01, css: '--k-statement', fx: 'resample', l: 'Scale · statement' },
        { k: 'kHeadline', t: 'range', d: 1, min: 0.4, max: 1.8, step: 0.01, css: '--k-headline', fx: 'resample', l: 'Scale · headings' },
        { k: 'kFigure', t: 'range', d: 1, min: 0.4, max: 1.8, step: 0.01, css: '--k-figure', fx: 'resample', l: 'Scale · year figures' },
        { k: 'kTitle', t: 'range', d: 1, min: 0.4, max: 1.8, step: 0.01, css: '--k-title', fx: 'resample', l: 'Scale · repo names' },
        { k: 'kBody', t: 'range', d: 1, min: 0.5, max: 2, step: 0.01, css: '--k-body', fx: 'resample', l: 'Scale · body' },
        { k: 'kLabel', t: 'range', d: 1, min: 0.5, max: 2, step: 0.01, css: '--k-label', fx: 'resample', l: 'Scale · labels' },
        { k: 'wDisplay', t: 'range', d: 700, min: 300, max: 900, step: 10, css: '--w-display', fx: 'resample', l: 'Weight · display' },
        { k: 'wBody', t: 'range', d: 500, min: 200, max: 800, step: 10, css: '--w-body', fx: 'resample', l: 'Weight · body' },
        { k: 'wdth', t: 'range', d: 125, min: 62, max: 150, step: 1, u: '%', css: '--wdth-display', fx: 'resample', l: 'Width axis' },
        { k: 'trDisplay', t: 'range', d: -0.02, min: -0.1, max: 0.2, step: 0.002, u: 'em', css: '--tr-display', fx: 'resample', l: 'Tracking · display' },
        { k: 'trStatement', t: 'range', d: -0.03, min: -0.1, max: 0.2, step: 0.002, u: 'em', css: '--tr-statement', fx: 'resample', l: 'Tracking · statement' },
        { k: 'trTagline', t: 'range', d: 0.14, min: 0, max: 0.5, step: 0.005, u: 'em', css: '--tr-tagline', l: 'Tracking · tagline' },
        { k: 'trBrand', t: 'range', d: 0.07, min: 0, max: 0.4, step: 0.005, u: 'em', css: '--tr-brand', l: 'Tracking · wordmark' },
        { k: 'lhDisplay', t: 'range', d: 1.02, min: 0.8, max: 1.6, step: 0.01, css: '--lh-display', fx: 'resample', l: 'Leading · name' },
        { k: 'lhHeadline', t: 'range', d: 1.1, min: 0.85, max: 1.7, step: 0.01, css: '--lh-headline', fx: 'resample', l: 'Leading · headings' },
        { k: 'lhBody', t: 'range', d: 1.7, min: 1.1, max: 2.4, step: 0.02, css: '--lh-body', l: 'Leading · body' },
      ],
    },
    {
      g: 'Matter',
      note: 'The conserved buffer. Grain size is measured against the sample grid — see The Grain Ratio Rule. Spacing is derived from each heading’s own font size, so the grid answers to ink rather than to point size: a heavy face and a light mono at the same size are covered differently on purpose.',
      c: [
        { k: 'count', t: 'range', d: 9000, min: 1200, max: 22000, step: 200, fx: 'count', l: 'Particle budget' },
        { k: 'grain', t: 'range', d: 1.75, min: 0.5, max: 6, step: 0.05, fx: 'uniform', l: 'Grain size' },
        { k: 'heroS', t: 'range', d: 1.05, min: 0.2, max: 2.4, step: 0.05, l: 'Grain · name' },
        { k: 'restS', t: 'range', d: 0.75, min: 0.2, max: 2, step: 0.05, l: 'Grain · headings' },
        { k: 'glyphs', t: 'select', d: 'terminal', opts: GLYPH_SETS, fx: 'atlas', l: 'Glyph set' },
        { k: 'glyphsCustom', t: 'text', d: '', fx: 'atlas', l: 'Custom glyphs', when: (v) => v.glyphs === 'custom' },
        { k: 'gridk', t: 'range', d: 36, min: 10, max: 80, step: 1, fx: 'resample', l: 'Sample density' },
        { k: 'fill', t: 'range', d: 0.69, min: 0, max: 1, step: 0.02, fx: 'resample', l: 'Interior fill' },
        { k: 'bright', t: 'range', d: 1.25, min: 0.2, max: 2.5, step: 0.05, fx: 'uniform', l: 'Brightness' },
        { k: 'glint', t: 'range', d: 0.5, min: 0, max: 2, step: 0.05, fx: 'uniform', l: 'Chip edge glint' },
        { k: 'blend', t: 'select', d: 'soft', fx: 'blend', l: 'Blend', opts: [{ v: 'add', l: 'Additive (v3)' }, { v: 'soft', l: 'Solid (lit)' }] },
        { k: 'ssize', t: 'range', d: 3, min: 1, max: 8, step: 0.1, u: '×', l: 'Symbol size' },
        { k: 'rsym', t: 'bool', d: true, l: 'Characters at rest' },
        { k: 'rdens', t: 'range', d: 0.46, min: 0, max: 1, step: 0.02, l: 'Characters at rest · share' },
        { k: 'rsize', t: 'range', d: 1, min: 0.5, max: 3, step: 0.05, u: '×', l: 'Characters at rest · size' },
      ],
    },
    {
      g: 'Reach',
      note:
        'A share of the word reaches for a hand near it without letting go, and the filament ' +
        'between the two ends is drawn by the grain’s own sprite rather than by extra geometry. ' +
        'That sprite is square, so a long diagonal capsule costs its length squared in fragments — ' +
        'this group, not the particle budget, is where the GPU cost of the system actually lives.',
      c: [
        { k: 'str', t: 'range', d: 0.55, min: 0, max: 1, step: 0.02, fx: 'uniform', l: 'Reach' },
        { k: 'svel', t: 'range', d: 0.44, min: 0, max: 2, step: 0.02, l: 'Flight streak' },
        { k: 'stail', t: 'range', d: 0.4, min: 0, max: 1, step: 0.02, fx: 'uniform', l: 'Filament opacity' },
        { k: 'ftaper', t: 'range', d: 0.25, min: 0.02, max: 1, step: 0.01, fx: 'uniform', l: 'Filament taper' },
        { k: 'ergy', t: 'range', d: 1.25, min: 0, max: 2, step: 0.05, fx: 'uniform', l: 'Strain glow' },
        { k: 'salign', t: 'bool', d: true, fx: 'uniform', l: 'Reaching marks aim at the hand' },
      ],
    },
    {
      g: 'Throw',
      note:
        'What a moving hand does. A parked hand does nothing at all — that is the aura’s job, in ' +
        'Life. Below the gate speed nothing tears; above it, matter is dragged along with the hand ' +
        'rather than popped away from it, and the radial push only clears it out of the way.',
      c: [
        { k: 'repelR', t: 'range', d: 76, min: 0, max: 320, step: 4, u: 'px', l: 'Wound radius' },
        { k: 'minv', t: 'range', d: 900, min: 100, max: 3000, step: 50, u: 'px/s', l: 'Gate speed' },
        { k: 'carry', t: 'range', d: 0.7, min: 0, max: 2, step: 0.02, l: 'Carry' },
        { k: 'push', t: 'range', d: 300, min: 0, max: 1200, step: 10, l: 'Radial push' },
        { k: 'drag', t: 'range', d: 2.1, min: 0.2, max: 8, step: 0.1, l: 'Air drag' },
        { k: 'spin', t: 'range', d: 1.2, min: 0, max: 4, step: 0.05, l: 'Tumble' },
      ],
    },
    {
      g: 'Return',
      note:
        'The return, in two destructive halves: a loose grain burns out as a code character, and ' +
        'the slot it left re-types in place. The same buffer entry both times — the matter is ' +
        'conserved in the machine even while the story on screen is destruction. A page change ' +
        'runs this same lifecycle, scheduled in bulk off the caret instead of one grain at a time.',
      c: [
        { k: 'delay', t: 'range', d: 1.37, min: 0.1, max: 4, step: 0.05, u: 's', l: 'Loose for' },
        { k: 'seam', t: 'range', d: 0.5, min: 0, max: 1, step: 0.02, l: 'Knit from the rim' },
        { k: 'burn', t: 'range', d: 0.45, min: 0.1, max: 1.5, step: 0.05, u: 's', l: 'Burn-out' },
        { k: 'mgap', t: 'range', d: 0.12, min: 0, max: 1.5, step: 0.02, u: 's', l: 'Gone for' },
        { k: 'mgrow', t: 'range', d: 0.55, min: 0.1, max: 2, step: 0.05, u: 's', l: 'Manifest' },
        { k: 'msize', t: 'range', d: 2.2, min: 1, max: 6, step: 0.1, u: '×', l: 'Manifest · swell' },
        { k: 'mflash', t: 'range', d: 1.2, min: 0, max: 4, step: 0.05, l: 'Manifest · flash' },
        { k: 'mflick', t: 'range', d: 80, min: 20, max: 400, step: 5, u: 'ms', l: 'Glyph cycle' },
      ],
    },
    {
      g: 'Material',
      note:
        'A letterform is a lit slab, not a stencil. The height field cut at sample time drives ' +
        'extrusion, camera parallax, rim and crevice shade at once, so thickness costs four floats ' +
        'a grain and no per-frame work. Validated in the lab at interior fill 0.69 and brightness ' +
        '1.25 — the material and that pair were measured together.',
      c: [
        {
          k: 'mat', t: 'select', d: 'chip', l: 'Settled form',
          opts: [{ v: 'chip', l: 'Chips (isometric)' }, { v: 'surface', l: 'Surface (normal-lit)' }],
        },
        { k: 'ext', t: 'range', d: 18, min: 0, max: 60, step: 1, u: 'px', fx: 'uniform', l: 'Extrusion' },
        { k: 'persp', t: 'range', d: 0.34, min: 0, max: 1.2, step: 0.02, fx: 'uniform', l: 'Near gain' },
        { k: 'cam', t: 'range', d: 0.58, min: 0, max: 2, step: 0.02, l: 'Camera lean' },
        { k: 'orbit', t: 'range', d: 0.14, min: 0, max: 0.6, step: 0.01, l: 'Camera drift' },
        { k: 'bump', t: 'range', d: 1.35, min: 0, max: 3, step: 0.05, fx: 'uniform', l: 'Normal strength' },
        { k: 'ao', t: 'range', d: 0.45, min: 0, max: 1, step: 0.02, fx: 'uniform', l: 'Crevice shade' },
        { k: 'amb', t: 'range', d: 0.3, min: 0, max: 1, step: 0.02, fx: 'uniform', l: 'Ambient' },
        { k: 'spec', t: 'range', d: 1, min: 0, max: 3, step: 0.05, fx: 'uniform', l: 'Specular' },
        { k: 'shin', t: 'range', d: 22, min: 2, max: 90, step: 1, fx: 'uniform', l: 'Specular tightness' },
        { k: 'rim', t: 'range', d: 0.85, min: 0, max: 2.5, step: 0.05, fx: 'uniform', l: 'Rim' },
        { k: 'rimp', t: 'range', d: 3.2, min: 0.5, max: 8, step: 0.1, fx: 'uniform', l: 'Rim tightness' },
        { k: 'face', t: 'range', d: 1, min: 0, max: 1, step: 0.02, fx: 'uniform', l: 'Chip face shading' },
        { k: 'lz', t: 'range', d: 0.55, min: 0.05, max: 2, step: 0.05, l: 'Key light · height' },
        { k: 'track', t: 'range', d: 0.44, min: 0, max: 1.5, step: 0.02, l: 'Key light · follows pointer' },
      ],
    },
    {
      g: 'Life',
      note:
        'What a settled word does when nobody is touching it. Every term here is an offset from ' +
        'where a grain rests or a multiplier on how bright it rests, so none of it accumulates — ' +
        'a page left alone for an hour is exactly where it started. All of it off is a legal ' +
        'reading: the words hold still and the material still lights.',
      c: [
        { k: 'wob', t: 'range', d: 0.8, min: 0, max: 6, step: 0.1, u: 'px', l: 'Wobble' },
        { k: 'flow', t: 'range', d: 4, min: 0, max: 12, step: 0.1, u: 'px', l: 'Stroke flow' },
        { k: 'ember', t: 'range', d: 0.56, min: 0, max: 1.5, step: 0.02, l: 'Ember' },
        { k: 'sheen', t: 'range', d: 0.4, min: 0, max: 1.5, step: 0.02, l: 'Sheen' },
        { k: 'sheenT', t: 'range', d: 4, min: 1.5, max: 16, step: 0.5, u: 's', l: 'Sheen · period' },
        { k: 'sheenW', t: 'range', d: 90, min: 20, max: 400, step: 5, u: 'px', l: 'Sheen · band width' },
        { k: 'aura', t: 'range', d: 0.58, min: 0, max: 1.5, step: 0.02, l: 'Cursor aura' },
        { k: 'sreach', t: 'range', d: 2.2, min: 0.5, max: 8, step: 0.1, u: '×', l: 'Cursor aura · reach' },
        { k: 'sway', t: 'range', d: 0.5, min: 0, max: 1.5, step: 0.02, l: 'Light sway' },
      ],
    },
    {
      g: 'Motion',
      note: 'The transition is the thing people come back to watch.',
      c: [
        { k: 'trFull', t: 'range', d: 1.9, min: 0.5, max: 5, step: 0.05, u: 's', l: 'Transition' },
        { k: 'trFirst', t: 'range', d: 1.7, min: 0.5, max: 5, step: 0.05, u: 's', l: 'First transition' },
        { k: 'trQuick', t: 'range', d: 0.62, min: 0.15, max: 2, step: 0.02, u: 's', l: 'Rapid nav' },
        { k: 'fullGate', t: 'range', d: 1200, min: 0, max: 4000, step: 100, u: 'ms', l: 'Full-choreography gate' },
        { k: 'caret', t: 'bool', d: true, l: 'Caret' },
        { k: 'caretW', t: 'range', d: 0.12, min: 0.03, max: 0.5, step: 0.01, l: 'Caret width' },
        { k: 'caretBlink', t: 'range', d: 1, min: 0.2, max: 3, step: 0.1, u: 's', l: 'Caret blink' },
        { k: 'caretTilt', t: 'range', d: 0.3, min: 0, max: 0.8, step: 0.02, u: 'rad', l: 'Caret tilt' },
        { k: 'fade', t: 'range', d: 0.5, min: 0.05, max: 2, step: 0.05, u: 's', css: '--fade', l: 'Copy fade' },
        { k: 'rise', t: 'range', d: 8, min: 0, max: 40, step: 1, u: 'px', css: '--rise', l: 'Copy rise' },
        { k: 'scramble', t: 'bool', d: true, l: 'Link scramble' },
        { k: 'scrambleMs', t: 'range', d: 550, min: 100, max: 2000, step: 25, u: 'ms', l: 'Scramble' },
        { k: 'boot', t: 'bool', d: true, fx: 'reload', l: 'Boot terminal' },
        { k: 'bootMs', t: 'range', d: 1250, min: 200, max: 5000, step: 50, u: 'ms', fx: 'reload', l: 'Boot hold' },
        { k: 'wheelGate', t: 'range', d: 140, min: 40, max: 500, step: 10, l: 'Wheel threshold' },
        { k: 'navLock', t: 'range', d: 500, min: 0, max: 2000, step: 50, u: 'ms', l: 'Nav cooldown' },
      ],
    },
    {
      g: 'Layout',
      note: 'Chrome and rhythm. Nothing here is the only copy of anything.',
      c: [
        { k: 'gutter', t: 'range', d: 8, min: 1, max: 18, step: 0.2, u: 'vw', css: '--gutter', fx: 'resample', l: 'Side gutter' },
        { k: 'maxw', t: 'range', d: 1180, min: 600, max: 1900, step: 20, u: 'px', css: '--maxw', fx: 'resample', l: 'Content width' },
        { k: 'stack', t: 'range', d: 4.5, min: 0.5, max: 12, step: 0.1, u: 'vh', css: '--stack', fx: 'resample', l: 'Block rhythm' },
        { k: 'block', t: 'range', d: 2.6, min: 0.2, max: 8, step: 0.1, u: 'vh', css: '--block', fx: 'resample', l: 'Inner rhythm' },
        { k: 'sigilW', t: 'range', d: 28, min: 10, max: 72, step: 1, u: 'px', css: '--sigil-w', fx: 'resample', l: 'Corner mark · width' },
        { k: 'sigilH', t: 'range', d: 40, min: 14, max: 100, step: 1, u: 'px', css: '--sigil-h', fx: 'resample', l: 'Corner mark · height' },
        { k: 'sigilLg', t: 'range', d: 1, min: 0.2, max: 2.4, step: 0.02, css: '--sigil-lg', fx: 'resample', l: 'Home mark · scale' },
        { k: 'sigilA', t: 'range', d: 28, min: 0, max: 100, step: 1, u: '%', css: '--sigil-a', l: 'Corner mark · fill' },
        { k: 'sigilLgA', t: 'range', d: 16, min: 0, max: 100, step: 1, u: '%', css: '--sigil-lg-a', l: 'Home mark · fill' },
        { k: 'rWindow', t: 'range', d: 10, min: 0, max: 32, step: 1, u: 'px', css: '--r-window', l: 'Radius · window' },
        { k: 'rPill', t: 'range', d: 20, min: 0, max: 32, step: 1, u: 'px', css: '--r-pill', l: 'Radius · tags' },
        { k: 'hud', t: 'bool', d: true, attr: 'hud', l: 'HUD strip' },
        { k: 'sigil', t: 'bool', d: true, attr: 'sigil', l: 'Hourglass mark' },
      ],
    },
    {
      g: 'System',
      note: 'Which of the two sites runs, and how hard it pushes the GPU.',
      c: [
        {
          k: 'mode', t: 'select', d: 'auto', fx: 'reload', l: 'Reading',
          opts: [{ v: 'auto', l: 'Auto (detect)' }, { v: 'matter', l: 'Force matter' }, { v: 'calm', l: 'Force calm' }],
        },
        { k: 'dpr', t: 'range', d: 2, min: 1, max: 3, step: 0.25, u: '×', fx: 'dpr', l: 'Canvas pixel cap' },
      ],
    },
  ];

  // Whole-look starting points. A preset is a full state, not a patch: keys it
  // omits go back to their default, so picking two in a row gives the second one
  // rather than a mixture of both.
  const PRESETS = {
    Default: {},
    Amber: { accent: '#ffb35c', bg: '#0c0a08', ink: '#f0e8dd', glint: 0.75 },
    Phosphor: { accent: '#7dfaa3', bg: '#060a07', ink: '#e2f2e6', rim: 1.2 },
    Bone: { accent: '#f4f4f2', bg: '#101012', ink: '#f6f6f4', glint: 0.2, bright: 0.8 },
    Dense: { count: 18000, grain: 1.4, fill: 0.9, gridk: 26, restS: 0.6, heroS: 0.85, bright: 0.95 },
    Sparse: { count: 4200, grain: 2.6, fill: 0.3, gridk: 52, restS: 1, heroS: 1.4, glint: 0.9 },
    Loud: { fs: 1.18, kDisplay: 1.15, wdth: 138, trDisplay: -0.035, ext: 30, cam: 0.9, wob: 2.4, glint: 1.1 },
    Quiet: { fs: 0.92, kDisplay: 0.85, wdth: 100, vig: 1.4, bright: 0.85, ext: 9, cam: 0.3, wob: 0.4, trFull: 2.6 },
  };

  /* -------------------------------------------------------------- values -- */

  const ALL = SCHEMA.flatMap((s) => s.c);
  const BY_KEY = Object.fromEntries(ALL.map((c) => [c.k, c]));
  const V = Object.fromEntries(ALL.map((c) => [c.k, c.d]));

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch (err) {
    /* private mode, or a hand-edited value: defaults are the right answer */
  }
  for (const k in saved) if (k in V) V[k] = saved[k];

  let dirty = false;
  const watchers = [];

  const optOf = (c, v) => (c.opts || []).find((o) => o.v === v) || (c.opts || [])[0] || {};

  function cssValue(c) {
    const v = V[c.k];
    if (c.t === 'select') return optOf(c, v).s || '';
    return c.u ? v + c.u : String(v);
  }

  function ensureFont(c) {
    const q = optOf(c, V[c.k]).q;
    if (!q) return;
    const id = 'tw-font-' + q.replace(/\W+/g, '-').slice(0, 40);
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${q}&display=swap`;
    document.head.appendChild(link);
  }

  function applyOne(c) {
    if (c.css) root.style.setProperty(c.css, cssValue(c));
    if (c.attr) root.setAttribute('data-' + c.attr, V[c.k] ? 'on' : 'off');
    if (c.fx === 'font') ensureFont(c);
  }

  // `first` is the pass that runs in <head>, and the only one allowed to decide
  // the reading: matter.js has already run by the time the panel exists, so
  // adding the class later would leave four pages nobody is drawing.
  function applyAll(first) {
    for (const c of ALL) applyOne(c);
    if (!first) return;
    // Forced readings live here rather than in the head probe so the choice
    // survives a reload. Matter cannot be forced onto a machine with no WebGL.
    if (V.mode === 'calm') root.classList.remove('matter');
    else if (V.mode === 'matter' && !root.classList.contains('matter')) {
      try {
        if (document.createElement('canvas').getContext('webgl')) root.classList.add('matter');
      } catch (err) {
        /* no context: the calm document is the only reading available */
      }
    }
  }

  applyAll(true); // before first paint -- this file is not deferred for a reason

  window.TWEAK = {
    v: V,
    /** The eight atlas cells, cycled from the chosen set. */
    chars() {
      const set = optOf(BY_KEY.glyphs, V.glyphs);
      const src = (set.v === 'custom' ? V.glyphsCustom : set.c).trim() || '01>${}*;';
      return Array.from({ length: 8 }, (_, i) => [...src][i % [...src].length]);
    },
    /** matter.js registers once: fn(fx) for anything it must redo. */
    watch(fn) {
      watchers.push(fn);
    },
    set(k, v) {
      if (!(k in V)) return;
      V[k] = v;
      commit(BY_KEY[k]);
    },
  };

  function commit(c) {
    applyOne(c);
    dirty = true;
    if (dot) dot.hidden = false;
    for (const w of watchers) {
      try {
        w(c.fx || null, c.k);
      } catch (err) {
        /* a broken watcher must not freeze the panel */
      }
    }
    if (c.fx === 'reload') {
      // Boot and the reading are decided before this script's own panel exists,
      // so they can only be honoured on the next load. Persisted first, or the
      // reload would throw the change away.
      persist();
      location.reload();
    }
  }

  function persist() {
    const out = {};
    for (const c of ALL) if (V[c.k] !== c.d) out[c.k] = V[c.k];
    try {
      localStorage.setItem(KEY, JSON.stringify(out));
      dirty = false;
      if (dot) dot.hidden = true;
      return true;
    } catch (err) {
      return false;
    }
  }

  /* ----------------------------------------------------------------- ui -- */

  const CSS = `
#tw-tab{position:fixed;right:0;top:50%;translate:0 -50%;z-index:95;display:flex;align-items:center;
gap:6px;padding:14px 7px;border:1px solid var(--line);border-right:0;background:var(--panel);
color:var(--quiet);font:500 10px/1 var(--mono);letter-spacing:.18em;text-transform:uppercase;
writing-mode:vertical-rl;cursor:pointer;transition:color .25s,border-color .25s}
#tw-tab:hover,#tw-tab[aria-expanded=true]{color:var(--accent);border-color:var(--accent)}
#tw-panel{position:fixed;top:0;right:0;bottom:0;z-index:96;width:min(340px,100vw);display:flex;
flex-direction:column;background:color-mix(in srgb,var(--panel) 96%,transparent);
border-left:1px solid var(--line);backdrop-filter:blur(14px);color:var(--ink);
font:400 12px/1.4 var(--mono);overscroll-behavior:contain}
#tw-panel[hidden]{display:none}
#tw-panel header{display:flex;align-items:center;gap:8px;padding:13px 14px;border-bottom:1px solid var(--line)}
#tw-panel header b{font:700 11px/1 var(--mono);letter-spacing:.2em;text-transform:uppercase}
#tw-dirty{width:5px;height:5px;border-radius:50%;background:var(--accent)}
#tw-panel header .sp{margin-left:auto}
#tw-panel button.act{padding:5px 9px;border:1px solid var(--line);background:none;color:var(--quiet);
font:400 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;cursor:pointer}
#tw-panel button.act:hover{color:var(--accent);border-color:var(--accent)}
#tw-panel button.act[data-a=save]{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent)}
#tw-presets{display:flex;flex-wrap:wrap;gap:5px;padding:11px 14px;border-bottom:1px solid var(--line)}
#tw-presets button{padding:4px 8px;border:1px solid var(--line);border-radius:var(--r-pill);background:none;
color:var(--quiet);font:400 10px/1 var(--mono);cursor:pointer}
#tw-presets button:hover{color:var(--accent);border-color:var(--accent)}
#tw-body{flex:1;overflow-y:auto;padding-bottom:18px}
#tw-body details{border-bottom:1px solid var(--line)}
#tw-body summary{padding:11px 14px;cursor:pointer;font:500 10.5px/1 var(--mono);letter-spacing:.16em;
text-transform:uppercase;color:var(--ink);list-style:none}
#tw-body summary::-webkit-details-marker{display:none}
#tw-body summary::before{content:'+ ';color:var(--accent)}
#tw-body details[open] summary::before{content:'– '}
#tw-body details[open] summary{color:var(--accent)}
#tw-body .note{margin:0 14px 10px;font-size:10.5px;line-height:1.5;color:var(--dimmer)}
.tw-row{display:grid;grid-template-columns:1fr auto;gap:2px 8px;padding:6px 14px}
.tw-row[hidden]{display:none}
.tw-row label{font-size:11px;color:var(--dim)}
.tw-row output{font-size:10.5px;color:var(--accent);text-align:right;font-variant-numeric:tabular-nums}
.tw-row input[type=range]{grid-column:1/-1;width:100%;height:16px;margin:0;accent-color:var(--accent);
background:none;cursor:pointer}
.tw-row select,.tw-row input[type=text]{grid-column:1/-1;width:100%;padding:5px 6px;border:1px solid var(--line);
background:var(--bg);color:var(--ink);font:400 11px/1.3 var(--mono)}
.tw-row input[type=color]{width:44px;height:20px;padding:0;border:1px solid var(--line);background:none;cursor:pointer}
.tw-row.bool{grid-template-columns:1fr auto;align-items:center}
.tw-row input[type=checkbox]{width:15px;height:15px;margin:0;accent-color:var(--accent);cursor:pointer}
#tw-foot{padding:10px 14px;border-top:1px solid var(--line);font-size:10px;line-height:1.5;color:var(--dimmer)}
@media (max-width:820px){#tw-panel{width:100vw}#tw-tab{top:auto;bottom:12px;writing-mode:horizontal-tb;
border-right:1px solid var(--line);right:12px}}`;

  let panel;
  let tab;
  let dot;
  const rows = [];

  function row(c) {
    const el = document.createElement('div');
    el.className = 'tw-row' + (c.t === 'bool' ? ' bool' : '');
    const id = 'tw-i-' + c.k;
    const lab = document.createElement('label');
    lab.htmlFor = id;
    lab.textContent = c.l;
    el.append(lab);

    let input;
    let out;
    if (c.t === 'range') {
      out = document.createElement('output');
      el.append(out);
      input = document.createElement('input');
      Object.assign(input, { type: 'range', min: c.min, max: c.max, step: c.step, value: V[c.k] });
    } else if (c.t === 'select') {
      input = document.createElement('select');
      for (const o of c.opts) {
        const op = document.createElement('option');
        op.value = o.v;
        op.textContent = o.l;
        input.append(op);
      }
      input.value = V[c.k];
    } else if (c.t === 'bool') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!V[c.k];
    } else if (c.t === 'color') {
      input = document.createElement('input');
      input.type = 'color';
      input.value = V[c.k];
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = V[c.k];
      input.placeholder = 'up to 8 characters';
    }
    input.id = id;
    el.append(input);

    // Float steps land on values like 0.15000000000000002; four places is past
    // the smallest step in the schema and short enough to read at 10px.
    const show = () => {
      if (out) out.textContent = +V[c.k].toFixed(4) + (c.u || '');
    };
    show();
    input.addEventListener('input', () => {
      V[c.k] = c.t === 'range' ? +input.value : c.t === 'bool' ? input.checked : input.value;
      show();
      commit(c);
      refreshVisibility();
    });
    rows.push({ c, el, input, show });
    return el;
  }

  function refreshVisibility() {
    for (const r of rows) if (r.c.when) r.el.hidden = !r.c.when(V);
  }

  /** Push V back into every control -- after a preset or a reset. */
  function syncUI() {
    for (const r of rows) {
      if (r.c.t === 'bool') r.input.checked = !!V[r.c.k];
      else r.input.value = V[r.c.k];
      r.show();
    }
    refreshVisibility();
  }

  function patch(vals) {
    for (const k in V) V[k] = k in vals ? vals[k] : BY_KEY[k].d;
    applyAll(false);
    syncUI();
    dirty = true;
    dot.hidden = false;
    // A whole-state change invalidates everything, so every effect is announced
    // once. The boot terminal and the forced reading are read at load and simply
    // take effect next time; nothing here reloads the page underneath a click.
    for (const fx of ['uniform', 'blend', 'atlas', 'dpr', 'font', 'count', 'resample']) {
      for (const w of watchers) {
        try {
          w(fx, null);
        } catch (err) {
          /* as above: one bad watcher must not take the panel with it */
        }
      }
    }
  }

  function build() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.append(style);

    tab = document.createElement('button');
    tab.id = 'tw-tab';
    tab.type = 'button';
    tab.textContent = 'tweak';
    tab.setAttribute('aria-expanded', 'false');
    tab.setAttribute('aria-controls', 'tw-panel');

    panel = document.createElement('aside');
    panel.id = 'tw-panel';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Appearance, matter and motion controls');

    const head = document.createElement('header');
    head.innerHTML =
      '<b>tweak</b><span id="tw-dirty" hidden title="unsaved"></span>' +
      '<span class="sp"></span>' +
      '<button class="act" type="button" data-a="save">save</button>' +
      '<button class="act" type="button" data-a="reset">reset</button>' +
      '<button class="act" type="button" data-a="close" aria-label="Close">✕</button>';
    dot = head.querySelector('#tw-dirty');

    const pre = document.createElement('div');
    pre.id = 'tw-presets';
    for (const name of Object.keys(PRESETS)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = name;
      b.addEventListener('click', () => patch(PRESETS[name]));
      pre.append(b);
    }

    const body = document.createElement('div');
    body.id = 'tw-body';
    SCHEMA.forEach((sec, i) => {
      const d = document.createElement('details');
      d.open = i === 0;
      const s = document.createElement('summary');
      s.textContent = sec.g;
      d.append(s);
      if (sec.note) {
        const n = document.createElement('p');
        n.className = 'note';
        n.textContent = sec.note;
        d.append(n);
      }
      for (const c of sec.c) d.append(row(c));
      body.append(d);
    });

    const foot = document.createElement('p');
    foot.id = 'tw-foot';
    foot.textContent = 'Save keeps these on this browser. Reset restores the design system. T toggles.';

    panel.append(head, pre, body, foot);
    document.body.append(tab, panel);
    refreshVisibility();

    head.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'save') {
        a.textContent = persist() ? 'saved' : 'blocked';
        setTimeout(() => (a.textContent = 'save'), 1100);
      } else if (a.dataset.a === 'reset') {
        try {
          localStorage.removeItem(KEY);
        } catch (err) {
          /* nothing to remove */
        }
        patch({});
        dirty = false;
        dot.hidden = true;
      } else open(false);
    });

    tab.addEventListener('click', () => open(panel.hidden));
    // The site navigates on wheel, key and touch. While the panel is open those
    // gestures belong to it, which matter.js reads off this attribute.
    addEventListener('keydown', (ev) => {
      const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName);
      if (ev.key === 'Escape' && !panel.hidden) open(false);
      else if ((ev.key === 't' || ev.key === 'T') && !typing) open(panel.hidden);
    });
  }

  function open(on) {
    panel.hidden = !on;
    tab.setAttribute('aria-expanded', String(on));
    root.setAttribute('data-tw', on ? 'open' : 'closed');
    if (on) panel.querySelector('button.act').focus();
    else tab.focus();
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', build);
  else build();
})();
