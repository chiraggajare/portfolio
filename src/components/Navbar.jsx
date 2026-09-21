export default function Navbar({ activeSection, navigateTo }) {
  const navItems = [
    { name: 'Home', index: 0 },
    { name: 'Pitch', index: 2 },
    { name: 'About', index: 3 },
    { name: 'Skills', index: 7 },
    { name: 'Experience', index: 8 },
    { name: 'Projects', index: 9 },
    { name: 'Contact', index: 11 },
  ]

  return (
    <nav className="navbar">
      <a
        className="nav-logo"
        onClick={() => navigateTo(0)}
        style={{ cursor: 'pointer' }}
      >
        Chirag Gajare
      </a>
      <ul className="nav-links">
        {navItems.slice(1).map(({ name, index }) => (
          <li key={name}>
            <a
              className={activeSection === index ? 'active' : ''}
              onClick={() => navigateTo(index)}
            >
              {name}
            </a>
          </li>
        ))}
        <li>
          <a
            href="https://chiraggajare.github.io/portfolio/Chirag_Gajare.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Resume
          </a>
        </li>
      </ul>
    </nav>
  )
}
