export default function About() {
  return (
    <div className="about-grid">
      <div className="about-text">
        <span className="section-label">About me</span>
        <h2>Code, coffee,<br />and curiosity.</h2>
        <p>
          I'm a full-stack developer with a passion for building products that
          people actually enjoy using. I care deeply about clean code,
          thoughtful architecture, and the tiny details that make software feel great.
        </p>
        <p>
          When I'm not writing code, you'll find me tinkering with side
          projects, reading about systems design, or exploring the outdoors.
        </p>
        <a href="mailto:chiraggajare72@gmail.com" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Let's work together →
        </a>
      </div>
      <div className="fun-facts-grid">
        <div className="fun-fact ff-violet">
          <div className="label">Years coding</div>
          <div className="value">4+</div>
        </div>
        <div className="fun-fact ff-cyan">
          <div className="label">Projects worked on</div>
          <div className="value">10+</div>
        </div>
        <div className="fun-fact ff-pink">
          <div className="label">Cups of coffee</div>
          <div className="value">∞</div>
        </div>
        <div className="fun-fact ff-blue">
          <div className="label">Based in</div>
          <div className="value" style={{ fontSize: '1.1rem' }}>Pune, IN</div>
        </div>
      </div>
    </div>
  )
}
