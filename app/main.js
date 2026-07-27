// Entry point. Reads the beats already present in the markup, gives each one a
// formation, and choreographs the field against the scroll. The page is fully
// readable before any of this runs — html.gl is only ever additive, so a failed
// context or a blocked bundle costs the visitor nothing.

import gsap from 'gsap';

import { createCrystals } from './crystal.js';
import { createField } from './field.js';
import { glyphs, horizon, nebula, scatter, segment, stream } from './forms.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Particle budget by device class — mobile gets a real field, not an apology. */
function tier() {
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const small = Math.min(innerWidth, innerHeight) < 700;
  // Fewer particles get proportionally larger points, so the field keeps the
  // same visual mass on a phone as it has on a workstation.
  if (small || mem <= 4 || cores <= 4) return { count: 48000, size: 3.4, dpr: 1.5 };
  if (mem <= 8) return { count: 110000, size: 2.6, dpr: 1.6 };
  return { count: 170000, size: 2.3, dpr: 1.75 };
}

/**
 * How far the field may sit out of the copy's way. Wide viewports have a free
 * right-hand column; narrow ones do not, so the field recentres and the veil's
 * scrim takes over the job of protecting contrast.
 */
function laneShift() {
  return Math.max(0, Math.min(1, (innerWidth - 720) / 560));
}

function readJson(id, fallback) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return fallback;
  }
}

/** Camera and framing per beat: the composition changes, not just the shape. */
// Copy owns the left of the viewport at every beat, so the field is staged to
// the right of it. ox/oy are world-space offsets, scaled down once the layout
// stacks and there is no longer a free column to move into.
const STAGE = {
  hero: { z: 16, ry: 0.15, rx: 0.06, drift: 0.07, ox: 6.5, oy: 0.4 },
  moving: { z: 11.5, ry: -0.55, rx: 0.1, drift: 0.05, ox: 5.4, oy: -0.6 },
  bridge: { z: 14, ry: 0.22, rx: 0.34, drift: 0.06, ox: 4.4, oy: 1.5 },
  acting: { z: 12.5, ry: 0.08, rx: 0.12, drift: 0.09, ox: 5.2, oy: 0.1 },
  gallery: { z: 13.5, ry: 0.1, rx: 0.18, drift: 0.11, ox: 4.6, oy: 0.2 },
  about: { z: 12, ry: -0.3, rx: 0.1, drift: 0.08, ox: 5.6, oy: 0 },
  contact: { z: 9.5, ry: 0, rx: -0.14, drift: 0.04, ox: 2.2, oy: -0.8 },
};

/**
 * Every repository the rebuild read, flashing past too fast to finish reading
 * and just slow enough to register, while the field assembles behind it.
 * Started before the field is built, since that is the part worth covering.
 */
function startOverture(bootEl, names) {
  if (!bootEl) return { done: Promise.resolve(), abort() {} };

  const bar = bootEl.querySelector('.boot-bar i');
  const gauge = bootEl.querySelector('.boot-bar');
  const nameEl = bootEl.querySelector('.boot-name');
  const roll = names?.length ? names : ['github'];
  bootEl.hidden = false;

  const STEP = 78;
  const span = reduced ? 500 : Math.max(roll.length * STEP * 2, 1700);
  const started = performance.now();
  let i = 0;
  let closed = false;
  let tick = 0;
  let settle;
  // Resolves as the panel starts fading, which is the cue for ignition: the
  // dust begins gathering under a scrim that is on its way out.
  const done = new Promise((r) => (settle = r));

  const close = () => {
    if (closed) return;
    closed = true;
    clearInterval(tick);
    if (nameEl) nameEl.textContent = ' ';
    bootEl.classList.add('done');
    setTimeout(() => (bootEl.hidden = true), 800);
    settle();
  };

  tick = setInterval(() => {
    const p = Math.min((performance.now() - started) / span, 1);
    if (nameEl && !reduced) nameEl.textContent = roll[i++ % roll.length];
    if (bar) bar.style.transform = `scaleX(${p})`;
    gauge?.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    if (p >= 1) close();
  }, STEP);

  // abort() tears the rush down immediately when there is nothing to cover.
  return { done, abort: close };
}

