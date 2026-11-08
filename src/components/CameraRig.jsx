import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { bodyRegistry, sunWorldPos } from './system/StarSystem'
import { hoverState, systemApi, labelEls } from './system/bridge'
import { SYSTEM_CENTER, BODY_BY_ID } from './system/systemData'
import { clamp, damp, smoothstep, isTypingTarget } from '../utils/math'

// Flight path for the scroll journey: [x, y] per section, z is derived from the index
const FLIGHT_PATH = [
  [0, 0], [0, 0], [0, 0], [30, 0], [30, 0], [30, 0], [30, 0], [30, 0], [30, 0],
  [30, -20], [-30, -20], [-30, 0], [-30, 0], [-30, 0],
]

const WORLD_UP = new THREE.Vector3(0, 1, 0)
const PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -SYSTEM_CENTER[1])
const MIN_DIST = 10
const MAX_DIST = 300
const MIN_PHI = 0.18 // radians from straight above
const MAX_PHI = 1.45
const DEFAULT_PHI = 1.02
const SYSTEM_RADIUS = 110 // how far from the star the orbit focus may wander


// Shared with WarpStreaks: camera speed (units/s) and whether we're on a "journey"
export const cameraMotion = { speed: 0, warp: 0, dir: new THREE.Vector3(0, 0, -1) }

// ---------------------------------------------------------------------------
// Orbit state (module level so the HTML controls can drive it without re-renders)
// ---------------------------------------------------------------------------
const orbit = {
  focus: new THREE.Vector3(...SYSTEM_CENTER),
  gFocus: new THREE.Vector3(...SYSTEM_CENTER),
  theta: 0,
  gTheta: 0,
  phi: DEFAULT_PHI,
  gPhi: DEFAULT_PHI,
  dist: 150,
  gDist: 150,
  spin: 0, // inertial rotation speed
  panVel: new THREE.Vector3(), // inertial pan (a flick keeps gliding, like a map)
  idle: 0, // seconds since the last interaction (drives the slow auto-rotate)
  dragging: false,
  travel: false, // a long flight (into the system / take-off) is in progress
  aspect: 1.6,
}

const fitDistance = (aspect) => clamp(92 / (0.577 * Math.min(aspect, 1.7)), 130, 290)

// The overlay's +/−/overview buttons (declared in the three-free bridge)
systemApi.zoomBy = (f) => {
  orbit.gDist = clamp(orbit.gDist * f, MIN_DIST, MAX_DIST)
  orbit.idle = 0
  orbit.travel = false
}
systemApi.overview = () => {
  orbit.gFocus.copy(sunWorldPos)
  orbit.gDist = fitDistance(orbit.aspect)
  orbit.gPhi = DEFAULT_PHI
  orbit.panVel.set(0, 0, 0)
  orbit.idle = 0
}

// scratch objects (no per-frame allocation)
const _goal = new THREE.Vector3()
const _look = new THREE.Vector3()
const _up = new THREE.Vector3()
const _c = new THREE.Vector3()
const _tmp = new THREE.Vector3()
const _tmp2 = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _hit = new THREE.Vector3()
const _prev = new THREE.Vector3()
const _vel = new THREE.Vector3()
const _lift = new THREE.Vector3()
const _pole = new THREE.Vector3()
const _zAxis = new THREE.Vector3(0, 0, 1)
const RING_TILT = 0.42 // axial tilt of ringed worlds (matches StarSystem's gas giant)
const LAND_RATE = 4.2 // descent speed (second-order chase); higher = quicker landing
const _ray = new THREE.Raycaster()
const _ndc = new THREE.Vector2()
const _scratchCam = new THREE.PerspectiveCamera(60, 1, 0.1, 2000)

function orbitPose(focus, dist, theta, phi, outPos) {
  return outPos
    .set(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta))
    .multiplyScalar(dist)
    .add(focus)
}

// Where on the orbital plane is the pointer, for a given orbit state?
function planeHit(clientX, clientY, el, focus, dist, theta, phi, out) {
  const rect = el.getBoundingClientRect()
  _scratchCam.aspect = rect.width / rect.height
  _scratchCam.updateProjectionMatrix()
  orbitPose(focus, dist, theta, phi, _scratchCam.position)
  _scratchCam.lookAt(focus)
  _scratchCam.updateMatrixWorld(true)
  _ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
  _ray.setFromCamera(_ndc, _scratchCam)
  return _ray.ray.intersectPlane(PLANE, out)
}

