export default function Experience() {
  const experiences = [
    {
      period: '2026 – Present',
      role: 'AI Systems Associate',
      company: 'KodeZera',
      description: "Leading the redesign of the core dashboard and architecturally strong backend for AI powered chatbot. From user query to client's customized output generation."
    }
  ]

  return (
    <div className="experience-content" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <span className="section-label" style={{ display: 'block', textAlign: 'center' }}>Where I've worked</span>
      <h2 style={{ marginBottom: '3rem', textAlign: 'center', background: 'linear-gradient(135deg, #fff, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Experience.</h2>
      
      <div className="experience-cards" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {experiences.map((exp, i) => (
          <div key={i} className="experience-card" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '2.5rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'transform 0.3s ease, background 0.3s ease',
            cursor: 'default'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.transform = 'translateY(-5px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#fff' }}>{exp.role}</h3>
                <div style={{ color: '#22d3ee', fontSize: '1.1rem', fontWeight: 500, marginTop: '0.25rem' }}>{exp.company}</div>
              </div>
              <span style={{ 
                background: 'rgba(6, 182, 212, 0.2)', 
                color: '#67e8f9', 
                padding: '0.4rem 1rem', 
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                {exp.period}
              </span>
            </div>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, fontSize: '1.05rem' }}>
              {exp.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
