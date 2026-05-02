const MON_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const MON_EN = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

function mon(month, lang) {
  return lang === 'es' ? MON_ES[month - 1] : MON_EN[month - 1]
}

function duration(startY, startM, endY, endM, lang) {
  const total  = (endY - startY) * 12 + (endM - startM)
  const years  = Math.floor(total / 12)
  const months = total % 12
  const y = years  > 0 ? `${years} ${lang === 'es' ? (years === 1 ? 'año' : 'años') : (years === 1 ? 'yr' : 'yrs')}` : ''
  const m = months > 0 ? `${months} ${lang === 'es' ? (months === 1 ? 'mes' : 'meses') : (months === 1 ? 'mo' : 'mos')}` : ''
  return [y, m].filter(Boolean).join(' ')
}

const DarwinexLogo = () => (
  <svg viewBox="0 0 38 38" width="38" height="38" style={{ flexShrink: 0 }}>
    <rect width="38" height="38" rx="6" fill="#0a2030"/>
    <path d="M10 28 L10 10 L20 10 C27 10, 30 14, 30 19 C30 24, 27 28, 20 28 Z" fill="none" stroke="#00BFA5" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M15 15 L15 23" stroke="#00BFA5" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const CapgeminiLogo = () => (
  <svg viewBox="0 0 38 38" width="38" height="38" style={{ flexShrink: 0 }}>
    <rect width="38" height="38" rx="6" fill="#0070AD"/>
    <text x="19" y="16" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="8" fill="#fff">CAP</text>
    <text x="19" y="26" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="8" fill="#fff">GEMINI</text>
  </svg>
)

export function Work({ t, lang }) {
  return (
    <section id="work">
      <div className="sec-head">
        <div className="sec-num">{t.sec03}</div>
        <h2 className="sec-title" data-anim="reveal">{t.tlTitle}</h2>
      </div>
      <div className="timeline">
        <div></div>
        <div className="tl-track">
          <div className="tl-item" data-anim="tl-item">
            <div className="tl-year">
              {new Date().getFullYear()}
              <span className="now">{mon(2, lang)} 2021</span>
              <span className="now">{lang === 'es' ? 'presente' : 'present'}</span>
              <span className="dur">{duration(2021, 2, new Date().getFullYear(), new Date().getMonth() + 1, lang)}</span>
            </div>
            <div className="tl-main">
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'4px' }}>
                <DarwinexLogo />
                <h4>Darwinex</h4>
              </div>
              <div className="role">{t.role}</div>
              <p>{t.darwDesc}</p>
              <div className="chips">
                {['Java 21','Spring Boot','Maven','Docker','RabbitMQ','Redis','MongoDB','MySQL','AWS','Microservices','REST','GraphQL'].map(c => (
                  <span className="chip" key={c}>{c}</span>
                ))}
              </div>
            </div>
            <div className="tl-side">
              <b>{lang === 'es' ? 'sector' : 'sector'}</b>
              {lang === 'es' ? 'fintech / trading social' : 'fintech / social trading'}
              <br /><br />
              <b>{lang === 'es' ? 'equipo' : 'team'}</b>
              {lang === 'es' ? 'plataforma backend' : 'backend platform'}
              <br /><br />
              <b>{lang === 'es' ? 'modalidad' : 'mode'}</b>
              {lang === 'es' ? 'remoto' : 'remote'}
            </div>
          </div>

          <div className="tl-item" data-anim="tl-item">
            <div className="tl-year">
              2020
              <span className="now">{mon(9, lang)} 2019</span>
              <span className="now">{mon(2, lang)} 2020</span>
              <span className="dur">{duration(2019, 9, 2020, 2, lang)}</span>
            </div>
            <div className="tl-main">
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'4px' }}>
                <CapgeminiLogo />
                <h4>Capgemini</h4>
              </div>
              <div className="role">{lang === 'es' ? 'Consultor SAP' : 'SAP Consultant'}</div>
              <p>{lang === 'es'
                ? 'Aprendizaje de SAP SuccessFactors y Concur. Resolución de incidencias, realización de evolutivos y mantenimiento de las aplicaciones de gestión de Naturgy.'
                : 'Learning SAP SuccessFactors and Concur. Incident resolution, feature development and maintenance of Naturgy\'s management applications.'}
              </p>
              <div className="chips">
                {['SAP','SuccessFactors','Concur','Naturgy'].map(c => (<span className="chip" key={c}>{c}</span>))}
              </div>
            </div>
            <div className="tl-side">
              <b>{lang === 'es' ? 'foco' : 'focus'}</b>
              {lang === 'es' ? 'fundamentos del backend' : 'backend fundamentals'}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
