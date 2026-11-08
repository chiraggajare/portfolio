// Small shared helpers (no three.js import, so HTML-only code stays out of the 3D bundle)

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x))

export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

// Frame-rate independent damping factor: the same feel at 60Hz and 120Hz
export const damp = (rate, dt) => 1 - Math.exp(-rate * dt)

// Small deterministic PRNG so the universe looks the same on every visit
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const isTypingTarget = (el) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
