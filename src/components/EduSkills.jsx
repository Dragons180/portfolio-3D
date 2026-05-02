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
      y:'2019',
      ti: lang === 'es' ? 'Grado en Ingeniería Informática' : 'B.Sc. in Computer Engineering',
      pl: lang === 'es' ? 'Universidad Autónoma de Madrid' : 'Universidad Autónoma de Madrid',
      logo: UniLogo,
    },
  ]

  const skills = lang === 'es' ? [
    { n:'Comunicación técnica',    l:5 },
    { n:'Code review crítico',     l:5 },
    { n:'Trabajo asíncrono',       l:5 },
    { n:'Documentación',           l:4 },
    { n:'Resolución de incidencias', l:5 },
  ] : [
    { n:'Technical communication', l:5 },
    { n:'Critical code review',    l:5 },
    { n:'Async collaboration',     l:5 },
    { n:'Documentation',           l:4 },
    { n:'Incident response',       l:5 },
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
          <div style={{ marginTop: 32 }}>
            {skills.map((s, i) => (
              <div className="skill-row" key={i}>
                <span>{s.n}</span>
                <div className="lvl" data-anim="skill-bar">
                  {[1,2,3,4,5].map(n => (
                    <span key={n} className={n <= s.l ? 'f' : ''}></span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
