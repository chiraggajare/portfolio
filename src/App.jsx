import { lazy, Suspense, useEffect, useRef } from 'react'
import useScrollProgress from './hooks/useScrollProgress'
import useMousePosition from './hooks/useMousePosition'
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
import SystemOverlay from './components/system/SystemOverlay'
import { smoothstep } from './utils/math'

// three.js + the scene arrive in their own chunk, so the text paints first
const SpaceScene = lazy(() => import('./components/SpaceScene'))

// The journey: 13 stops. Empty ones are flyover space (the skills stream lives there).
const SECTIONS = [
  { component: Hero, id: 'hero' },
  { component: WavyName, id: 'name' },
  { component: ElevatorPitch, id: 'pitch' },
  { component: About, id: 'about' },
  { component: TechTitle, id: 'tech-title' },
  { component: null, id: 'tech-stack-2' },
  { component: null, id: 'tech-stack-3' },
  { component: null, id: 'tech-stack-4' },
  { component: null, id: 'tech-stack-5' },
  { component: Experience, id: 'experience' },
  { component: Projects, id: 'projects' },
  { component: WavyNameReverse, id: 'name-reverse' },
  { component: Contact, id: 'contact' },
]

function App() {
  const { activeSection, navigateTo, SECTION_COUNT } = useScrollProgress()
  const mouse = useMousePosition()
  const mode = useStore((state) => state.mode)

  // The scroll-journey UI fades out while the camera flies into the star system,
  // and on the way back it waits until the camera has flown home
  const prevMode = useRef(mode)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('system-mode', mode === 'system')
    if (prevMode.current === 'system' && mode === 'flight') {
      root.classList.add('returning')
      const t = setTimeout(() => root.classList.remove('returning'), 2600)
      prevMode.current = mode
      return () => clearTimeout(t)
    }
    prevMode.current = mode
  }, [mode])

  const wrapperRef = useRef(null)
  const sectionsRef = useRef([])
  const progressLineRef = useRef(null)
  const footerRef = useRef(null)
  const indicatorRef = useRef(null)

  const rafMouseRef = useRef(null)
  const currentMouseX = useRef(0)
  const currentMouseY = useRef(0)

  // Smooth mouse parallax on the sections wrapper using rAF instead of React re-renders
  useEffect(() => {
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
  }, [mouse])

  // Bypassing React renders entirely!
  // Subscribe to Zustand store for butter-smooth DOM updates
  useEffect(() => {
    const updateUI = (state) => {
      const progress = state.progress;
      const scrollIndex = progress * (SECTION_COUNT - 1);

      if (progressLineRef.current) {
        if (window.innerWidth <= 768) {
          progressLineRef.current.style.width = `${progress * 100}%`;
          progressLineRef.current.style.height = '100%';
        } else {
          progressLineRef.current.style.height = `${progress * 100}%`;
          progressLineRef.current.style.width = '100%';
        }
      }
      if (footerRef.current) {
        if (progress > 0.95) footerRef.current.classList.add('visible');
        else footerRef.current.classList.remove('visible');
      }
      if (indicatorRef.current) {
        if (progress > 0.005) indicatorRef.current.classList.add('hidden');
        else indicatorRef.current.classList.remove('hidden');
      }

      sectionsRef.current.forEach((el, i) => {
        if (!el) return;
        const id = SECTIONS[i].id;
        const dist = scrollIndex - i;

        if (Math.abs(dist) > 2) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.visibility = 'hidden';
          return;
        }

        const a = Math.abs(dist);
        const isActive = a < 0.5;
        const isTransitionText = id === 'name' || id === 'name-reverse';
        const isMobile = window.innerWidth < 768;

        // Hold full opacity while the section is "parked", then fade out decisively
        const opacity = isTransitionText
          ? 1 - smoothstep(0.35, 1.0, a)
          : 1 - smoothstep(0.1, 0.55, a);

        let scale = 1;
        let translateY = 0;

        if (isMobile) {
          // Clean, uncluttered slide transition for mobile
          scale = isTransitionText ? 1 : (dist > 0 ? 1 + dist * 0.12 : 1 - smoothstep(0, 1, a) * 0.08);
          translateY = -dist * 70;
        } else if (isTransitionText) {
          scale = 1;
        } else if (dist > 0) {
          // Already passed: accelerate towards & past the camera, like flying through it
          scale = 1 + dist * 0.5 + dist * dist * 2.6;
          translateY = dist * 18;
        } else {
          // Upcoming: emerge out of the deep
          scale = 1 - smoothstep(0, 1.2, a) * 0.38;
          translateY = -dist * 26;
        }

        el.style.opacity = opacity.toFixed(3);
        el.style.visibility = opacity > 0.002 ? 'visible' : 'hidden';
        el.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        // Children read --d to layer themselves at different depths (parallax stagger)
        el.style.setProperty('--d', Math.max(-1.5, Math.min(1.5, dist)).toFixed(3));
        el.style.pointerEvents = isActive ? 'auto' : 'none';
      });
    };

    const unsubscribe = useStore.subscribe(updateUI);

    // Use requestAnimationFrame to ensure the DOM refs are fully populated before painting
    requestAnimationFrame(() => {
      updateUI(useStore.getState());
    });

    const handleResize = () => {
      updateUI(useStore.getState());
    };
    window.addEventListener('resize', handleResize);

    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
    };
  }, [SECTION_COUNT]);

  // A section gets its own scroll box only if its content really doesn't fit the screen
  useEffect(() => {
    const measure = () => {
      sectionsRef.current.forEach((el) => {
        const box = el && el.querySelector(':scope > .section-content')
        if (!box) return
        box.classList.remove('scrolls')
        const content = box.firstElementChild
        // full-screen overlays (the wavy name) and empty spacer sections never scroll
        if (!content || getComputedStyle(content).position === 'absolute') return
        const cs = getComputedStyle(el)
        const avail = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
        // offsetHeight = the real layout height; ignores decorative overflow (orbits, glows,
        // drifting layers) that would otherwise make a section look taller than it is
        if (content.offsetHeight > avail + 4) box.classList.add('scrolls')
      })
    }
    const raf = requestAnimationFrame(measure)
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <>
      <Navbar activeSection={activeSection} navigateTo={navigateTo} />

      <Suspense fallback={null}>
        <SpaceScene mouse={mouse} />
      </Suspense>

      <div
        ref={wrapperRef}
        className="sections-wrapper"
      >
        {SECTIONS.map(({ component: Component, id }, i) => {
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
                {Component && <Component />}
              </div>
            </div>
          )
        })}
      </div>

      <FloatingSkillsHTML />

      <SystemOverlay navigateTo={navigateTo} />

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
        />
      </div>

      <div ref={footerRef} className="footer-text">
        Designed & built by Chirag Gajare · 2026
      </div>
    </>
  )
}

export default App