function boot() {
  const canvas = document.getElementById('field');
  const beats = [...document.querySelectorAll('[data-beat]')];
  const bootEl = document.getElementById('boot');
  if (!canvas || !beats.length) return;

  const data = readJson('field-data', { clusters: [1], featured: 6 });
  const repos = data.clusters.map((score) => ({ score }));

  // The overture runs *before* the field is built: allocating and compiling for
  // ~170k particles is the slow part, and a loader that only appears once the
  // loading is done is not a loader.
  const overture = startOverture(bootEl, data.names);

  const t = tier();
  let field;
  try {
    field = createField(canvas, t.count);
  } catch {
    overture.abort(); // No WebGL. The document is already complete without us.
    return;
  }
  const { renderer, scene, camera, points, spin, geometry, material, from, to, count } = field;

  material.uniforms.uSize.value = t.size;
  const delay = geometry.getAttribute('aDelay').array;

  // Which formation belongs to each beat. In the gallery the field steps back
  // to a wide ambient scatter on purpose: the crystals carry the shapes there,
  // and the field orbits them rather than composing them.
  const makers = beats.map((el) => {
    const kind = el.dataset.beat;
    if (kind === 'hero') return () => nebula(to, count, repos);
    if (kind === 'moving') return () => stream(to, count, 5);
    if (kind === 'bridge') return () => segment(to, count);
    // Both crystal beats step the field back to ambient: the solids carry the
    // shapes there, and the field orbits them rather than composing them.
    if (kind === 'acting' || kind === 'gallery') return () => scatter(to, count);
    if (kind === 'about') return () => nebula(to, count, repos.slice(0, 3));
    return () => horizon(to, count);
  });

  // Two crystal sets, one contrast. The Gallery's six are fetched and ranked
  // nightly and drift accordingly; the Acting station's four are settled
  // history and are held still as waypoints.
  const list = (v) => (Array.isArray(v) && v.length ? v : null);
  const sets = {
    gallery: list(data.seeds) && createCrystals(data.seeds),
    acting: list(data.acting) && createCrystals(data.acting, { still: true }),
  };
  for (const set of Object.values(sets)) if (set) scene.add(set.group);

  const aFrom = geometry.getAttribute('aFrom');
  const aTo = geometry.getAttribute('aTo');
  const aPos = geometry.getAttribute('position');

  let current = -1;
  let morphTween = null;

  // ---- gallery selection --------------------------------------------------

  // The list of names is the interface; the constellation answers it. Pointing
  // at a project opens its detail and lights its crystal, and because the
  // driver is the link's own hover and focus, a keyboard walks the gallery
  // exactly as a pointer does.
  // ponytail: no raycasting back the other way — the crystals are not
  // clickable. Add a Raycaster over crystals.crystals if the solids start
  // reading as decoration rather than as the gallery itself.
  const orbs = [...document.querySelectorAll('.orb')];
  let selected = -1;

  function select(index) {
    if (index === selected) return;
    selected = index;
    orbs.forEach((el, i) => el.classList.toggle('sel', i === index));
    sets.gallery?.crystals.forEach((c, i) => {
      gsap.to(c.material.uniforms.uFocus, {
        value: i === index ? 1 : 0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true,
      });
      gsap.to(c.mesh.scale, {
        x: c.scale * (i === index ? 1.32 : 1),
        y: c.scale * (i === index ? 1.32 : 1),
        z: c.scale * (i === index ? 1.32 : 1),
        duration: 0.7,
        ease: 'expo.out',
        overwrite: true,
      });
    });
  }

  orbs.forEach((el, i) => {
    const link = el.querySelector('.orb-a');
    el.addEventListener('pointerenter', () => select(i));
    link?.addEventListener('focus', () => select(i));
  });

  function goTo(index) {
    if (index === current || !makers[index]) return;
    current = index;

    // Freeze the field exactly where it is, so an interrupted morph never pops.
    const m = material.uniforms.uMorph.value;
    for (let i = 0; i < count; i++) {
      let p = (m - delay[i] * 0.34) / 0.66;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      p = p * p * (3 - 2 * p);
      const o = i * 3;
      from[o] += (to[o] - from[o]) * p;
      from[o + 1] += (to[o + 1] - from[o + 1]) * p;
      from[o + 2] += (to[o + 2] - from[o + 2]) * p;
    }

    makers[index]();
    aFrom.needsUpdate = true;
    aTo.needsUpdate = true;
    aPos.needsUpdate = true;

    const s = STAGE[beats[index].dataset.beat] || STAGE.about;
    const lane = laneShift();
    material.uniforms.uMorph.value = 0;
    morphTween?.kill();

    // Each crystal set belongs to exactly one beat. Everywhere else it is
    // shattered and gone, so arriving is the front sweeping solids into
    // existence and leaving is the same front run backwards.
    const kind = beats[index].dataset.beat;
    for (const [name, set] of Object.entries(sets)) {
      if (!set) continue;
      const held = kind === name;
      set.group.position.set(s.ox * lane, s.oy * lane, 0);
      set.crystals.forEach((c, i) => {
        const delay = held ? i * 0.11 : 0;
        gsap.to(c.material.uniforms.uForm, {
          value: held ? 1 : 0,
          duration: held ? 1.9 : 1.1,
          delay,
          ease: 'power2.inOut',
          overwrite: true,
        });
        gsap.to(c.material.uniforms.uOpacity, {
          value: held ? 1 : 0,
          duration: held ? 1.4 : 0.9,
          delay,
          overwrite: true,
        });
      });
    }
    if (kind !== 'gallery') select(-1);
    else if (selected < 0) select(0);

    if (reduced) {
      material.uniforms.uMorph.value = 1;
      material.uniforms.uDrift.value = 0;
      camera.position.z = s.z;
      points.rotation.set(s.rx, s.ry, 0);
      points.position.set(s.ox * lane, s.oy * lane, 0);
      render();
      return;
    }

    gsap.to(points.position, {
      x: s.ox * lane,
      y: s.oy * lane,
      duration: 2.4,
      ease: 'expo.out',
      overwrite: 'auto',
    });

    morphTween = gsap.to(material.uniforms.uMorph, {
      value: 1,
      duration: 2.1,
      ease: 'expo.out',
      overwrite: true,
    });
    gsap.to(camera.position, { z: s.z, duration: 2.1, ease: 'expo.out', overwrite: true });
    gsap.to(points.rotation, {
      x: s.rx,
      y: s.ry,
      duration: 2.4,
      ease: 'expo.out',
      overwrite: 'auto',
    });
    gsap.to(material.uniforms.uDrift, { value: s.drift, duration: 1.6, ease: 'power2.out' });
  }

  // ---- sizing -------------------------------------------------------------

  function resize() {
    const w = innerWidth;
    const h = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, t.dpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    material.uniforms.uDpr.value = dpr;
    // Narrow viewports have no spare column, so the field sits under the copy.
    // There it is atmosphere, not subject, and it dims to stay out of the way.
    material.uniforms.uOpacity.value = 0.5 + laneShift() * 0.5;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // ---- pointer ------------------------------------------------------------

  const pointer = material.uniforms.uPointer.value;
  const target = { x: 0, y: 0 };
  if (!reduced) {
    addEventListener(
      'pointermove',
      (ev) => {
        target.x = (ev.clientX / innerWidth - 0.5) * 12;
        target.y = -(ev.clientY / innerHeight - 0.5) * 8;
      },
      { passive: true },
    );
  }

  // ---- the stage ----------------------------------------------------------

  // Under html.stage the beats stop being a scrolling document and become a
  // stack of layers inside a fixed viewport; #track is the only element left
  // with height, so scrolling reads as progress rather than as movement. That
  // is what makes the loop seam possible — nothing on screen is positioned by
  // scrollY, so returning to the top moves nothing.
  //
  // Track length is one viewport per beat plus one for the seam, and one more
  // because the first viewport of scroll is consumed getting off the top.
  const SEAM = beats.length; // the empty slot past the last beat
  const track = document.createElement('div');
  track.id = 'track';
  track.setAttribute('aria-hidden', 'true');

  const shown = new Float32Array(beats.length);
  let span = 1;
  let seamAt = 0;
  let live = false; // scroll only takes the field once ignition has handed over

  function measure() {
    span = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
  }

  /**
   * One frame of the stage: scroll position picks the formation, and drives
   * each beat's copy through fade-in / hold / fade-out. Between two beats the
   * copy is fully gone and only the field carries the transition — that gap is
   * the `transit` of destabilise → transit → resolve.
   */
  function stage(now) {
    const p = (scrollY / span) * (SEAM + 1);
    const seam = p >= SEAM;

    // In the seam the field is already morphing back to the opening formation,
    // so by the time the jump happens it is mid-transit and the cut is unseeable.
    if (live) goTo(seam ? 0 : Math.min(Math.floor(p), beats.length - 1));

    for (let b = 0; b < beats.length; b++) {
      const local = p - b;
      let v = 0;
      if (!seam && local >= 0 && local < 1) {
        // Beat 0 does not fade in: at the top of the track it is already there,
        // revealed by the overture rather than by scrolling into it.
        const rise = b === 0 ? 1 : Math.min(local / 0.18, 1);
        v = Math.max(Math.min(rise, (1 - local) / 0.22, 1), 0);
      }
      if (Math.abs(v - shown[b]) < 0.004) continue;
      if (v > 0 !== shown[b] > 0) {
        beats[b].classList.toggle('on', v > 0);
        beats[b].toggleAttribute('inert', v <= 0);
        // A beat tall enough to scroll internally is always re-entered from its
        // heading, never from wherever it was left.
        if (v <= 0) beats[b].scrollTop = 0;
      }
      shown[b] = v;
      beats[b].style.setProperty('--in', v.toFixed(3));
    }

    // 60% into the seam, with the field already committed to the opening.
    if (seam && p - SEAM > 0.6 && now - seamAt > 900) {
      seamAt = now;
      scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  // ---- ignition -----------------------------------------------------------

  const title = document.querySelector('#hero h1');

  /**
   * Where an element's text actually sits, in world units on the z = 0 plane.
   *
   * A Range over the contents gives the text's own rects — one per line box —
   * rather than the block's, which is what makes the particles land on the
   * letterforms instead of in the middle of the column the heading sits in.
   */
  function typeLayout(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
    if (!rects.length) return null;

    const cs = getComputedStyle(el);
    const pad = parseFloat(cs.fontSize) * 0.38; // a 0.94 line box does not contain its own glyphs
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    const top = Math.min(...rects.map((r) => r.top)) - pad;
    const bottom = Math.max(...rects.map((r) => r.bottom)) + pad;
    const per = (2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360)) / innerHeight;

    return {
      px: right - left,
      py: bottom - top,
      w: (right - left) * per,
      h: (bottom - top) * per,
      cx: ((left + right) / 2 - innerWidth / 2) * per,
      cy: (innerHeight / 2 - (top + bottom) / 2) * per,
      lines: rects.map((r) => ({ x: r.left - left, y: r.top - top, w: r.width, h: r.height })),
      font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
      tracking: cs.letterSpacing,
    };
  }

  /**
   * The opening. Dust gathers into the name in the page's own letterforms,
   * holds long enough to be read as type, hands off to the real <h1>, and
   * disperses into the account's disc — which is the first beat's own
   * formation, so the sequence ends exactly where scroll choreography begins.
   *
   * Played once, on load. The loop seam returns to an assembled hero rather
   * than replaying this, because un-lighting the name to re-spell it is a pop,
   * and the seam's whole job is to have no pop in it.
   */
  async function ignite() {
    // Scheduled before anything that can throw: whatever becomes of the field,
    // the name gets lit. It is the one element that may never depend on WebGL.
    gsap.delayedCall(3.6, () => {
      title?.classList.add('lit');
      live = true;
    });
    if (!title) return goTo(0);

    // Sampling letterforms before the face has arrived spells the name in a
    // fallback grotesque. The overture is on screen covering exactly this wait;
    // the race is so a font that never settles cannot strand the field as dust.
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2000))]);

    camera.position.z = STAGE.hero.z;
    points.position.set(0, 0, 0);
    points.rotation.set(0, 0, 0);
    const layout = typeLayout(title);
    if (!layout) return goTo(0);

    glyphs(to, count, title.textContent, layout);
    aTo.needsUpdate = true;
    material.uniforms.uMorph.value = 0;
    material.uniforms.uDrift.value = 0.012; // letterforms have to hold still to be read
    gsap.to(material.uniforms.uMorph, { value: 1, duration: 2.4, ease: 'expo.out' });

    // Long enough after the reveal that the type is already carrying the name
    // when the particles let go of it.
    gsap.delayedCall(4.1, () => goTo(0));
  }

  // ---- loop ---------------------------------------------------------------

  const clock = { t: 0, last: performance.now() };

  function render() {
    renderer.render(scene, camera);
  }

  function frame(now) {
    const dt = Math.min((now - clock.last) / 1000, 0.05);
    clock.last = now;
    clock.t += dt;
    material.uniforms.uTime.value = clock.t;
    pointer.x += (target.x - pointer.x) * 0.06;
    pointer.y += (target.y - pointer.y) * 0.06;
    spin.rotation.y += dt * 0.014;
    for (const set of Object.values(sets)) set?.orbit(clock.t);
    stage(now);
    render();
    requestAnimationFrame(frame);
  }

  // ---- wiring -------------------------------------------------------------

  resize();
  addEventListener('resize', () => {
    resize();
    measure();
    const s = STAGE[beats[current]?.dataset.beat] || STAGE.hero;
    const lane = laneShift();
    points.position.set(s.ox * lane, s.oy * lane, 0);
    for (const set of Object.values(sets)) set?.group.position.set(s.ox * lane, s.oy * lane, 0);
  });

  // The field starts dispersed, so the opening is an assembly the visitor
  // watches rather than a shape that was simply there.
  scatter(from, count);
  aFrom.needsUpdate = true;
  aPos.needsUpdate = true;

  document.documentElement.classList.add('gl');

  if (reduced) {
    // Stage mode never applies: the page stays the readable vertical document
    // it already is, and the field holds one static frame of the first beat.
    title?.classList.add('lit');
    goTo(0);
    render();
    overture.abort();
    return;
  }

  document.documentElement.style.setProperty('--slots', String(SEAM + 2));
  document.documentElement.classList.add('stage');
  document.body.append(track);
  beats.forEach((el) => el.setAttribute('inert', ''));
  measure();
  scrollTo({ top: 0, behavior: 'instant' });
  stage(performance.now()); // lays the first beat out before ignition measures its name
  requestAnimationFrame(frame);
  overture.done.then(ignite);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
