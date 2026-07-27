// The matter system: one conserved particle buffer that spells the site.
//
// Every heading marked `.mt` is sampled off-screen into a point cloud. Navigating
// runs one choreography over that single buffer -- a caret consumes the current
// page's glyphs, carries the grains across, and emits them into the next page's
// letterforms. Nothing is created or destroyed; between pages the grains idle in
// an hourglass at the page's anchor.
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

  const PAGES = ['home', 'exp', 'proj', 'contact'];
  const LABELS = { home: 'INDEX', exp: 'EXPERIENCE', proj: 'PROJECTS', contact: 'CONTACT' };
  const N = 6000; // particle budget; sized once, never reallocated
  const GRAIN = 2.3;
  const LAGS = [0.006, 0.016, 0.026, 0.036, 0.048, 0.062, 0.078, 0.096];
  const NARROW = matchMedia('(max-width: 820px)');

  const $ = (id) => document.getElementById(id);

  function accentRGB() {
    const hex = getComputedStyle(document.body).getPropertyValue('--accent').trim();
    const m = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
    return m ? [1, 2, 3].map((i) => parseInt(m[i], 16) / 255) : [0.4, 0.91, 0.98];
  }

  /* ------------------------------------------------------------ renderer -- */

  const VERT = `
attribute vec2 aPos; attribute float aSize; attribute float aAlpha;
attribute float aGlyph; attribute float aDot;
uniform vec2 uRes; uniform float uSize; uniform float uDpr;
varying float vA; varying float vG; varying float vD;
void main(){
  vA = aAlpha; vG = aGlyph; vD = aDot;
  gl_PointSize = aSize * uSize * uDpr;
  gl_Position = vec4(aPos.x / uRes.x * 2.0 - 1.0, 1.0 - aPos.y / uRes.y * 2.0, 0.0, 1.0);
}`;

  // Chromatic-fringed glyph lookup: three horizontally offset atlas taps become
  // the R/G/B channels, mixed toward a plain dot as vD rises.
  const FRAG = `
precision mediump float;
uniform vec3 uColor; uniform sampler2D uAtlas;
varying float vA; varying float vG; varying float vD;
void main(){
  vec2 bu = vec2((vG + gl_PointCoord.x) / 9.0, 1.0 - gl_PointCoord.y);
  vec2 du = vec2((8.0 + gl_PointCoord.x) / 9.0, 1.0 - gl_PointCoord.y);
  float gR = texture2D(uAtlas, bu + vec2(0.0012, 0.0)).a;
  float gG = texture2D(uAtlas, bu).a;
  float gB = texture2D(uAtlas, bu - vec2(0.0012, 0.0)).a;
  float dA = texture2D(uAtlas, du).a;
  vec3 ch = mix(vec3(gR, gG, gB), vec3(dA), vD);
  float a = mix(max(gR, max(gG, gB)), dA, vD) * vA;
  if (a < 0.02) discard;
  vec2 gc = gl_PointCoord - vec2(0.34, 0.3);
  float glint = pow(max(0.0, 1.0 - length(gc) * 2.6), 3.0) * 0.55 * (1.0 - vD) * a;
  gl_FragColor = vec4(uColor * ch + vec3(glint), a * 0.92);
}`;

  // Atlas: eight terminal glyphs in cells 0-7, a soft dot in cell 8.
  const GLYPHS = ['0', '1', '>', '$', '{', '}', '*', ';'];

  function paintAtlas(cv) {
    const cx = cv.getContext('2d');
    cx.clearRect(0, 0, cv.width, cv.height);
    const grd = cx.createLinearGradient(0, 0, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(1, 'rgba(255,255,255,.42)');
    cx.fillStyle = grd;
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.font = '700 46px "JetBrains Mono", monospace';
    GLYPHS.forEach((g, i) => cx.fillText(g, i * 64 + 32, 36));
    const rg = cx.createRadialGradient(8 * 64 + 30, 30, 2, 8 * 64 + 32, 32, 17);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.65, 'rgba(255,255,255,.85)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = rg;
    cx.beginPath();
    cx.arc(8 * 64 + 32, 32, 17, 0, 6.283);
    cx.fill();
  }

  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }

  /** One gl.POINTS draw call over N particles. Returns null if WebGL is refused. */
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

    const attrs = [
      ['aPos', arrays.pos, 2],
      ['aSize', arrays.sArr, 1],
      ['aAlpha', arrays.aArr, 1],
      ['aDot', arrays.dArr, 1],
      ['aGlyph', arrays.gArr, 1],
    ].map(([name, data, size]) => {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      return { buf, data };
    });
    const dynamic = attrs.slice(0, 4); // aGlyph never changes after seeding

    const atlas = Object.assign(document.createElement('canvas'), { width: 576, height: 64 });
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
    const uRes = U('uRes');
    const uDpr = U('uDpr');
    gl.uniform1i(U('uAtlas'), 0);
    gl.uniform1f(U('uSize'), GRAIN);
    gl.uniform3fv(U('uColor'), accentRGB());

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    let dpr = 1;
    return {
      gl,
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
        gl.uniform2f(uRes, w, h);
        gl.uniform1f(uDpr, ratio);
      },
      pixelRatio: () => dpr,
      draw() {
        for (const a of dynamic) {
          gl.bindBuffer(gl.ARRAY_BUFFER, a.buf);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, a.data);
        }
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, N);
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
      this.t = 0;
      this.visited = {};
      try {
        this.visited = JSON.parse(sessionStorage.getItem('jak-v4-visited') || '{}');
      } catch (err) {
        /* private mode: every visit gets the full choreography */
      }
    }

    start() {
      this.initHudClock();
      this.initScramble();
      this.initCursorRing();
      this.initNav();
      this.initInput();

      const booted = new Promise((done) => this.initBoot(done));
      const built = this.initGL() ? this.afterGL() : Promise.resolve(false);

      Promise.all([built, booted]).then(([ok]) => {
        if (!ok || this.dead) return;
        this.ready = true;
        const hash = location.hash.replace('#pg-', '');
        this.startTr(PAGES.includes(hash) ? hash : 'home', true);
      });
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
      document.querySelectorAll('.copy').forEach((el) => {
        el.style.opacity = '';
        el.style.transform = '';
      });
    }

    /* ------------------------------------------------------------ sample -- */

    /** Rasterize every `.mt` heading to a point cloud in viewport coordinates. */
    sampleAll() {
      const off = document.createElement('canvas');
      const octx = off.getContext('2d', { willReadFrequently: true });
      this.tg = {};
      this.copies = {};
      for (const pg of PAGES) {
        const sec = $('pg-' + pg);
        const list = [];
        sec.querySelectorAll('.mt').forEach((el) => {
          const r = el.getBoundingClientRect();
          const txt = (el.textContent || '').trim();
          if (r.width < 2 || !txt) return;
          const cs = getComputedStyle(el);
          const fs = parseFloat(cs.fontSize);
          // The sample grid must be finer than the thinnest stroke, or the
          // letterform dissolves. Below ~26px there is not enough to resolve.
          const g = Math.max(3, Math.min(6, Math.round(fs / 14)));
          const pad = 4;
          const cw = Math.ceil(r.width) + pad * 2;
          const ch = Math.ceil(r.height) + pad * 2;
          off.width = cw;
          off.height = ch;
          octx.fillStyle = '#fff';
          octx.textBaseline = 'middle';
          octx.textAlign = 'left';
          try {
            octx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
          } catch (err) {
            /* Safari < 17.4: tracking is baked into the measured box anyway */
          }
          octx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
          octx.fillText(txt, pad, ch / 2);
          const img = octx.getImageData(0, 0, cw, ch).data;
          const on = (px, py) =>
            px >= 0 && py >= 0 && px < cw && py < ch && img[(py * cw + px) * 4 + 3] > 120;
          const xs = [];
          const ys = [];
          for (let py = 0; py < ch; py += g) {
            for (let px = 0; px < cw; px += g) {
              if (!on(px, py)) continue;
              // Always keep edge samples; thin the interior to save budget.
              const edge = !on(px - g, py) || !on(px + g, py) || !on(px, py - g) || !on(px, py + g);
              if (edge || Math.random() < 0.8) {
                xs.push(r.left + px - pad);
                ys.push(r.top + py - pad);
              }
            }
          }
          list.push({ el, fs, l: r.left, r: r.right, cy: r.top + r.height / 2, top: r.top, xs, ys });
        });
        list.sort((a, b) => a.top - b.top || a.l - b.l);
        // Reserve grains for the idle hourglass, then thin proportionally.
        const cap = Math.min(N - 380, 4800);
        const tot = list.reduce((s, tg) => s + tg.xs.length, 0);
        const keep = tot > cap ? cap / tot : 1;
        list.forEach((tg, idx) => {
          const n0 = tg.xs.length;
          const pts = new Float32Array(n0 * 2);
          const xf = new Float32Array(n0);
          let m = 0;
          for (let k = 0; k < n0; k++) {
            if (keep < 1 && Math.random() > keep) continue;
            pts[m * 2] = tg.xs[k] + (Math.random() - 0.5) * 1.5;
            pts[m * 2 + 1] = tg.ys[k] + (Math.random() - 0.5) * 1.5;
            xf[m] = (tg.xs[k] - tg.l) / Math.max(1, tg.r - tg.l);
            m++;
          }
          tg.pts = pts;
          tg.xf = xf;
          tg.n = m;
          tg.idx = idx;
          delete tg.xs;
          delete tg.ys;
        });
        this.tg[pg] = list;
        this.copies[pg] = Array.from(sec.querySelectorAll('.copy'))
          .map((el) => ({ el, top: el.getBoundingClientRect().top }))
          .sort((a, b) => a.top - b.top)
          .map((o) => o.el);
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
        pos: new Float32Array(N * 2),
        vel: new Float32Array(N * 2),
        st: new Uint8Array(N),
        homeX: new Float32Array(N),
        homeY: new Float32Array(N),
        u: new Float32Array(N),
        uspd: new Float32Array(N),
        kind: new Uint8Array(N),
        rank: new Float32Array(N),
        uox: new Float32Array(N),
        uoy: new Float32Array(N),
        otg: new Int16Array(N),
        oxf: new Float32Array(N),
        tC: new Float32Array(N),
        tL: new Float32Array(N),
        lagB: new Uint8Array(N),
        ld: new Uint8Array(N),
        nhX: new Float32Array(N),
        nhY: new Float32Array(N),
        after: new Uint8Array(N),
        nTg: new Int16Array(N),
        nXf: new Float32Array(N),
        dX: new Float32Array(N),
        dY: new Float32Array(N),
        baseS: new Float32Array(N),
        baseA: new Float32Array(N),
        aArr: new Float32Array(N),
        sArr: new Float32Array(N),
        dArr: new Float32Array(N),
        gArr: new Float32Array(N),
      });
      A.tC.fill(9); // 9 = "not taking part in this transition"
      for (let i = 0; i < N; i++) {
        A.kind[i] = Math.random() < 0.3 ? 0 : 1; // 0 = traces the hourglass outline
        A.rank[i] = Math.random();
        A.u[i] = Math.random();
        A.uspd[i] = 0.07 + Math.random() * 0.08;
        A.baseS[i] = 2.6 + Math.random() * 2.2;
        A.baseA[i] = 0.5 + Math.random() * 0.5;
        A.gArr[i] = Math.floor(Math.random() * 8);
        const P = this.outlineP(A.u[i]);
        A.uox[i] = P[0];
        A.uoy[i] = P[1];
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
      this.lbx = new Float32Array(8);
      this.lby = new Float32Array(8);

      this.onResize();
      addEventListener('resize', () => this.onResize());
      addEventListener('pointermove', (ev) => {
        this.mx = ev.clientX;
        this.my = ev.clientY;
      });
      // The CSS falls back to the calm document below 820px; stop burning frames.
      NARROW.addEventListener('change', (ev) => {
        if (ev.matches) this.giveUp();
      });

      let last = performance.now();
      const loop = (now) => {
        if (this.dead) return;
        requestAnimationFrame(loop);
        const dt = Math.min((now - last) / 1000, 0.045); // clamped: a throttled
        last = now; // tab must not skip the choreography
        this.tick(dt);
      };
      requestAnimationFrame(loop);
      return true;
    }

    afterGL() {
      const fonts = document.fonts
        ? Promise.all([
            document.fonts.load('700 140px "Space Grotesk"'),
            document.fonts.load('700 42px "JetBrains Mono"'),
            document.fonts.load('500 26px "JetBrains Mono"'),
          ])
        : Promise.resolve();
      return fonts.catch(() => {}).then(() => {
        if (this.dead) return false;
        this.r.refreshAtlas();
        this.sampleAll();
        this.anc = Object.assign({}, this.ancHome);
        this.ancT = this.ancHome;
        this.seedLoop();
        this.seeded = true;
        return true;
      });
    }

    onResize() {
      const w = innerWidth;
      const h = innerHeight;
      this.r.resize(w, h, Math.min(devicePixelRatio || 1, this.dprCap || 2));
      const cdpr = (this.cdpr = Math.min(devicePixelRatio || 1, 2));
      this.ccw = w;
      this.cch = h;
      this.caret.width = w * cdpr;
      this.caret.height = h * cdpr;
      this.cctx.setTransform(cdpr, 0, 0, cdpr, 0, 0);
      clearTimeout(this.rsT);
      this.rsT = setTimeout(() => {
        // Re-anchor on resize only -- never per frame.
        if (this.tr || !this.seeded || this.dead) return;
        this.sampleAll();
        this.ancT = !this.cur || this.cur === 'home' ? this.ancHome : this.ancSigil;
        if (this.cur) {
          this.assignInstant(this.cur);
          this.parkCaret(this.cur);
        }
      }, 260);
    }

    /** Hourglass perimeter in unit space: two triangles meeting at a slight waist.
     *  v walks the outline; each half runs A(-1,s) -> B(1,s) -> C(0,0.05s) -> A. */
    outlineP(v) {
      const s = v < 0.5 ? -1 : 1; // -1 = upper bulb
      const w = (v < 0.5 ? v : v - 0.5) * 2;
      const t1 = 0.413; // A->B is the flat outer edge
      const t2 = 0.706; // B->C dives to the waist
      if (w < t1) return [-1 + 2 * (w / t1), s];
      if (w < t2) {
        const p = (w - t1) / (t2 - t1);
        return [1 - p, s + (s * 0.05 - s) * p];
      }
      const p = (w - t2) / (1 - t2);
      return [-p, s * 0.05 + (s - s * 0.05) * p];
    }

    seedLoop() {
      const A = this.A;
      const anc = this.anc;
      for (let i = 0; i < N; i++) {
        A.st[i] = 0;
        const [ux, uy] = this.loopPoint(i);
        A.pos[i * 2] = anc.x + ux * anc.w * 0.5;
        A.pos[i * 2 + 1] = anc.y + uy * anc.h * 0.5;
        A.aArr[i] = 0;
        A.sArr[i] = A.baseS[i] * 0.7;
        A.dArr[i] = 1;
      }
    }

    /** Where an idling grain belongs: outline tracers vs. the falling stream. */
    loopPoint(i) {
      const A = this.A;
      if (A.kind[i] === 0) return [A.uox[i], A.uoy[i]];
      const th = A.u[i] * 6.2832;
      const c = Math.cos(th);
      return [Math.sin(2 * th) * 0.55 * (0.1 + 0.9 * Math.abs(c)), -c * 0.9];
    }

    /* --------------------------------------------------------- transition -- */

    goTo(page) {
      if (!this.ready || this.tr || page === this.cur) return;
      this.startTr(page, false);
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
          : { x: this.anc.x, y: this.anc.y };
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

    startTr(page, first) {
      const A = this.A;
      const rnd = Math.random;
      // Full choreography once per page per session; repeats fly direct.
      const full = first || !this.visited[page];
      const oldPg = this.cur;
      A.tC.fill(9);
      A.ld.fill(0);

      const ntgs = this.tg[page] || [];
      const slots = [];
      for (const tg of ntgs) {
        for (let k = 0; k < tg.n; k++) {
          slots.push({ x: tg.pts[k * 2], y: tg.pts[k * 2 + 1], xf: tg.xf[k], ti: tg.idx });
        }
      }
      const oldIdx = [];
      for (let i = 0; i < N; i++) if (A.st[i] === 1) oldIdx.push(i);
      oldIdx.sort((a, b) => A.otg[a] - A.otg[b] || A.oxf[a] - A.oxf[b]);
      const loopIdx = [];
      const st0 = (rnd() * N) | 0;
      for (let k = 0; k < N; k++) {
        const i = (st0 + k) % N;
        if (A.st[i] === 0) loopIdx.push(i);
      }
      const avail = oldIdx.length + Math.max(0, loopIdx.length - 340);
      const useSlots =
        slots.length > avail ? slots.filter(() => rnd() < avail / slots.length) : slots;

      const sd = this.buildSegs(full, oldPg && full ? this.tg[oldPg] : null, ntgs);
      const dur = full ? (first ? 1.7 : 1.9) : 0.62;
      const M = useSlots.length;
      const K = oldIdx.length;
      let lp = 0;
      for (let k = 0; k < M; k++) {
        const s = useSlots[k];
        let p;
        let srcLoop = false;
        if (k < K) p = oldIdx[k];
        else {
          if (lp >= loopIdx.length) break;
          p = loopIdx[lp++];
          srcLoop = true;
        }
        if (full) {
          if (srcLoop) A.tC[p] = sd.tw0 + rnd() * (sd.tw1 - sd.tw0) * 0.9;
          else {
            const w = sd.cw[A.otg[p]] || [0.05, 0.4];
            A.tC[p] = w[0] + (w[1] - w[0]) * A.oxf[p];
          }
          const e = sd.ew[s.ti] || [sd.e0, sd.e1];
          A.tL[p] = Math.max(A.tC[p] + 0.08, e[0] + (e[1] - e[0]) * s.xf);
        } else {
          A.tC[p] = 0.02 + rnd() * 0.25;
          A.tL[p] = A.tC[p] + 0.45 + rnd() * 0.25;
          A.dX[p] = A.pos[p * 2];
          A.dY[p] = A.pos[p * 2 + 1];
        }
        A.nhX[p] = s.x;
        A.nhY[p] = s.y;
        A.after[p] = 1;
        A.nTg[p] = s.ti;
        A.nXf[p] = s.xf;
        A.lagB[p] = (rnd() * 8) | 0;
      }
      // Surplus grains from the old page: consumed, then returned to the loop.
      for (let k = M; k < K; k++) {
        const p = oldIdx[k];
        if (full) {
          const w = sd.cw[A.otg[p]] || [0.05, 0.4];
          A.tC[p] = w[0] + (w[1] - w[0]) * A.oxf[p];
          A.tL[p] = Math.max(A.tC[p] + 0.1, sd.tw0 + 0.05 + rnd() * (sd.tw1 - sd.tw0));
        } else {
          A.tC[p] = 0.02 + rnd() * 0.2;
          A.tL[p] = A.tC[p];
        }
        A.after[p] = 0;
        A.u[p] = rnd();
        A.kind[p] = rnd() < 0.25 ? 0 : 1;
        const P = this.outlineP(A.u[p]);
        A.uox[p] = P[0];
        A.uoy[p] = P[1];
        A.lagB[p] = (rnd() * 8) | 0;
      }

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
      for (const p of PAGES) {
        const sec = $('pg-' + p);
        sec.style.pointerEvents = 'none';
        if (p === page || p === oldPg) sec.style.visibility = 'visible';
      }
      this.ancT = page === 'home' ? this.ancHome : this.ancSigil;
      this.park = null;
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

    landP(i) {
      const A = this.A;
      A.ld[i] = 1;
      if (A.after[i] === 1) {
        A.st[i] = 1;
        A.homeX[i] = A.nhX[i];
        A.homeY[i] = A.nhY[i];
        A.otg[i] = A.nTg[i];
        A.oxf[i] = A.nXf[i];
      } else A.st[i] = 0;
    }

    endTr() {
      const tr = this.tr;
      const A = this.A;
      for (let i = 0; i < N; i++) if (A.tC[i] < 9 && !A.ld[i]) this.landP(i);
      for (const p of PAGES) {
        const sec = $('pg-' + p);
        const on = p === tr.page;
        sec.style.visibility = on ? 'visible' : 'hidden';
        sec.style.pointerEvents = on ? 'auto' : 'none';
      }
      for (const r of tr.rv) {
        if (!r.done) {
          r.el.style.opacity = '1';
          r.el.style.transform = 'none';
        }
      }
      this.cur = tr.page;
      this.visited[tr.page] = 1;
      try {
        sessionStorage.setItem('jak-v4-visited', JSON.stringify(this.visited));
      } catch (err) {
        /* nothing to remember, nothing to lose */
      }
      try {
        history.replaceState(null, '', '#pg-' + tr.page);
      } catch (err) {
        /* file:// origin — the URL just stays put */
      }
      this.parkCaret(tr.page);
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
    }

    parkCaret(page) {
      const tgs = this.tg[page] || [];
      if (!tgs.length) {
        this.park = null;
        return;
      }
      const lt = tgs[tgs.length - 1];
      this.park = { x: lt.r + 14, y: lt.cy, h: Math.max(14, Math.min(34, lt.fs * 0.5)) };
    }

    /** Re-seat grains onto a page's glyphs with no animation (used after resize). */
    assignInstant(page) {
      const A = this.A;
      const slots = [];
      for (const tg of this.tg[page] || []) {
        for (let k = 0; k < tg.n; k++) {
          slots.push({ x: tg.pts[k * 2], y: tg.pts[k * 2 + 1], xf: tg.xf[k], ti: tg.idx });
        }
      }
      const pool = [];
      for (let i = 0; i < N; i++) if (A.st[i] === 1) pool.push(i);
      for (let i = 0; i < N && pool.length < slots.length + 400; i++) if (A.st[i] === 0) pool.push(i);
      const M = Math.min(slots.length, pool.length);
      for (let k = 0; k < M; k++) {
        const p = pool[k];
        const s = slots[k];
        A.st[p] = 1;
        A.homeX[p] = s.x;
        A.homeY[p] = s.y;
        A.otg[p] = s.ti;
        A.oxf[p] = s.xf;
      }
      for (let k = M; k < pool.length; k++) {
        const p = pool[k];
        if (A.st[p] === 1) {
          A.st[p] = 0;
          A.u[p] = Math.random();
        }
      }
    }

    /* ------------------------------------------------------------- frame -- */

    tick(dt) {
      if (!this.seeded) return;
      const f = Math.min(dt * 60, 2.4);
      this.t += dt;
      const t = this.t;
      const A = this.A;
      const anc = this.anc;
      const ancT = this.ancT;
      anc.x += (ancT.x - anc.x) * 0.07 * f;
      anc.y += (ancT.y - anc.y) * 0.07 * f;
      anc.w += (ancT.w - anc.w) * 0.07 * f;
      anc.h += (ancT.h - anc.h) * 0.07 * f;

      const tr = this.tr;
      const LBx = this.lbx;
      const LBy = this.lby;
      if (tr) {
        tr.T = Math.min(1.02, tr.T + dt / tr.dur);
        tr.frames++;
        tr.acc += dt;
        if (tr.full && tr.segs.length) {
          // Eight lag bands trailing the caret, so grains stream rather than snap.
          for (let b = 0; b < 8; b++) {
            const c = this.caretPos(Math.max(0, Math.min(1, tr.T) - LAGS[b]));
            LBx[b] = c.x;
            LBy[b] = c.y;
          }
        }
        for (const r of tr.rv) {
          if (!r.done && tr.T >= r.at) {
            r.done = true;
            r.el.style.opacity = '1';
            r.el.style.transform = 'none';
          }
        }
      }

      const big = anc.w > 110;
      const visCut = big ? 2 : 0.085;
      const ss = 0.55 + 0.45 * Math.min(1, anc.w / 180);
      const mx = this.mx;
      const my = this.my;
      const damp = Math.pow(0.82, f);

      for (let i = 0; i < N; i++) {
        const j = i * 2;
        let st = A.st[i];
        let follow = false;
        let kinematic = false;
        if (tr && A.tC[i] < 9 && !A.ld[i]) {
          if (tr.T >= A.tL[i]) {
            this.landP(i);
            st = A.st[i];
          } else if (tr.T >= A.tC[i]) follow = true;
        }
        let tx;
        let ty;
        let k = 0.14;
        let aT;
        let sT;
        let dT;
        if (follow) {
          if (tr.full) {
            const b = A.lagB[i];
            tx = LBx[b] + Math.sin(t * 7 + i * 1.3) * 5;
            ty = LBy[b] + Math.cos(t * 6.1 + i * 2.1) * 5 + (b - 3.5) * 1.4;
            k = 0.26;
          } else {
            kinematic = true;
            const p = Math.min(1, (tr.T - A.tC[i]) / Math.max(0.01, A.tL[i] - A.tC[i]));
            const sm = p * p * (3 - 2 * p);
            tx = A.dX[i] + (A.nhX[i] - A.dX[i]) * sm;
            ty = A.dY[i] + (A.nhY[i] - A.dY[i]) * sm - Math.sin(p * Math.PI) * (26 + (i % 9) * 7);
          }
          aT = 1;
          sT = A.baseS[i] * 1.1;
          dT = 0;
        } else if (st === 1) {
          tx = A.homeX[i];
          ty = A.homeY[i];
          aT = A.baseA[i] * 0.95;
          sT = A.baseS[i] * 0.6;
          dT = 1;
        } else {
          if (A.kind[i] !== 0) {
            // Ease through the waist, linger at the bulbs.
            const th0 = A.u[i] * 6.2832;
            A.u[i] = (A.u[i] + dt * A.uspd[i] * (0.55 + 1.6 * (1 - Math.abs(Math.cos(th0))))) % 1;
          }
          const [ux, uy] = this.loopPoint(i);
          tx = anc.x + ux * anc.w * 0.5 + Math.sin(t * 1.7 + i) * 1.5;
          ty = anc.y + uy * anc.h * 0.5 + Math.cos(t * 1.3 + i * 0.7) * 1.5;
          k = 0.09;
          const vis = A.rank[i] < visCut;
          if (A.kind[i] === 0) {
            aT = vis ? 0.8 : 0;
            sT = A.baseS[i] * 0.62 * ss;
            dT = 1;
          } else {
            aT = vis ? 0.5 + 0.22 * Math.sin(t * 2 + i) : 0;
            sT = A.baseS[i] * 0.82 * ss;
            dT = big ? 0.2 : 1;
          }
        }

        const x = A.pos[j];
        const y = A.pos[j + 1];
        if (kinematic) {
          A.pos[j] = tx;
          A.pos[j + 1] = ty;
          A.vel[j] = 0;
          A.vel[j + 1] = 0;
        } else {
          if (!tr && st === 1) {
            // Settled glyphs scatter away from the pointer and brighten.
            const dx = x - mx;
            const dy = y - my;
            const d2 = dx * dx + dy * dy;
            const R = 76;
            if (d2 < R * R && d2 > 0.01) {
              const dist = Math.sqrt(d2);
              const g = (1 - dist / R) * (1 - dist / R);
              A.vel[j] += (dx / dist) * g * 2.6;
              A.vel[j + 1] += (dy / dist) * g * 2.6;
              dT *= 1 - g;
              sT *= 1 + g * 0.9;
            }
          }
          A.vel[j] = (A.vel[j] + (tx - x) * k * f) * damp;
          A.vel[j + 1] = (A.vel[j + 1] + (ty - y) * k * f) * damp;
          A.pos[j] = x + A.vel[j] * f;
          A.pos[j + 1] = y + A.vel[j + 1] * f;
        }
        A.aArr[i] += (aT - A.aArr[i]) * 0.16 * f;
        A.sArr[i] += (sT - A.sArr[i]) * 0.16 * f;
        A.dArr[i] += (dT - A.dArr[i]) * 0.14 * f;
      }

      this.r.draw();
      this.drawCaret(t);
      if (tr && tr.T >= 1) this.endTr();
    }

    /* ------------------------------------------------------------- caret -- */

    drawCaret(t) {
      const cx = this.cctx;
      cx.clearRect(0, 0, this.ccw, this.cch);
      const ac = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#67e8f9';
      const tr = this.tr;
      if (tr && tr.full && tr.segs.length) {
        const T = Math.min(1, tr.T);
        const c = this.caretPos(T);
        const c2 = this.caretPos(Math.max(0, T - 0.012));
        const tilt = Math.max(-0.45, Math.min(0.45, (c.x - c2.x) * 0.012));
        this.nozzle(cx, c.x, c.y, c.h, ac, t, c.mode, tilt);
      } else if (!tr && this.park) {
        this.nozzle(cx, this.park.x, this.park.y, this.park.h, ac, t, 'idle', 0);
      }
    }

    /** The read/write head: a nozzle whose grain flow reverses when consuming. */
    nozzle(cx, x, y, h, color, t, mode, tilt) {
      cx.save();
      cx.translate(x, y);
      cx.rotate(tilt || 0);
      const w2 = Math.max(5, h * 0.42);
      cx.fillStyle = color;
      cx.globalAlpha = mode === 'idle' ? 0.72 + 0.22 * Math.sin(t * 2) : 1;
      cx.fillRect(-w2 - 2, -h - 4, (w2 + 2) * 2, 3);
      cx.beginPath();
      cx.moveTo(-w2, -h);
      cx.lineTo(w2, -h);
      cx.lineTo(0, -1);
      cx.closePath();
      cx.fill();
      const span = Math.max(10, h * 0.8);
      for (let g = 0; g < 3; g++) {
        if (mode === 'emit' || mode === 'travel') {
          const gy = 3 + ((t * 85 + g * 7) % span);
          cx.globalAlpha = 1 - gy / span;
          cx.fillRect(-1.2, gy, 2.4, 2.4);
        } else if (mode === 'consume') {
          const gy = 3 + span - ((t * 85 + g * 7) % span);
          cx.globalAlpha = (gy / span) * 0.9;
          cx.fillRect(-1.2, gy, 2.4, 2.4);
        } else if (g === 0) {
          cx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 2.4);
          cx.fillRect(-1.2, 5, 2.4, 2.4);
        }
      }
      cx.restore();
      cx.globalAlpha = 1;
    }

    /* ------------------------------------------------------------- shell -- */

    initNav() {
      document.querySelectorAll('[data-nav]').forEach((el) => {
        el.addEventListener('click', (ev) => {
          ev.preventDefault();
          this.goTo(el.dataset.nav);
        });
      });
    }

    initInput() {
      let wac = 0;
      let lastWheel = 0;
      const nav = (dir) => {
        if (this.tr || !this.ready) return;
        if (performance.now() - (this.lastNav || 0) < 500) return;
        const nx = PAGES.indexOf(this.cur) + dir;
        if (nx >= 0 && nx < PAGES.length) this.goTo(PAGES[nx]);
      };
      addEventListener(
        'wheel',
        (ev) => {
          const now = performance.now();
          if (now - lastWheel > 300) wac = 0;
          lastWheel = now;
          wac += ev.deltaY;
          if (Math.abs(wac) > 140) {
            nav(wac > 0 ? 1 : -1);
            wac = 0;
          }
        },
        { passive: true },
      );
      addEventListener('keydown', (ev) => {
        if (['ArrowDown', 'PageDown', 'ArrowRight'].includes(ev.key)) nav(1);
        else if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(ev.key)) nav(-1);
        else if (ev.key >= '1' && ev.key <= String(PAGES.length)) this.goTo(PAGES[+ev.key - 1]);
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

    setHud(page) {
      const el = $('hud-page');
      const n = PAGES.indexOf(page) + 1;
      if (el) el.textContent = `0${n} / 0${PAGES.length} — ${LABELS[page]}`;
    }

    navActive(page) {
      for (const p of PAGES) {
        const el = $('nl-' + p);
        if (el) el.setAttribute('aria-current', p === page ? 'page' : 'false');
      }
    }

    initBoot(done) {
      const el = $('boot');
      const log = $('boot-log');
      if (!el || !log) {
        done();
        return;
      }
      const lines = [
        ['<span class="accent">$</span> jakhmola --wake', 120],
        ['&gt; ledger restored ....... 6,000 units · nothing lost', 500],
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
          }, at),
        );
      }
      // A gate in front of content must never behave like one: ~1.2s, any input skips.
      timers.push(setTimeout(finish, 1250));
      for (const ev of ['pointerdown', 'keydown', 'wheel']) addEventListener(ev, finish);
    }

    initHudClock() {
      const clock = $('hud-clock');
      if (!clock) return;
      const pad = (n) => String(n).padStart(2, '0');
      const tk = () => {
        const d = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
        clock.textContent = `GMT+5:30 IN ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };
      tk();
      setInterval(tk, 1000);
    }

    initScramble() {
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
            const p = Math.min(1, (now - t0) / 550);
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

    initCursorRing() {
      if (matchMedia('(pointer:coarse)').matches) return;
      const ring = document.createElement('div');
      ring.id = 'ring';
      document.body.appendChild(ring);
      let tx = -100;
      let ty = -100;
      let cx = -100;
      let cy = -100;
      let hot = false;
      document.addEventListener('mousemove', (ev) => {
        tx = ev.clientX;
        ty = ev.clientY;
        hot = !!(ev.target && ev.target.closest && ev.target.closest('a'));
      });
      const loop = () => {
        if (this.dead) {
          ring.remove();
          return;
        }
        requestAnimationFrame(loop);
        cx += (tx - cx) * 0.16;
        cy += (ty - cy) * 0.16;
        const s = hot ? 52 : 34;
        ring.style.width = ring.style.height = s + 'px';
        ring.style.opacity = hot ? '.85' : '.5';
        ring.style.transform = `translate(${cx - s / 2}px,${cy - s / 2}px)`;
      };
      requestAnimationFrame(loop);
    }
  }

  // Width is decided here rather than in the head probe, because the viewport is
  // not final at parse time: a tiling compositor resizes the window afterwards,
  // and a point-in-time innerWidth test reads the pre-resize value. The media
  // query is reactive, so a window that starts narrow and lands wide still runs.
  // ponytail: one-way -- going narrow hands the session to the calm document for
  // good. Widening back would need a full re-init, which no one does mid-visit.
  const matter = new Matter();
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
