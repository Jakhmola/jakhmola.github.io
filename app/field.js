// The particle field: one BufferGeometry morphing between formations on the
// GPU. Positions interpolate from aFrom to aTo with a per-particle delay and a
// noise-driven swirl that peaks mid-transit, so a change of beat reads as a
// body of matter reorganising rather than points teleporting.

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

// Ashima / Stefan Gustavson simplex noise, the standard compact GLSL port.
export const SIMPLEX = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
      i.z+vec4(0.0,i1.z,i2.z,1.0))
    + i.y+vec4(0.0,i1.y,i2.y,1.0))
    + i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

// Thin film: the channels are phase-offset rather than amplitude-scaled, so the
// ramp genuinely travels indigo -> electric blue -> cyan -> warm -> violet the
// way an oil film does, instead of riding one hue at different brightnesses.
// The red base is held low deliberately: let it climb and additive stacking
// averages every dense core to white, which throws the iridescence away.
// Exported because the crystal refracts through the same palette the field is
// made of — one material, two states of matter.
export const FILM = /* glsl */ `
vec3 film(float t){
  return vec3(0.20, 0.34, 0.62) + vec3(0.22, 0.20, 0.24) * cos(6.28318 * (t + vec3(0.50, 0.62, 0.78)));
}
`;

const VERT = /* glsl */ `
attribute vec3 aFrom;
attribute vec3 aTo;
attribute float aSeed;
attribute float aDelay;

uniform float uMorph;
uniform float uTime;
uniform float uSize;
uniform float uDpr;
uniform float uDrift;
uniform vec3 uPointer;

varying vec3 vColor;
varying float vFade;

${SIMPLEX}
${FILM}

vec3 flow(vec3 p, float t){
  return vec3(
    snoise(p * 0.34 + vec3(0.0, t, 0.0)),
    snoise(p * 0.34 + vec3(5.2, 1.3 - t, 2.7)),
    snoise(p * 0.34 + vec3(-3.1, 4.4, t * 0.7))
  );
}

void main(){
  // Per-particle stagger: the leading edge arrives while the tail is still moving.
  float t = clamp((uMorph - aDelay * 0.34) / 0.66, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);

  vec3 pos = mix(aFrom, aTo, t);

  float transit = sin(t * 3.14159265);
  pos += flow(pos, uTime * 0.06) * transit * (0.55 + aSeed * 1.7);
  pos += flow(pos * 0.5, uTime * 0.02) * uDrift;

  // Pointer pushes the near field gently; it never fights the scroll.
  vec3 toP = pos - uPointer;
  float grab = smoothstep(4.5, 0.0, length(toP));
  pos += normalize(toP + 1e-4) * grab * 0.55;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float depth = clamp((-mv.z - 2.0) / 26.0, 0.0, 1.0);
  // Perspective size in world units, not pixels — points must stay well above
  // one device pixel or the whole field degrades into a flat haze.
  gl_PointSize = uSize * uDpr * (22.0 / max(-mv.z, 0.6)) * (0.5 + aSeed * 1.05);
  gl_PointSize = clamp(gl_PointSize, 1.0, 44.0);

  vColor = film(aSeed * 0.62 + transit * 0.3 + depth * 0.4);
  vFade = (1.0 - depth * 0.62) * (0.62 + transit * 0.5);
}
`;

const FRAG = /* glsl */ `
precision mediump float;
varying vec3 vColor;
varying float vFade;
uniform float uOpacity;

void main(){
  // Procedural sprite — a soft round falloff, no texture shipped.
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.06, d);
  a *= a;
  // Additive stacking blows dense cores to flat white and throws away the
  // iridescence, so each point contributes softly and density does the rest.
  gl_FragColor = vec4(vColor, a * vFade * uOpacity * 0.30);
}
`;

export function createField(canvas, count) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(new Color(0x05070a), 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(52, 1, 0.1, 120);
  camera.position.set(0, 0, 15);

  const geo = new BufferGeometry();
  const from = new Float32Array(count * 3);
  const to = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const delay = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    seed[i] = Math.random();
    delay[i] = Math.random();
  }
  // `position` is required by three's frustum/bounding logic; the shader reads
  // aFrom/aTo instead, so we keep it as a stable copy of the first formation.
  geo.setAttribute('position', new BufferAttribute(from, 3));
  geo.setAttribute('aFrom', new BufferAttribute(from, 3));
  geo.setAttribute('aTo', new BufferAttribute(to, 3));
  geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
  geo.setAttribute('aDelay', new BufferAttribute(delay, 1));
  geo.boundingSphere = null;

  const material = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uMorph: { value: 1 },
      uTime: { value: 0 },
      uSize: { value: 1.5 },
      uDpr: { value: 1 },
      uDrift: { value: 0.07 },
      uOpacity: { value: 1 },
      uPointer: { value: { x: 0, y: 0, z: 0 } },
    },
  });

  const points = new Points(geo, material);
  points.frustumCulled = false;

  // The ambient spin lives on a parent so it can accumulate freely without
  // fighting the per-beat rotation GSAP tweens on `points` itself.
  const spin = new Group();
  spin.add(points);
  scene.add(spin);

  return { renderer, scene, camera, points, spin, geometry: geo, material, from, to, count };
}
