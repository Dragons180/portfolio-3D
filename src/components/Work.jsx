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
          <div className="tl-item" data-anim="reveal">
            <div className="tl-year">2021<span className="now">{lang === 'es' ? '· actualidad' : '· present'}</span></div>
            <div className="tl-main">
              <h4>Darwinex</h4>
              <div className="role">{t.role}</div>
              <p>{t.darwDesc}</p>
              <div className="chips">
                {['Java 17','Spring Boot','Maven','Docker','RabbitMQ','Redis','MongoDB','MySQL','AWS','Microservices','REST','GraphQL'].map(c => (
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
              {lang === 'es' ? 'híbrido · madrid' : 'hybrid · madrid'}
            </div>
          </div>

          <div className="tl-item" data-anim="reveal">
            <div className="tl-year">2019</div>
            <div className="tl-main">
              <h4>{lang === 'es' ? 'Inicio profesional' : 'Career start'}</h4>
              <div className="role">{lang === 'es' ? 'desarrollo java' : 'java development'}</div>
              <p>{lang === 'es'
                ? 'Primeros años aprendiendo el oficio: APIs REST, bases de datos relacionales, fundamentos de arquitectura limpia y deuda técnica real.'
                : 'Early years learning the craft: REST APIs, relational databases, foundations of clean architecture and real technical debt.'}
              </p>
              <div className="chips">
                {['Java','MySQL','REST','Maven'].map(c => (<span className="chip" key={c}>{c}</span>))}
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