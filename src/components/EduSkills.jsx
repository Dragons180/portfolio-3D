const UniLogo = () => (
  <svg viewBox="0 0 38 38" width="38" height="38">
    <rect width="38" height="38" rx="6" fill="#1a1a2e"/>
    <polygon points="19,10 32,16 19,22 6,16" fill="#fff"/>
    <rect x="15" y="22" width="8" height="8" rx="1" fill="#fff"/>
    <rect x="30" y="16" width="2" height="8" rx="1" fill="#fff"/>
    <circle cx="31" cy="25" r="2" fill="#FF6B1A"/>
  </svg>
)

const DevExpertLogo = () => (
  <svg viewBox="0 0 38 38" width="38" height="38">
    <rect width="38" height="38" rx="6" fill="#0d0d0d"/>
    <text x="19" y="22" textAnchor="middle" fontFamily="monospace" fontWeight="bold" fontSize="13" fill="#FF6B1A">DX</text>
    <circle cx="19" cy="30" r="2" fill="#FF6B1A" opacity="0.6"/>
  </svg>
)

export function EduSkills({ t, lang }) {
  const edu = [
    { y:'2026', ti:'AI Experts',                           pl:'DevExpert.io',        logo: DevExpertLogo },
    {
      y:'2015 — 2020',
      ti: lang === 'es' ? 'Grado en Ingeniería Informática' : 'B.Sc. in Computer Engineering',
      pl: lang === 'es' ? 'Universidad Autónoma de Madrid' : 'Universidad Autónoma de Madrid',
      logo: UniLogo,
    },
  ]

  const skills = lang === 'es' ? [
    { n:'Comunicación técnica',    l:5 },
    { n:'Code review crítico',     l:5 },
    { n:'Trabajo asíncrono',       l:5 },
    { n:'Importancia en la documentación', l:4 },
    { n:'Resolución de incidencias', l:5 },
    { n:'Arquitectura hexagonal',    l:5 },
    { n:'Domain-Driven Design (DDD)', l:5 },
    { n:'Prompting / Integración con IA', l:5 },
  ] : [
    { n:'Technical communication', l:5 },
    { n:'Critical code review',    l:5 },
    { n:'Async collaboration',     l:5 },
    { n:'Importance of documentation', l:4 },
    { n:'Incident response',        l:5 },
    { n:'Hexagonal architecture',    l:5 },
    { n:'Domain-Driven Design (DDD)', l:5 },
    { n:'Prompting / AI Integration', l:5 },
  ]

  return (
    <section id="edu">
      <div className="edu-skills">
        <div data-anim="reveal">
          <div className="es-num">{t.sec04}</div>
          <div className="es-title">{t.eduTitle}</div>
          <div style={{ marginTop: 32 }}>
            {edu.map((e, i) => (
              <div className="edu-item" key={i}>
                <div className="logo"><e.logo /></div>
                <div className="edu-body">
                  <div className="yr">{e.y}</div>
                  <div className="ti">{e.ti}</div>
                  <div className="pl">{e.pl}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div data-anim="reveal">
          <div className="es-num">// soft skills</div>
          <div className="es-title">{t.skillsTitle}</div>
          <div className="skills-log" style={{ marginTop: 32 }}>
            {skills.map((s, i) => (
              <div className="sl-line" key={i}>
                <span className="sl-ts">2026-05-03 10:23:45.{String(i * 22 + 1).padStart(3,'0')}</span>
                <span className="sl-lv sl-info">INFO</span>
                <span className="sl-dim"> 1 --- </span>
                <span className="sl-thread">[skill-loader]</span>
                <span className="sl-logger"> c.d.r.Skills </span>
                <span className="sl-dim">: </span>
                <span className="sl-msg">{s.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
