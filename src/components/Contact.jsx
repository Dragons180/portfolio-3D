import { useState } from 'react'

export function Contact({ t, lang }) {
  const [form, setForm]   = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle')

  const labels = lang === 'es'
    ? { name: 'nombre', email: 'email', message: 'mensaje', send: 'enviar', sending: 'enviando…', ok: '✓ mensaje enviado', error: '✗ algo salió mal, inténtalo de nuevo' }
    : { name: 'name',   email: 'email', message: 'message', send: 'send',   sending: 'sending…',  ok: '✓ message sent',   error: '✗ something went wrong, try again' }

  function set(k) {
    return e => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'ok' : 'error')
      if (res.ok) setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact">
      <div className="sec-head">
        <div className="sec-num">{t.sec05}</div>
        <h2 className="sec-title"><span style={{fontFamily:"'JetBrains Mono',monospace",color:'var(--accent)'}}>POST</span> /api/contact</h2>
      </div>

      <div className="contact">
        <div className="big" data-anim="reveal-big">{t.contactBig}</div>

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="cf-row">
            <label className="cf-label">{labels.name}</label>
            <input
              className="cf-input"
              type="text"
              value={form.name}
              onChange={set('name')}
              required
              autoComplete="name"
            />
          </div>
          <div className="cf-row">
            <label className="cf-label">{labels.email}</label>
            <input
              className="cf-input"
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
          </div>
          <div className="cf-row">
            <label className="cf-label">{labels.message}</label>
            <textarea
              className="cf-input cf-textarea"
              value={form.message}
              onChange={set('message')}
              required
              rows={5}
            />
          </div>

          <div className="cf-footer">
            {status === 'ok'    && <span className="cf-feedback ok">{labels.ok}</span>}
            {status === 'error' && <span className="cf-feedback err">{labels.error}</span>}
            <button
              className="cf-btn"
              type="submit"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? labels.sending : labels.send} →
            </button>
          </div>
        </form>
      </div>

      <footer>
        <span>© 2026 — david redondo</span>
        <div className="marquee">
          <div>
            {Array.from({ length: 2 }).flatMap(() => ['systems engineering','distributed by default','java · spring · docker','built in madrid','lat: 40.4168','lng: -3.7038','msgs/s: 42k','uptime: 99.97%']).map((x, i) => (
              <span key={i}>{x} ◆</span>
            ))}
          </div>
        </div>
        <span>last build · 04.30.2026</span>
      </footer>
    </section>
  )
}
