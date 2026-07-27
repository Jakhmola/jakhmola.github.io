// CRYSTAL: a closed refractive solid that forms and then holds itself, while
// the field orbits it rather than composing it. The surface is the same Gielis
// superformula the point cloud is drawn from, triangulated instead of sampled —
// the manifold as a solid rather than as a cloud of samples on it.
//
// No cubemap, no render target, no transmission pass: the environment the glass
// refracts is an analytic function of direction inside the field's own thin-film
// palette, sampled at three IORs for dispersion. One draw call per crystal.

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  ShaderMaterial,
} from 'three';

import { FILM } from './field.js';
import { PRESETS, rng, superR } from './forms.js';

const TAU = Math.PI * 2;

/**
 * Triangulate a superformula surface over a (θ, φ) grid.
 *
 * Non-indexed on purpose: every triangle owns its three vertices, so a face can
 * carry its own shard identity and fly off as one piece, and flat normals fall
 * out for free — which is what makes it read as a cut crystal rather than a
 * blown-glass blob.
 */
function crystalGeometry(preset, segs = 64, rings = 32) {
  const at = (i, j) => {
    const theta = (i / segs) * TAU - Math.PI;
    const phi = (j / rings) * Math.PI - Math.PI / 2;
    const r1 = superR(theta, preset.m, preset.n1, preset.n2, preset.n3);
    const r2 = superR(phi, preset.m, preset.n1, preset.n2, preset.n3);
    return [
      r1 * Math.cos(theta) * r2 * Math.cos(phi),
      r2 * Math.sin(phi),
      r1 * Math.sin(theta) * r2 * Math.cos(phi),
    ];
  };

  const tris = segs * rings * 2;
  const position = new Float32Array(tris * 9);
  const normal = new Float32Array(tris * 9);
  const shard = new Float32Array(tris * 3);
  const burst = new Float32Array(tris * 9);
  const rand = rng(0x2545f491 ^ Math.round(preset.m * 7919));

  let p = 0;
  let s = 0;
  let extent = 1e-6;

  const face = (a, b, c) => {
    // Flat normal from the face's own plane; a superformula surface has creases
    // that averaged vertex normals would smooth straight out of existence.
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;

    // One shard value and one escape vector per face, shared by its three
    // vertices so the triangle stays rigid on the way out.
    const sv = rand();
    const cx = (a[0] + b[0] + c[0]) / 3;
    const cy = (a[1] + b[1] + c[1]) / 3;
    const cz = (a[2] + b[2] + c[2]) / 3;
    const spread = 0.35 + rand() * 0.9;

    for (const v of [a, b, c]) {
      position[p] = v[0];
      position[p + 1] = v[1];
      position[p + 2] = v[2];
      normal[p] = nx;
      normal[p + 1] = ny;
      normal[p + 2] = nz;
      burst[p] = cx * spread + nx * 0.4;
      burst[p + 1] = cy * spread + ny * 0.4;
      burst[p + 2] = cz * spread + nz * 0.4;
      p += 3;
      shard[s++] = sv;
      extent = Math.max(extent, Math.hypot(v[0], v[1], v[2]));
    }
  };

  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < rings; j++) {
      const a = at(i, j);
      const b = at(i + 1, j);
      const c = at(i + 1, j + 1);
      const d = at(i, j + 1);
      face(a, b, c);
      face(a, c, d);
    }
  }

  // The superformula's radius swings wildly between presets; normalising by the
  // surface's own extent is what keeps six different equations the same size on
  // screen without hand-tuning a scale per form.
  const k = 1 / extent;
  for (let i = 0; i < position.length; i++) {
    position[i] *= k;
    burst[i] *= k;
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(position, 3));
  geo.setAttribute('normal', new BufferAttribute(normal, 3));
  geo.setAttribute('aShard', new BufferAttribute(shard, 1));
  geo.setAttribute('aBurst', new BufferAttribute(burst, 3));
  return geo;
}

const VERT = /* glsl */ `
attribute float aShard;
attribute vec3 aBurst;

uniform float uForm;

varying vec3 vN;
varying vec3 vW;
varying float vA;

void main(){
  // Crystallisation is a threshold front sweeping the surface, not a scale-up:
  // a face exists once uForm passes its own shard value. Running uForm back
  // down plays the same front in reverse, which is the shatter.
  float g = smoothstep(aShard - 0.22, aShard + 0.22, uForm);
  vec3 p = position + aBurst * (1.0 - g) * 2.2;

  vN = normalize(normalMatrix * normal);
  vec4 world = modelMatrix * vec4(p, 1.0);
  vW = world.xyz;
  vA = g;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const FRAG = /* glsl */ `
