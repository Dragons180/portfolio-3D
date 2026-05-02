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

      <div className="hero-blur" />

      <div className="hero-left">
        <div className="hero-identity">
          <div className="hero-avatar">
            <img src="/avatar.png" alt="David Redondo" />
          </div>
          <h1 className="hero-title">
            <span className="l1" data-anim="hero-l1">{t.heroL1}</span>
            <span className="l2" data-anim="hero-l2">{t.heroL2}</span>
          </h1>
        </div>

        <p className="hero-desc">{t.heroDesc}</p>
      </div>

      <div className="hero-scroll">
        <span>{t.heroScroll}</span>
        <span className="arrow">↓</span>
      </div>

      <div className="hero-right">
        <div className="hero-canvas" ref={mountRef}></div>
      </div>

      <div className="scroll-tag">scene · {heroVariant}</div>
    </section>
  )
}
