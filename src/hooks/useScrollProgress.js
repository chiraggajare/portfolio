import { useState, useEffect, useRef, useCallback } from 'react'

const SECTION_COUNT = 12
const LERP_FACTOR = 0.025 // Slower, more buttery manual scroll
const SCROLL_SENSITIVITY = 0.00010

export default function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  const targetRef = useRef(0)
  const currentRef = useRef(0)
  const rafRef = useRef(null)
  const isNavigatingRef = useRef(false)
  const [activeSection, setActiveSection] = useState(0)
  const lastSetProgressRef = useRef(0)
  const lastActiveSectionRef = useRef(0)

  // Only these sections will magnetically snap. The rest are completely free-scroll.
  const TRUE_SECTIONS = [0, 2, 3, 7, 8, 9, 11];

  const navigateTo = useCallback((sectionIndex) => {
    targetRef.current = Math.max(0, Math.min(1, sectionIndex / (SECTION_COUNT - 1)))
    isNavigatingRef.current = true
  }, [])

  useEffect(() => {
    document.body.style.height = `${SECTION_COUNT * 100}vh`

    let interactionTimeout = null;

    const handleInteractionEnd = () => {
      clearTimeout(interactionTimeout);
      interactionTimeout = setTimeout(() => {
        const segments = SECTION_COUNT - 1;
        const currentSegment = targetRef.current * segments;
        
        // Find the absolute nearest TRUE section
        const nearestTrueSection = TRUE_SECTIONS.reduce((prev, curr) => {
          return (Math.abs(curr - currentSegment) < Math.abs(prev - currentSegment) ? curr : prev);
        });

        const distanceToTrue = Math.abs(currentSegment - nearestTrueSection);
        
        // Only gently snap if we are within 0.4 of a true section
        if (distanceToTrue > 0 && distanceToTrue < 0.4) {
          targetRef.current = nearestTrueSection / segments;
        }
      }, 400);
    };

    const handleWheel = (e) => {
      e.preventDefault()
      isNavigatingRef.current = false
      const delta = e.deltaY * SCROLL_SENSITIVITY
      targetRef.current = Math.max(0, Math.min(1, targetRef.current + delta))
      handleInteractionEnd()
    }

    // Touch support
    let touchStartY = 0
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }
    const handleTouchMove = (e) => {
      e.preventDefault()
      const touchY = e.touches[0].clientY
      const delta = (touchStartY - touchY) * 0.003
      targetRef.current = Math.max(0, Math.min(1, targetRef.current + delta))
      touchStartY = touchY
      handleInteractionEnd()
    }

    const animate = () => {
      const diff = targetRef.current - currentRef.current
      
      // Buttery smooth, slow cinematic movement when clicking navbar
      // Normal responsive movement when scrolling manually
      const lerp = isNavigatingRef.current ? 0.01 : LERP_FACTOR
      
      currentRef.current += diff * lerp
      
      // Snap when very close and hand back control
      if (Math.abs(diff) < 0.0001) {
        currentRef.current = targetRef.current
        isNavigatingRef.current = false
      }
      
      // Only trigger React state if there is actual movement, but don't aggressively throttle it
      // so we keep perfect 60fps for the HTML section scaling
      if (Math.abs(diff) > 0.000001) {
        setProgress(currentRef.current)
        
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
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const sectionProgress = progress * (SECTION_COUNT - 1)

  return { progress, activeSection, sectionProgress, navigateTo, SECTION_COUNT }
}
