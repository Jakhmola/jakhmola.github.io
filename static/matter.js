// The matter system: one conserved particle buffer that spells the site.
//
// Every heading marked `.mt` is sampled off-screen into a point cloud. Navigating
// runs one choreography over that single buffer: a caret sweeps the current page
// and everything it passes over burns out as a code character, it travels, and it
// sweeps the next page typing each slot back into existence. Nothing is created
// or destroyed -- the entry that manifests into a slot is the one that vacated
// it -- and nothing idles anywhere in between.
//
// Runs only when index.html's head probe set `.matter` on <html> (WebGL present,
// motion not reduced, viewport wide enough). Otherwise the page is already a
// plain scrolling document and this file does nothing.
//
// Rendering is hand-rolled WebGL1 rather than a library: it is a single
// gl.POINTS draw call, so a 3D engine would be ~600KB of CDN for ~80 lines.

(() => {
  'use strict';

  const root = document.documentElement;
  if (!root.classList.contains('matter')) return;

  // Every number in this file that used to be a named constant is now a knob in
  // tweak.js's schema, which owns the defaults and the rationale for each one.
  // `T` is the live value object -- mutated in place by the panel, so a read in
  // the frame loop already sees the new value with no plumbing in between.
  //
  // Without tweak.js there are no values to run on, and the calm scrolling
  // document is the correct fallback rather than four pages of hidden headings.
  if (!window.TWEAK) {
    root.classList.remove('matter');
    return;
  }
  const T = window.TWEAK.v;

  // Headless instrumentation, entirely off unless the URL asks for it.
  //
  // A capture has to aim at an exact frame, and a loop driven by wall-clock rAF
  // cannot be aimed: headless virtual time freezes the clock and starves rAF,
  // so the only way to reach a known moment deterministically is to integrate
  // to it before the first paint. `#t0=2.5` does exactly that, `#dbg=1` paints
  // what the field is actually doing. Both skip the boot gate, because a
  // capture is not a visitor. See tools/bench.mjs.
  const QS = new URLSearchParams(location.hash.slice(1));
  const DBG = QS.has('dbg');
  const T0 = +(QS.get('t0') || 0);
  // `#mx=300&my=320` parks a hand there for the whole capture. Half of what the
  // material does is a response to a pointer, and a headless browser has none --
  // so without this every screenshot of the aura and the reach is a screenshot
  // of the field with nobody in the room.
  const MX = QS.has('mx') ? +QS.get('mx') : null;

  const PAGES = ['home', 'exp', 'proj', 'contact'];
  const LABELS = { home: 'INDEX', exp: 'EXPERIENCE', proj: 'PROJECTS', contact: 'CONTACT' };

  // A *view* is the unit the field is sampled and scheduled in; a *page* is the
  // unit the nav, the HUD and the URL talk about. They were the same thing until
  // the Experience page became a tape, where one Epoch owns the viewport and the
  // other three are laid out behind it so they can be measured.
  //
  // Keying the point clouds by view rather than by page is the whole of the tape.
  // `sampleAll` cuts one cloud per Epoch, `startTr` burns the old view's slots
  // out and types the new view's in, and an Epoch change is therefore mechanically
  // a page change -- the same caret, the same schedule, no second code path. It
  // also means only the Epoch on screen spends grain: sampling all four titles
  // against one budget would ask for roughly four times what the page has.
  const EPN = document.querySelectorAll('#pg-exp .epoch').length;
  const VIEWS = PAGES.flatMap((p) =>
    p === 'exp' && EPN ? Array.from({ length: EPN }, (_, i) => `exp:${i}`) : [p],
  );
  const pageOf = (v) => (v && v.split(':')[0]) || v;
  const epOf = (v) => {
    const i = v ? v.indexOf(':') : -1;
    return i < 0 ? -1 : +v.slice(i + 1);
  };
  // The view a page is entered at from outside it. Always its first: arriving on
  // Experience from the nav should start the tape at the beginning, not resume
  // wherever it was left.
  const firstView = (p) => VIEWS.find((v) => pageOf(v) === p) || p;
  const isView = (v) => VIEWS.includes(v);
  // The element a view's `.mt` and `.copy` are read from. An Epoch view sees only
  // its own subtree, which is what scopes the sample.
  const rootOf = (v) => {
    const ep = epOf(v);
    return ep < 0 ? $('pg-' + v) : $('pg-exp').querySelector(`.epoch[data-ep="${ep}"]`);
  };
  // The buffer is allocated once at the panel's ceiling and never reallocated;
  // `NP` is how many of those grains are live. Moving the budget changes what is
  // simulated and drawn, not what is allocated, so it stays a slider rather than
  // a page reload -- and conservation still holds over the live set.
  const MAXN = 22000;
  let NP = Math.max(400, Math.min(MAXN, T.count | 0));
  const NARROW = matchMedia('(max-width: 820px)');
  // A grain sprite must stay near its sample spacing (The Grain Ratio Rule), so
  // `grain`, `heroS`, `restS` and `grid` are only meaningful relative to each
  // other. The panel can break that relationship on purpose; the defaults are
  // the measured set.
  const CLAMP = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  // The direction the sheen band travels in, as a unit normal. Diagonal and
  // mostly horizontal, because the composition is wider than it is tall and a
  // band that crossed vertically would light whole lines at once rather than
  // walking through the words. Its width and strength are knobs; the angle is
  // the composition's, and it moves when the layout does, not when a slider does.
  const SHEEN = [0.94, 0.34];
  // Which of the eight atlas cells a grain shows at a given tick. Two odd
  // multiplies and a shift: a dying or manifesting grain cycles characters
  // deterministically, with no per-grain glyph state to store and no random
  // number drawn per frame per grain.
  const glyphOf = (c, k) => (Math.imul(c, 2654435761) ^ Math.imul(k, 40503)) >>> 29;

  const $ = (id) => document.getElementById(id);

  function accentRGB() {
    const hex = getComputedStyle(document.body).getPropertyValue('--accent').trim();
    const m = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
    return m ? [1, 2, 3].map((i) => parseInt(m[i], 16) / 255) : [0.4, 0.91, 0.98];
  }

  /* ------------------------------------------------------------ renderer -- */

  // The letterform is a lit slab, not a stencil.
  //
  // `aN` is the letterform's own surface normal at this grain -- the gradient of
  // the blurred occupancy field cut at sample time. `aShade` is that same
  // field's value: depth into the stroke, 0 at the contour and 1 at the spine.
  // `aZ` is the depth already scaled by the type size it came from, because a
  // 42px figure and a 113px name cannot be extruded by the same pixel count
  // without the small one separating into two ghosts of itself.
  //
  // Extrusion, camera parallax, near-gain, rim and crevice shade all read those
  // three, so thickness costs four floats a grain and no per-frame geometry.
  const VERT = `
attribute vec2 aPos; attribute vec2 aHome; attribute float aSize; attribute float aAlpha;
attribute float aChip; attribute float aGlyph; attribute float aRot;
attribute float aZ; attribute float aShade; attribute vec2 aN; attribute float aGly;
uniform vec2 uRes; uniform float uDpr; uniform float uSize;
uniform float uPersp; uniform vec2 uCam; uniform float uExt;
uniform float uBright; uniform float uBump; uniform float uAo;
uniform vec3 uLight; uniform float uAmb; uniform float uSpec; uniform float uShin;
uniform float uRim; uniform float uRimP; uniform float uStretch;
uniform float uFace;
varying float vA; varying float vG; varying float vC; varying float vR;
varying float vS; varying float vLit; varying float vSpc; varying float vGly;
varying float vE; varying float vW; varying vec2 vDir; varying float vPs;
varying vec3 vFace; varying float vTspec;
void main(){
  float near = 1.0 + aShade * uPersp;
  vA = aAlpha * uBright;
  vG = aGlyph; vC = aChip; vR = aRot; vGly = aGly;
  // Crevice shade is the same field read the other way: the contour sits back.
  vS = mix(1.0 - uAo, 1.0, aShade);

  // Surface shading, computed once per grain per frame in the vertex stage --
  // 1/40th the work of doing it per fragment, and the normal is constant across
  // a 3px sprite anyway.
  vec2 n2 = aN * uBump;
  float nz = sqrt(max(0.04, 1.0 - min(0.96, dot(n2, n2))));
  vec3 N = normalize(vec3(n2, nz));
  vec3 L = normalize(uLight);
  // Rim on the steep normals only. A contour that catches light while the spine
  // stays matte is the cheapest honest signal that a form has thickness.
  float rim = pow(1.0 - nz, uRimP) * uRim;
  vLit = uAmb + (1.0 - uAmb) * max(0.0, dot(N, L)) + rim;
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  vSpc = pow(max(0.0, dot(N, H)), uShin) * uSpec;

  // The chip's three faces are lit here, once per grain. The silhouette rotates
  // per fragment by aRot, so the face normals rotate with it -- a tumbling cube
  // catches and loses the light instead of wearing three painted-on tones.
  float fc = cos(aRot), fs = sin(aRot);
  mat2 FR = mat2(fc, -fs, fs, fc);
  vec3 Nt = vec3(FR * vec2(0.0, -0.55), 0.84);
  vec3 Nl = vec3(FR * vec2(-0.80, 0.28), 0.53);
  vec3 Nr = vec3(FR * vec2(0.80, 0.28), 0.53);
  vec3 lit = uAmb + (1.0 - uAmb) *
    max(vec3(0.0), vec3(dot(Nt, L), dot(Nl, L), dot(Nr, L)));
  vFace = mix(vec3(1.0), lit, uFace);
  vTspec = pow(max(0.0, dot(Nt, H)), uShin) * uSpec;

  // A strand is not extra geometry. The grain's own sprite is grown to span the
  // gap back to its anchor, and the fragment stage draws a tapered capsule
  // inside it. Nothing pulls yet -- uStretch is 0 until the stretch task lands,
  // and the sprite degenerates to the plain form exactly.
  // ponytail: the sprite is square, so a long diagonal segment costs len^2
  //   fragments. Segment reach bounds it; instanced quads if it ever binds.
  float basePx = max(1.0, aSize * uSize * near);
  vec2 hd = (aHome - aPos) * uStretch;
  float len = length(hd);
  float sizePx = basePx + len;
  vE = len / sizePx;
  vW = basePx / sizePx;
  vDir = len > 0.001 ? -hd / len : vec2(1.0, 0.0);

  gl_PointSize = clamp(sizePx * uDpr, 1.0, 300.0);
  vPs = gl_PointSize;
  // The camera leans across the extruded depth. Spine and contour separate by
  // parallax, which is the one cue a flat sticker can never produce.
  vec2 p = aPos + hd * 0.5 + uCam * (aZ * uExt);
  gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
}`;

  const FRAG = `
precision mediump float;
uniform vec3 uColor; uniform sampler2D uAtlas;
uniform float uOpaque; uniform float uFace; uniform float uGlint;
uniform float uErg;
uniform highp float uStretch;  // shared with the vertex stage, so precision must match
uniform float uTaper; uniform float uAlign; uniform float uTail;
varying float vA; varying float vG; varying float vC; varying float vR;
varying float vS; varying float vLit; varying float vSpc; varying float vGly;
varying float vE; varying float vW; varying vec2 vDir; varying float vPs;
varying vec3 vFace; varying float vTspec;

const float S = 0.866;

void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float aa = 3.0 / max(vPs, 3.0);

  // Under stretch the sprite spans grain -> reach point, and the grain's own
  // form rides at its end of that span instead of dissolving into it. bq is
  // the head-local frame every form below is drawn in; with no elongation it
  // degenerates to q exactly.
  vec2 bq = mix(q, (q - vDir * vE) / max(vW, 0.001), uStretch);

  /* ---- chip: an isometric cube cut from the sprite, three lit faces -------- */
  float caa = max(aa, 2.5 / max(vPs * vW, 2.5));
  float cr = cos(vR), sr = sin(vR);
  vec2 p = vec2(bq.x * cr - bq.y * sr, bq.x * sr + bq.y * cr);
  float a = p.x / S;
  float top = 1.0 - smoothstep(1.0 - caa, 1.0 + caa, abs(a) + abs(p.y + 0.5) * 2.0);
  float ty = -0.5 * abs(a);
  float band = (1.0 - smoothstep(1.0 - caa, 1.0 + caa, abs(a)))
             * smoothstep(ty - caa, ty + caa, p.y)
             * (1.0 - smoothstep(1.0 + ty - caa, 1.0 + ty + caa, p.y));
  float rl = smoothstep(-caa, caa, p.x);
  float edge = (1.0 - smoothstep(0.0, max(0.10, caa * 1.5), abs(p.x))) * band * uGlint;
  float chipCov = clamp(top + band, 0.0, 1.0);
  float chipLum = top * (vFace.x + vTspec) + band * mix(vFace.y, vFace.z, rl) + edge;

  /* ---- surface: a soft round grain lit by the letterform's own normal ------ */
  float d = length(bq);
  float surfCov = 1.0 - smoothstep(0.55, 1.0, d);
  float surfLum = vLit + vSpc * (1.0 - smoothstep(0.0, 0.8, d));

  /* ---- glyph: what the grain reveals it was made of, while it is loose ----- */
  float gr = vR * uAlign;
  float ggc = cos(gr), ggs = sin(gr);
  vec2 gq = vec2(bq.x*ggc - bq.y*ggs, bq.x*ggs + bq.y*ggc) * (1.0 + 0.35*uAlign);
  float gmask = 1.0 - step(1.001, max(abs(gq.x), abs(gq.y)));
  vec2 gpc = gq * 0.5 + 0.5;
  vec2 bu = vec2((vG + gpc.x) / 9.0, 1.0 - gpc.y);
  // Hard-edged, not the raw bilinear tap: the atlas fringe is what turns a
  // scaling character into a smear.
  float gA = smoothstep(0.34, 0.56, texture2D(uAtlas, bu).a) * gmask;
  // Strain lights the symbol: the harder a grain reaches, the more of its
  // own light it holds. Same doctrine as the cord's emissive floor.
  float glyLum = 0.55 + vLit * 0.6 + uErg * vE * 0.5;

  /* ---- cord: one segment of a filament, tapered toward the root ----------- */
  float sa = clamp(dot(q, vDir), -vE, vE);
  float dseg = length(q - vDir * sa);
  float tt = vE > 0.001 ? (sa + vE) / (2.0 * vE) : 1.0;
  float rad = vW * mix(uTaper, 0.78, tt * tt);
  float tetCov = 1.0 - smoothstep(rad - aa, rad + aa, dseg);
  // Cross-section read per fragment from the capsule's own radius, so the
  // tail lights as a cylinder instead of a flat ribbon.
  float acr = clamp(dseg / max(rad, 0.001), 0.0, 1.0);
  float cyl = 1.0 - acr * acr;
  float tetLum = vLit * (0.42 + 0.58 * cyl) + vSpc * cyl * cyl * cyl;
  tetLum = max(tetLum, uErg * vE * (0.25 + 0.75 * cyl));

  // surface -> chip -> glyph, in that order of disturbance. The grain keeps
  // its own form at the head of the capsule, and the reach hangs behind it as
  // a dimmer tapered filament.
  float baseCov = mix(mix(surfCov, chipCov, vC), gA, vGly);
  float baseLum = mix(mix(surfLum, chipLum, vC), glyLum, vGly);
  float tailC = tetCov * uTail * smoothstep(0.03, 0.22, vE) * uStretch;
  float headK = step(tailC * tetLum, baseCov * baseLum);
  float cov = max(baseCov, tailC);
  float lum = mix(tetLum, baseLum, headK);

  float A = cov * vS;
  if (A * vA < 0.012) discard;

  // uOpaque 0 -> emissive: brightness lives in rgb, coverage in alpha.
  // uOpaque 1 -> solid: alpha carries coverage so grains occlude, and the
  // shading has to live in rgb, which is the only way a dark side stays dark.
  vec3 rgb = uColor * lum;
  float outA = mix(A * vA * 0.92, A * 0.97, uOpaque);
  vec3 outC = mix(rgb, rgb * clamp(vA, 0.0, 1.4), uOpaque);
  gl_FragColor = vec4(outC, outA);
}`;

  // Atlas: eight glyphs in a fixed 9-cell strip, cycled if the panel's chosen
  // set is shorter. 128px cells rather than 64: a grain revealed at manifest or
  // reach size draws its character at ~120px, and a 64px cell magnified is
  // exactly the mush that makes a symbol read as a smudge. The ninth cell is
  // dead space -- the soft dot that used to live there is now the `surface`
  // form, which is lit geometry rather than a painted sprite.
  function paintAtlas(cv) {
    const cx = cv.getContext('2d');
    cx.clearRect(0, 0, cv.width, cv.height);
    // Flat, not a gradient: the shader hard-edges the tap at smoothstep(.34,.56)
    // and a fill that fades across the cell would eat the glyph's own strokes.
    cx.fillStyle = '#fff';
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    const mono = getComputedStyle(document.body).getPropertyValue('--mono').trim() || 'monospace';
    cx.font = `700 116px ${mono}`;
    window.TWEAK.chars().forEach((g, i) => cx.fillText(g, i * 128 + 64, 72));
  }

  /** Occupancy blurred into a height field. Its gradient is the letterform's
   *  own surface normal at each sample; its value is depth into the stroke,
   *  which is real geometry rather than a decoration -- one field feeds
   *  extrusion, parallax and crevice shade at once, for two floats a grain.
   *
   *  Three box passes is enough for a smooth ramp from contour to spine, and it
   *  runs once per heading at sample time, never in the frame loop. */
  function fieldOf(occ, gw, gh) {
    let a = Float32Array.from(occ);
    let b = new Float32Array(gw * gh);
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          let s = 0;
          let n = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const X = x + dx;
              const Y = y + dy;
              if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue;
              s += a[Y * gw + X];
              n++;
            }
          }
          b[y * gw + x] = s / n;
        }
      }
      const t = a;
      a = b;
      b = t;
    }
    return a;
  }

  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }

  /** One gl.POINTS draw call over the live NP particles. Null if WebGL is refused. */
  function createRenderer(canvas, arrays) {
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    if (!gl) return null;

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    // `when` is how often the buffer is re-sent: 'frame' every draw, 'land'
    // whenever a grain takes or leaves a slot, 'once' at seeding. The letterform
    // geometry is in the middle group because on four pages a grain gets a new
    // slot every navigation -- which the lab, with one page, never had to do.
    const attrs = [
      ['aPos', arrays.pos, 2, 'frame'],
      // The far end of this grain's own capsule: where it is reaching, or the
      // point it is streaking away from. Equal to aPos whenever nothing is
      // pulling, and then the sprite degenerates to the plain form exactly.
      ['aHome', arrays.anch, 2, 'frame'],
      ['aSize', arrays.sArr, 1, 'frame'],
      ['aAlpha', arrays.aArr, 1, 'frame'],
      ['aChip', arrays.cArr, 1, 'frame'],
      ['aGly', arrays.gyArr, 1, 'frame'],
      ['aZ', arrays.zArr, 1, 'land'],
      ['aShade', arrays.shArr, 1, 'land'],
      ['aN', arrays.nArr, 2, 'land'],
      ['aRot', arrays.rArr, 1, 'once'],
      ['aGlyph', arrays.gArr, 1, 'once'],
    ].map(([name, data, size, when]) => {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      return { buf, data, size, when };
    });
    const perFrame = attrs.filter((a) => a.when === 'frame');
    const perLanding = attrs.filter((a) => a.when === 'land');
    let geomDirty = true;

    const atlas = Object.assign(document.createElement('canvas'), { width: 1152, height: 128 });
    paintAtlas(atlas);
    const tex = gl.createTexture();
    const upload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    upload();

    const U = (n) => gl.getUniformLocation(prog, n);
    const u = {};
    for (const n of ['uRes', 'uDpr', 'uSize', 'uPersp', 'uCam', 'uExt', 'uBright', 'uBump',
      'uAo', 'uLight', 'uAmb', 'uSpec', 'uShin', 'uRim', 'uRimP', 'uColor', 'uOpaque',
      'uFace', 'uGlint', 'uTaper', 'uStretch', 'uAlign', 'uErg', 'uTail']) u[n] = U(n);
    gl.uniform1i(U('uAtlas'), 0);
    gl.uniform2f(u.uCam, 0, 0);
    gl.uniform3f(u.uLight, -0.55, -0.6, 0.55);

    // Everything the panel can move in one call, so a change is one re-push
    // rather than a per-knob code path.
    const sync = () => {
      // uStretch is a master switch, not an amount: how far a grain reaches is
      // carried in the distance between its two ends, so this only says whether
      // the fragment stage should draw a capsule between them at all.
      gl.uniform1f(u.uStretch, T.str > 0 ? 1 : 0);
      gl.uniform1f(u.uTail, T.stail);
      gl.uniform1f(u.uAlign, T.salign ? 1 : 0);
      gl.uniform1f(u.uTaper, T.ftaper);
      gl.uniform1f(u.uErg, T.ergy);
      gl.uniform1f(u.uSize, T.grain);
      gl.uniform1f(u.uBright, T.bright);
      gl.uniform1f(u.uPersp, T.persp);
      gl.uniform1f(u.uExt, T.ext);
      gl.uniform1f(u.uBump, T.bump);
      gl.uniform1f(u.uAo, T.ao);
      gl.uniform1f(u.uAmb, T.amb);
      gl.uniform1f(u.uSpec, T.spec);
      gl.uniform1f(u.uShin, T.shin);
      gl.uniform1f(u.uRim, T.rim);
      gl.uniform1f(u.uRimP, T.rimp);
      gl.uniform1f(u.uFace, T.face);
      gl.uniform1f(u.uGlint, T.glint);
      gl.uniform3fv(u.uColor, accentRGB());
    };
    sync();

    // Solid is the material's own blend: alpha carries coverage, so a grain
    // occludes the grains behind it and a dark side stays dark. Additive is
    // kept as the v3 reading -- density as luminosity -- and it is the escape
    // hatch for a light field, where a lit slab has nothing to occlude against.
    const setBlend = () => {
      const solid = T.blend !== 'add';
      gl.blendFunc(gl.SRC_ALPHA, solid ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
      gl.uniform1f(u.uOpaque, solid ? 1 : 0);
    };
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    setBlend();
    gl.clearColor(0, 0, 0, 0);

    let dpr = 1;
    return {
      gl,
      sync,
      setBlend,
      // The atlas is painted before webfonts land; repaint once they do.
      refreshAtlas() {
        paintAtlas(atlas);
        upload();
      },
      resize(w, h, ratio) {
        dpr = ratio;
        canvas.width = Math.round(w * ratio);
        canvas.height = Math.round(h * ratio);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(u.uRes, w, h);
        gl.uniform1f(u.uDpr, ratio);
      },
      pixelRatio: () => dpr,
      setLight(x, y, z) {
        gl.uniform3f(u.uLight, x, y, z);
      },
      setCam(x, y) {
        gl.uniform2f(u.uCam, x, y);
      },
      /** A grain took or left a slot: its letterform geometry has to go up. */
      markGeom() {
        geomDirty = true;
      },
      // Only the live prefix of each array is uploaded and drawn: at a 4,000-grain
      // budget the other 18,000 slots are neither simulated nor sent to the GPU.
      draw() {
        for (const a of perFrame) {
          gl.bindBuffer(gl.ARRAY_BUFFER, a.buf);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, a.data.subarray(0, NP * a.size));
        }
        if (geomDirty) {
          geomDirty = false;
          for (const a of perLanding) {
            gl.bindBuffer(gl.ARRAY_BUFFER, a.buf);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, a.data.subarray(0, NP * a.size));
          }
        }
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, NP);
      },
    };
  }

  /* --------------------------------------------------------------- system -- */

  class Matter {
    constructor() {
      this.cur = null;
      this.tr = null;
      this.park = null;
      this.ready = false;
      this.dead = false;
      this.mx = -9999;
      this.my = -9999;
      this.pvx = 0;
      this.pvy = 0;
      this.pt = 0;
      // Where the light and the camera sit when no pointer has been seen: the
      // lab's resting key, up and to the left. Starting at 0 would sweep the
      // highlight across the field on the first frame after boot.
      this.parX = -0.4;
      this.parY = -0.5;
      this.t = 0;
      this.lastNavAt = -Infinity;
      // How many grains the hand was carrying as of the last frame. A field-wide
      // count cannot be known part-way through the frame that is computing it,
      // so the wake's cap reads last frame's census -- see tick().
      this.marks = 0;
      // How far the hand has travelled since it last put a mark down. The Trail is
      // emitted per distance rather than per frame, so its spacing is a property of
      // the gesture and not of the refresh rate.
      this.run = 0;
      this.lx = -9999;
      this.ly = -9999;
      // Tape playback: live while it is running, taken once a hand has driven it.
      // `taken` lasts the rest of the visit, not the rest of the page.
      this.tapeLive = false;
      this.tapeTaken = false;
      this.tapeT = null;
    }

    /* -------------------------------------------------------------- tape -- */

    /** The tape plays itself, once, and then it is the visitor's.
     *
     *  Playback is the machine's idle behaviour rather than a carousel. It runs
     *  forward through the Epochs, parks on the last one, and never wraps round
     *  or carries on to the next page -- this site does not change page without
     *  being asked, and an Epoch is the only thing on it that moves by itself.
     *
     *  The first deliberate input hands control over for the rest of the visit
     *  rather than pausing. A timer that resumed would keep taking the tape back
     *  off the visitor, and then nothing on the page is attributable to them --
     *  the argument The Hand Has To Be Attributable Rule makes about the aura,
     *  applied to time instead of to space. Finite, self-terminating and stopped
     *  by any interaction is also the shape that needs no pause control bolted on.
     *
     *  Deliberate means acted, not present: a pointer crossing the field is
     *  someone watching, and the material answering a hand is not a request to
     *  stop the recording. Only pointerdown, a key, a wheel or a touch take it. */
    armTape() {
      if (T0 || DBG || !EPN || !T.tape || this.tapeTaken) return;
      this.tapeLive = true;
      const EVS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
      const take = () => {
        this.tapeTaken = true;
        this.stopTape();
        for (const ev of EVS) removeEventListener(ev, take);
      };
      for (const ev of EVS) addEventListener(ev, take, { passive: true });
    }

    stopTape() {
      this.tapeLive = false;
      clearTimeout(this.tapeT);
      this.tapeT = null;
    }

    /** Queue the next Epoch, or stop because the tape has run out. */
    cueTape(view) {
      clearTimeout(this.tapeT);
      this.tapeT = null;
      if (!this.tapeLive) return;
      const ep = epOf(view);
      const next = ep < 0 ? null : `exp:${ep + 1}`;
      // Parked on the last Epoch: the recording is over. Stopping here instead of
      // advancing is the whole of "never auto-navigates off the page", and it
      // leaves the tape resting at the end where the exit forward is one gesture
      // away.
      if (!next || !isView(next)) {
        this.stopTape();
        return;
      }
      this.tapeT = setTimeout(() => {
        if (this.tapeLive && !this.tr) this.goTo(next);
      }, T.tapeMs);
    }

    start() {
      this.initHudClock();
      this.initScramble();
      this.initHover();
      this.initNav();
      this.initInput();

      const booted = new Promise((done) => this.initBoot(done));
      const built = this.initGL() ? this.afterGL() : Promise.resolve(false);

      Promise.all([built, booted]).then(([ok]) => {
        if (!ok || this.dead) return;
        this.ready = true;
        // `#pg-contact` is the visitor's form; `pg=contact` is the harness's,
        // because the two cannot share a hash and a capture has to name a page.
        // `pg=exp` enters the tape at its first Epoch; `pg=exp:2` names one, so a
        // capture can aim at a single Epoch without driving the gesture layer.
        const want = QS.get('pg') || location.hash.replace('#pg-', '');
        this.want = isView(want) ? want : PAGES.includes(want) ? firstView(want) : 'home';
        this.startTr(this.want, true);
        this.scrub();
      });
    }

    /** Run the field forward to the moment `#t0=` names, at a fixed step, so the
     *  same URL lands on the same frame on any machine. A capture aims here and
     *  never at a wall-clock instant. Nothing at all without `#t0=`. */
    scrub() {
      if (MX !== null) {
        this.mx = MX;
        this.my = +QS.get('my');
      }
      for (let k = 0; k < T0 * 60; k++) this.tick(1 / 60);
    }

    /** Throw the field away and aim at `#t0=` again from a clean seeding.
     *  Re-running the clock rather than continuing it, because `#t0=3.5` has to
     *  mean the same frame whether or not the viewport moved on the way there. */
    reaim() {
      this.tr = null;
      this.needMeasure = false;
      this.cur = null;
      this.t = 0;
      this.sampleAll();
      this.ancT = pageOf(this.want) === 'home' ? this.ancHome : this.ancSigil;
      this.seedGone();
      this.startTr(this.want, true);
      this.scrub();
    }

    /** Which sections and which Epochs are visible.
     *
     *  Epochs are toggled exactly the way pages are -- `visibility`, never
     *  `display` -- because the sampler has to go on measuring the three that are
     *  off screen, and a `display:none` Epoch measures 0x0 and samples nothing. */
    showOnly(views) {
      const live = views.filter(Boolean);
      const pgs = live.map(pageOf);
      for (const p of PAGES) {
        const sec = $('pg-' + p);
        if (sec) sec.style.visibility = pgs.includes(p) ? 'visible' : 'hidden';
      }
      if (!EPN) return;
      const eps = live.map(epOf).filter((i) => i >= 0);
      // No Epoch named means the tape is not involved, so leave the Epochs where
      // they were -- otherwise navigating away from Experience would blank the
      // page the caret is still consuming.
      if (!eps.length) return;
      for (const el of $('pg-exp').querySelectorAll('.epoch')) {
        el.style.visibility = eps.includes(+el.dataset.ep) ? 'visible' : 'hidden';
      }
    }

    /** Hand the page back to the calm scrolling document and stop everything. */
    giveUp() {
      this.dead = true;
      root.classList.remove('matter');
      const boot = $('boot');
      if (boot) boot.remove();
      for (const p of PAGES) {
        const sec = $('pg-' + p);
        sec.style.visibility = '';
        sec.style.pointerEvents = '';
      }
      document.querySelectorAll('.epoch').forEach((el) => {
        el.style.visibility = '';
      });
      document.querySelectorAll('.copy').forEach((el) => {
        el.style.opacity = '';
        el.style.transform = '';
      });
    }

    /* ------------------------------------------------------------ sample -- */

    /** Rasterize every `.mt` heading to a point cloud in viewport coordinates.
     *
     *  One cloud per *view*, not per page: on the Experience tape each Epoch is
     *  its own view, so its year and title are cut separately and only the Epoch
     *  on screen is ever in the slot table. All four Epochs are laid out at the
     *  same box behind each other for exactly this reason -- see the tape block
     *  in style.css. */
    sampleAll() {
      const off = document.createElement('canvas');
      const octx = off.getContext('2d', { willReadFrequently: true });
      this.cutAt = innerWidth + 'x' + innerHeight;
      this.tg = {};
      this.copies = {};
      this.sweep = {};
      this.slots = {};
      for (const pg of VIEWS) {
        const sec = rootOf(pg);
        if (!sec) continue;
        const list = [];
        sec.querySelectorAll('.mt').forEach((el) => {
          const r = el.getBoundingClientRect();
          const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (r.width < 2 || !txt) return;
          const cs = getComputedStyle(el);
          const fs = parseFloat(cs.fontSize);
          // The name is the one heading a visitor must be able to read, so it
          // is exempt from thinning when the budget gets tight.
          const hero = !!el.closest('.name');
          // Spacing is derived from the heading's own size rather than being one
          // grid for the whole page. Measured over the real headings, that lands
          // Archivo at 5.3 grains across its stroke at both 114px and 84px, and
          // JetBrains Mono at 2.5-3.5 -- lower because its strokes really are
          // thinner. The grid answers to ink, not to point size, which is what
          // makes a 42px figure and the name read as the same material.
          //
          // Floored at 2: below that the sprite falls under a device pixel at
          // any grain size that keeps The Grain Ratio Rule, and the row renders
          // as a smudge rather than as grains.
          const g = CLAMP(Math.round(fs / T.gridk), 2, 8);
          const pad = 6;
          const cw = Math.ceil(r.width) + pad * 2;
          const ch = Math.ceil(r.height) + pad * 2;
          off.width = cw;
          off.height = ch;
          octx.fillStyle = '#fff';
          octx.textBaseline = 'middle';
          octx.textAlign = 'left';
          try {
            octx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
            // Width has to be set as a keyword on its own: the `font` shorthand
            // drops stretch, and the computed value ('125%') is rejected here.
            // ponytail: the design has two widths; a full %-to-keyword table can
            // wait until a third one exists.
            octx.fontStretch = parseFloat(cs.fontStretch) > 100 ? 'expanded' : 'normal';
          } catch (err) {
            /* Safari < 17.4: tracking is baked into the measured box anyway */
          }
          octx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
          octx.fillText(txt, pad, ch / 2);
          const img = octx.getImageData(0, 0, cw, ch).data;

          // Occupancy on the heading's own lattice, then blurred into a height
          // field. The padding guarantees the border cells are never ink, which
          // is what lets the neighbour tests below run unguarded.
          const gw = Math.ceil(cw / g);
          const gh = Math.ceil(ch / g);
          const occ = new Uint8Array(gw * gh);
          for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
              const px = x * g;
              const py = y * g;
              occ[y * gw + x] = px < cw && py < ch && img[(py * cw + px) * 4 + 3] > 120 ? 1 : 0;
            }
          }
          const fld = fieldOf(occ, gw, gh);
          const at = (x, y) => (x < 0 || y < 0 || x >= gw || y >= gh ? 0 : fld[y * gw + x]);

          const loc = [];
          for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
              const i = y * gw + x;
              if (!occ[i]) continue;
              // Always keep the contour; thin the interior. A silhouette is what
              // makes a letterform legible and the fill is only weight, which is
              // the cheap thing to buy back with grain size. See The Contour Rule.
              const edge = !occ[i - 1] || !occ[i + 1] || !occ[i - gw] || !occ[i + gw];
              if (!edge && Math.random() > T.fill) continue;
              loc.push({
                x: r.left + x * g - pad + (Math.random() - 0.5) * g * 0.6,
                y: r.top + y * g - pad + (Math.random() - 0.5) * g * 0.6,
                // Negated so the normal points out of the stroke's spine.
                nx: -(at(x + 1, y) - at(x - 1, y)) * 2.2,
                ny: -(at(x, y + 1) - at(x, y - 1)) * 2.2,
                d: Math.min(1, at(x, y) * 1.6),
              });
            }
          }
          list.push({ el, fs, g, hero, l: r.left, r: r.right, cy: r.top + r.height / 2, top: r.top, loc });
        });
        list.sort((a, b) => a.top - b.top || a.l - b.l);
        // Thin proportionally -- but never the name, which keeps every sample it
        // took. Never more than 80% of the live budget on one page, so a page
        // change always has grains that are already gone to manifest from.
        //
        // A flat 380 used to be held back on top of this, for grains to idle in
        // the hourglass between pages. Nothing idles anywhere now. At the 9,000
        // default the 80% term bound and the 380 was inert, which is why it
        // survived the rewrite -- but below a 1,900 budget it took over, and the
        // panel's slider goes down to 1,200.
        const cap = Math.round(NP * 0.8);
        const heroTot = list.reduce((s, tg) => s + (tg.hero ? tg.loc.length : 0), 0);
        const tot = list.reduce((s, tg) => s + tg.loc.length, 0) - heroTot;
        const keep = tot > cap - heroTot ? (cap - heroTot) / tot : 1;
        list.forEach((tg, idx) => {
          const n0 = tg.loc.length;
          const pts = new Float32Array(n0 * 2);
          const xf = new Float32Array(n0);
          // The letterform's own geometry at each sample, carried alongside the
          // position. Nothing reads these yet -- they are what the lit material
          // is built from, and they are cut here because this is the only place
          // the height field exists.
          const nrm = new Float32Array(n0 * 2);
          const shd = new Float32Array(n0);
          let m = 0;
          for (let k = 0; k < n0; k++) {
            if (keep < 1 && !tg.hero && Math.random() > keep) continue;
            const p = tg.loc[k];
            pts[m * 2] = p.x;
            pts[m * 2 + 1] = p.y;
            nrm[m * 2] = p.nx;
            nrm[m * 2 + 1] = p.ny;
            shd[m] = p.d;
            xf[m] = (p.x - tg.l) / Math.max(1, tg.r - tg.l);
            m++;
          }
          tg.pts = pts;
          tg.xf = xf;
          tg.nrm = nrm;
          tg.shd = shd;
          tg.n = m;
          tg.idx = idx;
          delete tg.loc;
        });
        this.tg[pg] = list;
        this.slots[pg] = this.tableOf(list);
        // `.calm-only` copy is display:none on this reading, so it measures at
        // 0x0 and sorts to the top -- which spent the first beat of the reveal
        // schedule fading in something nobody can see.
        this.copies[pg] = Array.from(sec.querySelectorAll('.copy'))
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter((o) => o.r.width > 0 && o.r.height > 0)
          .sort((a, b) => a.r.top - b.r.top)
          .map((o) => o.el);
        // The travel the sheen band has to cover to cross this page, in the
        // band's own diagonal coordinate. Cut here because this is where the
        // heading boxes are already in hand, and it must never be measured in
        // the frame loop -- see The Measure-Once Rule.
        let lo = Infinity;
        let hi = -Infinity;
        for (const tg of list) {
          for (const c of [tg.l * SHEEN[0] + tg.top * SHEEN[1],
            tg.r * SHEEN[0] + (tg.cy * 2 - tg.top) * SHEEN[1]]) {
            if (c < lo) lo = c;
            if (c > hi) hi = c;
          }
        }
        this.sweep[pg] = list.length ? [lo - 200, hi + 200] : [0, 1];
      }
      const box = (id) => {
        const r = $(id).getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
      };
      this.ancHome = box('hg-home');
      this.ancSigil = box('hg-sigil');
    }

    /* ---------------------------------------------------------------- gl -- */

    initGL() {
      const A = (this.A = {
        pos: new Float32Array(MAXN * 2),
        anch: new Float32Array(MAXN * 2),
        vel: new Float32Array(MAXN * 2),
        // 0 settled · 1 loose · 2 carried · 4 burning out · 5 gone · 6 manifesting.
        // Numbered, not named, because the debug census prints them as a row and
        // the harness asserts on that row without knowing what they mean.
        st: new Uint8Array(MAXN),
        homeX: new Float32Array(MAXN),
        homeY: new Float32Array(MAXN),
        // The slot's own normal, kept apart from the one being drawn: a loose
        // grain's normal tumbles with it, and has to find its way back.
        nhX: new Float32Array(MAXN),
        nhY: new Float32Array(MAXN),
        // When this grain entered its state, and when it leaves. Both absolute
        // seconds on the same clock the pointer wound uses, so a page change is
        // nothing but a very large scheduled wound.
        hT: new Float32Array(MAXN),
        hAt: new Float32Array(MAXN),
        spin: new Float32Array(MAXN),
        // The decode flash: brightness a grain carries for a moment after its
        // character changes. Drives both the burn-out and the manifest.
        lead: new Float32Array(MAXN),
        rank: new Float32Array(MAXN),
        // 1 while a grain spells part of the name -- the one heading held to
        // The Name Reads First Rule, so it rests at a larger grain.
        heroG: new Uint8Array(MAXN),
        // Per-grain scatter on the sprite its slot asks for, so a word does not
        // read as one printed pattern. Seeded once, never re-rolled.
        sj: new Float32Array(MAXN),
        baseS: new Float32Array(MAXN),
        baseA: new Float32Array(MAXN),
        rest: new Float32Array(MAXN),
        // When the caret is going to type this grain back in. Held apart from
        // hAt because it is set at scheduling time and consumed two states
        // later, when the burn-out finishes.
        mAt: new Float32Array(MAXN),
        aArr: new Float32Array(MAXN),
        sArr: new Float32Array(MAXN),
        cArr: new Float32Array(MAXN),
        gyArr: new Float32Array(MAXN),
        rArr: new Float32Array(MAXN),
        gArr: new Float32Array(MAXN),
        zArr: new Float32Array(MAXN),
        shArr: new Float32Array(MAXN),
        nArr: new Float32Array(MAXN * 2),
      });
      // Seeded across the whole allocation, not just the live prefix: raising
      // the budget then wakes grains that already have a size, a phase and a
      // character, so they manifest like everything else rather than appearing.
      for (let i = 0; i < MAXN; i++) {
        A.rank[i] = Math.random();
        A.sj[i] = 0.85 + Math.random() * 0.4;
        A.baseS[i] = 3 * A.sj[i];
        A.baseA[i] = 0.6 + Math.random() * 0.4;
        A.gArr[i] = Math.floor(Math.random() * 8);
        // Each chip sits at its own slight angle, so a word of them reads as
        // scattered solids rather than as one printed pattern.
        A.rest[i] = (Math.random() - 0.5) * 0.7;
        A.rArr[i] = A.rest[i];
        // Depth and normal are the letterform's, not the grain's: a grain that
        // is not currently part of a stroke has no surface to be lit as, so it
        // takes the neutral one -- flat, facing front, no crevice.
        A.shArr[i] = 1;
        A.st[i] = 5;
      }

      const canvas = $('matter');
      try {
        this.r = createRenderer(canvas, A);
      } catch (err) {
        this.r = null;
      }
      if (!this.r) {
        this.giveUp();
        return false;
      }
      canvas.addEventListener('webglcontextlost', (ev) => {
        ev.preventDefault();
        this.giveUp();
      });

      this.caret = $('caret-cv');
      this.cctx = this.caret.getContext('2d');

      this.onResize();
      addEventListener('resize', () => this.onResize());
      addEventListener('pointermove', (ev) => {
        // Velocity in px/s, not per-event deltas: what tears matter loose is how
        // fast the hand is travelling, and that has to mean the same thing on a
        // 60Hz trackpad and a 144Hz mouse. Clamped because the first event after
        // a pause reports a dt of nothing and would read as an infinite swipe.
        const now = performance.now();
        const d = CLAMP((now - this.pt) / 1000, 0.008, 0.1);
        if (this.mx > -9000) {
          this.pvx = (ev.clientX - this.mx) / d;
          this.pvy = (ev.clientY - this.my) / d;
        }
        this.pt = now;
        this.mx = ev.clientX;
        this.my = ev.clientY;
      });
      // The CSS falls back to the calm document below 820px; stop burning frames.
      NARROW.addEventListener('change', (ev) => {
        if (ev.matches) this.giveUp();
      });

      // The panel names which expensive thing a change invalidates; anything it
      // does not name is read live by tick() and needs no wiring at all. The two
      // that cost a re-measure are debounced, because a slider fires per pixel.
      let twT = 0;
      const later = (fn) => {
        clearTimeout(twT);
        twT = setTimeout(fn, 220);
      };
      window.TWEAK.watch((fx) => {
        if (this.dead) return;
        if (fx === 'uniform') this.r.sync();
        else if (fx === 'blend') this.r.setBlend();
        else if (fx === 'atlas') this.r.refreshAtlas();
        else if (fx === 'dpr') this.onResize();
        else if (fx === 'count') {
          NP = CLAMP(T.count | 0, 400, MAXN);
          later(() => this.remeasure());
        } else if (fx === 'resample') later(() => this.remeasure());
        else if (fx === 'font') {
          // A face that is still downloading measures as the fallback, and the
          // point cloud would be cut for a font nobody ends up seeing.
          later(() =>
            (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
              if (this.dead) return;
              this.r.refreshAtlas();
              this.remeasure();
            }),
          );
        }
      });

      const dbg = DBG ? this.initDbg() : null;
      let last = performance.now();
      const loop = (now) => {
        if (this.dead) return;
        requestAnimationFrame(loop);
        const dt = Math.min((now - last) / 1000, 0.045); // clamped: a throttled
        last = now; // tab must not skip the choreography
        this.tick(dt);
        if (dbg) dbg(dt);
      };
      requestAnimationFrame(loop);
      return true;
    }

    /** The field in numbers, painted over itself. Debug URLs only.
     *
     *  The state census is printed as a row of counts rather than named states
     *  on purpose: it stays readable as the lifecycle grows states, and a
     *  capture can assert on it without the harness knowing what they mean. */
    initDbg() {
      const el = document.body.appendChild(document.createElement('pre'));
      el.id = 'dbg';
      el.setAttribute('aria-hidden', 'true');
      // Deliberately outside the design system, and it has to be. Pure black is
      // not a colour this palette contains -- the field is #0a0c0e and the
      // darkest neutral is #07090b -- but this is an instrument, not a surface.
      // Reading `--bg` and `--ink` would make the readout illegible at exactly
      // the moment it is most needed: while someone is dragging the palette
      // around to see what it does to the field. So it stays two literals, it
      // stays maximum contrast, and it only ever exists under `#dbg=1`.
      //
      // The design detector flags the `#000` on principle and is right to; this
      // comment is the answer, not a waiver.
      el.style.cssText =
        'position:fixed;left:0;bottom:0;z-index:99;margin:0;padding:6px 8px;background:#000;' +
        'color:#e8edef;font:12px/1.5 monospace;white-space:pre-wrap';
      let acc = 0;
      let frames = 0;
      let fps = 0;
      return (dt) => {
        acc += dt;
        frames++;
        if (acc >= 0.5) {
          fps = Math.round(frames / acc);
          acc = 0;
          frames = 0;
        }
        const st = [0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < NP; i++) st[this.A.st[i]]++;
        // The viewport and the first heading's box are here because a headless
        // capture lays out at a size the harness cannot see from outside, and a
        // point cloud measured against the wrong one puts the whole field a band
        // off its own DOM. Printing both makes that visible in the screenshot.
        const tg = (this.tg && this.tg[this.cur] && this.tg[this.cur][0]) || null;
        const cp = (this.copies && this.copies[this.cur] && this.copies[this.cur][0]) || null;
        el.textContent =
          `${fps} fps · ${NP} grains · ${this.cur || '—'} · ${innerWidth}x${innerHeight}` +
          `${this.tr ? ' · tr ' + this.tr.T.toFixed(2) : ''}\nst ${st.join(' ')}` +
          (tg
            ? ` · box ${Math.round(tg.top)}→${Math.round(tg.el.getBoundingClientRect().top)}` +
              ` ink ${Math.round(tg.pts[1])}`
            : '') +
          (cp ? ` · copy ${Math.round(cp.getBoundingClientRect().top)}` : '') +
          ` · cut@${this.cutAt} ro ${this.nRO} rm ${this.nRM || 0}`;
      };
    }

    afterGL() {
      // Raced, not awaited. A font CDN that is slow rather than broken never
      // rejects, and everything past this point -- sampling, seeding, the whole
      // matter site -- is behind it. After 2s, sample whatever is loaded: the
      // fallback metrics are wrong, but a wrong glyph beats a blank page.
      const fonts = document.fonts
        ? Promise.race([
            Promise.all([
              document.fonts.load('700 140px "Archivo"'),
              document.fonts.load('700 42px "JetBrains Mono"'),
              document.fonts.load('500 26px "JetBrains Mono"'),
            ]),
            new Promise((res) => setTimeout(res, 2000)),
          ])
        : Promise.resolve();
      return fonts.catch(() => {}).then(() => {
        if (this.dead) return false;
        this.r.refreshAtlas();
        this.sampleAll();
        this.ancT = this.ancHome;
        this.seedGone();
        this.seeded = true;
        // The race above can lose, and then the point cloud is cut against the
        // wrong metrics. watchLayout is what notices.
        this.watchLayout();
        if (this.needMeasure) this.remeasure();
        return true;
      });
    }

    /** Re-measure whenever the text this field is drawn from changes shape.
     *
     *  `sampleAll()` cuts all four pages against one layout, and the words are
     *  then drawn where that layout said they were -- for good, because a page
     *  settling late fires no event the measuring path listens to. Measured
     *  here at 68px on a cold load: the tagline rewraps once its real face
     *  arrives, the name below it is pushed down, and the matter goes on
     *  spelling the name straight through the line above it until an unrelated
     *  resize happens to fix it. `document.fonts.ready` does not catch it --
     *  it resolves the moment nothing is pending, which with the font
     *  stylesheet still in flight is immediately.
     *
     *  So watch the boxes rather than enumerate the causes. Every element this
     *  page is measured from is observed, and anything that changes the shape
     *  of one -- a face swapping in, a line rewrapping, a window resize -- is
     *  the same event: re-measure. Idle cost is nothing; it fires on change. */
    watchLayout() {
      if (!window.ResizeObserver) return;
      let settled = false;
      let t = 0;
      this.nRO = 0;
      const ro = new ResizeObserver(() => {
        // The observer delivers every element once on observe; that first
        // batch is the layout the sample was already cut from.
        if (!settled) {
          settled = true;
          return;
        }
        this.nRO++;
        clearTimeout(t);
        t = setTimeout(() => this.remeasure(), 120);
      });
      for (const pg of PAGES) $('pg-' + pg).querySelectorAll('.mt, .copy').forEach((el) => ro.observe(el));
    }

    onResize() {
      const w = innerWidth;
      const h = innerHeight;
      this.r.resize(w, h, Math.min(devicePixelRatio || 1, this.dprCap || T.dpr));
      const cdpr = (this.cdpr = Math.min(devicePixelRatio || 1, 2));
      this.ccw = w;
      this.cch = h;
      this.caret.width = w * cdpr;
      this.caret.height = h * cdpr;
      this.cctx.setTransform(cdpr, 0, 0, cdpr, 0, 0);
      // Re-anchor on resize only -- never per frame.
      clearTimeout(this.rsT);
      // A capture is not a visitor: it gets one frame, and headless resizes the
      // viewport to the whole window (here, +143px of absent browser chrome)
      // immediately before taking it. Debounced by 260ms with no rAF left to
      // run, every screenshot would show a field cut for a viewport shorter
      // than the one in the picture -- and every measurement taken off it,
      // including The Name Reads First Rule, would be measuring that instead.
      if (T0 && this.seeded) this.reaim();
      else this.rsT = setTimeout(() => this.remeasure(), 260);
    }

    /** Re-sample every heading and re-seat the grains, because the layout the
     *  point clouds were measured from has changed. Every debounced caller ends
     *  up here: a window resize, and any type or layout knob in the panel. */
    remeasure() {
      if (this.dead) return;
      // Deferred, never dropped. Mid-transition the grains are in flight and
      // there is nothing to re-seat; before seeding there is nothing to re-seat
      // either, and that window is the dangerous one -- it is up to two seconds
      // wide while the font race runs, and a viewport that settles inside it
      // (a tiling compositor, a headless window, a phone's URL bar retracting)
      // used to have its one and only resize thrown away, leaving the field a
      // band off its own text for the rest of the visit. Both callers pick the
      // request back up: endTr, and afterGL the moment seeding finishes.
      if (this.tr || !this.seeded) {
        this.needMeasure = true;
        return;
      }
      this.needMeasure = false;
      this.nRM = (this.nRM || 0) + 1;
      this.sampleAll();
      this.ancT = !this.cur || pageOf(this.cur) === 'home' ? this.ancHome : this.ancSigil;
      if (this.cur) {
        this.assignInstant(this.cur);
        this.parkCaret(this.cur);
      }
    }

    /** Everything gone: no matter anywhere, every slot open. What the field
     *  boots into, and what a capture re-aims from. Nothing is destroyed by it
     *  -- a gone grain is a buffer entry at zero size waiting for its cue. */
    seedGone() {
      const A = this.A;
      for (let i = 0; i < MAXN; i++) {
        A.st[i] = 5;
        A.hAt[i] = Infinity;
        A.mAt[i] = Infinity;
        A.aArr[i] = 0;
        A.sArr[i] = 0;
        A.cArr[i] = 0;
        A.gyArr[i] = 0;
        A.lead[i] = 0;
        A.vel[i * 2] = 0;
        A.vel[i * 2 + 1] = 0;
        A.anch[i * 2] = A.pos[i * 2];
        A.anch[i * 2 + 1] = A.pos[i * 2 + 1];
      }
      this.r.markGeom();
    }

    /** The two halves of the destructive return.
     *
     *  A grain that dies leaves its slot open; the grain that later manifests
     *  into that slot is the same buffer entry, so the matter is conserved in
     *  the machine even while the story on screen is destruction. Nothing is
     *  ever created: `MAXN` entries exist from boot and the same `NP` of them
     *  are simulated whatever the page says. */
    die(i, flash) {
      const A = this.A;
      const j = i * 2;
      A.st[i] = 4;
      A.hT[i] = this.t;
      A.lead[i] = flash;
      A.vel[j] *= 0.3;
      A.vel[j + 1] *= 0.3;
    }

    manifest(i) {
      const A = this.A;
      const S = this.slots[this.slotView];
      // Past this page's slot count there is nothing to be part of. The grain
      // stays gone -- still allocated, still counted, simply not this page.
      if (!S || i >= S.n) {
        A.hAt[i] = Infinity;
        return;
      }
      const j = i * 2;
      A.st[i] = 6;
      A.hT[i] = this.t;
      A.hAt[i] = Infinity;
      A.lead[i] = 1;
      A.homeX[i] = S.x[i];
      A.homeY[i] = S.y[i];
      A.nhX[i] = S.nx[i];
      A.nhY[i] = S.ny[i];
      A.shArr[i] = S.sh[i];
      A.zArr[i] = S.z[i];
      A.heroG[i] = S.hero[i];
      A.baseS[i] = S.size[i] * A.sj[i];
      A.pos[j] = S.x[i];
      A.pos[j + 1] = S.y[i];
      A.anch[j] = S.x[i];
      A.anch[j + 1] = S.y[i];
      A.vel[j] = 0;
      A.vel[j + 1] = 0;
      // It arrives as a character and settles into flesh, so it starts at full
      // glyph, zero size: a mark typed into place rather than one faded up.
      A.gyArr[i] = 1;
      A.sArr[i] = 0;
      A.aArr[i] = 0;
      A.gArr[i] = (Math.random() * 8) | 0;
      this.r.markGeom();
    }

    /** A hand moving fast enough through settled matter throws it loose.
     *
     *  A parked cursor does nothing at all, which is both physically right and
     *  what stops a stationary pointer quietly boiling a hole in the name. */
    wound(cx, cy, vx, vy, radius, gain) {
      const A = this.A;
      const R2 = radius * radius;
      const sp = Math.hypot(vx, vy);
      for (let i = 0; i < NP; i++) {
        if (A.st[i] !== 0) continue;
        const j = i * 2;
        const dx = A.pos[j] - cx;
        const dy = A.pos[j + 1] - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 > R2) continue;
        const d = Math.sqrt(d2) || 0.001;
        const g = (1 - d / radius) * gain;
        A.st[i] = 1;
        // Carry dominates: a grain is dragged along with the hand, not popped
        // away from it. The radial push only clears it out of the hand's path.
        A.vel[j] = vx * T.carry * g + (dx / d) * T.push * g + (Math.random() - 0.5) * sp * 0.18;
        A.vel[j + 1] = vy * T.carry * g + (dy / d) * T.push * g + (Math.random() - 0.5) * sp * 0.18;
        A.spin[i] = (Math.random() - 0.5) * sp * 0.012 * T.spin;
        // Seam closes the hole from its rim inward, which is what makes it read
        // as knitting shut rather than as every grain independently remembering
        // to come home.
        const rim = 1 - CLAMP(d / radius, 0, 1);
        A.hAt[i] = this.t + T.delay * (T.seam * rim * 2 + (1 - T.seam) * (0.7 + Math.random() * 0.6));
        A.mAt[i] = -Infinity; // no caret is scheduling this one; mgap rules
      }
    }

    /* --------------------------------------------------------- transition -- */

    /** Accepts a view or a page. A page resolves to its first view, so a nav click
     *  on Experience starts the tape at the beginning and a click on the page it
     *  is already showing is still a no-op. */
    goTo(target) {
      const view = isView(target) ? target : firstView(target);
      if (!this.ready || this.tr || view === this.cur) return;
      this.startTr(view, false);
    }

    /** Timeline of caret segments: consume the old page, travel, emit the new. */
    buildSegs(full, oldTgs, newTgs) {
      const segs = [];
      const cw = {};
      const ew = {};
      const c0 = 0.04;
      const c1 = 0.4;
      let t0 = 0.4;
      let t1 = 0.62;
      let e0 = 0.62;
      const e1 = 0.95;
      if (!oldTgs) {
        t0 = 0.06;
        t1 = 0.32;
        e0 = 0.32;
      }
      if (!full || !newTgs.length) {
        return { segs, cw, ew, tw0: 0.12, tw1: 0.4, e0: 0.4, e1: 0.9 };
      }
      const sweep = (tgs, ta, tb, mode, wins) => {
        const tot = tgs.reduce((s, t) => s + t.n, 0) || 1;
        const conn = 0.018;
        const usable = tb - ta - conn * Math.max(0, tgs.length - 1);
        let t = ta;
        let prev = null;
        for (const tg of tgs) {
          const h = Math.max(13, Math.min(40, tg.fs * 0.5));
          if (prev) {
            segs.push({ t0: t, t1: t + conn, x0: prev.x, y0: prev.y, x1: tg.l, y1: tg.cy, arc: 16, h, mode });
            t += conn;
          }
          const w = (usable * tg.n) / tot;
          segs.push({ t0: t, t1: t + w, x0: tg.l, y0: tg.cy, x1: tg.r, y1: tg.cy, arc: 0, h, mode });
          wins[tg.idx] = [t, t + w];
          t += w;
          prev = { x: tg.r, y: tg.cy };
        }
        return prev;
      };
      const from =
        oldTgs && oldTgs.length
          ? sweep(oldTgs, c0, c1, 'consume', cw)
          : { x: this.ancT.x, y: this.ancT.y };
      const first = newTgs[0];
      const dist = Math.hypot(first.l - from.x, first.cy - from.y);
      segs.push({
        t0,
        t1,
        x0: from.x,
        y0: from.y,
        x1: first.l,
        y1: first.cy,
        arc: Math.min(240, 60 + dist * 0.3),
        h: 20,
        mode: 'travel',
      });
      const last = sweep(newTgs, e0, e1, 'emit', ew) || { x: first.r, y: first.cy };
      segs.push({ t0: e1, t1: 1, x0: last.x, y0: last.y, x1: last.x + 14, y1: last.y, arc: 6, h: 16, mode: 'emit' });
      return { segs, cw, ew, tw0: t0, tw1: t1, e0, e1 };
    }

    /** Every vacancy in a page's letterforms as one flat table, in the order
     *  they must be drawn.
     *
     *  Cut at sample time and not at navigation, for two reasons. A transition
     *  may not allocate -- that is the named performance constraint -- and the
     *  order is load-bearing: grain p takes slot p, handout runs in buffer
     *  order, and buffer order is draw order. Sorting the slots contour-first
     *  here is therefore the whole of the back-to-front compositing the lit slab
     *  needs, for free: the contour lays down first and the spine paints over
     *  it. It stops being free the day a grain may choose a slot for itself.
     *
     *  The objects below are garbage the moment they are packed. They exist so
     *  the sort can be written as a sort. */
    tableOf(list) {
      const raw = [];
      for (const tg of list) {
        for (let k = 0; k < tg.n && raw.length < MAXN; k++) {
          raw.push({
            x: tg.pts[k * 2],
            y: tg.pts[k * 2 + 1],
            xf: tg.xf[k],
            nx: tg.nrm[k * 2],
            ny: tg.nrm[k * 2 + 1],
            sh: tg.shd[k],
            // Extrusion in units of the display size, so every heading on the
            // ramp gets the same proportional thickness rather than the same
            // pixel count. 120 is the reference the lab measured against.
            z: tg.shd[k] * (tg.fs / 120),
            ti: tg.idx,
            hero: tg.hero ? 1 : 0,
            // The lattice this slot was cut on. A grain wears the sprite its own
            // slot's spacing asks for, or The Grain Ratio Rule breaks the moment
            // two headings sample differently: the name on a 3px grid wearing
            // sprites sized for a 2px one is a skeleton.
            g: tg.g,
          });
        }
      }
      raw.sort((a, b) => a.sh - b.sh);
      const n = raw.length;
      const S = {
        n,
        x: new Float32Array(n),
        y: new Float32Array(n),
        nx: new Float32Array(n),
        ny: new Float32Array(n),
        sh: new Float32Array(n),
        z: new Float32Array(n),
        size: new Float32Array(n),
        xf: new Float32Array(n),
        ti: new Int16Array(n),
        hero: new Uint8Array(n),
      };
      for (let k = 0; k < n; k++) {
        const s = raw[k];
        S.x[k] = s.x;
        S.y[k] = s.y;
        S.nx[k] = s.nx;
        S.ny[k] = s.ny;
        S.sh[k] = s.sh;
        S.z[k] = s.z;
        S.size[k] = s.g;
        S.xf[k] = s.xf;
        S.ti[k] = s.ti;
        S.hero[k] = s.hero;
      }
      return S;
    }

    startTr(page, first) {
      const A = this.A;
      const rnd = Math.random;
      // The transition is the thing people come back to watch, so a deliberate
      // return always gets the full choreography. Only a rapid burst of nav
      // goes direct, so hammering the arrow keys stays responsive.
      const full = first || performance.now() - this.lastNavAt > T.fullGate;
      const oldPg = this.cur;
      const ntgs = this.tg[page] || [];
      const sl = this.slots[page];
      // The table the grains' slot indices currently point into. Read before it
      // is moved on, because the consume sweep is timed off the old page.
      const osl = this.slots[this.slotView];
      const sd = this.buildSegs(full, oldPg && full ? this.tg[oldPg] : null, ntgs);
      const dur = full ? (first ? T.trFirst : T.trFull) : T.trQuick;
      const t0 = this.t;
      // Grain p takes slot p, so buffer order stays depth order. Past the
      // budget the table is simply truncated, which cuts the spine and keeps
      // the silhouette -- the right thing to lose. See The Contour Rule.
      const M = Math.min(sl.n, NP);
      // Where in `[lo, hi]` the caret is when it passes over this slot. The
      // per-heading window when the caret actually sweeps that heading, the
      // whole span when it does not (a page with no old text to consume).
      const mark = (w, lo, hi, xf) => (w ? w[0] + (w[1] - w[0]) * xf : lo + (hi - lo) * xf);

      for (let i = 0; i < NP; i++) {
        // Consume. What burns a grain out is the caret passing over the slot it
        // is standing on; a grain that is already gone has nothing to burn, and
        // simply waits for its cue on the other side.
        const st = A.st[i];
        // Anything the hand was carrying is handed back here, before the caret
        // schedules a single slot. The caret owns the field while it works, and
        // a grain still chasing the pointer through a transition would be the one
        // thing on screen not answering to it. Demoted to loose rather than
        // released: the schedule below is about to give it an exit anyway, and
        // `st` is read once, above, so the burn-out timing is unaffected.
        if (st === 2) A.st[i] = 1;
        if (st !== 4 && st !== 5) {
          A.hAt[i] =
            t0 +
            dur *
              (full && osl && i < osl.n
                ? mark(sd.cw[osl.ti[i]], sd.tw0, sd.tw1, osl.xf[i])
                : 0.02 + rnd() * 0.25);
        }
        // Emit. What types a grain back in is the caret passing over the slot it
        // is about to stand on. Ordering needs no guard: the burn-out hands its
        // own exit the later of this time and its own, so a grain can never
        // manifest into a slot it has not finished vacating.
        A.mAt[i] =
          i < M
            ? t0 +
              dur * (full ? mark(sd.ew[sl.ti[i]], sd.e0, sd.e1, sl.xf[i]) : 0.45 + rnd() * 0.4)
            : Infinity;
        if (st === 5) A.hAt[i] = A.mAt[i];
      }
      this.slotView = page;

      for (const el of oldPg ? this.copies[oldPg] : []) el.style.opacity = '0';
      const newCopies = this.copies[page] || [];
      const nc = Math.max(1, newCopies.length - 1);
      const rv = newCopies.map((el, ix) => {
        el.style.opacity = '0';
        const at = full
          ? sd.e0 + (sd.e1 - sd.e0) * (0.25 + (0.7 * ix) / nc)
          : 0.45 + (0.4 * ix) / nc;
        return { el, at, done: false };
      });
      for (const p of PAGES) $('pg-' + p).style.pointerEvents = 'none';
      this.showOnly([page, oldPg]);
      this.ancT = pageOf(page) === 'home' ? this.ancHome : this.ancSigil;
      this.park = null;
      // The caret is about to be the transition's, so it cannot also be a label's.
      // Its cached rect is stale from this point anyway: the page underneath it is
      // being replaced.
      this.dock = null;
      this.tr = { T: 0, dur, full, page, oldPg, segs: sd.segs, rv, frames: 0, acc: 0 };
      this.setHud(page);
      this.navActive(page);
    }

    caretPos(t) {
      const segs = this.tr.segs;
      if (!segs.length) return null;
      if (t <= segs[0].t0) {
        const s = segs[0];
        return { x: s.x0, y: s.y0, h: s.h, mode: s.mode };
      }
      for (const s of segs) {
        if (t >= s.t0 && t <= s.t1) {
          const p = (t - s.t0) / Math.max(1e-4, s.t1 - s.t0);
          return {
            x: s.x0 + (s.x1 - s.x0) * p,
            y: s.y0 + (s.y1 - s.y0) * p - Math.sin(p * Math.PI) * s.arc,
            h: s.h,
            mode: s.mode,
          };
        }
      }
      const s = segs[segs.length - 1];
      return { x: s.x1, y: s.y1, h: s.h, mode: s.mode };
    }

    endTr() {
      const tr = this.tr;
      // Nothing is forced to finish here any more. The caret's job ended when
      // it left the page; the last few characters go on settling into flesh
      // behind it, on their own clock, which is what the tail of a sentence
      // being typed actually looks like.
      this.showOnly([tr.page]);
      for (const p of PAGES) {
        $('pg-' + p).style.pointerEvents = p === pageOf(tr.page) ? 'auto' : 'none';
      }
      for (const r of tr.rv) {
        if (!r.done) {
          r.el.style.opacity = '1';
          r.el.style.transform = 'none';
        }
      }
      this.cur = tr.page;
      this.lastNavAt = performance.now();
      try {
        // The page, not the view. The calm reading marks its active nav item with
        // `:has(#pg-x:target)`, so the hash has to stay a page id -- and an Epoch
        // is a position on a page rather than a place of its own.
        history.replaceState(null, '', '#pg-' + pageOf(tr.page));
      } catch (err) {
        /* file:// origin — the URL just stays put */
      }
      this.parkCaret(tr.page);
      // Playback belongs to being on the tape. Arriving on it arms the recording;
      // moving to any other page stops it. Arming on arrival rather than once at
      // startup is what makes the timer reach a visitor who wheeled here, since
      // that wheel would otherwise have taken the tape before they ever saw it.
      if (epOf(tr.page) >= 0) {
        if (epOf(tr.oldPg) < 0) this.armTape();
        this.cueTape(tr.page);
      } else {
        this.stopTape();
      }
      // Adaptive downscale: if the first full transition missed ~48fps, halve the
      // fill cost rather than the particle count -- the buffer is sized once.
      if (tr.full && !this.perfChecked && tr.frames > 20) {
        this.perfChecked = true;
        if (tr.acc / tr.frames > 0.021) {
          this.dprCap = 1;
          this.r.resize(innerWidth, innerHeight, 1);
        }
      }
      this.tr = null;
      this.lastNav = performance.now();
      if (this.needMeasure) this.remeasure();
    }

    parkCaret(page) {
      const tgs = this.tg[page] || [];
      // On the tape the head rests on the track, at the Epoch it has just written.
      // This is the one place in the system where the pointer metaphor and the
      // timeline metaphor are the same object: where the read head sits *is* the
      // position on the recording, so a separate playhead would be a second thing
      // saying what the caret already says. The caret still sweeps the year and
      // the title on the way in -- only where it comes to rest has changed.
      //
      // Measured here rather than in the frame loop: parkCaret runs once per
      // transition, which is what The Measure-Once Rule allows.
      const ep = epOf(page);
      if (ep >= 0 && T.tapeHead) {
        const tk = $('tk-' + ep);
        const rail = document.querySelector('.tape-rail');
        if (tk && rail) {
          const r = tk.getBoundingClientRect();
          const rr = rail.getBoundingClientRect();
          this.park = {
            x: r.left,
            y: rr.top + T.tapeTickH / 2,
            // Slightly over the tick's own height, so the head reads as sitting on
            // the track rather than as one more mark printed on it.
            h: Math.max(5, T.tapeTickH * 0.85),
          };
          this.cpos = null;
          return;
        }
      }
      if (!tgs.length) {
        this.park = null;
        return;
      }
      const lt = tgs[tgs.length - 1];
      // Ink extent, not `lt.r`. The layout box of a `nowrap; fit-content` span
      // runs well past the last stroke -- ~180px on the home name -- and a
      // cursor parked out there reads as a triangle floating in dead space
      // rather than as the end of the line. The samples know where the ink is.
      let ink = -Infinity;
      for (let k = 0; k < lt.n; k++) if (lt.pts[k * 2] > ink) ink = lt.pts[k * 2];
      this.park = {
        x: (ink > -Infinity ? ink : lt.r) + 14,
        y: lt.cy,
        h: Math.max(14, Math.min(34, lt.fs * 0.5)),
      };
    }

    /** Re-seat grains onto a page's glyphs with no animation, after the layout
     *  the point clouds were cut from has moved. Same handout as a transition,
     *  so the depth order buffer order carries is the same one -- a resize must
     *  not leave the slab compositing backwards. */
    assignInstant(page) {
      const A = this.A;
      const S = this.slots[page];
      this.slotView = page;
      for (let i = 0; i < NP; i++) {
        if (i < S.n) {
          this.manifest(i);
          // No manifest to watch: the word was already there, it has only moved.
          A.st[i] = 0;
          A.hAt[i] = Infinity;
          A.gyArr[i] = 0;
          A.sArr[i] = A.baseS[i] * (A.heroG[i] ? T.heroS : T.restS);
          A.aArr[i] = A.baseA[i];
          A.rArr[i] = A.rest[i];
          A.nArr[i * 2] = A.nhX[i];
          A.nArr[i * 2 + 1] = A.nhY[i];
          A.anch[i * 2] = A.pos[i * 2];
          A.anch[i * 2 + 1] = A.pos[i * 2 + 1];
        } else {
          A.st[i] = 5;
          A.hAt[i] = Infinity;
          A.aArr[i] = 0;
          A.sArr[i] = 0;
        }
      }
      this.r.markGeom();
    }

    /* ------------------------------------------------------------- frame -- */

    tick(dt) {
      if (!this.seeded) return;
      const f = Math.min(dt * 60, 2.4);
      this.t += dt;
      const t = this.t;
      const A = this.A;

      const tr = this.tr;
      if (tr) {
        tr.T = Math.min(1.02, tr.T + dt / tr.dur);
        tr.frames++;
        tr.acc += dt;
        for (const r of tr.rv) {
          if (!r.done && tr.T >= r.at) {
            r.done = true;
            r.el.style.opacity = '1';
            r.el.style.transform = 'none';
          }
        }
      }

      const mx = this.mx;
      const my = this.my;
      const seen = mx > -9000;

      // One key light for the whole field, and a camera that leans across the
      // extruded depth. Both follow the pointer: the highlight travels over the
      // word instead of sitting on it, and spine and contour separate by
      // parallax, which is the one cue a flat sticker can never produce.
      //
      // Smoothed rather than read straight off the pointer, because a light and
      // a camera that snap when the hand jumps read as a glitch.
      this.parX += ((seen ? (mx / this.ccw - 0.5) * 2 : -0.4) - this.parX) * 0.05 * f;
      this.parY += ((seen ? (my / this.cch - 0.5) * 2 : -0.5) - this.parY) * 0.05 * f;
      // The key also sways on its own, so a page nobody is pointing at still has
      // weather over it. Two periods that do not divide, so the highlight never
      // retraces the same path across the word.
      this.r.setLight(
        -0.55 + this.parX * T.track + Math.sin(t * 0.42) * T.sway * 0.4,
        -0.6 + this.parY * T.track + Math.cos(t * 0.3) * T.sway * 0.3,
        T.lz,
      );
      this.r.setCam(
        (-0.62 + this.parX * 0.5) * T.cam + Math.sin(t * 0.31) * T.orbit,
        (-0.34 + this.parY * 0.5) * T.cam + Math.cos(t * 0.23) * T.orbit * 0.6,
      );

      // Pointer velocity in px/s, decayed rather than zeroed: the browser stops
      // sending events the instant the hand stops, and a throw that ended on the
      // last event should die out over a few frames rather than at one.
      const pdec = Math.pow(0.02, dt);
      this.pvx *= pdec;
      this.pvy *= pdec;
      const speed = Math.hypot(this.pvx, this.pvy);
      // A hand moving faster than the gate tears matter loose. Below it, nothing
      // -- see the aura, which is what a slow or parked hand does instead. Never
      // during a transition: the caret owns the field while it is working.
      if (seen && !tr && speed > T.minv) {
        this.wound(mx, my, this.pvx, this.pvy, T.repelR, CLAMP((speed - T.minv) / 600, 0.15, 1));
      }

      const chip = T.mat === 'chip' ? 1 : 0;
      const drag = Math.exp(-T.drag * dt);
      // The band's position on this page's own travel, and the falloff that
      // gives it a soft edge. Hoisted: both are the same for every grain.
      const sw = this.sweep[this.slotView] || [0, 1];
      const shPos = sw[0] + ((t / T.sheenT) % 1) * (sw[1] - sw[0]);
      const shInv = 1 / (2 * T.sheenW * T.sheenW);
      // Far enough out that a hand resting anywhere near a word is felt by all
      // of it, rather than only by the grains directly under the cursor.
      const auraR = T.repelR * T.sreach;
      const auraR2 = auraR * auraR;
      // The wake. Picked up inside a tighter radius than the hand is felt
      // within, so a travelling hand collects grains as it goes instead of
      // promoting the whole neighbourhood the instant it arrives -- and the
      // leash below is the felt radius itself, so the hand keeps one zone of
      // influence rather than acquiring a third number of its own.
      //
      // `wn` is what is left of the cap this frame: the running total is last
      // frame's census, and this frame's own promotions are counted exactly. So
      // the cap can be exceeded by at most one frame of newly-eligible grains,
      // which the pickup radius already bounds.
      const wtake = T.wake && seen && !tr;
      const wpickR2 = auraR2 * T.wpick * T.wpick;
      let wn = wtake ? Math.max(0, (T.wn | 0) - this.carried) : 0;
      let carried = 0;
      // How much larger a loose or dying grain draws its character, so a mark
      // the size of a grain is legible as the symbol it always was.
      const sym1 = T.ssize - 1;
      // Whether anything is allowed to pull a grain off its own centre at all.
      // At zero the two ends of every capsule coincide and the shader's stretch
      // path degenerates to the plain form, so it costs a compare, not a branch
      // in the fragment stage.
      const stretch = T.str > 0;

      for (let i = 0; i < NP; i++) {
        const j = i * 2;
        let st = A.st[i];
        // One clock for the whole lifecycle. A page change schedules it in bulk
        // off the caret; a wound schedules it one grain at a time. Neither the
        // burn-out nor the gap can be interrupted, which is why they are the two
        // states this does not reach.
        if (st !== 4 && st !== 5 && t >= A.hAt[i]) {
          this.die(i, 0.8);
          st = 4;
        }

        if (st === 2) {
          /* --------------------------------------- carried: the wake -- */
          // The hand has this grain and is dragging it. A damped pursuit rather
          // than a spring to the pointer: a spring overshoots, and a wake that
          // overshoots orbits the hand instead of trailing it. `Throw · Air drag`
          // damps this too, on the fall-through below, so the two together set
          // how much the tail overruns when the hand stops.
          //
          // Each grain seeks its own place in the hand rather than the pointer
          // itself. Sixty grains pursuing one point converge on it and stack into
          // a single mark -- the first build did exactly that, and a hand held
          // still over the name produced one grain-sized blob instead of a wake.
          // The offset is seeded from values the grain already carries, so a
          // wake is a formation travelling with the hand, and every filament in
          // it has its own length. At spread 0 it collapses back to the point,
          // which is a legal reading and how the mistake stays inspectable.
          const wr = T.wspread * (0.4 + (A.rest[i] + 0.35) * 0.857);
          const wa = A.rank[i] * 6.2832;
          A.vel[j] += (mx + Math.cos(wa) * wr - A.pos[j]) * T.wseek * dt;
          A.vel[j + 1] += (my + Math.sin(wa) * wr - A.pos[j + 1]) * T.wseek * dt;
          const wd = Math.exp(-T.wlag * dt);
          A.vel[j] *= wd;
          A.vel[j + 1] *= wd;
          // The leash, measured from home and not from the hand: a grain may be
          // carried one felt-radius out of its own letterform and no further.
          // Measuring from the hand would be no leash at all, because a carried
          // grain is by definition near the hand.
          const ox = A.pos[j] - A.homeX[i];
          const oy = A.pos[j + 1] - A.homeY[i];
          if (!seen || !T.wake || ox * ox + oy * oy > auraR2) {
            // Let go into the return that already exists. Nothing here is a new
            // ending: the grain burns out as a character and its own slot types
            // back in, exactly as a thrown grain does.
            A.st[i] = 1;
            st = 1;
            A.hAt[i] = t + T.delay * (0.7 + Math.random() * 0.6);
          } else carried++;
        }

        if (st === 0) {
          /* -------------------------------------------- settled: the word -- */
          // None of what follows accumulates: every term is an offset from home
          // or a multiplier on rest, so a word left alone for an hour is exactly
          // where it started. Position is assigned rather than sprung, because
          // settled matter has no momentum -- the moment it does, it is loose.
          const ph = A.rank[i] * 6.2832;
          const hx = A.homeX[i];
          const hy = A.homeY[i];
          // Every distance in this branch is in units of this grain's own sample
          // spacing, never in pixels. The Grain Ratio Rule governs how far a
          // grain may move exactly as it governs how large it may draw: 4px of
          // flow is a third of a stroke on the name's 3px lattice and most of a
          // stroke on a 42px figure's 2px one, so one pixel value cannot be
          // right for both. `baseS` carries the lattice, with the grain's own
          // scatter already in it.
          const lat = A.baseS[i];
          let px = hx + Math.sin(t * 1.3 + ph) * T.wob * lat;
          let py = hy + Math.cos(t * 1.1 + ph * 2) * T.wob * lat;
          let amp = 1;
          // Flow: the contour drifts along its own stroke. The tangent is the
          // letterform's surface normal turned a quarter, and the normal is the
          // height field's gradient -- near zero at the spine, steepest at the
          // edge. So the outline travels and the fill barely moves, which is
          // what makes the motion read as the stroke flowing rather than as the
          // whole word sliding.
          if (T.flow > 0) {
            const w = Math.sin(t * 0.8 + ph * 3) * T.flow * lat;
            px += -A.nhY[i] * w;
            py += A.nhX[i] * w;
          }
          // Ember: two sines per grain whose periods do not divide, so grains
          // smoulder on their own phase instead of the field breathing in step.
          if (T.ember > 0) {
            amp += T.ember * 0.7 * Math.sin(t * 1.7 + ph * 7) * Math.sin(t * 0.53 + ph * 3);
          }
          // Sheen: one band of light walks the whole composition on its own
          // period, so the page has an event in it without anything moving.
          if (T.sheen > 0) {
            const sd = hx * SHEEN[0] + hy * SHEEN[1] - shPos;
            amp += T.sheen * 1.4 * Math.exp(-sd * sd * shInv);
          }
          // Settled matter is the material, and nothing is held back to stop it
          // blowing out any more: under solid alpha a grain occludes rather than
          // stacking, so density reads as weight instead of as luminosity. The
          // old 0.82 hero cap was the Additive Ceiling, and it retires here.
          //
          // heroS/restS still keep the sprite near its own sample grid, which is
          // The Grain Ratio Rule and is about legibility, not about brightness.
          let size = A.baseS[i] * (A.heroG[i] ? T.heroS : T.restS);
          // Aura and reach: the field acknowledges a hand it has not been
          // struck by. Near grains lean toward it, swell and brighten; a share
          // of them reach for it without letting go of the word, and the
          // filament between the two ends is drawn by the sprite itself.
          let reach = 0;
          let rdx = 0;
          let rdy = 0;
          if (seen && !tr && (T.aura > 0 || stretch || wtake)) {
            const ax = mx - hx;
            const ay = my - hy;
            const a2 = ax * ax + ay * ay;
            if (a2 < auraR2) {
              // The hand takes one. Riding this block rather than scanning for
              // its own candidates is the whole reason the wake costs nothing
              // per frame: the distance to the hand is already in hand here, for
              // every grain the hand could possibly reach.
              //
              // `rank` fixes which grains are ever eligible, exactly as it fixes
              // which ones reach. So the wake is always the same share of a word
              // rather than a different random handful on each pass -- a word has
              // a mobile fraction and a solid one, and that is a property of the
              // word, not of the gesture.
              if (wn > 0 && a2 < wpickR2 && A.rank[i] < T.wshare) {
                A.st[i] = 2;
                A.vel[j] = 0;
                A.vel[j + 1] = 0;
                wn--;
                // Settled this frame, carried from the next. Taking it now would
                // leave its position and sprite a frame stale, which reads as a
                // pop at the moment the hand touches the word.
              }
              const ad = Math.sqrt(a2) || 1;
              const fq = 1 - ad / auraR;
              if (T.aura > 0) {
                // Linear, not squared. Squared put almost all of the response
                // inside the first fifth of the radius, where it is
                // indistinguishable from the word's own idle shimmer -- so the
                // one thing the visitor is directly causing was the one thing
                // they could not attribute to themselves.
                const fa = fq * T.aura;
                amp += fa * 0.55;
                size *= 1 + fa * 0.5;
                px += (ax / ad) * fa * 1.6 * lat;
                py += (ay / ad) * fa * 1.6 * lat;
              }
              // The share and the reach are one knob. `fq*fq*0.5` peaks at a
              // third of the radius out and falls to nothing at both ends, so
              // the longest capsule in the field is ~23px at the defaults --
              // which is the whole fill-rate budget of this effect, since a
              // square sprite pays for a diagonal segment by its length squared.
              if (stretch && A.rank[i] < T.str) {
                reach = fq * fq * 0.5 * T.str;
                rdx = ax;
                rdy = ay;
              }
            }
          }
          // Symbols where the story needs them. A reaching grain turns into its
          // character, because a stretched disc reads as goo rather than as
          // code; and the settled word holds a fixed share of characters on its
          // own, which is what makes it legible as something written.
          const gt = reach > 0 || (T.rsym && A.rank[i] < T.rdens) ? 1 : 0;
          A.gyArr[i] += (gt - A.gyArr[i]) * Math.min(1, dt * 6);
          size *= 1 + (T.rsize - 1) * A.gyArr[i];
          if (reach > 0) {
            size *= 1 + reach * (T.ssize - 1);
            // A reaching character aims at the hand, so its symbol is upright
            // along the line of strain rather than lying across it.
            if (T.salign) A.rArr[i] = Math.atan2(my - py, mx - px) + A.rest[i] * 0.35;
          } else A.rArr[i] += (A.rest[i] - A.rArr[i]) * Math.min(1, dt * 4);
          A.pos[j] = px;
          A.pos[j + 1] = py;
          A.anch[j] = px + rdx * reach;
          A.anch[j + 1] = py + rdy * reach;
          A.nArr[j] = A.nhX[i];
          A.nArr[j + 1] = A.nhY[i];
          A.sArr[i] += (size - A.sArr[i]) * Math.min(1, dt * 8);
          // Area is paid for in opacity, so a word holding characters does not
          // read as the same word turned brighter.
          A.aArr[i] = (A.baseA[i] * amp) / Math.sqrt(1 + (T.rsize - 1) * A.gyArr[i]);
          A.cArr[i] += (chip - A.cArr[i]) * Math.min(1, dt * 5);
        } else if (st === 1 || st === 2) {
          /* -------------------------------- loose: thrown, or carried -- */
          // One body for both, because a carried grain and a thrown one are the
          // same thing to look at: matter off its letterform, drawn as the
          // character it was made of, aimed at the hand while the hand is near.
          // Only how the velocity is arrived at differs, and that is settled
          // above. The wake therefore costs no drawing code at all.
          A.vel[j] *= drag;
          A.vel[j + 1] *= drag;
          A.pos[j] += A.vel[j] * dt;
          A.pos[j + 1] += A.vel[j + 1] * dt;
          // A loose grain no longer belongs to a surface, so its normal tumbles
          // with it: what was lit as a stroke is now lit as a solid -- unless it
          // is aiming at the hand, and then so is its light.
          if (stretch && T.salign && seen) {
            A.rArr[i] = Math.atan2(my - A.pos[j + 1], mx - A.pos[j]) + A.rest[i] * 0.35;
          } else A.rArr[i] += A.spin[i] * dt;
          A.nArr[j] = Math.cos(A.rArr[i]) * 0.55;
          A.nArr[j + 1] = Math.sin(A.rArr[i]) * 0.55;
          // Reach for the hand while it is near, streak with the flight when it
          // is not: a thrown grain leaves a trail behind its own travel, which
          // is the one cue that says how hard it was thrown.
          let anx = A.pos[j];
          let any = A.pos[j + 1];
          if (stretch) {
            const dxm = mx - A.pos[j];
            const dym = my - A.pos[j + 1];
            const dm2 = dxm * dxm + dym * dym;
            if (seen && dm2 < auraR2) {
              const fr = (1 - Math.sqrt(dm2) / auraR) * T.str;
              anx += dxm * fr;
              any += dym * fr;
            } else if (T.svel > 0) {
              const sp2 = Math.hypot(A.vel[j], A.vel[j + 1]);
              if (sp2 > 40) {
                const L = Math.min(70, sp2 * 0.07) * T.svel;
                anx -= (A.vel[j] / sp2) * L;
                any -= (A.vel[j + 1] / sp2) * L;
              }
            }
          }
          A.anch[j] = anx;
          A.anch[j + 1] = any;
          // Loose is where a mark finally has room to be something. A symbol at
          // grain size is a dot, and so is a cube: detached matter grows to a
          // legible mark and pays for the area in alpha, so a wound reads as
          // scatter rather than as the field getting brighter.
          A.cArr[i] += (chip - A.cArr[i]) * Math.min(1, dt * 8);
          A.gyArr[i] += (1 - A.gyArr[i]) * Math.min(1, dt * 7);
          const sym = 1 + sym1 * Math.max(A.gyArr[i], A.cArr[i]);
          A.sArr[i] += (A.baseS[i] * sym - A.sArr[i]) * Math.min(1, dt * 6);
          A.aArr[i] += (A.baseA[i] / Math.sqrt(sym) - A.aArr[i]) * Math.min(1, dt * 6);
        } else if (st === 4) {
          /* ------------------------------- burning out: becomes a symbol -- */
          // The grain becomes the character it was made of, flickers, and burns
          // down to nothing where it lies. The slot it left stays open.
          const p = Math.min(1, (t - A.hT[i]) / T.burn);
          A.vel[j] *= drag;
          A.vel[j + 1] *= drag;
          A.pos[j] += A.vel[j] * dt;
          A.pos[j + 1] += (A.vel[j + 1] - 24) * dt;
          A.gyArr[i] += (1 - A.gyArr[i]) * Math.min(1, dt * 14);
          A.rArr[i] += (A.rest[i] - A.rArr[i]) * Math.min(1, dt * 8);
          const gk = glyphOf(i, ((t * 1000) / T.mflick + A.rank[i] * 9) | 0);
          if (gk !== A.gArr[i]) {
            A.gArr[i] = gk;
            A.lead[i] = Math.max(A.lead[i], 0.8);
          }
          A.lead[i] *= Math.exp(-dt * 8);
          // It burns down from symbol size, not from grain size -- it was
          // already a character, and a shrink-then-swell would read as a pop.
          const dsym = 1 + sym1 * A.gyArr[i];
          A.sArr[i] = A.baseS[i] * dsym * (1 + T.msize * 0.4 * Math.sin(p * Math.PI)) * (1 - p * p);
          A.aArr[i] = (A.baseA[i] / Math.sqrt(dsym)) * (1 - p * p) * (1 + A.lead[i] * 1.4);
          // Nothing is holding on to it any more, so nothing is stretched.
          A.anch[j] = A.pos[j];
          A.anch[j + 1] = A.pos[j + 1];
          if (p >= 1) {
            A.st[i] = 5;
            A.sArr[i] = 0;
            A.aArr[i] = 0;
            A.gyArr[i] = 0;
            // Whichever is later: the gap this grain owes, or the moment the
            // caret is due over the slot it is going to take. This is the only
            // place the two schedules meet, and it is what makes it impossible
            // to manifest into a slot that has not finished being vacated.
            A.hAt[i] = Math.max(t + T.mgap + A.rank[i] * 0.2, A.mAt[i]);
          }
        } else if (st === 5) {
          /* ----------------------------------------------------- gone -- */
          if (t >= A.hAt[i]) this.manifest(i);
        } else {
          /* ------------------------------ manifesting: typed back in -- */
          // A character appears at the site, licks through a few glyphs, and
          // settles into flesh. The word closes as tissue, not as rain.
          const p = Math.min(1, (t - A.hT[i]) / T.mgrow);
          const km = Math.min(1, dt * 14);
          A.pos[j] += (A.homeX[i] - A.pos[j]) * km;
          A.pos[j + 1] += (A.homeY[i] - A.pos[j + 1]) * km;
          const gk = glyphOf(i * 7 + 3, ((t * 1000) / T.mflick) | 0);
          if (gk !== A.gArr[i] && p < 0.7) {
            A.gArr[i] = gk;
            A.lead[i] = 1;
          }
          A.lead[i] *= Math.exp(-dt * 9);
          // Flash decoupled from swell: msize is the size envelope, mflash the
          // brightness one. Coupling them through the decode leader is what
          // piled hot oversized sprites into an achromatic smear at the climax.
          const msym = 1 + sym1 * A.gyArr[i];
          A.sArr[i] =
            A.baseS[i] *
            Math.min(1, p * 4) *
            msym *
            (1 + (T.msize - 1) * Math.sin(p * Math.PI) * (0.35 + 0.65 * A.rank[i]));
          A.aArr[i] +=
            ((A.baseA[i] * (1 + A.lead[i] * T.mflash)) / Math.sqrt(msym) - A.aArr[i]) *
            Math.min(1, dt * 16);
          A.gyArr[i] = p < 0.55 ? 1 : Math.max(0, A.gyArr[i] - dt * 5);
          A.cArr[i] += (chip - A.cArr[i]) * Math.min(1, dt * 5);
          A.rArr[i] += (A.rest[i] - A.rArr[i]) * Math.min(1, dt * 8);
          A.nArr[j] += (A.nhX[i] - A.nArr[j]) * Math.min(1, dt * 6);
          A.nArr[j + 1] += (A.nhY[i] - A.nArr[j + 1]) * Math.min(1, dt * 6);
          A.anch[j] = A.pos[j];
          A.anch[j + 1] = A.pos[j + 1];
          if (p >= 1) {
            A.st[i] = 0;
            A.vel[j] = 0;
            A.vel[j + 1] = 0;
            A.pos[j] = A.homeX[i];
            A.pos[j + 1] = A.homeY[i];
            A.anch[j] = A.homeX[i];
            A.anch[j + 1] = A.homeY[i];
            A.nArr[j] = A.nhX[i];
            A.nArr[j + 1] = A.nhY[i];
            A.sArr[i] = A.baseS[i];
            A.gyArr[i] = 0;
            A.rArr[i] = A.rest[i];
          }
        }
      }

      // This frame's census, for next frame's cap. Counted rather than kept as a
      // running total on promote and release, so it cannot drift out of step with
      // the field it is supposed to describe -- startTr hands grains back without
      // going through the release path, and a counter would have to know that.
      this.carried = carried;

      this.stepLean(dt);
      this.r.draw();
      this.drawCaret(t, dt);
      if (tr && tr.T >= 1) this.endTr();
    }

    /* ------------------------------------------------------------- caret -- */

    drawCaret(t, dt) {
      const cx = this.cctx;
      cx.clearRect(0, 0, this.ccw, this.cch);
      if (!T.caret) return;
      const ac = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#67e8f9';
      const tr = this.tr;
      if (tr && tr.full && tr.segs.length) {
        // Not `T`. That is the knob object this whole file reads, and a local of
        // the same name shadowed it here -- so `T.caretTilt` was a property of a
        // Number, the clamp returned NaN, and `ctx.rotate(NaN)` is specified to
        // do nothing. The caret has never once leaned, and its knob has never
        // done anything, for as long as both have existed.
        const at = Math.min(1, tr.T);
        const c = this.caretPos(at);
        const c2 = this.caretPos(Math.max(0, at - 0.012));
        // 0.3rad ≈ 17°, an italic caret. The old nozzle could lean to 0.45 and
        // still read as a cone; a bar at that angle reads as a slash.
        const tilt = CLAMP((c.x - c2.x) * 0.012, -T.caretTilt, T.caretTilt);
        this.caretBar(cx, c.x, c.y, c.h, ac, t, c.mode, tilt);
      } else if (!tr && this.park) {
        // The caret does not travel to whatever the hand is over. It marks where
        // the machine last wrote, which is the end of the last heading, and a
        // read/write head that chases the mouse is a cursor -- a different object
        // with a different job. The hand's own answer is the Trail and the Snap.
        this.caretBar(cx, this.park.x, this.park.y, this.park.h, ac, t, 'idle', 0);
      }
    }

    /** The read/write head, drawn as what it is: a text caret. Solid while it
     *  works, step-blinking when parked -- the same 1s/55% duty as the boot
     *  log's `▮`. `h` is half the line, so the bar spans the type it sits on. */
    caretBar(cx, x, y, h, color, t, mode, tilt) {
      // ponytail: no grain-flow indicator on the bar. The particles streaming
      // in or out of it already say which direction the work is going.
      if (mode === 'idle' && (t % T.caretBlink) / T.caretBlink > 0.55) return;
      cx.save();
      cx.translate(x, y);
      cx.rotate(tilt || 0);
      const w = Math.max(2, h * T.caretW);
      cx.fillStyle = color;
      cx.fillRect(-w / 2, -h, w, h * 2);
      cx.restore();
    }

    /* ------------------------------------------------------------- shell -- */

    initNav() {
      document.querySelectorAll('[data-nav]').forEach((el) => {
        el.addEventListener('click', (ev) => {
          ev.preventDefault();
          this.goTo(el.dataset.nav);
        });
      });
      // The track. Click a tick to put the head on that Epoch; the arrow keys and
      // the wheel step through them via nav(), and focus inside the tab strip gets
      // the same arrows for free, so nothing extra is bound here for keyboard.
      //
      // ponytail: click, not drag. A drag would be a control that answers about
      // one movement in four -- every step is a real transition behind the nav
      // cooldown, so a continuous scrub would silently drop most of the gesture.
      // Three ways in (tick, arrows, wheel) all of which the transition can honour.
      document.querySelectorAll('.tick').forEach((el) => {
        el.addEventListener('click', () => this.goTo('exp:' + el.dataset.ep));
      });
    }

    initInput() {
      let wac = 0;
      let lastWheel = 0;
      const nav = (dir) => {
        // While the panel is open the wheel, the arrows and a swipe belong to it.
        if (this.tr || !this.ready || root.dataset.tw === 'open') return;
        if (performance.now() - (this.lastNav || 0) < T.navLock) return;
        // Along VIEWS, not PAGES -- which is the whole of the nested advance. A
        // wheel on Experience steps to the next Epoch and, once the tape runs out,
        // the same gesture continues to Projects. Every input path funnels through
        // here, so the wheel, both arrow axes, PageUp/Down and a swipe all get it
        // at once and cannot drift apart.
        const nx = VIEWS.indexOf(this.cur) + dir;
        if (nx >= 0 && nx < VIEWS.length) this.goTo(VIEWS[nx]);
      };
      addEventListener(
        'wheel',
        (ev) => {
          const now = performance.now();
          if (now - lastWheel > 300) wac = 0;
          lastWheel = now;
          wac += ev.deltaY;
          if (Math.abs(wac) > T.wheelGate) {
            nav(wac > 0 ? 1 : -1);
            wac = 0;
          }
        },
        { passive: true },
      );
      addEventListener('keydown', (ev) => {
        // A modified key belongs to the browser, not to this site. The audience
        // this is built for has a dozen tabs open, and `Cmd/Ctrl+1..4` is how
        // they switch between them -- claiming it means they come back to this
        // tab and find it on a page they did not choose. Same for `Alt+Left`,
        // which is Back.
        if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
        // Digits stay live while the panel is open. The Panel Owns The Gesture
        // Rule is an argument about scrolling -- a panel you cannot scroll
        // without changing page is not a panel -- and a digit is not a scroll.
        // Nearly every control in there affects matter that is only on one
        // page, so with all five paths refused the instrument cannot be used to
        // inspect the thing it instruments.
        const panel = root.dataset.tw === 'open';
        if (ev.key >= '1' && ev.key <= String(PAGES.length)) this.goTo(PAGES[+ev.key - 1]);
        else if (panel) return;
        else if (['ArrowDown', 'PageDown', 'ArrowRight'].includes(ev.key)) nav(1);
        else if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(ev.key)) nav(-1);
      });
      let ty0 = null;
      addEventListener('touchstart', (ev) => {
        ty0 = ev.touches[0].clientY;
      }, { passive: true });
      addEventListener('touchend', (ev) => {
        if (ty0 === null) return;
        const dy = ty0 - ev.changedTouches[0].clientY;
        if (Math.abs(dy) > 70) nav(dy > 0 ? 1 : -1);
        ty0 = null;
      }, { passive: true });
    }

    setHud(view) {
      const page = pageOf(view);
      const ep = epOf(view);
      const el = $('hud-page');
      const n = PAGES.indexOf(page) + 1;
      // The Epoch counter rides the page counter rather than replacing it: the
      // visitor is on page two of four *and* Epoch three of four, and dropping
      // either number leaves the tape looking like it lost the site's rhythm.
      const tail = ep >= 0 ? ` · EPOCH ${ep + 1} / ${EPN}` : '';
      if (el) el.textContent = `0${n} / 0${PAGES.length} — ${LABELS[page]}${tail}`;
      // The HUD itself is aria-hidden, so the change is announced here. An Epoch
      // change is a content change with no page change, which is precisely the
      // case a live region exists for.
      const live = $('pg-live');
      if (!live) return;
      if (ep < 0) {
        live.textContent = `${LABELS[page]}, page ${n} of ${PAGES.length}`;
        return;
      }
      const art = $('pg-exp').querySelector(`.epoch[data-ep="${ep}"]`);
      const year = art ? (art.querySelector('.year')?.textContent || '').trim() : '';
      const title = art ? (art.querySelector('.etitle')?.textContent || '').trim() : '';
      live.textContent = `${year}, ${title}. Epoch ${ep + 1} of ${EPN}, on ${LABELS[page]}.`;
    }

    navActive(view) {
      const page = pageOf(view);
      for (const p of PAGES) {
        const el = $('nl-' + p);
        if (el) el.setAttribute('aria-current', p === page ? 'page' : 'false');
      }
      // The tape's tab strip, marked from the same call that marks the nav, so the
      // two can never disagree about where the read head is.
      const ep = epOf(view);
      for (const tk of document.querySelectorAll('.tick')) {
        const on = +tk.dataset.ep === ep;
        tk.setAttribute('aria-selected', on ? 'true' : 'false');
        tk.tabIndex = on ? 0 : -1;
      }
      if (!EPN) return;
      for (const art of $('pg-exp').querySelectorAll('.epoch')) {
        // Set here rather than in the markup: the tablist these belong to is
        // matter-reading furniture, and a tabpanel with no tablist would be a lie
        // the calm document tells a screen reader.
        art.setAttribute('role', 'tabpanel');
        art.setAttribute('aria-labelledby', 'tk-' + art.dataset.ep);
      }
    }

    initBoot(done) {
      const el = $('boot');
      const log = $('boot-log');
      // A capture is not a visitor: a debug URL never waits behind the gate.
      if (!el || !log || !T.boot || DBG || T0) {
        if (el) el.remove();
        done();
        return;
      }
      // The three log lines keep their proportions as the hold changes, so a 400ms
      // boot is the same sequence played faster rather than three lines cut off.
      const rate = T.bootMs / 1250;
      const lines = [
        ['<span class="accent">$</span> jakhmola --wake', 120],
        // Interpolated, not typed: the site's whole claim is that the count is
        // real, and this line said 6,000 for as long as N said 9000. It reads the
        // live budget, so a visitor who moved the slider is told their own number.
        [`&gt; ledger restored ....... ${NP.toLocaleString('en-US')} units · nothing lost`, 500],
        ['&gt; route /index<span class="caret-blink">▮</span>', 880],
      ];
      let fin = false;
      const timers = [];
      const finish = () => {
        if (fin) return;
        fin = true;
        timers.forEach(clearTimeout);
        for (const ev of ['pointerdown', 'keydown', 'wheel']) removeEventListener(ev, finish);
        el.style.transition = 'transform .7s cubic-bezier(.76,0,.24,1)';
        el.style.transform = 'translateY(-100%)';
        setTimeout(() => el.remove(), 800);
        done();
      };
      for (const [html, at] of lines) {
        timers.push(
          setTimeout(() => {
            const div = document.createElement('div');
            div.innerHTML = html;
            log.appendChild(div);
            requestAnimationFrame(() => div.classList.add('in'));
          }, at * rate),
        );
      }
      // A gate in front of content must never behave like one: any input skips it.
      timers.push(setTimeout(finish, T.bootMs));
      for (const ev of ['pointerdown', 'keydown', 'wheel']) addEventListener(ev, finish);
    }

    initHudClock() {
      const clock = $('hud-clock');
      if (!clock) return;
      const pad = (n) => String(n).padStart(2, '0');
      const tk = () => {
        const d = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
        // Leading, and separated. `GMT+5:30 IN 02:33` parses as the
        // preposition -- it reads as "in two and a half hours".
        clock.textContent =
          `IN · GMT+5:30 · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };
      tk();
      setInterval(tk, 1000);
    }

    initScramble() {
      if (!T.scramble) return;
      const CH = '!<>-_/[]{}=+*^?#$%&@01';
      document.querySelectorAll('[data-scramble]').forEach((el) => {
        const nodes = [];
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = tw.nextNode())) if (n.textContent.trim()) nodes.push({ node: n, orig: n.textContent });
        if (!nodes.length) return;
        let raf = null;
        const restore = () => nodes.forEach((o) => (o.node.textContent = o.orig));
        el.addEventListener('pointerenter', () => {
          if (raf) cancelAnimationFrame(raf);
          const t0 = performance.now();
          const step = (now) => {
            const p = Math.min(1, (now - t0) / T.scrambleMs);
            for (const o of nodes) {
              const L = o.orig.length;
              const solved = Math.floor(p * L);
              let out = '';
              for (let i = 0; i < L; i++) {
                const c = o.orig[i];
                out += i < solved || c === ' ' ? c : CH[(Math.random() * CH.length) | 0];
              }
              o.node.textContent = out;
            }
            if (p < 1) raf = requestAnimationFrame(step);
            else {
              raf = null;
              restore();
            }
          };
          raf = requestAnimationFrame(step);
        });
        el.addEventListener('pointerleave', () => {
          if (raf) cancelAnimationFrame(raf);
          raf = null;
          restore();
        });
      });
    }

    /** The hand pulls a little on the thing under it. Small and critically damped:
     *  this system is cold and precise, and the elastic overshoot the effect is
     *  usually built with reads as jelly rather than as magnetism.
     *
     *  Writes `translate`, never `transform`. `.matter .copy` owns `transform` for
     *  its reveal and endTr assigns `transform: none` on those elements directly,
     *  so a lean written there would be wiped mid-hover on some elements and would
     *  wipe the reveal on others. The two properties compose -- the panel already
     *  does exactly this one level up, translating `.topnav` while its children
     *  keep their own transforms. */
    stepLean(dt) {
      const L = this.lean;
      if (!L) return;
      const live = L.on && T.lean && !this.tr && this.mx > -9000 && root.dataset.tw !== 'open';
      const tx = live ? (this.mx - L.cx) * T.leanF : 0;
      const ty = live ? (this.my - L.cy) * T.leanF : 0;
      const k = 1 - Math.exp(-dt * T.leanK);
      L.x += (tx - L.x) * k;
      L.y += (ty - L.y) * k;
      // Home, and released: the inline style comes off rather than being left at
      // `0px 0px`, so an element nobody is touching carries nothing from this.
      if (!live && Math.abs(L.x) < 0.05 && Math.abs(L.y) < 0.05) {
        L.el.style.translate = '';
        this.lean = null;
        return;
      }
      L.el.style.translate = `${L.x.toFixed(2)}px ${L.y.toFixed(2)}px`;
    }

    /** What the hand does to the shell, over the one set of interactive text the
     *  site has. `[data-scramble]` is already on the nav, the brand, and every
     *  source and social link, and it is the right set for this too -- the Dock
     *  is the other half of the gesture the scramble is: the machine has put its
     *  write head on a word and is retyping it, so the caret goes there.
     *
     *  The rect is read on enter and never in the frame loop. No page on this site
     *  scrolls and none reflows while it is up, so one read is the whole
     *  measurement -- see The Measure-Once Rule. */
    initHover() {
      document.querySelectorAll('[data-scramble]').forEach((el) => {
        el.addEventListener('pointerenter', () => {
          if (this.tr) return;
          const r = el.getBoundingClientRect();
          if (r.width < 2) return;
          const h = r.height / 2;
          if (T.caretDock) {
            // Past the last glyph by one bar-width, the way a caret sits one space
            // past the end of a line. Derived from the caret's own width knob
            // rather than picked, because the parked caret's 14px is a figure for a
            // 114px heading and would put this one halfway across the nav.
            this.dock = { el, x: r.right + Math.max(2, h * T.caretW) * 2, y: r.top + h, h };
          }
          // While the panel is open it has translated the whole nav 340px clear of
          // itself, so every rect cached in here is wrong by that much. Refusing is
          // one line and consistent with The Panel Owns The Gesture Rule;
          // re-reading rects on a panel toggle is not worth the code.
          if (T.lean && root.dataset.tw !== 'open') {
            const L = this.lean;
            if (L && L.el !== el) L.el.style.translate = '';
            // A rect read now is already displaced by whatever lean is still on the
            // element, so a re-entry mid-return keeps the centre it was first
            // measured at rather than measuring the displacement into itself.
            this.lean = L && L.el === el ? ((L.on = true), L) : { el, cx: r.left + r.width / 2, cy: r.top + h, x: 0, y: 0, on: true };
          }
        });
        el.addEventListener('pointerleave', () => {
          this.dock = null;
          if (this.lean && this.lean.el === el) this.lean.on = false;
        });
      });
      document.addEventListener('selectionchange', () => {
        const s = getSelection();
        this.selecting = !!s && !s.isCollapsed;
      });
    }

  }

  // Width is decided here rather than in the head probe, because the viewport is
  // not final at parse time: a tiling compositor resizes the window afterwards,
  // and a point-in-time innerWidth test reads the pre-resize value. The media
  // query is reactive, so a window that starts narrow and lands wide still runs.
  // ponytail: one-way -- going narrow hands the session to the calm document for
  // good. Widening back would need a full re-init, which no one does mid-visit.
  const matter = new Matter();
  // The harness needs to assert on the sampled point clouds and the state
  // census, and neither is reachable from outside this closure. Debug URLs only.
  if (DBG) window.__matter = matter;
  if (NARROW.matches) {
    const waitForWidth = (ev) => {
      if (ev.matches) return;
      NARROW.removeEventListener('change', waitForWidth);
      matter.start();
    };
    NARROW.addEventListener('change', waitForWidth);
  } else {
    matter.start();
  }
})();
