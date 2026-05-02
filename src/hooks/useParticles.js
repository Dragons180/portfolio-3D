import { useEffect } from 'react'

const BG        = '#141210'
const LINK_DIST = 130
const SPEED     = 0.28
const N_MAX     = 110

export function useParticles() {
  useEffect(() => {
    const cv = document.createElement('canvas')
    cv.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none'
    document.body.prepend(cv)
    const ctx = cv.getContext('2d')

    let W, H, pts, raf

    function init() {
      W = cv.width  = window.innerWidth
      H = cv.height = window.innerHeight
      const n = Math.min(N_MAX, Math.floor(W * H / 9000))
      pts = Array.from({ length: n }, () => ({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * SPEED * 2,
        vy: (Math.random() - 0.5) * SPEED * 2,
        r:  Math.random() * 1.1 + 0.45,
        // ~8% de partículas en color acento para reforzar la marca
        accent: Math.random() < 0.08,
      }))
    }

    function tick() {
      raf = requestAnimationFrame(tick)
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)

      const DIST2 = LINK_DIST * LINK_DIST

      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]
        a.x += a.vx; a.y += a.vy
        if (a.x <= 0 || a.x >= W) a.vx *= -1
        if (a.y <= 0 || a.y >= H) a.vy *= -1

        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < DIST2) {
            const alpha = 0.13 * (1 - Math.sqrt(d2) / LINK_DIST)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(242,240,234,${alpha.toFixed(3)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }

        ctx.beginPath()
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2)
        ctx.fillStyle = a.accent
          ? 'rgba(255,107,26,0.65)'
          : 'rgba(242,240,234,0.5)'
        ctx.fill()
      }
    }

    init()
    tick()
    window.addEventListener('resize', init)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', init)
      if (cv.parentNode) cv.parentNode.removeChild(cv)
    }
  }, [])
}
