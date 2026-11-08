import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'
import { NOISE_3D, mulberry32, getGlowTexture } from '../../three/glsl'
import { BODIES, SYSTEM_CENTER, SYSTEM_TILT } from './systemData'
import { hoverState } from './bridge'

// ---------------------------------------------------------------------------
// Shared registry: lets the camera, labels and overlay find bodies without
// React re-renders. id -> { object: THREE.Object3D, radius }
// ---------------------------------------------------------------------------
export const bodyRegistry = new Map()
export const sunWorldPos = new THREE.Vector3()
const _v = new THREE.Vector3()

// A soft starburst (diffraction spikes) for the star's shine. Generated once.
let _spikeTex = null
function getSpikeTexture() {
  if (_spikeTex) return _spikeTex
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const mid = size / 2
  ctx.globalCompositeOperation = 'lighter'
  const spike = (angle, len, width, alpha) => {
    ctx.save()
    ctx.translate(mid, mid)
    ctx.rotate(angle)
    const g = ctx.createLinearGradient(-len, 0, len, 0)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.5, `rgba(255,255,255,${alpha})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(-len, 0)
    ctx.lineTo(0, -width)
    ctx.lineTo(len, 0)
    ctx.lineTo(0, width)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  for (let i = 0; i < 4; i++) spike((i * Math.PI) / 4, mid, i % 2 ? 1.6 : 3, i % 2 ? 0.35 : 0.8)
  const core = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid * 0.5)
  core.addColorStop(0, 'rgba(255,255,255,0.9)')
  core.addColorStop(0.25, 'rgba(255,255,255,0.25)')
  core.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = core
  ctx.fillRect(0, 0, size, size)
  _spikeTex = new THREE.CanvasTexture(c)
  _spikeTex.colorSpace = THREE.SRGBColorSpace
  return _spikeTex
}

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------
const PLANET_VERT = /* glsl */ `
  uniform vec3 uSunPos;
  varying vec3 vObj;
  varying vec3 vN;
  varying vec3 vW;
  varying vec3 vLo; // sun direction in object space (for cloud & ring shadows)
  void main() {
    vObj = position;
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vLo = transpose(mat3(modelMatrix)) * normalize(uSunPos - w.xyz);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

// Shared cloud pattern so the surface can receive the cloud layer's shadow
const CLOUDS_GLSL = /* glsl */ `
  float cloudCover(vec3 p, float t, float seed) {
    vec3 q = p * 2.6 + vec3(t * 0.01, 0.0, seed);
    q += 0.35 * vec3(snoise(q * 0.7 + 4.0), snoise(q * 0.7 + 9.0), snoise(q * 0.7 + 13.0));
    float c = fbm(q, 5);
    float bands = 1.0 - smoothstep(0.0, 0.35, abs(abs(p.y) - 0.45)) * 0.35;
    return smoothstep(0.08, 0.55, c * bands + 0.05);
  }
`

const PLANET_FRAG = /* glsl */ `
  uniform vec3 uSunPos;
  uniform float uTime;
  uniform float uSeed;
  uniform float uDetail;
  uniform float uHover;
  uniform float uAmbient;
  uniform float uRadius;
  uniform float uRingIn;
  uniform float uRingOut;
  uniform vec3 uC0, uC1, uC2, uC3, uAtmo;
  varying vec3 vObj;
  varying vec3 vN;
  varying vec3 vW;
  varying vec3 vLo;
  ${NOISE_3D}
  ${CLOUDS_GLSL}

  // Relief shading from a height field via screen-space derivatives (surface gradient bump):
  // no extra noise evaluations, so it is almost free.
  vec3 bump(vec3 N, vec3 pos, float h) {
    vec3 dpdx = dFdx(pos);
    vec3 dpdy = dFdy(pos);
    float dhdx = dFdx(h);
    float dhdy = dFdy(h);
    vec3 r1 = cross(dpdy, N);
    vec3 r2 = cross(N, dpdx);
    float det = dot(dpdx, r1);
    vec3 grad = sign(det) * (dhdx * r1 + dhdy * r2);
    return normalize(abs(det) * N - grad);
  }

  void main() {
    vec3 p = normalize(vObj);
    vec3 N = normalize(vN);
    vec3 L = normalize(uSunPos - vW);
    vec3 V = normalize(cameraPosition - vW);
    int oct = int(uDetail);
    float baseDiff = dot(N, L);

    vec3 col = vec3(0.0);
    vec3 emissive = vec3(0.0);
    float spec = 0.0;
    float specPow = 40.0;
    float height = 0.0;
    float bumpAmt = 0.0;
    float shadow = 1.0;
    float limb = 0.0;

  #if defined(TERRA)
    float h = fbm(p * 2.2 + uSeed, oct);
    float land = smoothstep(0.03, 0.06, h);
    vec3 ocean = mix(uC0, uC1, smoothstep(-0.5, 0.03, h));
    // vegetation → dry highlands → rock
    float lat = abs(p.y);
    vec3 green = mix(uC2, uC2 * vec3(0.8, 1.05, 0.7), smoothstep(-0.2, 0.3, snoise(p * 6.0 + uSeed)));
    vec3 ground = mix(green, uC3, smoothstep(0.15, 0.45, h + (0.35 - lat) * 0.25));
    ground = mix(ground, vec3(0.55, 0.5, 0.46), smoothstep(0.5, 0.7, h));
    float polar = smoothstep(0.8, 0.9, lat + h * 0.12);
    col = mix(ocean, ground, land);
    // shallow-water glow along coasts
    col += uC1 * 0.35 * (1.0 - land) * smoothstep(-0.08, 0.03, h);
    col = mix(col, vec3(0.9, 0.94, 1.0), polar);
    height = max(h, 0.03) * land;
    bumpAmt = 0.035;
    spec = (1.0 - land) * (1.0 - polar) * 0.9;
    specPow = 60.0;
    // the cloud layer (separate shell) casts soft shadows on the ground
    vec3 ps = normalize(p + vLo * 0.02);
    shadow = 1.0 - cloudCover(ps, uTime, uSeed) * 0.45;
    float city = smoothstep(0.5, 0.8, snoise(p * 38.0)) * smoothstep(0.2, 0.6, snoise(p * 9.0 + 3.0) + 0.4);
    city *= land * (1.0 - polar);
    emissive = vec3(1.0, 0.7, 0.35) * city * (1.0 - smoothstep(-0.25, 0.05, baseDiff)) * 1.4;
  #elif defined(GAS)
    float t = uTime * 0.012;
    vec3 q = p * vec3(2.5, 8.0, 2.5) + vec3(t, 0.0, uSeed);
    float warp = fbm(q, 4);
    float latW = p.y + warp * 0.05;
    float b1 = sin(latW * 21.0) * 0.5 + 0.5;
    float b2 = sin(latW * 9.0 + 1.3) * 0.5 + 0.5;
    float fine = sin(latW * 70.0 + warp * 6.0) * 0.5 + 0.5;
    col = mix(uC0, uC1, smoothstep(0.2, 0.8, b1));
    col = mix(col, uC2, smoothstep(0.35, 0.9, b2) * 0.6);
    col *= 0.9 + 0.1 * fine;
    // great storm oval, swirled
    float lon = atan(p.z, p.x);
    vec2 sp = vec2((lon - 0.9) * 0.55, (p.y + 0.3) * 1.6);
    float so = length(sp) + warp * 0.05;
    col = mix(col, uC3, smoothstep(0.17, 0.08, so));
    col = mix(col, uC2 * 1.15, smoothstep(0.06, 0.0, so) * 0.6);
    // darker, cooler poles
    col *= mix(1.0, 0.65, smoothstep(0.65, 0.97, abs(p.y)));
    limb = 0.35;
    #if defined(RING)
      // shadow of the rings on the planet
      float tr = -vObj.y / (abs(vLo.y) > 1e-4 ? vLo.y : 1e-4);
      if (tr > 0.0) {
        vec3 hp = vObj + vLo * tr;
        float rr = length(hp.xz);
        if (rr > uRingIn && rr < uRingOut) {
          float rn = (rr - uRingIn) / (uRingOut - uRingIn);
          float dens = (snoise(vec3(rn * 26.0, 0.0, 0.0)) * 0.5 + 0.5);
          shadow = 1.0 - dens * 0.7;
        }
      }
    #endif
  #elif defined(LAVA)
    // dark basalt crust cut by glowing, flowing lava rivers
    vec3 q = p * 2.0 + uSeed;
    vec3 w = vec3(fbm(q, 3), fbm(q + 5.2, 3), fbm(q + 9.7, 3));
    float h = fbm(p * 2.6 + w * 0.6 + uSeed, oct);
    vec3 crust = mix(uC0, uC1, smoothstep(-0.45, 0.55, h));
    crust *= 0.75 + 0.5 * (snoise(p * 16.0 + uSeed) * 0.5 + 0.5);
    float r1 = abs(snoise(p * 3.0 + w * 1.5 + uSeed));
    float r2 = abs(snoise(p * 7.0 + w * 2.2 - uSeed));
    float river = 1.0 - smoothstep(0.0, 0.032, r1);
    float vein = (1.0 - smoothstep(0.0, 0.018, r2)) * smoothstep(-0.15, 0.25, h) * 0.75;
    float halo = 1.0 - smoothstep(0.0, 0.16, r1);
    float lake = smoothstep(-0.3, -0.42, h);
    float heat = max(max(river, vein), lake);
    float flicker = 0.82 + 0.18 * sin(uTime * 1.6 + p.x * 21.0 + p.y * 13.0 + p.z * 7.0);
    vec3 lava = mix(uC2, uC3, smoothstep(0.3, 1.0, heat) * (0.6 + 0.4 * river));
    col = mix(crust, crust * vec3(1.4, 0.8, 0.6), halo * 0.6); // scorched rock near the flows
    col *= 1.0 - heat;
    emissive = lava * heat * 1.9 * flicker + uC2 * halo * 0.22;
    height = h * 0.6 - river * 0.22 - lake * 0.25;
    bumpAmt = 0.07;
    spec = 0.12;
    specPow = 18.0;
  #elif defined(ICE)
    float h = fbm(p * 2.4 + uSeed, oct);
    col = mix(uC0, uC1, smoothstep(-0.45, 0.15, h));
    col = mix(col, uC2, smoothstep(0.0, 0.45, h));
    float crevN = abs(snoise(p * 7.0 + uSeed));
    float crev = 1.0 - smoothstep(0.0, 0.035, crevN);
    col = mix(col, uC0 * 0.6, crev * 0.7);
    col = mix(col, uC3, smoothstep(0.7, 0.85, abs(p.y)));
    height = h * 0.6 - crev * 0.12;
    bumpAmt = 0.03;
    spec = 0.8;
    specPow = 90.0;
    emissive = uC1 * 0.06 * (1.0 - crev); // subsurface glow
  #elif defined(MOON_GREEN) || defined(MOON_TECH)
    float h = fbm(p * 3.0 + uSeed, oct);
    // craters: rims around smooth bowls
    float cn = snoise(p * 5.0 + uSeed * 3.0);
    float crater = smoothstep(0.55, 0.75, cn);
    float rim = smoothstep(0.45, 0.55, cn) * (1.0 - crater);
    col = mix(uC0, uC1, smoothstep(-0.4, 0.35, h));
    col = mix(col, uC3, smoothstep(0.35, 0.6, h) * 0.5);
    col = mix(col, uC2, rim * 0.5);
    col *= 1.0 - crater * 0.25;
    height = h + rim * 0.3 - crater * 0.3;
    bumpAmt = 0.06;
    #if defined(MOON_TECH)
      vec2 g = abs(fract(vec2(atan(p.z, p.x) * 6.0, p.y * 10.0)) - 0.5);
      float grid = 1.0 - smoothstep(0.0, 0.04, min(g.x, g.y));
      emissive = uC2 * grid * (0.35 + 0.65 * (1.0 - smoothstep(-0.1, 0.4, baseDiff))) * (0.7 + 0.3 * sin(uTime * 2.0 + p.y * 12.0));
    #else
      float bio = smoothstep(0.55, 0.85, snoise(p * 14.0 + uSeed)) * (1.0 - smoothstep(-0.1, 0.4, baseDiff));
      emissive = uC2 * bio * 0.9;
    #endif
  #elif defined(BEACON)
    float h = fbm(p * 3.2 + uSeed, oct);
    col = mix(uC0, uC1, smoothstep(-0.3, 0.4, h));
    col = mix(col, uC2, smoothstep(0.35, 0.7, h) * 0.5);
    vec2 g = abs(fract(vec2(atan(p.z, p.x) * 8.0 / 3.14159, p.y * 8.0)) - 0.5);
    float grid = 1.0 - smoothstep(0.0, 0.03, min(g.x, g.y));
    float pulse = 0.5 + 0.5 * sin(uTime * 3.0 - p.y * 6.0);
    emissive = uC3 * grid * pulse * 0.9;
    height = h;
    bumpAmt = 0.04;
    spec = 0.3;
    specPow = 30.0;
  #endif

    // Extra high-frequency detail only when the camera is close (surface view)
    if (uDetail > 5.5) {
      float grain = snoise(p * 70.0 + uSeed) * 0.6 + snoise(p * 190.0) * 0.4;
      col *= 1.0 + grain * 0.1;
      height += grain * 0.04;
    }

    vec3 Nb = bumpAmt > 0.0 ? bump(N, vW, height * bumpAmt * uRadius) : N;
    float diff = dot(Nb, L);
    // soft terminator; the bump only shades the day side
    float light = smoothstep(-0.1, 0.6, mix(baseDiff, diff, smoothstep(-0.1, 0.25, baseDiff))) * shadow;
    vec3 H = normalize(L + V);
    float s = pow(max(dot(Nb, H), 0.0), specPow) * spec * light;
    float mu = max(dot(N, V), 0.0);

    vec3 lit = col * (light * 1.15 + uAmbient) * (1.0 - limb + limb * pow(mu, 0.5));
    lit += vec3(1.0, 0.96, 0.9) * s + emissive;

    // atmosphere: rim scattering on the day side + warm band along the terminator
    float fres = pow(1.0 - mu, 2.6);
    float dayRim = smoothstep(-0.25, 0.4, baseDiff);
    lit += uAtmo * fres * (0.08 + 0.92 * dayRim) * 0.75;
    float dusk = smoothstep(-0.12, 0.05, baseDiff) * (1.0 - smoothstep(0.05, 0.3, baseDiff));
    lit += vec3(1.0, 0.45, 0.18) * dusk * 0.12 * (0.4 + fres);
    lit += uAtmo * fres * uHover * 0.7;
    gl_FragColor = vec4(lit, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const CLOUD_FRAG = /* glsl */ `
  uniform vec3 uSunPos;
  uniform float uTime;
  uniform float uSeed;
  uniform float uAmount;
  varying vec3 vObj;
  varying vec3 vN;
  varying vec3 vW;
  varying vec3 vLo;
  ${NOISE_3D}
  ${CLOUDS_GLSL}
  void main() {
    vec3 p = normalize(vObj);
    float c = cloudCover(p, uTime, uSeed);
    vec3 N = normalize(vN);
    vec3 L = normalize(uSunPos - vW);
    vec3 V = normalize(cameraPosition - vW);
    float d = dot(N, L);
    float light = smoothstep(-0.15, 0.5, d);
    vec3 col = mix(vec3(1.0, 0.55, 0.35), vec3(1.0), smoothstep(0.0, 0.3, d)); // sunset tint at the edge
    float edge = pow(max(dot(N, V), 0.0), 0.35); // thin out towards the limb
    gl_FragColor = vec4(col * (light * 0.95 + 0.02), c * uAmount * edge);
    #include <colorspace_fragment>
  }
`

const ATMO_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vView;
  varying vec3 vW;
  varying vec3 vCenter;
  void main() {
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    vW = (modelMatrix * vec4(position, 1.0)).xyz;
    vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`
const ATMO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunPos;
  uniform float uRange;
  uniform float uIntensity;
  varying vec3 vN;
  varying vec3 vView;
  varying vec3 vW;
  varying vec3 vCenter;
  void main() {
    float d = dot(vView, vN); // back faces: [-range, 0] across the visible halo
    float glow = pow(smoothstep(0.0, uRange, -d), 2.6);
    float sun = smoothstep(-0.35, 0.6, dot(normalize(vW - vCenter), normalize(uSunPos - vCenter)));
    gl_FragColor = vec4(uColor * glow * (0.12 + 0.88 * sun) * uIntensity, 1.0);
    #include <colorspace_fragment>
  }
`

const RING_VERT = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vW;
  void main() {
    vLocal = position;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const RING_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunPos;
  uniform vec3 uCenter;
  uniform float uPlanetR;
  uniform float uInner;
  uniform float uOuter;
  varying vec3 vLocal;
  varying vec3 vW;
  ${NOISE_3D}
  void main() {
    float r = (length(vLocal.xy) - uInner) / (uOuter - uInner);
    float bands = snoise(vec3(r * 26.0, 0.0, 0.0)) * 0.5 + 0.5;
    bands *= 0.6 + 0.4 * (snoise(vec3(r * 45.0, 3.0, 0.0)) * 0.5 + 0.5);
    float edge = smoothstep(0.0, 0.06, r) * (1.0 - smoothstep(0.9, 1.0, r));
    float gap = 1.0 - smoothstep(0.018, 0.0, abs(r - 0.62)) * 0.95;
    float a = bands * edge * gap * 0.85;
    // planet shadow on the ring
    vec3 toSun = normalize(uSunPos - vW);
    vec3 oc = uCenter - vW;
    float t = dot(oc, toSun);
    float d2 = dot(oc, oc) - t * t;
    float shadow = (t > 0.0 && d2 < uPlanetR * uPlanetR) ? 0.1 : 1.0;
    // ice particles glow when back-lit (looking towards the sun through the ring)
    vec3 V = normalize(cameraPosition - vW);
    float fwd = pow(max(dot(-V, toSun), 0.0), 6.0);
    vec3 tint = mix(uColor * vec3(0.85, 0.75, 0.65), uColor * 1.1, smoothstep(0.2, 0.8, r));
    vec3 c = tint * (0.3 + 0.8 * bands) * shadow + vec3(1.0, 0.9, 0.75) * fwd * 0.6 * shadow;
    gl_FragColor = vec4(c, a);
    #include <colorspace_fragment>
  }
`

const SUN_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec3 vObj;
  varying vec3 vN;
  varying vec3 vW;
  ${NOISE_3D}
  void main() {
    vec3 p = normalize(vObj);
    float t = uTime;
    // slow convection: domain-warped large cells
    vec3 q = p * 3.0;
    vec3 w = vec3(fbm(q + t * 0.03, 3), fbm(q + 7.3 - t * 0.025, 3), fbm(q + 3.1 + t * 0.02, 3));
    float big = fbm(p * 2.4 + w * 0.9 + t * 0.015, 4);
    // fine granulation: bright cell centres, darker lanes
    float gran = 1.0 - abs(snoise(p * 26.0 + w * 3.0 + t * 0.12));
    gran = gran * gran * gran;
    float gran2 = 1.0 - abs(snoise(p * 58.0 - t * 0.18));

    vec3 deep = vec3(1.0, 0.26, 0.02);
    vec3 mid = vec3(1.0, 0.52, 0.08);
    vec3 hot = vec3(1.0, 0.82, 0.42);
    vec3 white = vec3(1.0, 0.97, 0.88);
    vec3 col = mix(deep, mid, smoothstep(-0.55, 0.15, big));
    col = mix(col, hot, smoothstep(0.0, 0.55, big));
    col += white * (gran * 0.3 + gran2 * 0.06);

    // a few dark sunspots with orange penumbrae
    float spotN = fbm(p * 1.7 + 11.0 + t * 0.004, 3);
    col = mix(col, deep * 0.9, smoothstep(0.38, 0.46, spotN) * 0.55);
    col *= 1.0 - smoothstep(0.46, 0.52, spotN) * 0.6;

    // limb darkening towards deep orange, then a hot thin rim (chromosphere)
    vec3 V = normalize(cameraPosition - vW);
    float mu = max(dot(normalize(vN), V), 0.0);
    col = mix(deep * 0.75, col, pow(mu, 0.32));
    col += vec3(1.0, 0.42, 0.12) * pow(1.0 - mu, 5.0) * 1.4;
    gl_FragColor = vec4(col * 1.35, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const TYPE_DEFINE = {
  terra: 'TERRA',
  gas: 'GAS',
  lava: 'LAVA',
  ice: 'ICE',
  moonGreen: 'MOON_GREEN',
  moonTech: 'MOON_TECH',
  beacon: 'BEACON',
}

const CORONA_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  ${NOISE_3D}
  void main() {
    vec2 c = vUv - 0.5;
    float r = length(c) * 2.0;          // 0 centre → 1 edge of the quad
    float a = atan(c.y, c.x);
    float inner = 0.3;                  // star radius in quad units
    float n = snoise(vec3(cos(a) * 3.0, sin(a) * 3.0, uTime * 0.12)) * 0.5 + 0.5;
    float n2 = snoise(vec3(cos(a) * 9.0, sin(a) * 9.0, uTime * 0.25 + 4.0)) * 0.5 + 0.5;
    float streamers = pow(n, 2.0) * 0.35 + pow(n2, 3.0) * 0.15; // soft, no hard rays
    float fall = exp(-(r - inner) * (7.0 - streamers * 3.0));
    float halo = exp(-(r - inner) * 2.4) * 0.35;
    float intensity = (fall * (0.35 + streamers) + halo) * smoothstep(inner - 0.02, inner + 0.02, r) * (1.0 - smoothstep(0.85, 1.0, r));
    vec3 col = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.85, 0.55), fall);
    gl_FragColor = vec4(col * intensity, 1.0);
    #include <colorspace_fragment>
  }
`

// ---------------------------------------------------------------------------
// Sun
// ---------------------------------------------------------------------------
function Sun({ body }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const coronaRef = useRef()
  const glow = getGlowTexture(THREE)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uSunPos: { value: sunWorldPos } },
        vertexShader: PLANET_VERT,
        fragmentShader: SUN_FRAG,
      }),
    []
  )
  const corona = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: CORONA_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  const spikes = getSpikeTexture()
  const spikeRef = useRef()
  const haloRef = useRef()

  useFrame(({ camera }, dt) => {
    material.uniforms.uTime.value += dt
    corona.uniforms.uTime.value += dt
    if (meshRef.current) meshRef.current.rotation.y += dt * 0.02
    if (coronaRef.current) coronaRef.current.quaternion.copy(camera.quaternion)
    if (groupRef.current) {
      // the shine is strongest from afar (a star on the horizon) and calm up close
      groupRef.current.getWorldPosition(_v)
      const far = THREE.MathUtils.smoothstep(_v.distanceTo(camera.position) / body.radius, 6, 60)
      if (spikeRef.current) {
        // the starburst belongs to the distant star seen from the scroll journey
        const goal = useStore.getState().mode === 'system' ? 0 : 0.18 + 0.5 * far
        const m = spikeRef.current.material
        m.opacity += (goal - m.opacity) * Math.min(1, dt * 3)
        m.rotation += dt * 0.01
        spikeRef.current.visible = m.opacity > 0.005
      }
      if (haloRef.current) haloRef.current.material.opacity = 0.5 + 0.4 * far
    }
  })

  const register = (obj) => {
    groupRef.current = obj
    if (obj) bodyRegistry.set(body.id, { object: obj, radius: body.radius })
  }

  const q = body.radius / 0.3 // quad size so the star fills the inner 30%
  return (
    <group ref={register}>
      <mesh ref={meshRef} material={material}>
        <sphereGeometry args={[body.radius, 96, 48]} />
      </mesh>
      <mesh ref={coronaRef} material={corona} renderOrder={1}>
        <planeGeometry args={[q, q]} />
      </mesh>
      <sprite ref={haloRef} scale={[body.radius * 4.2, body.radius * 4.2, 1]} renderOrder={2}>
        <spriteMaterial map={glow} color="#ffd9a0" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite scale={[body.radius * 12, body.radius * 12, 1]} renderOrder={-2}>
        <spriteMaterial map={glow} color="#ff8a3a" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite ref={spikeRef} scale={[body.radius * 16, body.radius * 16, 1]} renderOrder={3}>
        <spriteMaterial map={spikes} color="#ffe2b0" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Planet / moon
// ---------------------------------------------------------------------------
function Planet({ body, children }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const cloudRef = useRef()
  const seed = useMemo(() => mulberry32(body.id.length * 977 + body.radius * 131)() * 10, [body])

  const material = useMemo(() => {
    const c = body.colors.map((h) => new THREE.Color(h))
    const defines = { [TYPE_DEFINE[body.type]]: '' }
    if (body.ring) defines.RING = ''
    return new THREE.ShaderMaterial({
      defines,
      extensions: { derivatives: true },
      uniforms: {
        uSunPos: { value: sunWorldPos },
        uTime: { value: 0 },
        uSeed: { value: seed },
        uDetail: { value: 4 },
        uHover: { value: 0 },
        uAmbient: { value: 0.14 },
        uRadius: { value: body.radius },
        uRingIn: { value: body.ring ? body.radius * body.ring.inner : 0 },
        uRingOut: { value: body.ring ? body.radius * body.ring.outer : 0 },
        uC0: { value: c[0] },
        uC1: { value: c[1] },
        uC2: { value: c[2] },
        uC3: { value: c[3] },
        uAtmo: { value: new THREE.Color(body.atmosphere) },
      },
      vertexShader: PLANET_VERT,
      fragmentShader: PLANET_FRAG,
    })
  }, [body, seed])

  const cloudMaterial = useMemo(() => {
    if (body.type !== 'terra') return null
    return new THREE.ShaderMaterial({
      uniforms: { uSunPos: { value: sunWorldPos }, uTime: { value: 0 }, uSeed: { value: seed }, uAmount: { value: 0.9 } },
      vertexShader: PLANET_VERT,
      fragmentShader: CLOUD_FRAG,
      transparent: true,
      depthWrite: false,
    })
  }, [body, seed])

  const atmoScale = body.type === 'gas' ? 1.1 : 1.08
  const atmoMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(body.atmosphere) },
          uSunPos: { value: sunWorldPos },
          uRange: { value: Math.sqrt(1 - 1 / (atmoScale * atmoScale)) },
          uIntensity: { value: body.parent ? 0.7 : body.type === 'lava' ? 0.35 : 0.95 },
        },
        vertexShader: ATMO_VERT,
        fragmentShader: ATMO_FRAG,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [body, atmoScale]
  )

  const ringMaterial = useMemo(() => {
    if (!body.ring) return null
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(body.ring.color) },
        uSunPos: { value: sunWorldPos },
        uCenter: { value: new THREE.Vector3() },
        uPlanetR: { value: body.radius },
        uInner: { value: body.radius * body.ring.inner },
        uOuter: { value: body.radius * body.ring.outer },
      },
      vertexShader: RING_VERT,
      fragmentShader: RING_FRAG,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    })
  }, [body])

  useFrame((state, dt) => {
    const u = material.uniforms
    u.uTime.value += dt
    if (cloudMaterial) {
      cloudMaterial.uniforms.uTime.value = u.uTime.value
      // thinner clouds up close so the continents and oceans read from the surface
      const goal = useStore.getState().selected === body.id ? 0.4 : 0.9
      cloudMaterial.uniforms.uAmount.value += (goal - cloudMaterial.uniforms.uAmount.value) * Math.min(1, dt * 2)
    }
    if (meshRef.current) meshRef.current.rotation.y += dt * (body.parent ? 0.08 : 0.05)
    if (cloudRef.current && meshRef.current) cloudRef.current.rotation.y = meshRef.current.rotation.y
    // More noise octaves only when the camera is close, fewer from afar
    if (groupRef.current) {
      groupRef.current.getWorldPosition(_v)
      const dist = _v.distanceTo(state.camera.position) / body.radius
      u.uDetail.value = dist < 4 ? 6 : dist < 14 ? 5 : 4
      if (ringMaterial) ringMaterial.uniforms.uCenter.value.copy(_v)
    }
    // a little fill light on the map so night sides read as planets; true darkness up close
    const ambGoal = useStore.getState().landed ? 0.03 : 0.14
    u.uAmbient.value += (ambGoal - u.uAmbient.value) * Math.min(1, dt * 2)
    const targetHover = hoverState.id === body.id ? 1 : 0
    u.uHover.value += (targetHover - u.uHover.value) * Math.min(1, dt * 8)
  })

  const register = (obj) => {
    groupRef.current = obj
    if (obj) bodyRegistry.set(body.id, { object: obj, radius: body.radius })
  }

  const segs = body.parent ? 64 : 160

  return (
    <group ref={register}>
      <group rotation={[0, 0, body.type === 'gas' ? 0.42 : 0.2]}>
        <mesh ref={meshRef} material={material}>
          <sphereGeometry args={[body.radius, segs, segs / 2]} />
        </mesh>
        {cloudMaterial && (
          <mesh ref={cloudRef} material={cloudMaterial} scale={1.012}>
            <sphereGeometry args={[body.radius, 128, 64]} />
          </mesh>
        )}
        {ringMaterial && (
          <mesh material={ringMaterial} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[body.radius * body.ring.inner, body.radius * body.ring.outer, 180, 1]} />
          </mesh>
        )}
      </group>
      <mesh material={atmoMaterial} scale={atmoScale}>
        <sphereGeometry args={[body.radius, 64, 32]} />
      </mesh>
      {body.type === 'beacon' && <BeaconMast radius={body.radius} />}
      {children}
    </group>
  )
}

// A blinking relay satellite orbiting the Beacon planet
function BeaconMast({ radius }) {
  const ref = useRef()
  const spriteRef = useRef()
  const glow = getGlowTexture(THREE)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ref.current) ref.current.rotation.y = t * 0.6
    if (spriteRef.current) spriteRef.current.material.opacity = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(t * 3.2)), 6)
  })
  return (
    <group ref={ref} rotation={[0.4, 0, 0]}>
      <group position={[radius * 1.9, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.16, 0.16, 0.36]} />
          <meshBasicMaterial color="#b9b2c8" />
        </mesh>
        <mesh position={[0, 0, 0.42]}>
          <boxGeometry args={[0.02, 0.5, 0.28]} />
          <meshBasicMaterial color="#3a4a8a" />
        </mesh>
        <mesh position={[0, 0, -0.42]}>
          <boxGeometry args={[0.02, 0.5, 0.28]} />
          <meshBasicMaterial color="#3a4a8a" />
        </mesh>
      </group>
      <sprite ref={spriteRef} position={[radius * 1.9, 0.2, 0]} scale={[1.2, 1.2, 1]}>
        <spriteMaterial map={glow} color="#ff7ac8" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Orbit lines, selection marker, asteroid belt
// ---------------------------------------------------------------------------
function OrbitLine({ radius, color, bodyId }) {
  const line = useMemo(() => {
    const pts = []
    const n = 256
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false })
    const l = new THREE.Line(geo, mat)
    l.userData.orbitOf = bodyId
    return l
  }, [radius, color, bodyId])
  return <primitive object={line} />
}

function AsteroidBelt({ inner = 54, outer = 59, count = 2200 }) {
  const ref = useRef()
  const { geometry, material } = useMemo(() => {
    const rand = mulberry32(4242)
    const pos = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const shade = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2
      const r = inner + (outer - inner) * (0.5 + (rand() - 0.5) * (rand() + 0.3))
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = (rand() - 0.5) * 1.0
      pos[i * 3 + 2] = Math.sin(a) * r
      size[i] = 0.4 + Math.pow(rand(), 3) * 1.8
      shade[i] = 0.55 + rand() * 0.45
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aShade', new THREE.BufferAttribute(shade, 1))
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) } },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aShade;
        uniform float uPixelRatio;
        varying float vFade;
        varying float vShade;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(aSize * 26.0 * uPixelRatio / -mv.z, 1.0, 7.0);
          vFade = smoothstep(320.0, 40.0, -mv.z);
          vShade = aShade;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vFade;
        varying float vShade;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float lit = 0.6 + 0.4 * clamp(-uv.x - uv.y + 0.3, 0.0, 1.0); // fake lit side
          gl_FragColor = vec4(vec3(0.72, 0.64, 0.57) * vShade * lit, (1.0 - smoothstep(0.3, 0.5, d)) * 0.8 * vFade);
        }
      `,
    })
    return { geometry: g, material: m }
  }, [inner, outer, count])

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.004
  })
  return <points ref={ref} geometry={geometry} material={material} />
}

