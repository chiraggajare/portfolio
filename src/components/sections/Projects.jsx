const projects = [
  {
    title: "PanchaKarma Setu",
    description:
      "An Ayurvedic Detox Healthcare Platform for digitizing Ayurvedic treatments with a high-performance, responsive UI.",
    logo: "/panchkarmasetu-logo.png",
    alt: "PanchaKarma Setu Logo",
    live: "https://panchkarmasetu.onrender.com/",
    github: "https://github.com/chiraggajare/PanchkarmaSetu",
  },
  {
    title: "LiveCodeX",
    description:
      "A Real-Time Collaborative Code Editor where users can work and brainstorm on code-snippets together in personal virtual rooms!",
    logo: "/livecodex-logo.png",
    alt: "LiveCodeX Logo",
    live: "https://livecodex-awlr.onrender.com/home",
    github: "https://github.com/chiraggajare/LiveCodeX",
  },
]

export default function Projects() {
  return (
    <div className="projects-redesign">
      <span className="section-label">Things I've built</span>
      <h2 className="projects-heading">Selected Projects.</h2>

      <div className="projects-grid">
        {projects.map((project) => (
          <article className="project-card" key={project.title}>
            <div className="concentric-rings">
              <div className="ring ring-1" />
              <div className="ring ring-2" />
              <div className="logo-center">
                <img src={project.logo} alt={project.alt} />
              </div>
            </div>

            <div className="project-details">
              <h3>{project.title}</h3>
              <p>{project.description}</p>

              <div className="project-links-row">
                <a
                  href={project.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-btn link-btn-primary"
                >

                  Live ↗
                </a>
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-btn link-btn-ghost"
                >
                  GitHub
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}