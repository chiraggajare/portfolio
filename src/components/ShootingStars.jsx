import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const SHOOTING_STAR_COUNT = 15
// Pre-allocate reusable vectors to avoid GC pressure
const _tempVec = new THREE.Vector3(0, 1, 0)

export default function ShootingStars() {
  const groupRef = useRef()

  const stars = useMemo(() => {
    return new Array(SHOOTING_STAR_COUNT).fill(0).map(() => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        -Math.random() * 200 - 50
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        Math.random() * 50 + 50
      ),
      // Pre-allocate a normalized direction vector for orientation
      normalizedDir: new THREE.Vector3(),
      length: Math.random() * 4 + 2,
      thickness: Math.random() * 0.05 + 0.02,
      opacity: 0,
      state: 'waiting',
      timer: Math.random() * 5
    }))
  }, [])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    const meshes = groupRef.current.children
    
    stars.forEach((star, i) => {
      const mesh = meshes[i]
      
      if (star.state === 'waiting') {
        star.timer -= delta
        mesh.material.opacity = 0
        if (star.timer <= 0) {
          star.state = 'shooting'
          star.position.set(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            -150 - Math.random() * 50
          )
          star.velocity.set(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
            Math.random() * 80 + 80
          )
          mesh.position.copy(star.position)
          // Reuse pre-allocated vector instead of creating new ones
          star.normalizedDir.copy(star.velocity).normalize()
          mesh.quaternion.setFromUnitVectors(_tempVec, star.normalizedDir)
          mesh.scale.set(star.thickness, star.length, star.thickness)
        }
      } else if (star.state === 'shooting') {
        star.position.addScaledVector(star.velocity, delta)
        mesh.position.copy(star.position)
        
        if (star.position.z > 10) {
          star.state = 'waiting'
          star.timer = Math.random() * 4 + 2
        } else {
          const distFromPeak = Math.abs(star.position.z + 50)
          const op = Math.max(0, 1 - distFromPeak / 100)
          mesh.material.opacity = op * 0.8
        }
      }
    })
  })

  return (
    <group ref={groupRef}>
      {stars.map((star, i) => (
        <mesh key={i}>
          <cylinderGeometry args={[1, 1, 1, 4]} />
          <meshBasicMaterial 
            color={new THREE.Color(0.9, 0.95, 1.0)} 
            transparent 
            opacity={0} 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
