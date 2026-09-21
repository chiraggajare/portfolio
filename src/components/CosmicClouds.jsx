import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CLOUD_COUNT = 18

export default function CosmicClouds({ progress }) {
  const groupRef = useRef()

  const clouds = useMemo(() => {
    const items = []
    const colors = [
      new THREE.Color(0x7c3aed).multiplyScalar(0.15), // violet
      new THREE.Color(0x3b82f6).multiplyScalar(0.12), // blue
      new THREE.Color(0x06b6d4).multiplyScalar(0.1),  // cyan
      new THREE.Color(0xf472b6).multiplyScalar(0.08), // pink
      new THREE.Color(0x8b5cf6).multiplyScalar(0.1),  // purple
    ]

    for (let i = 0; i < CLOUD_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const radius = 8 + Math.random() * 25
      items.push({
        position: [
          Math.cos(theta) * radius,
          (Math.random() - 0.5) * 15,
          -10 - Math.random() * 160,
        ],
        scale: 4 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        opacity: 0.03 + Math.random() * 0.06,
      })
    }
    return items
  }, [])

  const material = useMemo(() => {
    // Create a soft radial gradient texture for the clouds
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.5)')
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.1)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }, [])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const time = clock.getElapsedTime()
        child.rotation.z += clouds[i].rotationSpeed * 0.01
        // Subtle floating motion
        child.position.y += Math.sin(time * 0.3 + i) * 0.002
      })
    }
  })

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, i) => (
        <sprite
          key={i}
          position={cloud.position}
          scale={[cloud.scale, cloud.scale, 1]}
        >
          <spriteMaterial
            map={material}
            color={cloud.color}
            transparent
            opacity={cloud.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  )
}
