import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronUp, Plus, Minus, Maximize2, Hand } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { BODIES, BODY_BY_ID, TOUR_ORDER, SKILL_GROUPS, PROJECTS } from './systemData'
import { labelEls, hoverState, systemApi } from './bridge'
import { isTypingTarget } from '../../utils/math'

// ---------------------------------------------------------------------------
// What each world says when you land on it
// ---------------------------------------------------------------------------
function CoreInfo() {
  return (
    <>
      <p className="hud-lead">
        I'm a full-stack developer who loves crafting clean, performant, and delightful digital experiences — from
        APIs to pixel-perfect UIs, <em>all the way to the cloud.</em>
      </p>
      <p className="hud-inline">Developer <i>✦</i> Innovator <i>✦</i> Problem-Solver <i>✦</i> Technologist</p>
    </>
  )
}

function TerraInfo() {
  return (
    <>
      <p className="hud-lead">
        Code, coffee, <em>and curiosity.</em> I build products that people actually enjoy using.
      </p>
      <dl className="hud-figures">
        <div><dt>Years coding</dt><dd>4+</dd></div>
        <div><dt>Projects</dt><dd>10+</dd></div>
        <div><dt>Coffee</dt><dd>∞</dd></div>
        <div><dt>Based in</dt><dd>Pune, IN</dd></div>
      </dl>
      <p className="hud-text">
        I care deeply about clean code, thoughtful architecture, and the tiny details that make software feel great.
        Beyond code, I'm exploring ideas, tinkering with side projects, diving into system design, or chasing new
        adventures outdoors.
      </p>
    </>
  )
}

// One category at a time: tinted tabs (same colours as the skills fly-past) and the
// tools as clear, roomy chips, instead of 30 names in one dense block
const SKILL_TOTAL = SKILL_GROUPS.reduce((n, g) => n + g.items.length, 0)
function StackaraInfo() {
  const [cat, setCat] = useState(0)
  const group = SKILL_GROUPS[cat]
  return (
    <div className="hud-stack">
      <div className="stack-tabs" role="group" aria-label="Skill categories">
        {SKILL_GROUPS.map((g, i) => (
          <button
            key={g.title}
            className={`stack-tab ${i === cat ? 'is-on' : ''}`}
            style={{ '--t': g.tint }}
            aria-pressed={i === cat}
            onClick={(e) => {
              setCat(i)
              e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
            }}
          >
            <span className="st-dot" />
            {g.title}
            <small>{g.items.length}</small>
          </button>
        ))}
      </div>
      <ul key={cat} className="stack-items" style={{ '--t': group.tint }} aria-label={group.title}>
        {group.items.map((s, i) => (
          <li key={s} style={{ '--i': i }}>{s}</li>
        ))}
      </ul>
      <p className="stack-total">
        {SKILL_TOTAL} tools across {SKILL_GROUPS.length} categories
      </p>
    </div>
  )
}

