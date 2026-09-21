import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import Starfield from './Starfield'
import CosmicClouds from './CosmicClouds'
import ShootingStars from './ShootingStars'
import Galaxies from './Galaxies'
import Supernovas from './Supernovas'

function CameraController({ progress, mouse }) {
  const targetZ = 10 - progress * 180

  // scrollIndex maps progress to our 12 sections (0 to 11)
  const scrollIndex = progress * 11
  
  const FLIGHT_PATH = [
    [0, 0],       // 0: Hero
    [10, 0],      // 1: Travel Right
    [20, 0],      // 2: Continue Right (Straight)
    [20, -10],    // 3: Travel Up
    [20, -20],    // 4: Continue Up (Straight)
    [10, -20],    // 5: Travel Left
    [0, -20],     // 6: Continue Left (Straight)
    [0, -10],     // 7: Travel Down
    [0, 0],       // 8: Continue Down (Straight)
    [10, 0],      // 9: Travel Right
    [20, 0],      // 10: Continue Right (Straight)
    [20, -10],    // 11: Travel Up
    [20, -10]     // 12: Buffer
  ];

  const currIndex = Math.floor(scrollIndex);
  const nextIndex = Math.min(currIndex + 1, FLIGHT_PATH.length - 1);
  const fraction = scrollIndex - currIndex;
  
  const p1 = FLIGHT_PATH[currIndex];
  const p2 = FLIGHT_PATH[nextIndex];
  
  // Linear interpolation for perfectly straight, directional lines (no swirl)
  const targetX = p1[0] + (p2[0] - p1[0]) * fraction;
  const targetY = p1[1] + (p2[1] - p1[1]) * fraction;

  // Calculate direction vector to physically tilt the spaceship into the turn
  const dirX = p2[0] - p1[0];
  const dirY = p2[1] - p1[1];
  const baseRotY = dirX * -0.015; // Bank left/right depending on horizontal travel
  const baseRotX = dirY * 0.015;  // Pitch up/down depending on vertical travel

  useFrame(({ camera }) => {
    // Mouse controls X/Y physical movement AND tilting (Parallax) - reduced for less prominence
    const mouseOffsetX = mouse ? (mouse.x * 2.5) : 0
    const mouseOffsetY = mouse ? (mouse.y * 2.5) : 0

    // Buttery smooth lerping (0.025 instead of 0.05)
    camera.position.z += (targetZ - camera.position.z) * 0.025
    camera.position.x += ((targetX + mouseOffsetX) - camera.position.x) * 0.025
    camera.position.y += ((targetY + mouseOffsetY) - camera.position.y) * 0.025
    
    // Softer tilt
    const targetRotX = mouse ? (mouse.y * 0.08) : 0
    const targetRotY = mouse ? (-mouse.x * 0.08) : 0
    
    // Combine spaceship banking rotation + mouse parallax rotation
    camera.rotation.x += ((baseRotX + targetRotX) - camera.rotation.x) * 0.025
    camera.rotation.y += ((baseRotY + targetRotY) - camera.rotation.y) * 0.025
  })

  return null
}

export default function SpaceScene({ progress, mouse }) {
  return (
    <div className="space-canvas">
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 500, position: [0, 0, 10] }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#000000' }}
      >
        <CameraController progress={progress} mouse={mouse} />
        <Starfield progress={progress} />
        <CosmicClouds progress={progress} />
        <Galaxies progress={progress} />
        <Supernovas progress={progress} />
        <ShootingStars />
      </Canvas>
    </div>
  )
}
