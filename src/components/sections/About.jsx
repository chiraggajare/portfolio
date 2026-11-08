import Eyebrow from './Eyebrow'

export default function About() {
  return (
    <div className="about" style={{ '--accent': 'var(--w-terra)' }}>
      <div className="about-head">
        <Eyebrow num="02" world="Haven">About me</Eyebrow>
        <h2 className="display">
          Code, coffee,
          <br />
          <em>and curiosity.</em>
        </h2>
        <p className="lede">
          I'm a full-stack developer with a passion for building products that people actually enjoy using.
        </p>
      </div>

      <div className="about-body">
        <p>
          I care deeply about clean code, thoughtful architecture, and the tiny details that make software feel great.
        </p>
        <p>
          Beyond code, I'm exploring ideas, tinkering with side projects, diving into system design, or chasing new
          adventures outdoors.
        </p>
      </div>

      <dl className="figures">
        <div className="figure">
          <dt>Years coding</dt>
          <dd>4<sup>+</sup></dd>
        </div>
        <div className="figure">
          <dt>Projects worked on</dt>
          <dd>10<sup>+</sup></dd>
        </div>
        <div className="figure">
          <dt>Cups of coffee</dt>
          <dd>
            <svg className="infinity-svg" viewBox="0 0 240 100" fill="none" role="img" aria-label="Infinity">
              <path className="infinity-track" d="M120 50C150 8 215 8 215 50S150 92 120 50C90 8 25 8 25 50S90 92 120 50Z" />
              <path className="infinity-runner" d="M120 50C150 8 215 8 215 50S150 92 120 50C90 8 25 8 25 50S90 92 120 50Z" pathLength="400" />
            </svg>
          </dd>
        </div>
        <div className="figure">
          <dt>Based in</dt>
          <dd>Pune, <em>IN</em></dd>
        </div>
      </dl>
    </div>
  )
}
