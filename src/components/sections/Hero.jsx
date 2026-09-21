import { Sparkle } from 'lucide-react'

export default function Hero() {
  return (
    <div className="hero-layout">
      <div className="hero-content-wrapper">
        <div className="hero-left">
          <div className="hero-name-stack">
            <div className="name-outline">CHIRAG</div>
            <div className="name-solid">GAJARE</div>
          </div>
          <div className="hero-nickname">( FULL-STACK ENGINEER )</div>
          
          <ul className="hero-roles">
            <li>
              <span className="role-icon"><Sparkle size={18} strokeWidth={2.5} /></span> 
              Developer
            </li>
            <li>
              <span className="role-icon"><Sparkle size={18} strokeWidth={2.5} /></span> 
              Innovator
            </li>
            <li>
              <span className="role-icon"><Sparkle size={18} strokeWidth={2.5} /></span> 
              Problem-Solver
            </li>
            <li>
              <span className="role-icon"><Sparkle size={18} strokeWidth={2.5} /></span> 
              Technologist
            </li>
          </ul>

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
