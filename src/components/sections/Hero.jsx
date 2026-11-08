import Eyebrow from './Eyebrow'

const ROLES = ['Developer', 'Innovator', 'Problem-Solver', 'Technologist']

export default function Hero() {
  return (
    <div className="hero">
      <div className="hero-text">
        <Eyebrow num="00">Origin — Pune, 18.52° N</Eyebrow>
        <h1 className="hero-name">
          <span className="hero-first">Chirag</span>
          <em className="hero-last">Gajare</em>
        </h1>
        <p className="hero-role">Full-stack engineer</p>
        <ul className="hero-roles" aria-label="Roles">
          {ROLES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <figure className="hero-portrait">
        <span className="hp-orbit hp-orbit--outer"><i className="hp-moon" /></span>
        <span className="hp-orbit hp-orbit--inner"><i className="hp-moon hp-moon--small" /></span>
        <span className="hp-frame">
          <img
            src="https://res.cloudinary.com/doqqc1ogd/image/upload/q_auto,f_auto,w_660/v1777907423/pic3_urqwob.png"
            alt="Chirag Gajare"
            width="330"
            height="330"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
        </span>
      </figure>
    </div>
  )
}
