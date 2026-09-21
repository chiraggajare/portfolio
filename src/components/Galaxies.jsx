import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

function Galaxy({ 
  position, 
  tilt, 
  count = 10000, 
  radius = 60, 
  branches = 3, 
  spin = 1.2, 
  blackHoleRadius = 3.0,
  coreColor = '#ffffff',
  insideColor = '#ffbb55',
  outsideColor = '#2233ff'
}) {
  const pointsRef = useRef()
  
  const { geometry } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colorsArr = new Float32Array(count * 3)
    
    const colorCore = new THREE.Color(coreColor)
    const colorInside = new THREE.Color(insideColor)
    const colorOutside = new THREE.Color(outsideColor)

    // Hardcoded randomness parameters that generally look good for all galaxies
    const randomness = 0.25;
    const randomnessPower = 3;

    for(let i = 0; i < count; i++) {
      const i3 = i * 3
      
      const randomT = Math.random();
      const distRadius = blackHoleRadius + (Math.pow(randomT, 4) * (radius - blackHoleRadius))

      const spinAngle = distRadius * spin
      const branchAngle = (i % branches) / branches * Math.PI * 2

      const randomX = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * distRadius
      const randomY = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * distRadius
      const randomZ = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * distRadius

      positions[i3    ] = Math.cos(branchAngle + spinAngle) * distRadius + randomX
      positions[i3 + 1] = randomY * 0.15 // Flattened Y (thin disk)
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * distRadius + randomZ

      const normalizedDist = distRadius / radius
      const mixedColor = new THREE.Color()
      
      if (normalizedDist < 0.1) {
        mixedColor.lerpColors(colorCore, colorInside, normalizedDist * 10)
      } else {
        mixedColor.lerpColors(colorInside, colorOutside, (normalizedDist - 0.1) * 1.1)
      }
      
      colorsArr[i3    ] = mixedColor.r
      colorsArr[i3 + 1] = mixedColor.g
      colorsArr[i3 + 2] = mixedColor.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colorsArr, 3))
    
    return { geometry: geo }
  }, [count, radius, branches, spin, blackHoleRadius, coreColor, insideColor, outsideColor])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 1 }
      },
      vertexShader: `
        varying vec3 vColor;
        uniform float uTime;
        uniform float uSpeed;

        void main() {
          vColor = color;
          
          vec3 pos = position;
          
          // Spin
          float angle = atan(pos.x, pos.z);
          float distanceToCenter = length(pos.xz);
          
          // Differential rotation
          float angleOffset = (1.0 / (distanceToCenter + 0.1)) * uTime * 4.0 * uSpeed;
          
          angle += angleOffset;
          pos.x = cos(angle) * distanceToCenter;
          pos.z = sin(angle) * distanceToCenter;

          vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;
          
          gl_Position = projectedPosition;
          
          // Size attenuation - refined base size for elegant, visible stars without blobby overlap
          gl_PointSize = 12.0 * (1.0 / -viewPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float dist = length(uv);
          
          if (dist > 0.5) discard;
          
          // Exponential falloff for an incredibly soft, glowy dust particle
          float strength = pow(1.0 - (dist * 2.0), 3.0);
          
          gl_FragColor = vec4(vColor, strength * 1.0);
        }
      `
    })
  }, [])

  return (
    <group position={position} rotation={tilt}>
      <points ref={pointsRef} geometry={geometry} material={material} userData={{ isGalaxyPoints: true }} />
    </group>
  )
}

export default function Galaxies() {
  const groupRef = useRef()
  const lastProgress = useRef(0)
  const currentSpeed = useRef(1)
  const accumulatedTime = useRef(0)

  const galaxyData = useMemo(() => {
    // Generate 15 unique galaxies scattered along the flight path
    return Array.from({ length: 15 }).map(() => {
      // Scatter X and Y further out into deep space so they frame the scene without cluttering the center
      const randomX = (Math.random() < 0.5 ? -1 : 1) * (150 + Math.random() * 250); 
      const randomY = (Math.random() < 0.5 ? -1 : 1) * (100 + Math.random() * 200);
      // Scatter Z from 0 down to -400
      const randomZ = -Math.random() * 400; 
      
      const outsideColors = ['#2233ff', '#ff22aa', '#aa22ff', '#22ffaa', '#334455'];
      const insideColors = ['#ffbb55', '#ffffff', '#ffaa88', '#bbddff'];
      
      return {
        position: [randomX, randomY, randomZ],
        tilt: [
          Math.random() * Math.PI, 
          Math.random() * Math.PI, 
          Math.random() * Math.PI  
        ],
        // Randomize the structural DNA of each galaxy!
        count: 15000 + Math.random() * 20000,          // Much denser
        radius: 50 + Math.random() * 80,               // Much larger
        branches: Math.floor(2 + Math.random() * 4),   // 2 to 5 spiral arms
        spin: 0.5 + Math.random() * 2.5,               // Loose or tightly wound spirals
        blackHoleRadius: 1.5 + Math.random() * 3,      // Small or massive black holes
        outsideColor: outsideColors[Math.floor(Math.random() * outsideColors.length)],
        insideColor: insideColors[Math.floor(Math.random() * insideColors.length)],
      }
    })
  }, [])

  useFrame((state, delta) => {
    const progress = useStore.getState().progress;
    const scrollDelta = Math.abs(progress - lastProgress.current)
    lastProgress.current = progress
    
    // When scrolling fast, speed shoots up to max 20x for smoother feel
    const targetSpeed = 1.0 + Math.min(scrollDelta * 6000, 20.0)
    currentSpeed.current += (targetSpeed - currentSpeed.current) * 0.03
    
    accumulatedTime.current += delta * currentSpeed.current

    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if (child.userData.isGalaxyPoints && child.material && child.material.uniforms) {
          child.material.uniforms.uTime.value = accumulatedTime.current
          child.material.uniforms.uSpeed.value = currentSpeed.current
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {galaxyData.map((data, i) => (
        <Galaxy key={i} {...data} />
      ))}
    </group>
  )
}
