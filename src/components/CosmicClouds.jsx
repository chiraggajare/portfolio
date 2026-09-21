import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CLOUD_COUNT = 100

export default function CosmicClouds() {
  const groupRef = useRef()

  const clouds = useMemo(() => {
    const items = []
    
    // Generate 15 random chunks throughout the entire space (including the beginning)
    const clusterCenters = Array.from({ length: 15 }).map(() => ({
      x: (Math.random() - 0.5) * 150,
      y: (Math.random() - 0.5) * 100,
      z: 20 - Math.random() * 260 // From z=20 (right in front of camera) down to -240
    }));

    const colors = [
      new THREE.Color(0x7c3aed).multiplyScalar(0.35), // violet
      new THREE.Color(0x3b82f6).multiplyScalar(0.3),  // blue
      new THREE.Color(0x06b6d4).multiplyScalar(0.25), // cyan
      new THREE.Color(0xf472b6).multiplyScalar(0.25), // pink
      new THREE.Color(0x8b5cf6).multiplyScalar(0.3),  // purple
    ]

    for (let i = 0; i < CLOUD_COUNT; i++) {
      // 80% form massive deep space nebula clusters, 20% scatter ambiently
      const isCluster = Math.random() < 0.8
      
      let x, y, z;
      if (isCluster) {
        // Group into the random chunks
        const clusterIndex = Math.floor(Math.random() * clusterCenters.length);
        const center = clusterCenters[clusterIndex];
        
        // Volumetric spread around the cluster center
        x = center.x + (Math.random() - 0.5) * 60;
        y = center.y + (Math.random() - 0.5) * 50;
        z = center.z + (Math.random() - 0.5) * 60;
      } else {
        // Ambient background dust
        x = (Math.random() - 0.5) * 200;
        y = (Math.random() - 0.5) * 100;
        z = -Math.random() * 250;
      }

      items.push({
        position: [x, y, z],
        scale: 60 + Math.random() * 80, // Massive clouds
        color: colors[Math.floor(Math.random() * colors.length)],
        rotationSpeed: (Math.random() - 0.5) * 0.05, // Slower, majestic rotation
        opacity: 0.04 + Math.random() * 0.06, // Highly visible clouds
      })
    }
    return items
  }, [])

  const material = useMemo(() => {
    // Create an irregular, wispy noise-like texture by overlapping several soft radial gradients
    // High-definition 512x512 canvas to prevent pixelation on massive clouds
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    // Ensure gradients NEVER touch the edges of the 512x512 canvas to prevent hard box edges
    for (let i = 0; i < 4; i++) {
      const offsetX = 256 + (Math.random() - 0.5) * 80; // max 296
      const offsetY = 256 + (Math.random() - 0.5) * 80;
      const radius = 100 + Math.random() * 100; // max 200. 296 + 200 = 496 (safely within 512)
      
      const gradient = ctx.createRadialGradient(offsetX, offsetY, 0, offsetX, offsetY, radius)
      gradient.addColorStop(0, 'rgba(255,255,255,0.8)')
      gradient.addColorStop(0.4, 'rgba(255,255,255,0.25)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 512, 512)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }, [])

  useFrame(({ clock, camera }) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const time = clock.getElapsedTime()
        child.rotation.z += clouds[i].rotationSpeed * 0.01
        // Subtle floating motion
        child.position.y += Math.sin(time * 0.3 + i) * 0.002
        
        // Butter-smooth camera proximity fading to prevent choppy clipping while scrolling
        const zDist = camera.position.z - child.position.z;
        let targetOpacity = clouds[i].opacity;
        
        if (zDist < 0) {
           // Behind camera
           targetOpacity = 0;
        } else if (zDist < 120) {
           // Getting close, fade out smoothly so it doesn't clip
           targetOpacity = clouds[i].opacity * (zDist / 120);
        }
        
        // Apply opacity smoothly
        if (child.material) {
           child.material.opacity += (targetOpacity - child.material.opacity) * 0.1;
        }
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
