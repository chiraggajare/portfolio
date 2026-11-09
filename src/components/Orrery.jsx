import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'

// The way into the star system: a tiny working orrery. Its planets are the same
// colours as the real worlds. Hover (or the first-visit tease) reveals the label;
// clicking it launches the flight into the system.
export default function Orrery({ onActivate }) {
  const mode = useStore((s) => s.mode)
  const progress = useStore((s) => (s.progress < 0.02 ? 0 : 1))
  const inside = mode === 'system'
  const [tease, setTease] = useState(false)

  // Introduce itself once, shortly after the page loads
  useEffect(() => {
    let seen = false
    try { seen = sessionStorage.getItem('orrery-tease') === '1' } catch { /* ignore */ }
    if (seen) return
    // wait until the welcome veil has lifted
    const wait = document.documentElement.classList.contains('welcoming') ? 2400 : 0
    const a = setTimeout(() => setTease(true), 1800 + wait)
    const b = setTimeout(() => {
      setTease(false)
      try { sessionStorage.setItem('orrery-tease', '1') } catch { /* ignore */ }
    }, 7500 + wait)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [])

  const activate = () => {
    setTease(false)
    const s = useStore.getState()
    if (s.mode === 'system') s.exitSystem()
    else s.enterSystem()
    onActivate?.()
  }

  return (
    <button
      className={`orrery ${inside ? 'is-inside' : ''} ${tease && !inside && progress === 0 ? 'is-teasing' : ''}`}
      onClick={activate}
      aria-label={inside ? 'Return to the journey' : 'Fly to Nexoverse'}
    >
      <span className="orrery-label">
        {inside ? (
          <>Return to the journey</>
        ) : (
          <>
            <em>Fly to</em> Nexoverse
          </>
        )}
      </span>
      <span className="orrery-dial" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <circle className="o-ring" cx="24" cy="24" r="9" />
          <circle className="o-ring" cx="24" cy="24" r="15" />
          <circle className="o-ring" cx="24" cy="24" r="21" />
          <circle className="o-sun" cx="24" cy="24" r="3.4" />
          <g className="o-orb o-orb-1"><circle cx="33" cy="24" r="1.9" fill="#7cc4ff" /></g>
          <g className="o-orb o-orb-2"><circle cx="24" cy="9" r="2.6" fill="#e8b07a" /></g>
          <g className="o-orb o-orb-3"><circle cx="3" cy="24" r="1.7" fill="#f78fc8" /></g>
        </svg>
        <span className="o-back">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </span>
    </button>
  )
}
