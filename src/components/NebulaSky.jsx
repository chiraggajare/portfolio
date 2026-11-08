import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { NOISE_3D, mulberry32 } from '../three/glsl'
import { useStore } from '../store/useStore'

const SKY_RADIUS = 440
const FAR_STARS = 2600

// The nebula is expensive noise, so it is rendered ONCE into a small equirectangular
// texture at startup; afterwards the sky costs a single texture lookup per pixel.
const BAKE_FRAG = /* glsl */ `
  varying vec2 vUv;
  ${NOISE_3D}
  void main() {
    float phi = vUv.x * 6.28318530718;
    float theta = (1.0 - vUv.y) * 3.14159265359;
    vec3 d = vec3(-cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta));

    float n1 = fbm(d * 1.7 + 3.0, 6);
    float n2 = fbm(d * 3.4 + 11.0, 5);
    float n3 = fbm(d * 7.0 - 4.0, 4);

    // A soft galactic band across the sky
    float bandCoord = dot(d, normalize(vec3(0.35, 1.0, 0.25))) + n1 * 0.35;
    float band = exp(-bandCoord * bandCoord * 7.0);

    vec3 violet = vec3(0.30, 0.10, 0.55);
    vec3 teal   = vec3(0.03, 0.22, 0.30);
    vec3 rose   = vec3(0.45, 0.08, 0.26);
    vec3 col = violet * smoothstep(-0.15, 0.7, n1) * 0.6
             + teal   * smoothstep(0.0, 0.75, n2) * 0.5
             + rose   * smoothstep(0.35, 0.9, n1 + n2 * 0.6) * 0.45;
    col *= 0.2 + band * 1.25;
    // dark dust lanes
    col *= 1.0 - smoothstep(0.05, 0.55, n3) * 0.65 * band;
    // faint unresolved starlight in the band
    col += vec3(0.55, 0.5, 0.65) * band * smoothstep(0.1, 0.8, n2 + n3) * 0.08;
    gl_FragColor = vec4(col * 0.42, 1.0);
  }
`

export default function NebulaSky() {
  const { gl } = useThree()
  const skyRef = useRef()
  const starsRef = useRef()
  const intensity = useRef(0)

  const target = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(1024, 512, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      depthBuffer: false,
    })
    const scene = new THREE.Scene()
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const mat = new THREE.ShaderMaterial({
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: BAKE_FRAG,
    })
    const geo = new THREE.PlaneGeometry(2, 2)
    scene.add(new THREE.Mesh(geo, mat))
    const prev = gl.getRenderTarget()
    gl.setRenderTarget(rt)
    gl.render(scene, cam)
    gl.setRenderTarget(prev)
    mat.dispose()
    geo.dispose()
    return rt
  }, [gl])

  useEffect(() => () => target.dispose(), [target])

  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        uniforms: { uMap: { value: target.texture }, uIntensity: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform float uIntensity;
          varying vec2 vUv;
          void main() {
            vec3 c = texture2D(uMap, vUv).rgb * uIntensity;
            // tiny dither to avoid banding in dark gradients
            c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    [target]
  )

  const { starGeo, starMat } = useMemo(() => {
    const rand = mulberry32(7)
    const pos = new Float32Array(FAR_STARS * 3)
    const size = new Float32Array(FAR_STARS)
    const col = new Float32Array(FAR_STARS * 3)
    const palette = [
      [0.75, 0.85, 1.0],
      [1.0, 1.0, 1.0],
      [1.0, 0.9, 0.75],
      [0.85, 0.8, 1.0],
    ]
    for (let i = 0; i < FAR_STARS; i++) {
      const u = rand() * 2 - 1
      const a = rand() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      const r = SKY_RADIUS * 0.95
      pos[i * 3] = Math.cos(a) * s * r
      pos[i * 3 + 1] = u * r
      pos[i * 3 + 2] = Math.sin(a) * s * r
      size[i] = 0.8 + Math.pow(rand(), 6) * 2.4
      const c = palette[(rand() * palette.length) | 0]
      col.set(c, i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const m = new THREE.ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) } },
      vertexShader: /* glsl */ `
        attribute float aSize;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vA;
        void main() {
          vColor = color;
          vA = 0.55 + 0.45 * sin(uTime * (0.6 + fract(position.x) * 1.5) + position.y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = 1.0 - smoothstep(0.15, 0.5, d);
          gl_FragColor = vec4(vColor, a * vA * 0.8);
        }
      `,
    })
    return { starGeo: g, starMat: m }
  }, [])

  useFrame(({ camera, clock }, dt) => {
    // Only a faint backdrop in explore mode; the scroll journey keeps its original clean black sky
    const goal = useStore.getState().mode === 'system' ? 0.3 : 0
    intensity.current += (goal - intensity.current) * Math.min(1, dt * 2)
    skyMaterial.uniforms.uIntensity.value = intensity.current
    starMat.uniforms.uTime.value = clock.getElapsedTime()
    const on = intensity.current > 0.01
    if (skyRef.current) skyRef.current.visible = on
    if (starsRef.current) starsRef.current.visible = on
    skyRef.current?.position.copy(camera.position)
    starsRef.current?.position.copy(camera.position)
  })

  return (
    <>
      <mesh ref={skyRef} material={skyMaterial} renderOrder={-1000} frustumCulled={false}>
        <sphereGeometry args={[SKY_RADIUS, 48, 24]} />
      </mesh>
      <points ref={starsRef} geometry={starGeo} material={starMat} renderOrder={-999} frustumCulled={false} />
    </>
  )
}
