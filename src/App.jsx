import { useState, useEffect, useRef } from 'react'
import useScrollProgress from './hooks/useScrollProgress'
import useMousePosition from './hooks/useMousePosition'
import SpaceScene from './components/SpaceScene'
import Navbar from './components/Navbar'

// Sections
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import ElevatorPitch from './components/sections/ElevatorPitch'
import WavyName from './components/sections/WavyName'
import Skills from './components/sections/Skills'
import Experience from './components/sections/Experience'
import WavyNameReverse from './components/sections/WavyNameReverse'
import Projects from './components/sections/Projects'
import Contact from './components/sections/Contact'
import FloatingSkillsHTML from './components/FloatingSkillsHTML'

function App() {
  const { progress, activeSection, navigateTo, SECTION_COUNT } = useScrollProgress()
  const mouse = useMousePosition()
  const [mounted, setMounted] = useState(false)
  const wrapperRef = useRef(null)
  const rafMouseRef = useRef(null)
  const currentMouseX = useRef(0)
  const currentMouseY = useRef(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Smooth mouse parallax on the sections wrapper using rAF instead of React re-renders
  useEffect(() => {
    if (!mounted) return

    const animateParallax = () => {
      const targetX = mouse.x * -20
      const targetY = mouse.y * 20
      currentMouseX.current += (targetX - currentMouseX.current) * 0.08
      currentMouseY.current += (targetY - currentMouseY.current) * 0.08

      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translate(${currentMouseX.current}px, ${currentMouseY.current}px)`
      }
      rafMouseRef.current = requestAnimationFrame(animateParallax)
    }
    rafMouseRef.current = requestAnimationFrame(animateParallax)

    return () => {
      if (rafMouseRef.current) cancelAnimationFrame(rafMouseRef.current)
    }
  }, [mounted, mouse])

  if (!mounted) return null

  const sections = [
    { component: Hero, id: 'hero' },
    { component: WavyName, id: 'name' },
    { component: ElevatorPitch, id: 'pitch' },
    { component: About, id: 'about' },
    { component: () => null, id: 'tech-stack-1' },
    { component: () => null, id: 'tech-stack-2' },
    { component: () => null, id: 'tech-stack-3' },
    { component: Skills, id: 'skills' },
    { component: Experience, id: 'experience' },
    { component: Projects, id: 'projects' },
    { component: WavyNameReverse, id: 'name-reverse' },
    { component: Contact, id: 'contact' },
  ]

  const scrollIndex = progress * (SECTION_COUNT - 1)

  return (
    <>
      <Navbar activeSection={activeSection} navigateTo={navigateTo} />

      <SpaceScene progress={progress} mouse={mouse} />

      <div
        ref={wrapperRef}
        className="sections-wrapper"
      >
        {sections.map(({ component: Component, id }, i) => {
          const dist = scrollIndex - i

          // Only render if reasonably close to view
          if (Math.abs(dist) > 2) return null

          const isActive = Math.abs(dist) < 0.5

          // Zoom effect based on distance
          const scale = dist > 0 ? 1 + dist * 1.5 : 1 / (1 - dist * 0.5)
          const opacity = 1 - Math.abs(dist) * 1.2
          const translateY = dist * 20

          return (
            <div
              key={id}
              className={`section ${isActive ? 'active' : ''}`}
              style={{
                opacity: Math.max(0, opacity),
                transform: `scale(${scale}) translateY(${translateY}px)`,
                pointerEvents: isActive ? 'auto' : 'none'
              }}
            >
              <div className="section-content">
                <Component progress={progress} />
              </div>
            </div>
          )
        })}
      </div>

      <FloatingSkillsHTML progress={progress} />

      <div className={`scroll-indicator ${progress > 0.1 ? 'hidden' : ''}`}>
        <div className="scroll-text">Scroll to explore</div>
        <div className="scroll-mouse">
          <div className="scroll-wheel" />
        </div>
      </div>

      {/* Simplified passive linear progress line */}
      <div className="progress-line-container">
        <div 
          className="progress-line-fill" 
          style={{ height: `${progress * 100}%` }}
        />
      </div>

      <div className={`footer-text ${progress > 0.95 ? 'visible' : ''}`}>
        Designed & built by Chirag Gajare · 2025 · Crafted with React & Three.js
      </div>
    </>
  )
}

export default App
