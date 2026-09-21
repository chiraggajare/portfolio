import { Monitor, Settings, Database, Wrench } from 'lucide-react'

export default function Skills() {
  return (
    <div>
      <span className="section-label">What I work with</span>
      <h2 style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fff, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Skills & Tools.</h2>
      <div className="skills-grid">
        <div className="skill-card">
          <div className="skill-card-icon" style={{ background: 'rgba(124,58,237,0.15)' }}><Monitor size={28} color="#a78bfa" /></div>
          <h3>Frontend</h3>
          <div className="skill-tags">
            <span className="tag tag-violet">React</span>
            <span className="tag tag-violet">Next.js</span>
            <span className="tag tag-violet">JavaScript</span>
            <span className="tag tag-violet">TypeScript</span>
            <span className="tag tag-violet">HTML/CSS</span>
          </div>
        </div>
        <div className="skill-card">
          <div className="skill-card-icon" style={{ background: 'rgba(6,182,212,0.15)' }}><Settings size={28} color="#22d3ee" /></div>
          <h3>Backend</h3>
          <div className="skill-tags">
            <span className="tag tag-cyan">Node.js</span>
            <span className="tag tag-cyan">Express</span>
            <span className="tag tag-cyan">Python</span>
            <span className="tag tag-cyan">REST APIs</span>
          </div>
        </div>
        <div className="skill-card">
          <div className="skill-card-icon" style={{ background: 'rgba(244,114,182,0.15)' }}><Database size={28} color="#f472b6" /></div>
          <h3>Database & Cloud</h3>
          <div className="skill-tags">
            <span className="tag tag-pink">MongoDB</span>
            <span className="tag tag-pink">PostgreSQL</span>
            <span className="tag tag-pink">Firebase</span>
            <span className="tag tag-pink">AWS</span>
          </div>
        </div>
        <div className="skill-card">
          <div className="skill-card-icon" style={{ background: 'rgba(59,130,246,0.15)' }}><Wrench size={28} color="#60a5fa" /></div>
          <h3>Tools & More</h3>
          <div className="skill-tags">
            <span className="tag tag-blue">Git</span>
            <span className="tag tag-blue">Docker</span>
            <span className="tag tag-blue">Linux</span>
            <span className="tag tag-blue">Three.js</span>
          </div>
        </div>
      </div>
    </div>
  )
}
