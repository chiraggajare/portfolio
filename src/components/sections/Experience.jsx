import Eyebrow from './Eyebrow'

const experiences = [
  {
    period: '2026 – Present',
    role: 'AI Systems Associate',
    company: 'KodeZera',
    description:
      "Leading the redesign of the core dashboard and architecturally strong backend for AI powered chatbot. From user query to client's customized output generation.",
  },
]

export default function Experience() {
  return (
    <div className="experience" style={{ '--accent': 'var(--w-glacia)' }}>
      <div className="experience-head">
        <Eyebrow num="04" world="Glacia">Where I've worked</Eyebrow>
        <h2 className="display">Experience<em>.</em></h2>
      </div>
      <ol className="log">
        {experiences.map((exp) => (
          <li className="log-entry" key={exp.role}>
            <p className="log-when">
              <span className="log-dot" aria-hidden="true" />
              {exp.period}
            </p>
            <div className="log-what">
              <h3>{exp.role}</h3>
              <p className="log-org">{exp.company}</p>
              <p className="log-desc">{exp.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
