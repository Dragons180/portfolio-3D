export function EduSkills({ t, lang }) {
  const edu = lang === 'es' ? [
    { y:'2024', ti:'AWS Certified Developer — Associate', pl:'Amazon Web Services' },
    { y:'2022', ti:'Spring Professional Certification',   pl:'VMware Tanzu' },
    { y:'2019', ti:'Grado en Ingeniería Informática',     pl:'Universidad' },
  ] : [
    { y:'2024', ti:'AWS Certified Developer — Associate', pl:'Amazon Web Services' },
    { y:'2022', ti:'Spring Professional Certification',   pl:'VMware Tanzu' },
    { y:'2019', ti:'B.Sc. in Computer Engineering',       pl:'University' },
  ]

  const skills = lang === 'es' ? [
    { n:'Comunicación técnica',    l:5 },
    { n:'Code review crítico',     l:5 },
    { n:'Mentoría junior',         l:4 },
    { n:'Trabajo asíncrono',       l:5 },
    { n:'Documentación',           l:4 },
    { n:'Resolución de incidencias', l:5 },
  ] : [
    { n:'Technical communication', l:5 },
    { n:'Critical code review',    l:5 },
    { n:'Junior mentoring',        l:4 },
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
                <div className="yr">{e.y}</div>
                <div className="ti">{e.ti}</div>
                <div className="pl">{e.pl}</div>
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
                <div className="lvl">
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