function ForgeInfo({ goTo }) {
  return (
    <>
      <p className="hud-lead">The forge is where things get built. Each of its two moons is a project.</p>
      <div className="hud-projects">
        {['panchakarma', 'livecodex'].map((id) => {
          const p = PROJECTS[id]
          return (
            <button key={id} className="hud-project" onClick={() => goTo(id)}>
              <img src={p.logo} alt="" />
              <span>
                <strong>{p.title}</strong>
                <small>{p.description}</small>
                <em>Fly to this moon →</em>
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function ProjectInfo({ id }) {
  const p = PROJECTS[id]
  return (
    <>
      <img className="hud-logo" src={p.logo} alt={`${p.title} logo`} />
      <p className="hud-lead">{p.description}</p>
      <p className="hud-links">
        <a href={p.live} target="_blank" rel="noopener noreferrer">Visit live ↗</a>
        <a href={p.github} target="_blank" rel="noopener noreferrer">Source ↗</a>
      </p>
    </>
  )
}

function GlaciaInfo() {
  return (
    <>
      <p className="hud-kicker">2026 – Present</p>
      <p className="hud-lead">
        AI Systems Associate <em>at KodeZera</em>
      </p>
      <p className="hud-text">
        Leading the redesign of the core dashboard and architecturally strong backend for AI powered chatbot. From user
        query to client's customized output generation.
      </p>
    </>
  )
}

function BeaconInfo({ openContactForm }) {
  return (
    <>
      <p className="hud-lead">Have an opportunity or just want to say hi? This relay is always listening.</p>
      <p className="hud-links">
        <a href="mailto:chiraggajare72@gmail.com">Email →</a>
        <a href="https://github.com/chiraggajare" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        <a href="https://www.linkedin.com/in/chiraggajare/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        <button onClick={openContactForm}>Message form →</button>
      </p>
    </>
  )
}

const SUBTITLES = {
  core: 'Elevator pitch',
  terra: 'About me',
  stackara: "Tech I've built with",
  forge: 'Selected projects',
  panchakarma: 'Project',
  livecodex: 'Project',
  glacia: 'Experience',
  beacon: "Let's connect",
}

function Info({ id, goTo, openContactForm }) {
  switch (id) {
    case 'core': return <CoreInfo />
    case 'terra': return <TerraInfo />
    case 'stackara': return <StackaraInfo />
    case 'forge': return <ForgeInfo goTo={goTo} />
    case 'panchakarma':
    case 'livecodex': return <ProjectInfo id={id} />
    case 'glacia': return <GlaciaInfo />
    case 'beacon': return <BeaconInfo openContactForm={openContactForm} />
    default: return null
  }
}

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------
export default function SystemOverlay({ navigateTo }) {
  const mode = useStore((s) => s.mode)
  const selected = useStore((s) => s.selected)
  const landed = useStore((s) => s.landed)
  const select = useStore((s) => s.select)
  const exitSystem = useStore((s) => s.exitSystem)
  const active = mode === 'system'
  const [hintGone, setHintGone] = useState(false)
  const [help, setHelp] = useState(false)
  const hudRef = useRef(null)

  const goTo = (id) => {
    hoverState.set(null)
    setHintGone(true)
    select(id)
  }
  const hop = (dir) => {
    const i = TOUR_ORDER.indexOf(selected)
    goTo(TOUR_ORDER[(i + dir + TOUR_ORDER.length) % TOUR_ORDER.length])
  }
  const openContactForm = () => {
    exitSystem()
    navigateTo(12)
  }

  // the hint fades after the first interaction
  useEffect(() => {
    if (!active) return
    setHintGone(false)
    const gone = () => setTimeout(() => setHintGone(true), 1500)
    window.addEventListener('pointerdown', gone, { once: true })
    window.addEventListener('wheel', gone, { once: true })
    const t = setTimeout(() => setHintGone(true), 9000)
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', gone)
      window.removeEventListener('wheel', gone)
    }
  }, [active])

  // Keyboard: Esc takes off / leaves, ←/→ hop between worlds while landed
  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (isTypingTarget(e.target)) return
      const s = useStore.getState()
      if (e.key === 'Escape') {
        if (help) setHelp(false)
        else if (s.selected) select(null)
        else exitSystem()
      } else if (s.selected && e.key === 'ArrowRight') hop(1)
      else if (s.selected && e.key === 'ArrowLeft') hop(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (landed) hudRef.current?.focus({ preventScroll: true })
  }, [landed])

  const body = selected ? BODY_BY_ID[selected] : null
  const idx = selected ? TOUR_ORDER.indexOf(selected) : -1
  const prev = body ? BODY_BY_ID[TOUR_ORDER[(idx - 1 + TOUR_ORDER.length) % TOUR_ORDER.length]] : null
  const next = body ? BODY_BY_ID[TOUR_ORDER[(idx + 1) % TOUR_ORDER.length]] : null

  return (
    <div className={`system-overlay ${active ? 'is-active' : ''} ${selected ? 'is-landing' : ''} ${landed ? 'is-landed' : ''}`} aria-hidden={!active}>
      {/* Labels on the worlds — positioned every frame by SystemLabels in the canvas */}
      <div className="planet-labels">
        {/* not buttons: touches pass through to the canvas, whose picker treats a tap on
            a label as a tap on its world (keyboard users have the dock) */}
        {BODIES.map((b) => (
          <span
            key={b.id}
            ref={(el) => (el ? labelEls.set(b.id, el) : labelEls.delete(b.id))}
            className={`planet-label ${b.parent ? 'is-moon' : ''}`}
            style={{ '--c': b.color, opacity: 0 }}
            aria-hidden="true"
          >
            <span className="pl-name">{b.name}</span>
            <span className="pl-tag">{b.tag.split('·')[1]?.trim()}</span>
          </span>
        ))}
      </div>

      {/* Orbit view: title, hint, dock, controls */}
      <header className="sys-title">
        <p className="sys-kicker">You've arrived at</p>
        <h2>Nexoverse</h2>
        <p className="sys-tagline">A connected universe of ideas</p>
        <p className={`sys-hint ${hintGone ? 'is-gone' : ''}`}>
          <span className="hint-desktop">Drag to orbit · Scroll to zoom · Right-drag to move · Click a world to land</span>
          <span className="hint-touch">Drag to orbit · Pinch to zoom & turn · Tap a world to land</span>
        </p>
      </header>

      <nav className="sys-dock" aria-label="Worlds">
        {TOUR_ORDER.map((id) => {
          const b = BODY_BY_ID[id]
          return (
            <button
              key={id}
              className="dock-item"
              style={{ '--c': b.color }}
              onClick={() => goTo(id)}
              onMouseEnter={() => hoverState.set(id)}
              onMouseLeave={() => hoverState.set(null)}
              tabIndex={active && !selected ? 0 : -1}
            >
              <span className="dock-dot" />
              <span className="dock-name">{b.name}</span>
            </button>
          )
        })}
      </nav>

      <div className="sys-controls">
        <button onClick={() => systemApi.zoomBy(0.65)} aria-label="Zoom in" title="Zoom in"><Plus size={16} /></button>
        <button onClick={() => systemApi.zoomBy(1.5)} aria-label="Zoom out" title="Zoom out"><Minus size={16} /></button>
        <button onClick={() => systemApi.overview()} aria-label="See the whole system" title="See the whole system"><Maximize2 size={14} /></button>
        <button className={help ? 'is-on' : ''} onClick={() => setHelp((h) => !h)} aria-label="How to move around" aria-expanded={help} title="How to move around"><Hand size={15} /></button>
      </div>

      {/* Gesture guide, there whenever you need it (the first-visit hint fades) */}
      {help && !selected && (
        <div className="sys-help" role="dialog" aria-label="How to move around" onClick={() => setHelp(false)}>
          <dl className="hint-touch-block">
            <div><dt>Drag</dt><dd>Orbit around</dd></div>
            <div><dt>Pinch</dt><dd>Zoom, and twist to turn</dd></div>
            <div><dt>Two fingers</dt><dd>Move across the system</dd></div>
            <div><dt>Double-tap</dt><dd>Zoom in there · hold and drag to zoom</dd></div>
            <div><dt>Two-finger tap</dt><dd>Zoom out</dd></div>
            <div><dt>Tap a world</dt><dd>Land on it · pinch in to take off</dd></div>
          </dl>
          <dl className="hint-desktop-block">
            <div><dt>Drag</dt><dd>Orbit around</dd></div>
            <div><dt>Scroll / pinch</dt><dd>Zoom towards the cursor</dd></div>
            <div><dt>Right-drag · Shift-drag · WASD</dt><dd>Move across the system</dd></div>
            <div><dt>Double-click</dt><dd>Zoom in there (Shift: out)</dd></div>
            <div><dt>Arrow keys · + −</dt><dd>Orbit, tilt and zoom</dd></div>
            <div><dt>Click a world</dt><dd>Land · scroll out or Esc to take off</dd></div>
          </dl>
        </div>
      )}

      {/* Approach */}
      <div className={`landing-status ${selected && !landed ? 'is-visible' : ''}`} role="status" aria-live="polite">
        {body && !landed && (
          <>
            <span className="ls-dot" style={{ background: body.color }} />
            {selected === 'core' ? 'Approaching' : 'Descending to'} {body.name}
          </>
        )}
      </div>

      {/* Landed: the information floats in the sky above the planet */}
      {body && landed && (
        <section
          key={selected}
          ref={hudRef}
          tabIndex={-1}
          className="planet-hud"
          style={{ '--c': body.color }}
          aria-label={`${body.name} — ${SUBTITLES[selected]}`}
        >
          <p className="hud-eyebrow">
            <span>{String(idx + 1).padStart(2, '0')}</span> / {String(TOUR_ORDER.length).padStart(2, '0')} · {body.tag}
          </p>
          <h2 className="hud-title">{body.name}</h2>
          <p className="hud-sub">{SUBTITLES[selected]}</p>
          <div className="hud-body">
            <Info id={selected} goTo={goTo} openContactForm={openContactForm} />
          </div>
        </section>
      )}

      {body && landed && (
        <nav className="hud-nav" style={{ '--c': body.color }} aria-label="Travel">
          <button onClick={() => hop(-1)}>
            <ArrowLeft size={14} /> <span>{prev.name}</span>
          </button>
          <button className="hud-takeoff" onClick={() => select(null)}>
            <ChevronUp size={15} /> Take off
          </button>
          <button onClick={() => hop(1)}>
            <span>{next.name}</span> <ArrowRight size={14} />
          </button>
        </nav>
      )}
    </div>
  )
}
