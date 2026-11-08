import { useEffect, useMemo, useRef } from 'react'
import { useStore } from '../store/useStore'
import { SKILL_GROUPS } from './system/systemData'
import { mulberry32 } from '../utils/math'

// Skills scattered through space; scrolling zooms the camera past them.
// Same camera, range, timing and fade rules as the original fly-past (words stay
// crisp and readable, then slip past the screen); refinements: an even spread with
// no clumps or gaps, a tint per category, and a soft glow as each word approaches.

export default function FloatingSkillsHTML() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const itemRefs = useRef([])

  const items = useMemo(() => {
    const rand = mulberry32(31)
    const all = SKILL_GROUPS.flatMap((g) => g.items.map((s) => ({ text: s, tint: g.tint })))
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[all[i], all[j]] = [all[j], all[i]]
    }
    const n = all.length
    return all.map((s, i) => {
      // golden-angle spread so neighbours in depth never land in the same spot
      const a = i * 2.39996 + (rand() - 0.5) * 0.6
      const r = 15 + rand() * 40
      return {
        ...s,
        x: Math.cos(a) * r, // vw
        y: Math.sin(a) * r * 0.7, // vh
        z: 1000 + (i / n) * 5000 + (rand() - 0.5) * 120,
        scale: 0.8 + (i % 3) * 0.2,
      }
    })
  }, [])

  useEffect(() => {
    const update = (state) => {
      const scrollIndex = state.progress * 12
      const el = containerRef.current
      if (!el) return
      const visible = scrollIndex > 4.2 && scrollIndex < 8.5
      if (!visible) {
        if (el.style.display !== 'none') el.style.display = 'none'
        return
      }
      el.style.display = 'block'
      let o = 1
      if (scrollIndex < 4.8) o = (scrollIndex - 4.2) / 0.6
      else if (scrollIndex > 8.2) o = (8.5 - scrollIndex) / 0.3
      el.style.opacity = o.toFixed(3)

      const cam = Math.max(0, (scrollIndex - 3.5) * 1200)
      sceneRef.current.style.transform = `translateZ(${cam.toFixed(1)}px)`

      itemRefs.current.forEach((node, i) => {
        if (!node) return
        const d = items[i].z - cam
        let op = 1
        if (d > 3000) op = 0
        else if (d < 100) op = Math.max(0, d / 100)
        if (op <= 0) {
          if (node.style.display !== 'none') node.style.display = 'none'
          return
        }
        node.style.display = 'block'
        node.style.opacity = op.toFixed(3)
        node.style.setProperty('--glow', Math.max(0, Math.min(1, 1 - (d - 500) / 1500)).toFixed(2))
      })
    }
    const unsub = useStore.subscribe(update)
    update(useStore.getState())
    return unsub
  }, [items])

  return (
    <div ref={containerRef} className="floating-skills-container" style={{ display: 'none', opacity: 0 }} aria-hidden="true">
      <div ref={sceneRef} className="fsk-scene">
        {items.map((it, i) => (
          <div
            key={it.text}
            ref={(el) => (itemRefs.current[i] = el)}
            className="fsk-skill"
            style={{
              '--tint': it.tint,
              display: 'none',
              transform: `translate3d(calc(-50% + ${it.x.toFixed(2)}vw), calc(-50% + ${it.y.toFixed(2)}vh), -${it.z.toFixed(0)}px) scale(${it.scale})`,
            }}
          >
            {it.text}
          </div>
        ))}
      </div>
    </div>
  )
}
