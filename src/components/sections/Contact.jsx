import { useState, useRef } from 'react'
import { Mail, Code2, Briefcase, Send, CheckCircle, AlertCircle } from 'lucide-react'
import emailjs from '@emailjs/browser'

export default function Contact() {
  const formRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return

    setStatus('sending')

    try {
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
    <div className="contact-content compact">
      <span className="section-label">Say hello</span>
      <h2>Let's connect.</h2>
      <p className="contact-sub">
        Have an opportunity or just want to say hi? I'd love to hear from you.
      </p>
      <div className="contact-links">
        <a href="mailto:chiraggajare72@gmail.com" className="contact-link cl-email">
          <Mail size={16} /> Email
        </a>
        <a href="https://github.com/chiraggajare" target="_blank" rel="noopener noreferrer" className="contact-link cl-github">
          <Code2 size={16} /> GitHub
        </a>
        <a href="https://www.linkedin.com/in/chiraggajare/" target="_blank" rel="noopener noreferrer" className="contact-link cl-linkedin">
          <Briefcase size={16} /> LinkedIn
        </a>
      </div>
      <form ref={formRef} className="contact-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Your name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Your email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea
            name="message"
            className="form-input form-textarea"
            placeholder="Hi Chirag, I'd love to chat about..."
            value={formData.message}
            onChange={handleChange}
            required
          />
        </div>
        <button
          type="submit"
          className={`form-submit ${status === 'sent' ? 'form-submit--success' : ''} ${status === 'error' ? 'form-submit--error' : ''}`}
          disabled={status === 'sending'}
        >
          {status === 'idle' && <><Send size={14} /> Send message</>}
          {status === 'sending' && <>Sending<span className="animated-dots"><span>.</span><span>.</span><span>.</span></span></>}
          {status === 'sent' && <><CheckCircle size={14} /> Sent! Thank you</>}
          {status === 'error' && <><AlertCircle size={14} /> Failed — try again</>}
        </button>
      </form>
    </div>
  )
}

