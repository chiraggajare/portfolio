import { useState, useEffect, useRef } from 'react'
import useScrollProgress from './hooks/useScrollProgress'
import useMousePosition from './hooks/useMousePosition'
import SpaceScene from './components/SpaceScene'
import Navbar from './components/Navbar'
import { useStore } from './store/useStore'

// Sections
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import ElevatorPitch from './components/sections/ElevatorPitch'
import WavyName from './components/sections/WavyName'
import TechTitle from './components/sections/TechTitle'
import Experience from './components/sections/Experience'
import WavyNameReverse from './components/sections/WavyNameReverse'
import Projects from './components/sections/Projects'
import Contact from './components/sections/Contact'
import FloatingSkillsHTML from './components/FloatingSkillsHTML'

function App() {
  const { activeSection, navigateTo, SECTION_COUNT } = useScrollProgress()
  const mouse = useMousePosition()
  const [mounted, setMounted] = useState(false)
  
  const wrapperRef = useRef(null)
  const sectionsRef = useRef([])
  const progressLineRef = useRef(null)
  const footerRef = useRef(null)
  const indicatorRef = useRef(null)
  
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

  const sections = [
    { component: Hero, id: 'hero' },
    { component: WavyName, id: 'name' },
    { component: ElevatorPitch, id: 'pitch' },
    { component: About, id: 'about' },
    { component: TechTitle, id: 'tech-title' },
    { component: () => null, id: 'tech-stack-2' },
    { component: () => null, id: 'tech-stack-3' },
    { component: () => null, id: 'tech-stack-4' },
    { component: () => null, id: 'tech-stack-5' },
    { component: Experience, id: 'experience' },
    { component: Projects, id: 'projects' },
    { component: WavyNameReverse, id: 'name-reverse' },
    { component: Contact, id: 'contact' },
  ]

  // Bypassing React renders entirely!
  // Subscribe to Zustand store for butter-smooth DOM updates
  useEffect(() => {
    const updateUI = (state) => {
      const progress = state.progress;
      const scrollIndex = progress * (SECTION_COUNT - 1);

      if (progressLineRef.current) {
        progressLineRef.current.style.height = `${progress * 100}%`;
      }
      if (footerRef.current) {
        if (progress > 0.95) footerRef.current.classList.add('visible');
        else footerRef.current.classList.remove('visible');
      }
      if (indicatorRef.current) {
        if (progress > 0.1) indicatorRef.current.classList.add('hidden');
        else indicatorRef.current.classList.remove('hidden');
      }

      sectionsRef.current.forEach((el, i) => {
        if (!el) return;
        const id = sections[i].id;
        const dist = scrollIndex - i;

        if (Math.abs(dist) > 2) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.visibility = 'hidden';
          return;
        }

        const isActive = Math.abs(dist) < 0.5;
        const isTransitionText = id === 'name' || id === 'name-reverse';
        const isMobile = window.innerWidth < 768;

        const opacity = isTransitionText
          ? Math.max(0, 1 - Math.abs(dist) * 1.2)
          : Math.max(0, 1 - Math.abs(dist) * 1.8);

        let scale = 1;
        let translateY = 0;

        if (isMobile) {
          // Clean, uncluttered slide transition for mobile
          scale = isTransitionText
            ? 1
            : (dist > 0 ? 1 + dist * 0.15 : 1 - Math.abs(dist) * 0.1);
          translateY = dist * 80;
        } else {
          // Immersive, deep 3D fly-through for desktop
          scale = isTransitionText
            ? 1
            : (dist > 0 ? 1 + dist * 2 : 1 - Math.abs(dist) * 0.4);
          translateY = dist * 20;
        }

        el.style.opacity = opacity.toString();
        el.style.visibility = 'visible';
        el.style.transform = `scale(${scale}) translateY(${translateY}px)`;
        // NOTE: filter: blur(...) has been removed for extreme performance optimization!
        el.style.pointerEvents = isActive ? 'auto' : 'none';
      });
    };

    if (!mounted) return;

    const unsubscribe = useStore.subscribe(updateUI);
    
    // Use requestAnimationFrame to ensure the DOM refs are fully populated before painting
    requestAnimationFrame(() => {
      updateUI(useStore.getState());
    });

    return () => unsubscribe();
  }, [SECTION_COUNT, mounted]);

  if (!mounted) return null



  return (
    <>
      <Navbar activeSection={activeSection} navigateTo={navigateTo} />

      <SpaceScene mouse={mouse} />

      <div
        ref={wrapperRef}
        className="sections-wrapper"
      >
        {sections.map(({ component: Component, id }, i) => {
          return (
            <div
              key={id}
              ref={el => sectionsRef.current[i] = el}
              className={`section ${i === activeSection ? 'active' : ''}`}
              style={{
                opacity: 0,
                visibility: 'hidden',
                willChange: 'transform, opacity'
              }}
            >
              <div className="section-content">
                <Component />
              </div>
            </div>
          )
        })}
      </div>

      <FloatingSkillsHTML />

      <div ref={indicatorRef} className="scroll-indicator">
        <div className="scroll-text">Scroll to venture</div>
        <div className="scroll-mouse">
          <div className="scroll-wheel" />
        </div>
      </div>

      <div className="progress-line-container">
        <div
          ref={progressLineRef}
          className="progress-line-fill"
          style={{ height: '0%' }}
        />
      </div>

      <div ref={footerRef} className="footer-text">
        Designed & built by Chirag Gajare · 2025 · Crafted with React & Three.js
      </div>
    </>
  )
}

export default App
