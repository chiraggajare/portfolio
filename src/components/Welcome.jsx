import { useEffect, useRef, useState } from 'react'

const SEEN_KEY = 'nexo-welcomed'
const HOLD_MS = 2000 // fully visible (meanwhile the 3D universe loads and warms up)
const FADE_MS = 900 // then dissolves, and the first page fades in

// Browser storage can throw (private mode, blocked site data): treat that as a first visit
const seenBefore = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

const reveal = () => document.documentElement.classList.remove('welcoming')

// A soft, greyish veil of space shown once, on someone's very first visit. Only space shows
// behind it; the page itself (hidden by html.welcoming, set in index.html before first paint)
// fades in once the veil lifts.
export default function Welcome() {
  const [phase, setPhase] = useState(() => (seenBefore() ? 'done' : 'show'))
  const firstVisit = useRef(phase === 'show') // decided once, before we mark it as seen
  const [fontsReady, setFontsReady] = useState(false)

  // show the words only once their fonts have arrived (never longer than 1s), so they
  // don't appear in a fallback font and then jump
  useEffect(() => {
    if (!firstVisit.current) return
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
    if (!firstVisit.current) {
      reveal()
      return
    }
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* storage unavailable: it may show again next time, which is fine */
    }
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
