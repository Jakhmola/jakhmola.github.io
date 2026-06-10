// Progressive enhancement only — the page is complete without this file.
// 1. Typewriter effect on terminal command headings.
// 2. Interactive feedforward neural-net background: ambient forward passes
//    pulse through the layers, nodes react to the pointer, and a click fires
//    an inference pass from the nearest node.
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- typewriter ---------- */
  function typewriter() {
    if (reduced || !('IntersectionObserver' in window)) return;
    const els = document.querySelectorAll('.cmd');
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          io.unobserve(en.target);
          typeOut(en.target);
        }
      },
      { threshold: 0.5 },
    );
    for (const el of els) {
      el.dataset.text = el.textContent;
      el.textContent = '';
      el.classList.add('typing');
      io.observe(el);
    }
  }

  function typeOut(el) {
    const text = el.dataset.text;
    let i = 0;
    const tick = () => {
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 26 + Math.random() * 45);
      else el.classList.remove('typing');
    };
    tick();
  }

  /* ---------- neural-net background ---------- */
  function neuralNet() {
    const canvas = document.createElement('canvas');
    canvas.id = 'nn';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let nodes = [];
    let edges = [];
    let W = 0;
    let H = 0;
    const pointer = { x: -1e4, y: -1e4 };
    const POINTER_RADIUS = 130;

    function build() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth;
      H = innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodes = [];
      edges = [];
      const layers = Math.max(4, Math.min(8, Math.round(W / 230)));
      const cols = [];
      for (let l = 0; l < layers; l++) {
        const count = 4 + ((l * 5 + 3) % 3); // 4–6 per layer
        const col = [];
        for (let i = 0; i < count; i++) {
          const node = {
            ox: (W * (l + 0.5)) / layers + (Math.random() - 0.5) * W * 0.05,
            oy: (H * (i + 0.5)) / count + (Math.random() - 0.5) * H * 0.07,
            x: 0,
            y: 0,
            r: 2 + Math.random() * 2,
            phase: Math.random() * Math.PI * 2,
            drift: 0.25 + Math.random() * 0.3,
            glow: 0,
            layer: l,
          };
          col.push(node);
          nodes.push(node);
        }
        cols.push(col);
      }
      for (let l = 0; l < layers - 1; l++) {
        for (const a of cols[l]) {
          const targets = [...cols[l + 1]]
            .sort((p, q) => Math.abs(p.oy - a.oy) - Math.abs(q.oy - a.oy))
            .slice(0, 3);
          for (const b of targets) edges.push({ a, b, glow: 0 });
        }
      }
    }

    // A forward pass: pulses travel each edge layer-by-layer (negative t = stagger delay).
    const pulses = [];
    function firePass(from) {
      let frontier = new Set([from]);
      let delay = 0;
      while (frontier.size) {
        const next = new Set();
        for (const ed of edges) {
          if (frontier.has(ed.a)) {
            pulses.push({ ed, t: -delay });
            next.add(ed.b);
          }
        }
        frontier = next;
        delay += 0.55;
      }
      from.glow = 1;
    }

    function nearestNode(x, y) {
      let best = nodes[0];
      let bd = Infinity;
      for (const n of nodes) {
        const d = (n.x - x) ** 2 + (n.y - y) ** 2;
        if (d < bd) {
          bd = d;
          best = n;
        }
      }
      return best;
    }

    function inputNode() {
      const inputs = nodes.filter((n) => n.layer === 0);
      return inputs[(Math.random() * inputs.length) | 0];
    }

    let last = performance.now();
    let ambient = 0;
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      // ambient forward pass every ~4.5s
      ambient -= dt;
      if (ambient <= 0) {
        firePass(inputNode());
        ambient = 3.5 + Math.random() * 2;
      }

      ctx.clearRect(0, 0, W, H);

      for (const n of nodes) {
        n.x = n.ox + Math.sin(t * n.drift + n.phase) * 9;
        n.y = n.oy + Math.cos(t * n.drift * 0.8 + n.phase) * 9;
        const dx = n.x - pointer.x;
        const dy = n.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < POINTER_RADIUS) {
          const k = 1 - d / POINTER_RADIUS;
          n.x += (dx / (d || 1)) * k * 14; // gentle repel
          n.y += (dy / (d || 1)) * k * 14;
          n.glow = Math.max(n.glow, k * 0.8);
        }
        n.glow = Math.max(0, n.glow - dt * 1.4);
      }

      for (const ed of edges) {
        ed.glow = Math.max(0, ed.glow - dt * 1.6);
        const a = (0.04 + ed.glow * 0.5) * 0.9;
        ctx.strokeStyle = `rgba(126, 231, 135, ${a})`;
        ctx.lineWidth = ed.glow > 0.05 ? 1.2 : 1;
        ctx.beginPath();
        ctx.moveTo(ed.a.x, ed.a.y);
        ctx.lineTo(ed.b.x, ed.b.y);
        ctx.stroke();
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += dt * 1.8;
        if (p.t > 1) {
          p.ed.b.glow = 1;
          pulses.splice(i, 1);
          continue;
        }
        if (p.t < 0) continue;
        p.ed.glow = Math.max(p.ed.glow, 0.6);
        const x = p.ed.a.x + (p.ed.b.x - p.ed.a.x) * p.t;
        const y = p.ed.a.y + (p.ed.b.y - p.ed.a.y) * p.t;
        ctx.fillStyle = 'rgba(126, 231, 135, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const n of nodes) {
        if (n.glow > 0.02) {
          ctx.fillStyle = `rgba(126, 231, 135, ${n.glow * 0.25})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 7 * n.glow, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(121, 192, 255, ${0.3 + n.glow * 0.7})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(frame);
    }

    build();

    if (reduced) {
      // one static frame: faint structure, no motion, no listeners
      for (const n of nodes) {
        n.x = n.ox;
        n.y = n.oy;
      }
      ctx.clearRect(0, 0, W, H);
      for (const ed of edges) {
        ctx.strokeStyle = 'rgba(126, 231, 135, 0.04)';
        ctx.beginPath();
        ctx.moveTo(ed.a.x, ed.a.y);
        ctx.lineTo(ed.b.x, ed.b.y);
        ctx.stroke();
      }
      for (const n of nodes) {
        ctx.fillStyle = 'rgba(121, 192, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    addEventListener('pointermove', (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    });
    addEventListener('pointerleave', () => {
      pointer.x = -1e4;
      pointer.y = -1e4;
    });
    // Click anywhere = inference pass from the nearest node.
    addEventListener('click', (e) => firePass(nearestNode(e.clientX, e.clientY)));

    let resizeTimer;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    });

    requestAnimationFrame(frame);
  }

  typewriter();
  neuralNet();
})();
