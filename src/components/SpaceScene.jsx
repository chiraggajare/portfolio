import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import Starfield from './Starfield'
import CosmicClouds from './CosmicClouds'
import Galaxies from './Galaxies'
import ShootingStars from './ShootingStars'
import { useStore } from '../store/useStore'

const FLIGHT_PATH = [
  [0, 0],         // 0: Hero
  [0, 0],         // 1: (Straight - WavyName)
  [0, 0],         // 2: Pitch (Straight)
  [30, 0],        // 3: About (TURN RIGHT)
  [30, 0],        // 4: TechTitle (Straight)
  [30, 0],        // 5: tech-stack-2 (Straight)
  [30, 0],        // 6: tech-stack-3 (Straight)
  [30, 0],        // 7: tech-stack-4 (Straight)
  [30, 0],        // 8: tech-stack-5 (Straight)
  [30, -20],      // 9: Experience (TURN DOWN - Single direction change)
  [-30, -20],     // 10: Projects (TURN LEFT - Single direction change)
  [-30, 0],       // 11: WavyNameReverse (TURN UP - Single direction change)
  [-30, 0],       // 12: Contact (Straight)
  [-30, 0]        // 13: Buffer
];

function CameraController({ mouse }) {
  const currentTiltX = useRef(0)
  const currentTiltY = useRef(0)

  useFrame(({ camera }) => {
    const progress = useStore.getState().progress;
    // scrollIndex maps progress to our 13 sections (0 to 12 segments)
    const scrollIndex = progress * 12;
    const currIndex = Math.floor(scrollIndex);
    const nextIndex = Math.min(currIndex + 1, FLIGHT_PATH.length - 1);
    const fraction = scrollIndex - currIndex;
  
    // Make the fraction directional/stepped so space moves rapidly during transitions
    // and stays relatively still while reading a section
    let steppedFraction = 0;
    if (fraction < 0.25) steppedFraction = 0;
    else if (fraction > 0.75) steppedFraction = 1;
    else steppedFraction = (fraction - 0.25) / 0.5;
  
    // Smooth ease-in-out curve
    const easedFraction = steppedFraction * steppedFraction * (3 - 2 * steppedFraction);
  
    const p1 = FLIGHT_PATH[currIndex];
    const p2 = FLIGHT_PATH[nextIndex];
  
    // Apply directional transition to X and Y
    const targetX = p1[0] + (p2[0] - p1[0]) * easedFraction;
    const targetY = p1[1] + (p2[1] - p1[1]) * easedFraction;
  
    // Apply directional transition to Z (Zoom)
    const steppedScrollIndex = currIndex + easedFraction;
    const targetZ = 10 - steppedScrollIndex * (180 / 12);

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
    
    camera.rotation.x += (targetRotX - camera.rotation.x) * 0.025
    camera.rotation.y += (targetRotY - camera.rotation.y) * 0.025
    camera.rotation.z += (0 - camera.rotation.z) * 0.025
  })

  return null
}

export default function SpaceScene({ mouse }) {
  const showCosmicClouds = useStore((state) => state.showCosmicClouds)

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
        {/* Soft cosmic ambient light */}
        <ambientLight intensity={0.2} />
        
        <CameraController mouse={mouse} />
        
        <Starfield />
        {showCosmicClouds && <CosmicClouds />}
        <Galaxies />
        <ShootingStars />
      </Canvas>
    </div>
  )
}