function clampFocus() {
  _tmp.copy(orbit.gFocus).sub(sunWorldPos)
  _tmp.y = 0
  if (_tmp.length() > SYSTEM_RADIUS) {
    _tmp.setLength(SYSTEM_RADIUS)
    orbit.gFocus.set(sunWorldPos.x + _tmp.x, SYSTEM_CENTER[1], sunWorldPos.z + _tmp.z)
  }
  orbit.gFocus.y = SYSTEM_CENTER[1]
}

// Zoom towards whatever is under the cursor (keeps that point fixed on screen)
function zoomAt(clientX, clientY, el, factor) {
  const newDist = clamp(orbit.gDist * factor, MIN_DIST, MAX_DIST)
  if (planeHit(clientX, clientY, el, orbit.gFocus, orbit.gDist, orbit.gTheta, orbit.gPhi, _hit)) {
    orbit.gFocus.addScaledVector(_hit.sub(orbit.gFocus), 1 - newDist / orbit.gDist)
    clampFocus()
  }
  orbit.gDist = newDist
  orbit.idle = 0
}

function flightGoal(progress, out) {
  const scrollIndex = progress * 12
  const currIndex = Math.min(Math.floor(scrollIndex), FLIGHT_PATH.length - 2)
  const fraction = scrollIndex - currIndex
  // Stay still while reading a section, move decisively in between
  const s = Math.min(1, Math.max(0, (fraction - 0.2) / 0.6))
  const eased = s * s * (3 - 2 * s)
  const p1 = FLIGHT_PATH[currIndex]
  const p2 = FLIGHT_PATH[currIndex + 1]
  out.set(p1[0] + (p2[0] - p1[0]) * eased, p1[1] + (p2[1] - p1[1]) * eased, 10 - (currIndex + eased) * 15)
  return out
}

