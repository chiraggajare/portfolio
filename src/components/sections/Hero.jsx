export default function Hero() {
  return (
    <div className="hero-layout">
      <div className="hero-content-wrapper">
        <div className="hero-left">
          <div className="hero-name-stack">
            <div className="name-outline">CHIRAG</div>
            <div className="name-solid">GAJARE</div>
          </div>
          <div className="hero-nickname">( FULL-STACK DEV )</div>
          
          <ul className="hero-roles">
            <li><span className="plus">✦</span> Product</li>
            <li><span className="plus">✦</span> Developer</li>
            <li><span className="plus">✦</span> Designer</li>
            <li><span className="plus">✦</span> Innovator</li>
          </ul>

          <div className="hero-ctas" style={{ justifyContent: 'flex-start', marginTop: '1.5rem' }}>
            <a href="https://github.com/chiraggajare" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              View my work →
            </a>
            <a href="mailto:chiraggajare72@gmail.com" className="btn btn-outline">
              Get in touch
            </a>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-photo-container">
            <div className="photo-ring" />
            <img
              className="hero-photo"
              src="https://res.cloudinary.com/doqqc1ogd/image/upload/q_auto/f_auto/v1777907423/pic3_urqwob.png"
              alt="Chirag Gajare"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
