import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { isTypingTarget } from '../utils/math'

const SECTION_COUNT = 13
const SEGMENTS = SECTION_COUNT - 1
const SCROLL_SENSITIVITY = 0.0001

// Damping rates (per second). Frame-rate independent: the same feel at 60Hz and 120Hz.
const RATE_SCROLL = 2.6   // manual wheel / touch
const RATE_NAV = 3.6      // navbar / keyboard jumps
const RATE_SNAP = 1.6     // relaxed magnetic snap

// Checkpoints the scroll settles on — everything else is a flyover transition
const TRUE_SECTIONS = [0, 2, 3, 4, 9, 10, 12]

const nearestTrue = (segment) =>
  TRUE_SECTIONS.reduce((prev, curr) => (Math.abs(curr - segment) < Math.abs(prev - segment) ? curr : prev))

const isFlight = () => useStore.getState().mode === 'flight'

// If a section's content is taller than the screen (small phones, short laptops) it
// scrolls inside its own box first; the journey only continues once you reach its end.
const canScrollInside = (target, dy) => {
  const box = target && target.closest ? target.closest('.section-content.scrolls') : null
  if (!box || box.scrollHeight <= box.clientHeight + 2) return false
  if (dy > 0) return box.scrollTop + box.clientHeight < box.scrollHeight - 1
  if (dy < 0) return box.scrollTop > 0
  return false
}

export default function useScrollProgress() {
  const targetRef = useRef(0)
  const currentRef = useRef(0)
  const velocityRef = useRef(0)
  const rafRef = useRef(null)
  const modeRef = useRef('scroll') // 'scroll' | 'nav' | 'snap'
  const [activeSection, setActiveSection] = useState(0)
  const lastActiveSectionRef = useRef(0)

  const navigateTo = useCallback((sectionIndex) => {
    targetRef.current = Math.max(0, Math.min(1, sectionIndex / SEGMENTS))
    modeRef.current = 'nav'
  }, [])

  useEffect(() => {
    let interactionTimeout = null

    const scheduleSnap = () => {
      clearTimeout(interactionTimeout)
      interactionTimeout = setTimeout(() => {
        targetRef.current = nearestTrue(targetRef.current * SEGMENTS) / SEGMENTS
        modeRef.current = 'snap'
      }, 900) // settle onto the nearest checkpoint shortly after scrolling stops
    }

    const nudge = (delta) => {
      modeRef.current = 'scroll'
      targetRef.current = Math.max(0, Math.min(1, targetRef.current + delta))
      scheduleSnap()
    }

    const handleWheel = (e) => {
      // In star-system mode the wheel zooms the camera / scrolls panels instead
      if (!isFlight()) return
      if (canScrollInside(e.target, e.deltaY)) return // let the section's own content scroll
      e.preventDefault()
      // Normalise line/page delta modes (Firefox) to pixels
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1
      nudge(e.deltaY * unit * SCROLL_SENSITIVITY)
    }

    // Touch support
    let touchStartY = 0
    const handleTouchStart = (e) => {
      if (!isFlight()) return
      touchStartY = e.touches[0].clientY
      clearTimeout(interactionTimeout)
    }
    const handleTouchMove = (e) => {
      if (!isFlight()) return
      const touchY = e.touches[0].clientY
      const dy = touchStartY - touchY
      if (isTypingTarget(e.target) || canScrollInside(e.target, dy)) {
        touchStartY = touchY // native scrolling inside the section
        return
      }
      e.preventDefault()
      nudge(dy * 0.0008)
      touchStartY = touchY
    }
    const handleTouchEnd = () => {
      if (isFlight()) scheduleSnap()
    }

    // Keyboard: hop between checkpoints
    const handleKey = (e) => {
      if (!isFlight() || isTypingTarget(document.activeElement)) return
      const seg = Math.round(targetRef.current * SEGMENTS * 100) / 100
      let next = null
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) next = TRUE_SECTIONS.find((s) => s > seg + 0.01)
      else if (['ArrowUp', 'PageUp'].includes(e.key)) next = [...TRUE_SECTIONS].reverse().find((s) => s < seg - 0.01)
      else if (e.key === 'Home') next = 0
      else if (e.key === 'End') next = SEGMENTS
      if (next === null || next === undefined) return
      e.preventDefault()
      clearTimeout(interactionTimeout)
      navigateTo(next)
    }

    let last = performance.now()
    const animate = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const rate = modeRef.current === 'nav' ? RATE_NAV : modeRef.current === 'snap' ? RATE_SNAP : RATE_SCROLL
      const diff = targetRef.current - currentRef.current
      const step = diff * (1 - Math.exp(-rate * dt))
      currentRef.current += step

      const instVel = dt > 0 ? step / dt : 0
      velocityRef.current += (instVel - velocityRef.current) * (1 - Math.exp(-8 * dt))

      if (Math.abs(diff) < 0.00005) {
        currentRef.current = targetRef.current
        modeRef.current = 'scroll'
      }

      if (Math.abs(diff) > 0.000001 || Math.abs(velocityRef.current) > 0.0001) {
        if (Math.abs(diff) <= 0.000001) velocityRef.current = 0
        useStore.getState().setProgress(currentRef.current, velocityRef.current)

        let nearest = nearestTrue(currentRef.current * SEGMENTS)
        if (nearest !== lastActiveSectionRef.current) {
          lastActiveSectionRef.current = nearest
          setActiveSection(nearest)
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('keydown', handleKey)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKey)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      clearTimeout(interactionTimeout)
    }
  }, [navigateTo])

  return { activeSection, navigateTo, SECTION_COUNT }
}
