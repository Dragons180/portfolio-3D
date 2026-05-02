import { useForm, ValidationError } from '@formspree/react'

export function Contact({ t, lang }) {
  const [state, handleSubmit] = useForm('xrejepqn')

  const labels = lang === 'es'
    ? { name: 'nombre', email: 'email', message: 'mensaje', send: 'enviar', sending: 'enviando…', ok: '✓ mensaje enviado' }
    : { name: 'name',   email: 'email', message: 'message', send: 'send',   sending: 'sending…',  ok: '✓ message sent'   }

  return (
    <section id="contact">
      <div className="sec-head">
        <div className="sec-num">{t.sec05}</div>
        <h2 className="sec-title"><span style={{fontFamily:"'JetBrains Mono',monospace",color:'var(--accent)'}}>POST</span> /api/contact</h2>
      </div>

      <div className="contact">
        <div className="big" data-anim="reveal-big">{t.contactBig}</div>

        {state.succeeded ? (
          <p className="cf-feedback ok">{labels.ok}</p>
        ) : (
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="cf-row">
            <label className="cf-label">{labels.name}</label>
            <input
              className="cf-input"
              type="text"
              name="name"
              required
              autoComplete="name"
            />
            <ValidationError field="name" errors={state.errors} className="cf-feedback err" />
          </div>
          <div className="cf-row">
            <label className="cf-label">{labels.email}</label>
            <input
              className="cf-input"
              type="email"
              name="email"
              required
              autoComplete="email"
            />
            <ValidationError field="email" errors={state.errors} className="cf-feedback err" />
          </div>
          <div className="cf-row">
            <label className="cf-label">{labels.message}</label>
            <textarea
              className="cf-input cf-textarea"
              name="message"
              required
              rows={5}
            />
            <ValidationError field="message" errors={state.errors} className="cf-feedback err" />
          </div>

          <div className="cf-footer">
            <button
              className="cf-btn"
              type="submit"
              disabled={state.submitting}
            >
              {state.submitting ? labels.sending : labels.send} →
            </button>
          </div>
        </form>
        )}
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
