import { useState, useEffect } from 'react'
import Orrery from './Orrery'
import { useStore } from '../store/useStore'

export default function Navbar({ activeSection, navigateTo }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navItems = [
    { name: 'Home', index: 0 },
    { name: 'Pitch', index: 2 },
    { name: 'About', index: 3 },
    { name: 'Skills', index: 4 },
    { name: 'Experience', index: 9 },
    { name: 'Projects', index: 10 },
    { name: 'Contact', index: 12 },
  ]

  const mode = useStore((s) => s.mode)
  const exitSystem = useStore((s) => s.exitSystem)
  const inSystem = mode === 'system'

  const handleNavClick = (index) => {
    setIsMenuOpen(false)
    // Leaving the star system flies the camera back onto the journey path
    if (useStore.getState().mode !== 'flight') exitSystem()
    navigateTo(index)
  }

  return (
    <nav className="navbar">
      <a
        className="nav-logo"
        onClick={() => handleNavClick(0)}
        style={{ cursor: 'pointer' }}
      >
        Chirag Gajare
      </a>

      <div className="nav-right">
      {/* Nav Links Dropdown */}
      <div className={`nav-links-container ${isMenuOpen ? 'open' : ''}`}>
        <ul className="nav-links">
          {navItems.slice(1).map(({ name, index }) => (
            <li key={name}>
              <a
                className={!inSystem && activeSection === index ? 'active' : ''}
                onClick={() => handleNavClick(index)}
              >
                {name}
              </a>
            </li>
          ))}
          <li>
            <a
              href="https://chiraggajare.github.io/resume/Chirag_Gajare.pdf"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
            >
              Resume
            </a>
          </li>
        </ul>
      </div>

      {/* The way into the star system */}
      <Orrery onActivate={() => setIsMenuOpen(false)} />

      {/* Hamburger Toggle Button */}
      <button 
        className={`mobile-menu-btn ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle navigation"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      </div>
    </nav>
  )
}