export default function CameraRig({ mouse }) {
  const { camera, gl, size } = useThree()

  const chase = useRef(new THREE.Vector3(0, 0, 10))
  const landing = useRef({ id: null, u: new THREE.Vector3(), t: new THREE.Vector3(), lat: 0, height: 1.13, tilt: 12 })
  const modeRef = useRef('flight')
  const selRef = useRef(null)
  const speedRef = useRef(0)

  // ---------- Gestures ----------
  // Modelled on map / globe viewers (Google Maps & Earth, ArcGIS Earth, Sketchfab):
  //   one finger / left-drag  → orbit (with momentum)
  //   two fingers             → pinch zoom + pan + twist, all at once, about the fingers
  //   double-tap / dbl-click  → zoom in on that spot (shift: out)
  //   double-tap, then drag   → one-handed zoom (down = in, up = out)
  //   two-finger tap          → zoom out
  //   right / shift-drag      → pan (a flick keeps gliding)
  //   wheel / trackpad pinch  → zoom to cursor; trackpad sideways swipe → orbit
  //   tap a world             → land; the touch target is much bigger than the planet
  useEffect(() => {
    const el = gl.domElement
    const pointers = new Map()
    let gesture = null // 'rotate' | 'pan' | 'pinch' | 'tapzoom'
    const grab = new THREE.Vector3()
    let hasGrab = false
    let downX = 0
    let downY = 0
    let downT = 0
    let lastT = 0
    let moved = false
    let maxPointers = 0
    let pinch = null
    let tapzoom = null
    let lastTap = { t: 0, x: 0, y: 0 }

    const active = () => {
      const s = useStore.getState()
      return s.mode === 'system' && !s.selected
    }
    const rotateSpeed = () => clamp(2.6 / el.clientWidth, 0.0045, 0.0085)
    const startGrab = (x, y) => {
      hasGrab = !!planeHit(x, y, el, orbit.focus, orbit.dist, orbit.theta, orbit.phi, grab)
    }
    const two = () => {
      const [a, b] = [...pointers.values()]
      return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        d: Math.hypot(a.x - b.x, a.y - b.y),
        a: Math.atan2(b.y - a.y, b.x - a.x),
      }
    }
    // keep the grabbed point of the plane under (x, y) after a rotate / zoom change
    const holdGrab = (x, y) => {
      if (hasGrab && planeHit(x, y, el, orbit.focus, orbit.dist, orbit.theta, orbit.phi, _hit)) {
        _tmp.copy(orbit.gFocus)
        orbit.gFocus.add(grab).sub(_hit)
        clampFocus()
        orbit.focus.copy(orbit.gFocus)
        return _tmp.sub(orbit.gFocus).negate() // how far the focus moved this event
      }
      return null
    }
    const syncGoals = () => {
      orbit.gFocus.copy(orbit.focus)
      orbit.gTheta = orbit.theta
      orbit.gPhi = orbit.phi
      orbit.gDist = orbit.dist
    }

    // Fat-finger friendly picking: the nearest world whose screen disc (plus a margin)
    // contains the point. Cheap: eight projections, no raycasting.
    const pickBody = (x, y, slop) => {
      const rect = el.getBoundingClientRect()
      const k = rect.height / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      let best = null
      let bestScore = 1
      bodyRegistry.forEach((e, id) => {
        e.object.getWorldPosition(_tmp2)
        const d = _tmp2.distanceTo(camera.position)
        _tmp2.project(camera)
        if (_tmp2.z > 1) return
        const sx = rect.left + (_tmp2.x * 0.5 + 0.5) * rect.width
        const sy = rect.top + (-_tmp2.y * 0.5 + 0.5) * rect.height
        const score = Math.hypot(sx - x, sy - y) / ((e.radius / d) * k + slop)
        if (score < bestScore) {
          bestScore = score
          best = id
        }
      })
      return best
    }
    const pickLabel = (x, y) => {
      let hit = null
      let hitD = Infinity
      for (const [id, lab] of labelEls) {
        if (lab.style.opacity !== '1') continue
        const r = lab.getBoundingClientRect()
        if (x < r.left - 4 || x > r.right + 4 || y < r.top - 4 || y > r.bottom + 4) continue
        const d = Math.hypot(x - (r.left + r.right) / 2, y - (r.top + r.bottom) / 2)
        if (d < hitD) {
          hitD = d
          hit = id
        }
      }
      return hit
    }
    // 1) right on a world  2) on its name label (labels let touches through to the
    // canvas so a pinch that starts on one still works)  3) near a world (fat fingers)
    const pick = (x, y, slop) => pickBody(x, y, 4) || pickLabel(x, y) || pickBody(x, y, slop)

    const onDown = (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (!active()) return
      try { el.setPointerCapture(e.pointerId) } catch { /* synthetic or already released */ }
      orbit.spin = 0
      orbit.panVel.set(0, 0, 0)
      orbit.idle = 0
      orbit.travel = false
      syncGoals() // grabbing stops any glide: the view feels solid under the finger
      maxPointers = Math.max(maxPointers, pointers.size)
      lastT = performance.now()

      if (pointers.size === 1) {
        downX = e.clientX
        downY = e.clientY
        downT = lastT
        moved = false
        maxPointers = 1
        const quickSecond =
          e.pointerType !== 'mouse' && lastT - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40
        if (quickSecond) {
          gesture = 'tapzoom'
          tapzoom = { y: e.clientY, dist: orbit.dist }
          startGrab(e.clientX, e.clientY)
        } else if (e.button === 2 || e.button === 1 || e.shiftKey || e.ctrlKey || e.metaKey) {
          gesture = 'pan'
          startGrab(e.clientX, e.clientY)
        } else {
          gesture = 'rotate'
        }
      } else if (pointers.size === 2) {
        const m = two()
        gesture = 'pinch'
        pinch = { d: m.d, a: m.a, dist: orbit.dist, theta: orbit.theta }
        startGrab(m.x, m.y)
      }
      orbit.dragging = true
      document.documentElement.classList.add('is-grabbing')
    }

    const onMove = (e) => {
      // desktop hover: highlight the world under the cursor
      if (!pointers.has(e.pointerId)) {
        if (e.pointerType === 'mouse' && active() && e.target === el) hoverState.set(pick(e.clientX, e.clientY, 10))
        return
      }
      const prev = pointers.get(e.pointerId)
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (!active() || !gesture) return
      if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) > (e.pointerType === 'mouse' ? 4 : 9)) {
        moved = true
        hoverState.set(null)
      }
      if (!moved && gesture !== 'pinch') return
      orbit.idle = 0
      const now = performance.now()
      const dt = Math.max(8, now - lastT) / 1000
      lastT = now

      if (gesture === 'pinch' && pointers.size === 2) {
        const m = two()
        if (Math.abs(m.d - pinch.d) > 6 || Math.abs(m.a - pinch.a) > 0.05) moved = true
        orbit.dist = clamp(pinch.dist * (pinch.d / Math.max(m.d, 1)), MIN_DIST, MAX_DIST)
        // twist: the system turns with your fingers
        let da = m.a - pinch.a
        da = Math.atan2(Math.sin(da), Math.cos(da))
        orbit.theta = pinch.theta + da
        syncGoals()
        holdGrab(m.x, m.y)
        return
      }
      if (gesture === 'tapzoom') {
        orbit.dist = clamp(tapzoom.dist * Math.exp(-(e.clientY - tapzoom.y) * 0.008), MIN_DIST, MAX_DIST)
        syncGoals()
        holdGrab(downX, downY)
        return
      }
      if (gesture === 'pan') {
        const step = holdGrab(e.clientX, e.clientY)
        if (step) orbit.panVel.lerp(step.divideScalar(dt), 0.5)
        return
      }
      if (gesture === 'rotate') {
        const k = rotateSpeed()
        const dTheta = -(e.clientX - prev.x) * k
        orbit.theta += dTheta
        orbit.phi = clamp(orbit.phi - (e.clientY - prev.y) * k * 0.8, MIN_PHI, MAX_PHI)
        // a flick glides on, but never more than about a third of a turn
        orbit.spin = clamp(THREE.MathUtils.lerp(orbit.spin, dTheta / dt, 0.4), -3, 3)
        syncGoals()
      }
    }

    const onUp = (e) => {
      if (!pointers.has(e.pointerId)) return
      pointers.delete(e.pointerId)
      if (!active()) {
        if (pointers.size === 0) gesture = null
        return
      }
      // lifting one finger of a pinch: carry on orbiting with the other, no jump
      if (pointers.size === 1 && gesture === 'pinch') {
        gesture = 'rotate'
        orbit.spin = 0
        lastT = performance.now()
        return
      }
      if (pointers.size > 0) return

      const now = performance.now()
      const stale = now - lastT > 90 // finger rested before lifting: no fling
      if (gesture !== 'rotate' || stale) orbit.spin = 0
      if (gesture !== 'pan' || stale) orbit.panVel.set(0, 0, 0)
      orbit.dragging = false
      document.documentElement.classList.remove('is-grabbing')

      const wasTap = !moved && now - downT < 400
      const g = gesture
      gesture = null
      if (!wasTap) {
        lastTap.t = 0
        return
      }
      if (maxPointers >= 2) {
        zoomAt(downX, downY, el, 1.8) // two-finger tap: zoom out
        lastTap.t = 0
        return
      }
      if (g === 'tapzoom') {
        zoomAt(e.clientX, e.clientY, el, e.shiftKey ? 2 : 0.45) // a plain double-tap
        lastTap.t = 0
        return
      }
      const id = pick(e.clientX, e.clientY, e.pointerType === 'mouse' ? 10 : 30)
      if (id) {
        hoverState.set(null)
        useStore.getState().select(id)
        lastTap.t = 0
        return
      }
      if (e.pointerType === 'mouse' && now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 12) {
        zoomAt(e.clientX, e.clientY, el, e.shiftKey ? 2 : 0.45) // double-click
        lastTap.t = 0
        return
      }
      lastTap = { t: now, x: e.clientX, y: e.clientY }
    }

    const onWheel = (e) => {
      if (!active()) return
      e.preventDefault()
      orbit.travel = false
      orbit.idle = 0
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
      // a sideways trackpad swipe orbits; everything else zooms towards the cursor
      if (!e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2) {
        orbit.gTheta += e.deltaX * unit * 0.004
        return
      }
      const k = e.ctrlKey ? 0.01 : 0.0015 // trackpad pinch arrives as ctrl+wheel
      zoomAt(e.clientX, e.clientY, el, Math.exp(e.deltaY * unit * k))
    }
    const onLeave = () => hoverState.set(null)
    const onContext = (e) => {
      if (useStore.getState().mode === 'system') e.preventDefault()
    }
    // iOS Safari: stop the page itself from zooming during a pinch
    const onGesture = (e) => {
      if (useStore.getState().mode === 'system') e.preventDefault()
    }
    const onKey = (e) => {
      if (!active() || isTypingTarget(e.target)) return
      // WASD pans across the plane, relative to where you're looking
      const pan = (fx, fz) => {
        _tmp.copy(orbit.focus).sub(camera.position).setY(0).normalize()
        _tmp2.crossVectors(_tmp, WORLD_UP)
        orbit.gFocus.addScaledVector(_tmp, fz * orbit.gDist * 0.15).addScaledVector(_tmp2, fx * orbit.gDist * 0.15)
        clampFocus()
      }
      const actions = {
        ArrowLeft: () => (orbit.gTheta += 0.25),
        ArrowRight: () => (orbit.gTheta -= 0.25),
        ArrowUp: () => (orbit.gPhi = clamp(orbit.gPhi - 0.15, MIN_PHI, MAX_PHI)),
        ArrowDown: () => (orbit.gPhi = clamp(orbit.gPhi + 0.15, MIN_PHI, MAX_PHI)),
        w: () => pan(0, 1),
        s: () => pan(0, -1),
        a: () => pan(-1, 0),
        d: () => pan(1, 0),
        '+': () => systemApi.zoomBy(0.65),
        '=': () => systemApi.zoomBy(0.65),
        '-': () => systemApi.zoomBy(1.5),
        _: () => systemApi.zoomBy(1.5),
        0: () => systemApi.overview(),
      }
      const fn = actions[e.key.length === 1 ? e.key.toLowerCase() : e.key]
      if (fn && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        orbit.idle = 0
        orbit.travel = false
        fn()
      }
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('contextmenu', onContext)
    document.addEventListener('gesturestart', onGesture)
    window.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('contextmenu', onContext)
      document.removeEventListener('gesturestart', onGesture)
      window.removeEventListener('keydown', onKey)
    }
  }, [gl, camera])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const { mode, selected, progress, landed } = useStore.getState()
    const aspect = size.width / size.height
    orbit.aspect = aspect
    const mx = mouse ? mouse.x : 0
    const my = mouse ? mouse.y : 0
    _prev.copy(camera.position)
    let warp = 0

    // ---------- Mode / selection changes ----------
    if (mode !== modeRef.current) {
      modeRef.current = mode
      if (mode === 'system') {
        // arrive facing the system from the direction we're coming from
        orbit.focus.copy(sunWorldPos)
        orbit.gFocus.copy(sunWorldPos)
        orbit.gTheta = orbit.theta = Math.atan2(camera.position.x - sunWorldPos.x, camera.position.z - sunWorldPos.z)
        orbit.gPhi = orbit.phi = DEFAULT_PHI
        orbit.gDist = orbit.dist = fitDistance(aspect)
        orbit.travel = true
        orbit.idle = 0
      }
      chase.current.copy(camera.position)
    }
    if (selected !== selRef.current) {
      const tookOff = selRef.current && !selected
      selRef.current = selected
      landing.current.id = null
      if (tookOff && mode === 'system') {
        // back up to the whole-system view
        systemApi.overview()
        orbit.focus.copy(orbit.gFocus)
        orbit.dist = orbit.gDist
        orbit.gTheta = orbit.theta = Math.atan2(camera.position.x - sunWorldPos.x, camera.position.z - sunWorldPos.z)
        orbit.travel = true
        chase.current.copy(camera.position)
      }
    }

    if (mode === 'flight') {
      flightGoal(progress, _goal)
      _goal.x += mx * 2.5
      _goal.y += my * 2.5
      // returning from the system is a long flight: take it slower
      const far = camera.position.distanceTo(_goal) > 40
      const rate = far ? 1.3 : 3.2
      if (far) warp = 1
      chase.current.lerp(_goal, damp(rate, dt))
      camera.position.lerp(chase.current, damp(rate, dt))
      _e.set(my * 0.08, -mx * 0.08, 0, 'XYZ')
      _q.setFromEuler(_e)
      camera.quaternion.slerp(_q, damp(far ? 1.6 : 2.6, dt))
    } else if (selected) {
      warp = surfaceCamera(selected, dt, aspect, mx, my, landed) ? 1 : 0
    } else {
      // ---------- Orbiting the system ----------
      orbit.idle += dt
      if (!orbit.dragging) {
        if (Math.abs(orbit.spin) > 0.001) {
          orbit.gTheta += orbit.spin * dt
          orbit.spin *= Math.exp(-3 * dt)
        } else if (orbit.idle > 4) {
          orbit.gTheta += dt * 0.03 * Math.min(1, (orbit.idle - 4) / 3) // gentle idle drift
        }
      }
      if (!orbit.dragging && orbit.panVel.lengthSq() > 1e-4) {
        orbit.gFocus.addScaledVector(orbit.panVel, dt)
        orbit.panVel.multiplyScalar(Math.exp(-4 * dt))
        clampFocus()
      }
      const k = damp(9, dt)
      if (!orbit.dragging) {
        orbit.focus.lerp(orbit.gFocus, k)
        orbit.theta += (orbit.gTheta - orbit.theta) * k
        orbit.phi += (orbit.gPhi - orbit.phi) * k
      }
      orbit.dist = Math.exp(THREE.MathUtils.lerp(Math.log(orbit.dist), Math.log(orbit.gDist), damp(8, dt)))
      orbitPose(orbit.focus, orbit.dist, orbit.theta, orbit.phi, _goal)

      if (orbit.travel) {
        // long, eased flight in (second-order smoothing = gentle start and finish)
        chase.current.lerp(_goal, damp(1.5, dt))
        camera.position.lerp(chase.current, damp(1.5, dt))
        if (camera.position.distanceTo(_goal) < orbit.dist * 0.02 + 0.5) orbit.travel = false
        warp = 1
      } else {
        camera.position.lerp(_goal, orbit.dragging ? 1 : damp(14, dt))
        chase.current.copy(camera.position)
      }
      _m.lookAt(camera.position, orbit.focus, WORLD_UP)
      _q.setFromRotationMatrix(_m)
      camera.quaternion.slerp(_q, orbit.travel ? damp(2.2, dt) : 1)
    }

    // Speed → warp streaks (only during journeys, never while you're just orbiting)
    _vel.copy(camera.position).sub(_prev)
    const inst = _vel.length() / Math.max(dt, 1e-4)
    if (inst > 2) cameraMotion.dir.lerp(_vel.normalize(), damp(5, dt)).normalize()
    speedRef.current += (inst - speedRef.current) * damp(6, dt)
    cameraMotion.speed = speedRef.current
    cameraMotion.warp += (warp - cameraMotion.warp) * damp(4, dt)
  })

  // ---------- Landing ("surface") camera ----------
  // returns true while still travelling
  function surfaceCamera(id, dt, aspect, mx, my, landed) {
    const entry = bodyRegistry.get(id)
    if (!entry) return false
    entry.object.getWorldPosition(_c)
    const R = entry.radius
    const L = landing.current
    const isSun = id === 'core'

    if (L.id !== id) {
      // Always the same composition: touch down on the sun-lit side (24° from the equator by
      // default) and look away from the sun, over the planet's curve. Everything else in the
      // system lies in the orbital plane, which from there is below the horizon, so the sky
      // behind the text stays clear. A ringed world measures from its ring plane instead,
      // so its rings sit in the same place in the frame wherever it is in its orbit.
      L.id = id
      const portrait = aspect < 1
      const base = BODY_BY_ID[id]?.landing || {}
      // phones can override any value (narrower frame, so a steeper look and less turn)
      const spot = { ...base, ...(portrait ? base.mobile : null) }
      const lat = THREE.MathUtils.degToRad(spot.lat ?? 24)
      L.height = spot.height ?? (R < 1 ? 1.2 : 1.13)
      L.tilt = spot.tilt ?? (portrait ? 7 : 12)
      const pole = _pole.copy(WORLD_UP)
      if (BODY_BY_ID[id]?.ring) pole.applyAxisAngle(_zAxis, RING_TILT)
      // the sun's direction, flattened onto the equator / ring plane
      const sunDir = _tmp2.copy(sunWorldPos).sub(_c)
      sunDir.addScaledVector(pole, -sunDir.dot(pole))
      if (sunDir.lengthSq() < 1e-6) sunDir.set(0, 0, 1) // the star itself: face the journey
      sunDir.normalize()
      if (isSun) {
        L.u.set(0, 0, 1)
      } else {
        L.u.copy(sunDir).multiplyScalar(Math.cos(lat)).addScaledVector(pole, Math.sin(lat)).normalize()
      }
      // tangent pointing away from the sun (optionally turned sideways by `yaw`)
      L.t.copy(sunDir).negate().addScaledVector(L.u, Math.cos(lat)).normalize()
      if (spot.yaw) L.t.applyAxisAngle(L.u, THREE.MathUtils.degToRad(spot.yaw))
    }

    if (isSun) {
      // sit in the orbital plane beside the star and look up past it: the star rises from
      // the bottom of the frame and every planet stays on a line below the text
      _goal.copy(_c).addScaledVector(L.u, R * 4.0).addScaledVector(WORLD_UP, R * 0.3)
      _look.copy(_goal).addScaledVector(L.u, -10).addScaledVector(WORLD_UP, 10 * Math.tan(THREE.MathUtils.degToRad(aspect > 1 ? 22 : 16)))
      _look.addScaledVector(_tmp.crossVectors(L.u, WORLD_UP).normalize(), mx * 0.6)
      const w = smoothstep(R * 14, R * 5, camera.position.distanceTo(_c))
      _look.lerp(_c, 1 - w)
      _m.lookAt(camera.position, _look, WORLD_UP)
      _q.setFromRotationMatrix(_m)
    } else {
      _goal.copy(_c).addScaledVector(L.u, R * L.height)
      // look along the surface, tilted down so the horizon sits low in the frame
      const tilt = Math.tan(THREE.MathUtils.degToRad(L.tilt))
      const lookDir = _tmp.copy(L.t).addScaledVector(L.u, -tilt).normalize()
      _look.copy(_goal).addScaledVector(lookDir, 10)
      const right = _tmp2.crossVectors(lookDir, L.u).normalize()
      _look.addScaledVector(right, mx * 0.8).addScaledVector(L.u, my * 0.4)
      // keep the body centred while far away, swing to the horizon on final approach
      const w = smoothstep(R * 7, R * 1.2, camera.position.distanceTo(_goal))
      _up.copy(WORLD_UP).lerp(L.u, w).normalize()
      _look.lerp(_c, 1 - w)
      _m.lookAt(camera.position, _look, _up)
      _q.setFromRotationMatrix(_m)
    }

    // arc over the orbital plane on longer flights, so the path never cuts through other worlds
    const remaining = camera.position.distanceTo(_goal)
    _lift.copy(_goal).addScaledVector(WORLD_UP, Math.min(remaining * 0.35, 30))
    chase.current.lerp(_lift, damp(LAND_RATE, dt))
    camera.position.lerp(chase.current, damp(LAND_RATE, dt))
    // and never fly through anything
    bodyRegistry.forEach((e, cid) => {
      e.object.getWorldPosition(_tmp2)
      const min = e.radius * (cid === id ? (isSun ? 1.6 : 1.07) : cid === 'core' ? 1.7 : 1.5)
      if (camera.position.distanceTo(_tmp2) < min) camera.position.sub(_tmp2).setLength(min).add(_tmp2)
    })
    camera.quaternion.slerp(_q, damp(4.2, dt))

    // the story appears while the camera eases the last few metres (its fade-in hides the
    // settle), instead of waiting out the long exponential tail
    if (!landed && remaining < Math.max(R * 0.35, 0.25)) useStore.getState().setLanded(true)
    return remaining > R * 2
  }

  return null
}
