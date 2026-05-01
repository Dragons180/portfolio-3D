import { useEffect, useRef } from 'react'
import { initHero3D } from '../three/hero3d'

export function Hero({ t, heroVariant }) {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return
    const cleanup = initHero3D(mountRef.current)
    return cleanup
  }, [])

  return (
    <section className="hero" id="top">

      <div className="hero-left">
        <div className="hero-top">
          <div className="meta">
            <span><b>David Redondo</b></span>
            <span>{t.heroRole} · {t.heroYears}</span>
            <span>{t.heroLoc}</span>
          </div>
          <div className="status">
            <span className="led"></span>
            <span>{t.heroAvail}</span>
          </div>
        </div>

        <h1 className="hero-title">
          <span className="l1" data-anim="hero-l1">{t.heroL1}</span>
          <span className="l2" data-anim="hero-l2">{t.heroL2}</span>
        </h1>

        <p className="hero-desc">{t.heroDesc}</p>

        <div className="hero-scroll">
          <span>{t.heroScroll}</span>
          <span className="arrow">↓</span>
        </div>
      </div>

      <div className="hero-right">
        <div className="hero-canvas" ref={mountRef}></div>
      </div>

      <div className="scroll-tag">scene · {heroVariant}</div>
    </section>
  )
}
