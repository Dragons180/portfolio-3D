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
          <p>// 2021 → today @ darwinex</p>
          <p>// madrid, remote-friendly</p>
        </div>
        <div className="stats">
          <div className="stat" data-anim="count" data-target="5">
            <div className="n"><span>05</span><sup>+</sup></div>
            <div className="l">{t.stat1}</div>
          </div>
          <div className="stat" data-anim="count" data-target="14">
            <div className="n"><span>14</span></div>
            <div className="l">{t.stat2}</div>
          </div>
          <div className="stat" data-anim="count" data-target="42">
            <div className="n"><span>42</span><sup>k</sup></div>
            <div className="l">{t.stat3}</div>
          </div>
          <div className="stat" data-anim="count" data-target="99.97">
            <div className="n"><span>99.97</span><sup>%</sup></div>
            <div className="l">{t.stat4}</div>
          </div>
        </div>
      </div>
    </section>
  )
}