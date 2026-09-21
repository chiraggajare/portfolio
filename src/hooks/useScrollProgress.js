import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'

const SECTION_COUNT = 14
const LERP_FACTOR = 0.04 // Smoother manual scroll interpolation
const SCROLL_SENSITIVITY = 0.00010

export default function useScrollProgress() {
  const targetRef = useRef(0)
  const currentRef = useRef(0)
  const rafRef = useRef(null)
  const isNavigatingRef = useRef(false)
  const isSnappingRef = useRef(false)
  const [activeSection, setActiveSection] = useState(0)
  const lastActiveSectionRef = useRef(0)

  // Only these 7 sections are checkpoints — everything else is a flyover transition
  const TRUE_SECTIONS = [0, 2, 3, 9, 10, 11, 13];

  const navigateTo = useCallback((sectionIndex) => {
    targetRef.current = Math.max(0, Math.min(1, sectionIndex / (SECTION_COUNT - 1)))
    isNavigatingRef.current = true
    isSnappingRef.current = false
  }, [])

  useEffect(() => {
    document.body.style.height = `${SECTION_COUNT * 100}vh`

    let interactionTimeout = null;

    const handleInteractionEnd = () => {
      clearTimeout(interactionTimeout);
      interactionTimeout = setTimeout(() => {
        const segments = SECTION_COUNT - 1;
        const currentSegment = targetRef.current * segments;
        
        // Always snap to the absolute nearest TRUE section checkpoint
        const nearestTrueSection = TRUE_SECTIONS.reduce((prev, curr) => {
          return (Math.abs(curr - currentSegment) < Math.abs(prev - currentSegment) ? curr : prev);
        });

        targetRef.current = nearestTrueSection / segments;
        isSnappingRef.current = true;
      }, 1250); // Wait 1.25 seconds after scroll comes to a complete stop
    };

    const handleWheel = (e) => {
      e.preventDefault()
      isNavigatingRef.current = false
      isSnappingRef.current = false
      clearTimeout(interactionTimeout)
      const delta = e.deltaY * SCROLL_SENSITIVITY
      targetRef.current = Math.max(0, Math.min(1, targetRef.current + delta))
      handleInteractionEnd()
    }

    // Touch support
    let touchStartY = 0
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
      isSnappingRef.current = false
      clearTimeout(interactionTimeout)
    }
    const handleTouchMove = (e) => {
      e.preventDefault()
      isNavigatingRef.current = false
      const touchY = e.touches[0].clientY
      const delta = (touchStartY - touchY) * 0.0008 // Reduced from 0.003 to require multiple swipes on mobile
      targetRef.current = Math.max(0, Math.min(1, targetRef.current + delta))
      touchStartY = touchY
    }
    const handleTouchEnd = () => {
      handleInteractionEnd()
    }

    const animate = () => {
      const diff = targetRef.current - currentRef.current
      
      // Navbar click: fast and responsive jump (0.06)
      // Magnetic snap: gentle relaxed glide (0.025)
      // Manual scroll: responsive (0.04)
      let lerp = LERP_FACTOR
      if (isNavigatingRef.current) lerp = 0.06
      else if (isSnappingRef.current) lerp = 0.025
      
      currentRef.current += diff * lerp
      
      // Snap when very close and hand back control
      if (Math.abs(diff) < 0.0001) {
        currentRef.current = targetRef.current
        isNavigatingRef.current = false
        isSnappingRef.current = false
      }
      
      // Only trigger updates if there is actual movement
      if (Math.abs(diff) > 0.000001) {
        useStore.getState().setProgress(currentRef.current)
        
        const currentSegment = currentRef.current * (SECTION_COUNT - 1)
        const nearestTrueSection = TRUE_SECTIONS.reduce((prev, curr) => {
          return (Math.abs(curr - currentSegment) < Math.abs(prev - currentSegment) ? curr : prev);
        });
        if (nearestTrueSection !== lastActiveSectionRef.current) {
          lastActiveSectionRef.current = nearestTrueSection
          setActiveSection(nearestTrueSection)
        }
      }
      
      rafRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      clearTimeout(interactionTimeout)
    }
  }, [])

  return { activeSection, navigateTo, SECTION_COUNT }
}
