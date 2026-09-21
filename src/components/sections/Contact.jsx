export default function Contact() {
  return (
    <div className="contact-content">
      <span className="section-label">Say hello</span>
      <h2>Let's build something<br />great together.</h2>
      <p className="contact-sub">
        Send me a message if you have an opportunity for me or even just a
        friendly hello. I love to talk about tech and coffee!
      </p>
      <div className="contact-email">chiraggajare72@gmail.com</div>
      <div className="contact-links">
        <a href="mailto:chiraggajare72@gmail.com" className="contact-link cl-email">
          ✉ Send email
        </a>
        <a href="https://github.com/chiraggajare" target="_blank" rel="noopener noreferrer" className="contact-link cl-github">
          ⌥ GitHub
        </a>
        <a href="https://www.linkedin.com/in/chiraggajare/" target="_blank" rel="noopener noreferrer" className="contact-link cl-linkedin">
          in LinkedIn
        </a>
      </div>
      <div className="contact-form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Your email</label>
            <input type="email" className="form-input" placeholder="you@example.com" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea className="form-input form-textarea" placeholder="Hi Chirag, I'd love to chat about..." />
        </div>
        <button className="form-submit">Send message →</button>
      </div>
    </div>
  )
}
