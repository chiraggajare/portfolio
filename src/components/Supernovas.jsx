import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const SUPERNOVA_COUNT = 30; // Max simultaneous explosions

export default function Supernovas({ progress }) {
  const meshRef = useRef()
  const lastProgress = useRef(progress)
  const currentSpeed = useRef(1)
  const accumulatedTime = useRef(0)

  const { geometry } = useMemo(() => {
    const positions = new Float32Array(SUPERNOVA_COUNT * 3)
    const randoms = new Float32Array(SUPERNOVA_COUNT)
    const offsets = new Float32Array(SUPERNOVA_COUNT)

    for (let i = 0; i < SUPERNOVA_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400
      positions[i * 3 + 1] = (Math.random() - 0.5) * 400
      positions[i * 3 + 2] = -Math.random() * 300 - 50
      
      randoms[i] = Math.random()
      offsets[i] = Math.random() * 100 // Time offset
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))
    geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1))

    return { geometry: geo }
  }, [])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float aRandom;
        attribute float aOffset;
        varying float vAlpha;
        varying vec3 vColor;
        uniform float uTime;

        void main() {
          vec3 pos = position;
          
          // Explosion cycle (e.g. every 10-20 seconds base time)
          float cycleDuration = 10.0 + aRandom * 10.0;
          float localTime = mod(uTime + aOffset, cycleDuration);
          
          // The explosion itself lasts 1.5 seconds
          float explosionPhase = clamp(localTime, 0.0, 1.5) / 1.5;
          
          // Size grows fast, then stops
          float size = pow(explosionPhase, 0.3) * (800.0 + aRandom * 400.0);
          
          // Alpha peaks fast then fades
          if (explosionPhase < 0.1) {
            vAlpha = explosionPhase * 10.0;
          } else {
            vAlpha = 1.0 - ((explosionPhase - 0.1) / 0.9);
          }
          
          // Don't show if not in explosion phase
          if (localTime > 1.5) {
            vAlpha = 0.0;
            size = 0.0;
          }

          // Colors transition from white to blue/purple/pink
          vec3 coreColor = vec3(1.0, 1.0, 1.0);
          vec3 edgeColor = mix(vec3(0.2, 0.5, 1.0), vec3(0.8, 0.2, 1.0), aRandom);
          vColor = mix(coreColor, edgeColor, explosionPhase);

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPos;
          gl_PointSize = size / -mvPos.z;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float dist = length(uv);
          if (dist > 0.5 || vAlpha <= 0.0) discard;
          
          // Supernova shape: bright core, fading edges with slight ring effect
          float core = pow(1.0 - (dist * 2.0), 4.0);
          float ring = sin(dist * 3.14159 * 2.0) * pow(dist, 1.5) * 2.0;
          
          float alpha = max(core, ring) * vAlpha;
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `
    })
  }, [])

  useFrame((state, delta) => {
    // Calculate scroll speed
    const scrollDelta = Math.abs(progress - lastProgress.current)
    lastProgress.current = progress
    
    // When scrolling fast, time passes faster (explosions happen quicker)
    const targetSpeed = 1.0 + Math.min(scrollDelta * 8000, 20.0)
    currentSpeed.current += (targetSpeed - currentSpeed.current) * 0.1

    if (meshRef.current) {
      accumulatedTime.current += delta * currentSpeed.current;
      meshRef.current.material.uniforms.uTime.value = accumulatedTime.current;
    }
  })

  return (
    <points ref={meshRef} geometry={geometry} material={material} />
  )
}
