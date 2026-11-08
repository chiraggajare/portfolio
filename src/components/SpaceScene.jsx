import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import Starfield from './Starfield'
import Galaxies from './Galaxies'
import ShootingStars from './ShootingStars'
import NebulaSky from './NebulaSky'
import CameraRig from './CameraRig'
import WarpStreaks from './WarpStreaks'
import StarSystem, { bodyRegistry } from './system/StarSystem'
import { labelEls } from './system/bridge'
import { BODY_BY_ID } from './system/systemData'
import { useStore } from '../store/useStore'

const MAX_DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)

// Watches the real frame time and lowers the render resolution if the device struggles,
// so the site stays fluid on low-end laptops and phones instead of stuttering.
function AdaptiveQuality() {
  const setDpr = useThree((s) => s.setDpr)
  const samples = useRef({ t: 0, n: 0, dpr: MAX_DPR, cooldown: 2.5 })
  useFrame((_, dt) => {
    const s = samples.current
    if (document.hidden) return
    s.cooldown -= dt
    if (s.cooldown > 0) return // ignore start-up / shader compile frames
    s.t += dt
    s.n += 1
    if (s.t < 1.5) return
    const avg = s.t / s.n
    s.t = 0
    s.n = 0
    if (avg > 1 / 42 && s.dpr > 0.75) {
      s.dpr = Math.max(0.75, s.dpr - 0.25)
      setDpr(s.dpr)
      s.cooldown = 1.5
    } else if (avg < 1 / 58 && s.dpr < MAX_DPR) {
      s.dpr = Math.min(MAX_DPR, s.dpr + 0.25)
      setDpr(s.dpr)
      s.cooldown = 4
    }
  })
  return null
}

// Projects planet positions to screen space and moves the HTML labels (no React renders)
const _p = new THREE.Vector3()
const _pp = new THREE.Vector3()
const hide = (el) => {
  if (el.style.opacity !== '0') el.style.opacity = '0'
}
function SystemLabels() {
  const { size } = useThree()
  useFrame(({ camera }) => {
    const { mode, selected } = useStore.getState()
    const show = mode === 'system' && !selected
    labelEls.forEach((el, id) => {
      const entry = bodyRegistry.get(id)
      if (!entry || !show) return hide(el)
      entry.object.getWorldPosition(_p)
      const dist = _p.distanceTo(camera.position)
      _p.project(camera)
      if (_p.z > 1) return hide(el)
      // offset the label below the body by its projected radius
      const pxR = (entry.radius / (dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * (size.height / 2)
      const x = (_p.x * 0.5 + 0.5) * size.width
      const y = (-_p.y * 0.5 + 0.5) * size.height + pxR + 10
      // Moons only get a label once they separate visually from their planet (zoomed in)
      const parent = BODY_BY_ID[id]?.parent
      if (parent) {
        bodyRegistry.get(parent)?.object.getWorldPosition(_pp)
        _pp.project(camera)
        const dx = (_pp.x - _p.x) * 0.5 * size.width
        const dy = (_pp.y - _p.y) * 0.5 * size.height
        if (Math.hypot(dx, dy) < 90) return hide(el)
      }
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translateX(-50%)`
      el.style.opacity = '1'
    })
  })
  return null
}

export default function SpaceScene({ mouse }) {
  return (
    <div className="space-canvas">
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 1600, position: [0, 0, 10] }}
        dpr={MAX_DPR}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        style={{ background: '#000000', touchAction: 'none' }}
      >
        <AdaptiveQuality />
        <CameraRig mouse={mouse} />

        <NebulaSky />
        <Starfield />
        <Galaxies />
        <ShootingStars />
        <StarSystem />
        <WarpStreaks />
        <SystemLabels />
      </Canvas>
    </div>
  )
}
