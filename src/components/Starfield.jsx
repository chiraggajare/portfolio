import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const STAR_COUNT = 3000

export default function Starfield({ progress }) {
  const meshRef = useRef()

  const { geometry, sizes, shapes } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const sizesArr = new Float32Array(STAR_COUNT)
    const shapesArr = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      // Distribute in a large cylinder around the camera path
      const theta = Math.random() * Math.PI * 2
      const radius = 5 + Math.random() * 45
      positions[i * 3] = Math.cos(theta) * radius
      positions[i * 3 + 1] = Math.sin(theta) * radius
      positions[i * 3 + 2] = -Math.random() * 250 + 20

      // Make a tiny percentage of stars (2%) noticeably larger and brighter
      sizesArr[i] = Math.random() < 0.02 ? 0.3 + Math.random() * 0.5 : 0.05 + Math.random() * 0.15
      shapesArr[i] = Math.floor(Math.random() * 4) // 0=circle, 1=diamond, 2=cross, 3=four-point
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizesArr, 1))
    geo.setAttribute('aShape', new THREE.BufferAttribute(shapesArr, 1))

    return { geometry: geo, sizes: sizesArr, shapes: shapesArr }
  }, [])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aShape;
        varying float vShape;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vec3 pos = position;
          // Slowly drift all stars towards the camera over time
          float zOffset = uTime * 6.0; 
          float currentZ = pos.z + zOffset;
          // Wrap them around so they never run out (depth is 250, from 20 to -230)
          float wrappedZ = mod(currentZ + 230.0, 250.0) - 230.0;
          pos.z = wrappedZ;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          float dist = -mvPos.z;
          float sizeFactor = aSize * 400.0 * uPixelRatio / dist;
          // Increased max point size to 25.0 so the 2% of large stars can shine bright
          gl_PointSize = clamp(sizeFactor, 1.0, 25.0);

          vShape = aShape;
          // Twinkle effect
          float twinkle = sin(uTime * 1.5 + position.x * 10.0 + position.y * 7.0) * 0.4 + 0.6;
          // Fade with distance
          float distFade = smoothstep(230.0, 10.0, dist);
          vAlpha = twinkle * distFade * 1.2; // slight boost in brightness
        }
      `,
      fragmentShader: `
        varying float vShape;
        varying float vAlpha;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float alpha = 0.0;

          int shape = int(vShape + 0.5);

          if (shape == 0) {
            // Circle
            alpha = 1.0 - smoothstep(0.3, 0.5, d);
          } else if (shape == 1) {
            // Diamond
            float diamond = abs(uv.x) + abs(uv.y);
            alpha = 1.0 - smoothstep(0.3, 0.5, diamond);
          } else if (shape == 2) {
            // Cross / plus
            float cross = min(abs(uv.x), abs(uv.y));
            alpha = 1.0 - smoothstep(0.05, 0.12, cross);
            alpha *= 1.0 - smoothstep(0.35, 0.5, d);
          } else {
            // Four-point star
            float star = abs(uv.x * uv.y);
            float core = 1.0 - smoothstep(0.0, 0.02, star);
            float glow = 1.0 - smoothstep(0.15, 0.5, d);
            alpha = max(core, glow * 0.6);
          }

          alpha *= vAlpha;
          if (alpha < 0.01) discard;

          // Slightly warm white for variety
          vec3 color = vec3(0.95, 0.95, 1.0);
          gl_FragColor = vec4(color, alpha);
        }
      `,
    })
  }, [])

  useFrame(({ clock }) => {
    if (material.uniforms) {
      material.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <points ref={meshRef} geometry={geometry} material={material} />
  )
}
