import { TECH } from '../constants/tech'
import { TechLogos } from '../panels/TechLogos'

export function Stack({ t }) {
  return (
    <section id="stack">
      <div className="sec-head">
        <div className="sec-num">{t.sec02}</div>
        <h2 className="sec-title" data-anim="reveal">{t.stackTitle}</h2>
      </div>
      <div className="stack">
        <div className="stack-grid">
          {TECH.map((tech, i) => (
            <div className="tech" key={tech.name} data-anim="tech" style={{ '--lvl': tech.lvl + '%' }}>
              <div className="tech-top">
                <span>{String(i + 1).padStart(2, '0')}</span>
                <span>·{tech.tag}</span>
              </div>
              <div className="tech-icon">
                {TechLogos[tech.name] || <span style={{ fontFamily: 'Space Grotesk', fontSize: 56, fontWeight: 300 }}>{tech.id}</span>}
              </div>
              <div>
                <div className="tech-name">{tech.name}</div>
                <div className="tech-meta">
                  <span>since {tech.since}</span>
                  <span>{tech.lvl}%</span>
                </div>
                <div className="tech-bar"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}