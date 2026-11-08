import Eyebrow from './Eyebrow'

export default function ElevatorPitch() {
  return (
    <div className="pitch" style={{ '--accent': 'var(--w-core)' }}>
      <Eyebrow num="01" world="Core">Elevator pitch</Eyebrow>
      <blockquote className="pitch-quote">
        <span className="pitch-mark" aria-hidden="true">“</span>
        I'm a <em>Full-stack developer</em> who loves crafting clean, performant, and delightful digital
        experiences — from APIs to pixel-perfect UIs, <em>all the way to the cloud.</em>
      </blockquote>
    </div>
  )
}
