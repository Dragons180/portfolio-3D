export function TopBar({ lang, setLang, t }) {
  return (
    <nav className="topbar">
      <div className="row">
        <a href="#top" className="brand">
          <span className="dot"></span>
          <span>D.REDONDO</span>
          <span className="dim" style={{ marginLeft: 8 }}>// backend.eng</span>
        </a>
        <div className="links">
          <a href="#about">{t.navAbout}</a>
          <a href="#top" onClick={() => { window.__enterStack?.() }}>{t.navStack}</a>
          <a href="#work">{t.navWork}</a>
          <a href="#contact">{t.navContact}</a>
        </div>
        <div className="right">
          <span className="dim" style={{ fontSize: 10 }}>v.2026</span>
          <div className="lang">
            <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>es</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>en</button>
          </div>
        </div>
      </div>
    </nav>
  )
}