precision highp float;

uniform float uOpacity;
uniform float uFocus;

varying vec3 vN;
varying vec3 vW;
varying float vA;

${FILM}

/**
 * The room the crystal reflects. Nothing ships to be sampled, so the
 * environment is a function of direction, kept inside the field's own ramp: a
 * bright band up and down the poles, a slow horizontal sweep of hue.
 */
vec3 env(vec3 d){
  float band = smoothstep(0.15, 0.95, abs(d.y));
  float sweep = 0.5 + 0.5 * d.x;
  return film(sweep * 0.5 + band * 0.35) * (0.25 + band * 1.15);
}

void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(vW - cameraPosition);

  // abs() because the solid is drawn double-sided and back faces keep the
  // normal they were built with.
  float f = pow(1.0 - abs(dot(N, V)), 3.4);

  // Three IORs, one per channel: dispersion the way glass actually splits it,
  // for the cost of two extra refract() calls and no second pass.
  vec3 c = vec3(
    env(refract(V, N, 0.660)).r,
    env(refract(V, N, 0.672)).g,
    env(refract(V, N, 0.684)).b
  );

  vec3 rim = film(0.60) * f * 1.8;
  float a = (0.19 + f * 0.62) * vA * uOpacity;
  gl_FragColor = vec4((c * 0.72 + rim) * (1.0 + uFocus), a * (1.0 + uFocus * 0.6));
}
`;

/**
 * A constellation of crystals in orbit. `seeds` are the same
 * `{ form, energy, spin }` visual seeds the particle formations use, so a
 * project's solid and its point cloud come out of one equation.
 */
export function createCrystals(seeds, { still = false } = {}) {
  const group = new Group();
  const rand = rng(0x9e3779b1);
  const geoCache = new Map();

  const crystals = seeds.map((seed, i) => {
    const key = seed.form in PRESETS ? seed.form : 'shell';
    if (!geoCache.has(key)) geoCache.set(key, crystalGeometry(PRESETS[key]));

    const material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      uniforms: {
        uForm: { value: 0 },
        uOpacity: { value: 0 },
        uFocus: { value: 0 },
      },
    });

    const mesh = new Mesh(geoCache.get(key), material);
    mesh.frustumCulled = false;
    // Drawn after the additive points, so the solid sits in front of the cloud
    // it came out of rather than being averaged into it.
    mesh.renderOrder = 1;

    // An orbit rather than a carousel: each crystal keeps its own radius, its
    // own inclination and its own phase, so the six read as a constellation
    // that happens to be in motion instead of six items on a turntable.
    const phase = (i / seeds.length) * TAU;
    // Kept tight enough that the whole orbit clears the right edge of the frame
    // at the gallery's camera distance — a crystal that swings off screen reads
    // as a bug, not as depth.
    const radius = 2.3 + rand() * 1.05;
    const tilt = (rand() - 0.5) * 1.5;
    const scale = 0.62 + seed.energy * 0.42;
    mesh.scale.setScalar(scale);

    group.add(mesh);
    return {
      mesh,
      material,
      phase,
      radius,
      tilt,
      scale,
      rate: 0.16 + rand() * 0.1,
      spin: seed.spin || 1,
    };
  });

  // Settled work is placed once and stays placed. The Gallery re-ranks itself
  // nightly and its crystals drift accordingly; a Trajectory station is history
  // and does not move, so its solids are fixed waypoints on a shallow arc.
  if (still) {
    crystals.forEach((c, i) => {
      const t = seeds.length > 1 ? i / (seeds.length - 1) : 0.5;
      c.mesh.position.set(-2 + t * 4.4, 2.5 - t * 5, Math.sin(t * Math.PI) * 1.4 - 0.7);
    });
  }

  /**
   * Advance the constellation. `t` is the field's own clock, in seconds.
   * Still crystals keep their places and only turn, so they read as held.
   */
  function orbit(t) {
    for (const c of crystals) {
      if (!still) {
        const a = c.phase + t * 0.06;
        c.mesh.position.set(
          Math.cos(a) * c.radius,
          Math.sin(a * 0.7 + c.tilt) * 1.25,
          Math.sin(a) * c.radius * 0.7,
        );
      }
      c.mesh.rotation.y += (still ? 0.0014 : 0.0032) * c.spin;
      c.mesh.rotation.x = Math.sin(t * c.rate + c.phase) * (still ? 0.1 : 0.28);
    }
  }

  return { group, crystals, orbit };
}