// ---------------------------------------------------------------------------
// The whole system. Seen from the scroll journey it's a small, distant system on
// the horizon (only a few pixels of shading); "explore" flies the camera into it.
// ---------------------------------------------------------------------------
export default function StarSystem() {
  const rootRef = useRef()
  const orbitTime = useRef(0)
  const orbitSpeed = useRef(0.35)
  const orbitFade = useRef(0)

  const sun = BODIES.find((b) => b.type === 'sun')
  const planets = BODIES.filter((b) => b.type !== 'sun' && !b.parent)
  const moonsOf = (id) => BODIES.filter((b) => b.parent === id)

  useFrame((state, dt) => {
    const { mode, selected } = useStore.getState()
    // Planets drift slowly so they're easy to follow; everything pauses while you're landed
    const targetSpeed = selected ? 0 : 0.35
    orbitSpeed.current += (targetSpeed - orbitSpeed.current) * Math.min(1, dt * 2.5)
    orbitTime.current += dt * orbitSpeed.current

    for (const body of BODIES) {
      if (!body.orbit) continue
      const entry = bodyRegistry.get(body.id)
      if (!entry) continue
      const a = body.phase + orbitTime.current * body.speed
      entry.object.position.set(Math.cos(a) * body.orbit, 0, Math.sin(a) * body.orbit)
    }

    if (!rootRef.current) return
    rootRef.current.updateMatrixWorld()
    const sunEntry = bodyRegistry.get(sun.id)
    if (sunEntry) sunEntry.object.getWorldPosition(sunWorldPos)

    const goal = mode !== 'system' ? 0.45 : selected ? 0.2 : 1
    orbitFade.current += (goal - orbitFade.current) * Math.min(1, dt * 3)
    rootRef.current.traverse((o) => {
      if (o.userData.orbitOf !== undefined) o.material.opacity = 0.15 * orbitFade.current
    })
  })

  return (
    <group ref={rootRef} position={SYSTEM_CENTER} rotation={SYSTEM_TILT}>
      <Sun body={sun} />
      {planets.map((p) => (
        <OrbitLine key={`o-${p.id}`} radius={p.orbit} color={p.color} bodyId={p.id} />
      ))}
      <AsteroidBelt />
      {planets.map((p) => (
        <Planet key={p.id} body={p}>
          {moonsOf(p.id).map((m) => (
            <group key={m.id}>
              <OrbitLine radius={m.orbit} color={m.color} bodyId={m.id} />
              <Planet body={m} />
            </group>
          ))}
        </Planet>
      ))}
    </group>
  )
}
