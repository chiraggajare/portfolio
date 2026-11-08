import Eyebrow from './Eyebrow'
import { PROJECTS } from '../system/systemData'

// Same data as the Forge's two moons in the star system
const projects = Object.values(PROJECTS)

export default function Projects() {
  return (
    <div className="projects" style={{ '--accent': 'var(--w-forge)' }}>
      <div className="projects-head">
        <Eyebrow num="05" world="Forge">Things I've built</Eyebrow>
        <h2 className="display">
          Selected <em>projects.</em>
        </h2>
      </div>
      <ol className="project-list">
        {projects.map((p, i) => (
          <li className="project" key={p.title}>
            <span className="project-index">{String(i + 1).padStart(2, '0')}</span>
            <span className="project-logo">
              <img src={p.logo} alt={`${p.title} logo`} width="64" height="64" loading="lazy" decoding="async" />
            </span>
            <div className="project-body">
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <div className="project-links">
                <a href={p.live} target="_blank" rel="noopener noreferrer">Visit live <span aria-hidden="true">↗</span></a>
                <a href={p.github} target="_blank" rel="noopener noreferrer">Source <span aria-hidden="true">↗</span></a>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
