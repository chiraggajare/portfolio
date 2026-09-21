import { useState } from 'react'

export default function Navbar({ activeSection, navigateTo }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { name: 'Home', index: 0 },
    { name: 'Pitch', index: 2 },
    { name: 'About', index: 3 },
    { name: 'Skills', index: 9 },
    { name: 'Experience', index: 10 },
    { name: 'Projects', index: 11 },
    { name: 'Contact', index: 13 },
  ]

  const handleNavClick = (index) => {
    setIsMenuOpen(false)
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

      {/* Nav Links Overlay */}
      <div className={`nav-links-container ${isMenuOpen ? 'open' : ''}`}>
        <ul className="nav-links">
          {navItems.slice(1).map(({ name, index }) => (
            <li key={name}>
              <a
                className={activeSection === index ? 'active' : ''}
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
    </nav>
  )
}
