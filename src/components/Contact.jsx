export function Contact({ t }) {
  return (
    <section id="contact">
      <div className="sec-head">
        <div className="sec-num">{t.sec05}</div>
        <h2 className="sec-title">// {t.navContact}</h2>
      </div>
      <div className="contact">
        <div className="big" data-anim="reveal">{t.contactBig}</div>
        <div className="links">
          <a href="mailto:hello@davidredondo.dev"><span>hello@davidredondo.dev</span><span className="arr">→ email</span></a>
          <a href="https://github.com/" target="_blank" rel="noopener"><span>github.com/davidredondo</span><span className="arr">→ github</span></a>
          <a href="https://linkedin.com/" target="_blank" rel="noopener"><span>linkedin.com/in/davidredondo</span><span className="arr">→ linkedin</span></a>
          <a href="#"><span>+34 600 000 000</span><span className="arr">→ phone</span></a>
        </div>
      </div>

      <div className="cv-band">
        <a href="#">
          <div>
            <div className="lab">// {t.cvLab}</div>
            <div className="ti">{t.cvTi} ↓</div>
          </div>
          <div className="arrow">↘</div>
        </a>
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