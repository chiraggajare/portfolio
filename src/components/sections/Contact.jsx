import { useState, useRef } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import Eyebrow from './Eyebrow'
import { useStore } from '../../store/useStore'

export default function Contact() {
  const formRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [launching, setLaunching] = useState(false)

  // the rocket lifts off and the camera follows it straight away into the star system
  const launch = () => {
    if (launching) return
    setLaunching(true)
    setTimeout(() => useStore.getState().enterSystem(), 120)
    setTimeout(() => setLaunching(false), 2600)
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return

    setStatus('sending')

    try {
      // loaded only when someone actually sends a message
      const { default: emailjs } = await import('@emailjs/browser')
      await emailjs.send(
        'service_n1wt9t7',
        'template_sdcdnaz',
        {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          subject: 'This is from your portfolio website',
          title: 'This is from your portfolio website',
        },
        'iKPoNsEKZPY1GV6Ca'
      )
      setStatus('sent')
      setFormData({ name: '', email: '', message: '' })
      setTimeout(() => setStatus('idle'), 4000)
    } catch (err) {
      console.error('EmailJS error:', err)
      const subject = encodeURIComponent('This is from your portfolio website')
      const body = encodeURIComponent(`From: ${formData.name} (${formData.email})\n\n${formData.message}`)
      window.open(`mailto:chiraggajare72@gmail.com?subject=${subject}&body=${body}`, '_self')
      setStatus('idle')
    }
  }

  return (
    <div className="contact" style={{ '--accent': 'var(--w-beacon)' }}>
      <div className="contact-intro">
        <Eyebrow num="06" world="Beacon">Say hello</Eyebrow>
        <h2 className="display">
          Let's <em>connect.</em>
        </h2>
        <p className="lede">Have an opportunity or just want to say hi? I'd love to hear from you.</p>
        <ul className="contact-links">
          <li><a href="mailto:chiraggajare72@gmail.com"><span>Email</span><i aria-hidden="true">→</i></a></li>
          <li><a href="https://github.com/chiraggajare" target="_blank" rel="noopener noreferrer"><span>GitHub</span><i aria-hidden="true">↗</i></a></li>
          <li><a href="https://www.linkedin.com/in/chiraggajare/" target="_blank" rel="noopener noreferrer"><span>LinkedIn</span><i aria-hidden="true">↗</i></a></li>
        </ul>
      </div>

      <form ref={formRef} className="contact-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Your name</span>
          <input type="text" name="name" placeholder="Tony Stark" value={formData.name} onChange={handleChange} required />
        </label>
        <label className="field">
          <span>Your email</span>
          <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
        </label>
        <label className="field">
          <span>Message</span>
          <textarea name="message" placeholder="Hi Chirag, I'd love to chat about..." value={formData.message} onChange={handleChange} required />
        </label>
        <button
          type="submit"
          className={`send ${status === 'sent' ? 'is-sent' : ''} ${status === 'error' ? 'is-error' : ''}`}
          disabled={status === 'sending'}
        >
          {status === 'idle' && <>Send message <i aria-hidden="true">→</i></>}
          {status === 'sending' && <>Sending<span className="animated-dots"><span>.</span><span>.</span><span>.</span></span></>}
          {status === 'sent' && <><CheckCircle size={15} /> Sent — thank you</>}
          {status === 'error' && <><AlertCircle size={15} /> Failed — try again</>}
        </button>
      </form>

      {/* end of the journey: a little rocket that launches you into the star system */}
      <div className="launch-row">
        <button
          className={`launch ${launching ? 'is-launching' : ''}`}
          onClick={launch}
          aria-label="Launch to Nexoverse"
        >
          <span className="launch-craft" aria-hidden="true">
            <span className="launch-pad" />
            <svg className="launch-rocket" viewBox="0 0 40 84">
              <defs>
                <linearGradient id="rk-body" x1="0" x2="1">
                  <stop offset="0" stopColor="#cfc8bb" />
                  <stop offset="0.45" stopColor="#f6f2ea" />
                  <stop offset="1" stopColor="#a9a297" />
                </linearGradient>
                <linearGradient id="rk-flame" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff3c4" />
                  <stop offset="0.35" stopColor="#ffb347" />
                  <stop offset="1" stopColor="#ff4d1a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="rk-flame" d="M14.5 56 Q20 84 25.5 56 Z" fill="url(#rk-flame)" />
              <path d="M10 40 L3 58 Q3 60 5 59 L11 54 Z" fill="#f78fc8" />
              <path d="M30 40 L37 58 Q37 60 35 59 L29 54 Z" fill="#f78fc8" />
              <path d="M20 2 C27 9 30 18 30 28 L30 52 Q30 55 27 55 L13 55 Q10 55 10 52 L10 28 C10 18 13 9 20 2 Z" fill="url(#rk-body)" />
              <path d="M20 2 C24 6 26.5 10 27.8 15 L12.2 15 C13.5 10 16 6 20 2 Z" fill="#ffc46b" />
              <rect x="15" y="54" width="10" height="4" rx="1.2" fill="#6e6a63" />
              <circle cx="20" cy="29" r="5.2" fill="#1a1626" stroke="#ffc46b" strokeWidth="1.4" />
              <circle className="rk-light" cx="21.4" cy="27.6" r="1.6" fill="#9ad7ff" />
              <path d="M20 44 L20 52" stroke="#a9a297" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="launch-text">
            <small>Ready for lift-off</small>
            <strong>Launch to <em>Nexoverse!</em></strong>
          </span>
        </button>
      </div>
    </div>
  )
}
