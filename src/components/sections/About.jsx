export default function About() {
  return (
    <div className="about-redesign">
      <span className="section-label">About me</span>
      <h2 className="about-heading">
        Code, coffee,<br />and curiosity.
      </h2>
      <p className="about-subtitle">
        I'm a full-stack developer with a passion<br />
        for building products that people<br />
        actually enjoy using.
      </p>

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-label stat-label--purple">Years coding</div>
          <div className="stat-value stat-value--white">4+</div>
        </div>
        <div className="stat-item">
          <div className="stat-label stat-label--purple">Projects worked on</div>
          <div className="stat-value stat-value--white">10+</div>
        </div>
        <div className="stat-item stat-item--wide">
          <div className="stat-label stat-label--pink">Cups of coffee</div>
          <div className="stat-value stat-value--infinity">
            <svg
              className="infinity-svg"
              viewBox="0 0 240 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Infinity"
            >
              {/* Ghost track */}
              <path
                className="infinity-track"
                d="M120 50C150 8 215 8 215 50S150 92 120 50C90 8 25 8 25 50S90 92 120 50Z"
                strokeWidth="13"
                strokeLinecap="round"
                fill="none"
              />
              {/* Animated foreground segment */}
              <path
                className="infinity-runner"
                d="M120 50C150 8 215 8 215 50S150 92 120 50C90 8 25 8 25 50S90 92 120 50Z"
                pathLength="400"
                strokeWidth="13"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label stat-label--purple">Based in</div>
          <div className="stat-value stat-value--white">Pune, IN</div>
        </div>
      </div>

      <div className="about-divider" />

      <div className="about-paragraphs">
        <p>
          I care deeply about clean code, thoughtful architecture,
          and the tiny details that make software feel great.
        </p>
        <p>
          Beyond code, I'm exploring ideas, tinkering with side
          projects, diving into system design, or chasing new
          adventures outdoors.
        </p>
      </div>
    </div>
  )
}
