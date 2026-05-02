export function About({ t }) {
  return (
    <section id="about">
      <div className="sec-head">
        <div className="sec-num">{t.sec01}</div>
        <h2 className="sec-title" data-anim="reveal">{t.aboutTitle}</h2>
      </div>
      <div className="about">
        <div></div>
        <div className="lead" data-anim="reveal">{t.aboutP1}</div>
        <div className="body" data-anim="reveal">
          <p>{t.aboutP2}</p>
        </div>
      </div>
    </section>
  )
}