import { useEffect, useState } from 'react'

const HOLD_MS = 1500 // fully visible (meanwhile the 3D universe loads and warms up)
const FADE_MS = 900 // then dissolves, and the first page fades in

const reveal = () => document.documentElement.classList.remove('welcoming')

// A see-through grey veil shown on every load. Only space shows behind it; the page itself
// (hidden by html.welcoming, set on <html> in index.html) fades in once the veil lifts.
export default function Welcome() {
  const [phase, setPhase] = useState('show') // 'show' | 'fade' | 'done'
  const [fontsReady, setFontsReady] = useState(false)

  // show the words only once their fonts have arrived (never longer than 1s), so they
  // don't appear in a fallback font and then jump
  useEffect(() => {
    let live = true
    const ready = () => live && setFontsReady(true)
    const fonts = document.fonts
    if (!fonts?.load) return ready()
    Promise.race([
      Promise.all([fonts.load('italic 400 1em "Instrument Serif"'), fonts.load('500 1em "Space Grotesk"')]),
      new Promise((r) => setTimeout(r, 1000)),
    ]).then(ready, ready)
    return () => {
      live = false
    }
  }, [])

  // runs once: both timers must survive the switch to the fade phase
  useEffect(() => {
    const fade = setTimeout(() => {
      setPhase('fade')
      reveal()
    }, HOLD_MS)
    const done = setTimeout(() => setPhase('done'), HOLD_MS + FADE_MS)
    return () => {
      clearTimeout(fade)
      clearTimeout(done)
    }
  }, [])

  if (phase === 'done') return null
  return (
    <div className={`welcome ${phase === 'fade' ? 'is-leaving' : ''}`} role="status" aria-live="polite">
      <div className={`welcome-inner ${fontsReady ? 'is-ready' : ''}`}>
        <h1 className="welcome-title">Welcome</h1>
        <p className="welcome-sub">Scroll to explore</p>
      </div>
    </div>
  )
}
