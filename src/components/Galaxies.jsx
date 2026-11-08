import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { mulberry32, getGlowTexture } from '../three/glsl'

// One shared uniforms object → every galaxy updates with a single write per frame.
const sharedUniforms = {
  uTime: { value: 0 },
  uSpeed: { value: 1 },
  uPixelRatio: { value: 1 },
}

const galaxyMaterial = () =>
  new THREE.ShaderMaterial({
    depthWrite: false,
    transparent: true,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: sharedUniforms,
    vertexShader: /* glsl */ `
      attribute float aSize;
      varying vec3 vColor;
      varying float vCore;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uPixelRatio;

      void main() {
        vColor = color;
        vec3 pos = position;
        float r = length(pos.xz);
        // Differential rotation: inner stars orbit faster
        float angle = atan(pos.x, pos.z) + (1.0 / (r + 0.1)) * uTime * 4.0;
        pos.x = sin(angle) * r;
        pos.z = cos(angle) * r;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(aSize * 16.0 * uPixelRatio / -mv.z, 0.75, 6.0);
        vCore = aSize;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vCore;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float strength = pow(1.0 - d * 2.0, 2.2);
        gl_FragColor = vec4(vColor, strength);
      }
    `,
  })

function Galaxy({ data, glow }) {
  const geometry = useMemo(() => {
    const { count, radius, branches, spin, coreRadius, seed } = data
    const rand = mulberry32(seed)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const cCore = new THREE.Color(data.coreColor)
    const cIn = new THREE.Color(data.insideColor)
    const cOut = new THREE.Color(data.outsideColor)
    const cHii = new THREE.Color('#ff6fa8') // pink star-forming knots along the arms
    const tmp = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const bulge = rand() < 0.16
      let x, y, z, nd
      if (bulge) {
        // spherical-ish central bulge
        const r = Math.pow(rand(), 2.2) * radius * 0.16
        const a = rand() * Math.PI * 2
        const u = rand() * 2 - 1
        const s = Math.sqrt(1 - u * u)
        x = Math.cos(a) * s * r
        y = u * r * 0.55
        z = Math.sin(a) * s * r
        nd = r / radius
      } else {
        const t = rand()
        const r = coreRadius + Math.pow(t, 1.6) * (radius - coreRadius)
        const branch = ((i % branches) / branches) * Math.PI * 2
        const ang = branch + r * spin * 0.05
        const spread = (0.08 + 0.32 * (r / radius)) * r
        const jx = Math.pow(rand(), 2.5) * (rand() < 0.5 ? 1 : -1) * spread
        const jz = Math.pow(rand(), 2.5) * (rand() < 0.5 ? 1 : -1) * spread
        x = Math.cos(ang) * r + jx
        z = Math.sin(ang) * r + jz
        y = (rand() - 0.5) * radius * 0.03 * (1 - r / radius)
        nd = r / radius
      }
      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z

      if (nd < 0.12) tmp.lerpColors(cCore, cIn, nd / 0.12)
      else tmp.lerpColors(cIn, cOut, Math.min(1, (nd - 0.12) * 1.3))
      if (!bulge && nd > 0.25 && rand() < 0.05) tmp.lerp(cHii, 0.8)
      colors[i3] = tmp.r
      colors[i3 + 1] = tmp.g
      colors[i3 + 2] = tmp.b
      sizes[i] = bulge ? 1.2 + rand() * 1.6 : 0.6 + Math.pow(rand(), 4) * 2.6
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.computeBoundingSphere()
    return geo
  }, [data])

  const material = useMemo(galaxyMaterial, [])

  return (
    <group position={data.position} rotation={data.tilt}>
      <points geometry={geometry} material={material} />
      {/* small glowing core */}
      <sprite scale={[data.radius * 0.45, data.radius * 0.45, 1]}>
        <spriteMaterial map={glow} color={data.insideColor} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  )
}

export default function Galaxies() {
  const lastProgress = useRef(0)
  const currentSpeed = useRef(1)
  const glow = getGlowTexture(THREE)

  const galaxyData = useMemo(() => {
    // Seeded so the sky is the same on every visit (and can be art-directed)
    const rand = mulberry32(20261108)
    const outside = ['#3b4dff', '#ff3fb0', '#9b4dff', '#2de0b0', '#4f7dff']
    const inside = ['#ffcf7a', '#ffffff', '#ffb59a', '#cfe4ff']
    return Array.from({ length: 10 }).map((_, i) => {
      const side = i % 2 === 0 ? 1 : -1
      const vert = i % 4 < 2 ? 1 : -1
      return {
        seed: 1000 + i * 77,
        position: [side * (110 + rand() * 200), vert * (70 + rand() * 150), 40 - rand() * 420],
        tilt: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI],
        count: Math.floor(7000 + rand() * 7000),
        radius: 45 + rand() * 65,
        branches: 2 + Math.floor(rand() * 3),
        spin: 1 + rand() * 2.5,
        coreRadius: 1.5 + rand() * 2,
        outsideColor: outside[Math.floor(rand() * outside.length)],
        insideColor: inside[Math.floor(rand() * inside.length)],
        coreColor: '#ffffff',
      }
    })
  }, [])

  useFrame((state, delta) => {
    const progress = useStore.getState().progress
    const scrollDelta = Math.abs(progress - lastProgress.current)
    lastProgress.current = progress
    // Spin up while the user is scrolling fast
    const targetSpeed = 1.0 + Math.min(scrollDelta * 6000, 20.0)
    currentSpeed.current += (targetSpeed - currentSpeed.current) * Math.min(1, delta * 2)
    sharedUniforms.uTime.value += Math.min(delta, 0.05) * currentSpeed.current * 0.25
    sharedUniforms.uSpeed.value = currentSpeed.current
    sharedUniforms.uPixelRatio.value = state.gl.getPixelRatio()
  })

  return (
    <group>
      {galaxyData.map((data) => (
        <Galaxy key={data.seed} data={data} glow={glow} />
      ))}
    </group>
  )
}
