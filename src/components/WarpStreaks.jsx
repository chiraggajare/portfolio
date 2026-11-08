import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { cameraMotion } from './CameraRig'
import { mulberry32 } from '../three/glsl'

const COUNT = 220
const DEPTH = 90

// Stars stretch into streaks while the camera is on a journey (flying into the system,
// between planets, or back to the scroll path). They always radiate from the centre of
// the screen, where you're heading. Never shown while you just scroll or orbit.
export default function WarpStreaks() {
  const ref = useRef()
  const offset = useRef(0)

  const { geometry, material } = useMemo(() => {
    const rand = mulberry32(99)
    const pos = new Float32Array(COUNT * 2 * 3)
    const end = new Float32Array(COUNT * 2)
    const tint = new Float32Array(COUNT * 2)
    for (let i = 0; i < COUNT; i++) {
      const a = rand() * Math.PI * 2
      const r = 2.5 + Math.pow(rand(), 0.8) * 20
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      const z = -rand() * DEPTH
      const t = rand()
      for (let k = 0; k < 2; k++) {
        const j = i * 2 + k
        pos.set([x, y, z], j * 3)
        end[j] = k
        tint[j] = t
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1))
    g.setAttribute('aTint', new THREE.BufferAttribute(tint, 1))
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uOffset: { value: 0 }, uLen: { value: 1 }, uOpacity: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aEnd;
        attribute float aTint;
        uniform float uOffset;
        uniform float uLen;
        varying float vA;
        varying float vTint;
        void main() {
          vec3 p = position;
          p.z = mod(p.z + uOffset, ${DEPTH.toFixed(1)}) - ${DEPTH.toFixed(1)};
          p.z += aEnd * uLen;
          vA = smoothstep(-${DEPTH.toFixed(1)}, -55.0, p.z) * (1.0 - smoothstep(-10.0, -2.0, p.z)) * (0.15 + aEnd * 0.85);
          vTint = aTint;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying float vA;
        varying float vTint;
        void main() {
          vec3 c = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.92, 0.8), vTint);
          gl_FragColor = vec4(c, vA * uOpacity);
        }
      `,
    })
    return { geometry: g, material: m }
  }, [])

  useFrame(({ camera }, dt) => {
    const s = cameraMotion.speed
    const u = material.uniforms
    const target = THREE.MathUtils.smoothstep(s, 20, 120) * 0.6 * cameraMotion.warp
    u.uOpacity.value += (target - u.uOpacity.value) * Math.min(1, dt * 6)
    u.uLen.value = THREE.MathUtils.clamp(s * 0.07, 0.4, 18)
    offset.current = (offset.current + s * dt * 0.8) % 100000
    u.uOffset.value = offset.current
    if (ref.current) {
      ref.current.visible = u.uOpacity.value > 0.005
      ref.current.position.copy(camera.position)
      // always burst from the middle of the screen, towards the viewer
      ref.current.quaternion.copy(camera.quaternion)
    }
  })

  return <lineSegments ref={ref} geometry={geometry} material={material} frustumCulled={false} renderOrder={10} />
}
