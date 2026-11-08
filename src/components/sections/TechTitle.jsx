import Eyebrow from './Eyebrow'

export default function TechTitle() {
  return (
    <div className="tech-title" style={{ '--accent': 'var(--w-stackara)' }}>
      <Eyebrow num="03" world="Stackara">The toolkit</Eyebrow>
      <h2 className="display">
        Tech I've built <em>with</em>
        <span className="animated-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
      </h2>
      <p className="tech-hint">Five constellations · thirty stars — keep flying</p>
    </div>
  )
}
