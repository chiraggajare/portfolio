export default function Projects() {
  return (
    <div>
      <span className="section-label">Things I've built</span>
      <h2 style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fff, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Projects.</h2>
      <div className="projects-grid">
        <div className="project-card">
          <div className="project-thumb thumb-violet"><span>🍃</span></div>
          <div className="project-info">
            <h3>PanchaKarma Setu</h3>
            <p>
              An Ayurvedic Detox Healthcare Platform for digitizing Ayurvedic
              treatments with a high-performance, responsive UI.
            </p>
            <div className="project-links">
              <a href="#" className="link-btn link-btn-primary">Live ↗</a>
              <a href="https://github.com/chiraggajare/PanchkarmaSetu" target="_blank" rel="noopener noreferrer" className="link-btn link-btn-ghost">GitHub</a>
            </div>
          </div>
        </div>

        <div className="project-card">
          <div className="project-thumb thumb-blue"><span>💻</span></div>
          <div className="project-info">
            <h3>LiveCodeX</h3>
            <p>
              A Real-Time Collaborative Code Editor where users can work and
              brainstorm on code-snippets together in personal virtual rooms!
            </p>
            <div className="project-links">
              <a href="#" className="link-btn link-btn-primary">Live ↗</a>
              <a href="https://github.com/chiraggajare/LiveCodeX" target="_blank" rel="noopener noreferrer" className="link-btn link-btn-ghost">GitHub</a>
            </div>
          </div>
        </div>

        <div className="project-card">
          <div className="project-thumb thumb-cyan"><span>🍫</span></div>
          <div className="project-info">
            <h3>Chocoholic</h3>
            <p>
              A chocolate gifting e-commerce website for selling premium and
              imported chocolates as gifts on your special occasions!
            </p>
            <div className="project-links">
              <a href="#" className="link-btn link-btn-primary">Live ↗</a>
              <a href="https://github.com/chiraggajare/chocoholic" target="_blank" rel="noopener noreferrer" className="link-btn link-btn-ghost">GitHub</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
