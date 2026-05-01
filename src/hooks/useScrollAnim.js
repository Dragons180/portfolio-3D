import { useEffect } from 'react'
import gsap from 'gsap'

export function useScrollAnim() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const l1 = document.querySelector('[data-anim="hero-l1"]')
      const l2 = document.querySelector('[data-anim="hero-l2"]')
      if (l1 && l2) {
        gsap.from([l1, l2], {
          yPercent: 105, opacity: 0,
          duration: 1.1, ease: 'expo.out',
          stagger: 0.12, delay: 0.2
        })
      }

      const reveals = document.querySelectorAll('[data-anim="reveal"]')
      reveals.forEach(el => gsap.set(el, { y: 28, opacity: 0 }))
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            gsap.to(entry.target, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', delay: 0.05 })
            io.unobserve(entry.target)
          }
        })
      }, { threshold: 0.18 })
      reveals.forEach(el => io.observe(el))

      const techs = document.querySelectorAll('[data-anim="tech"]')
      techs.forEach(el => gsap.set(el, { y: 18, opacity: 0 }))
      const techIO = new IntersectionObserver((entries) => {
        const visible = entries.filter(e => e.isIntersecting).map(e => e.target)
        if (visible.length) {
          gsap.to(visible, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.06 })
          visible.forEach(el => techIO.unobserve(el))
        }
      }, { threshold: 0.2 })
      techs.forEach(el => techIO.observe(el))

      const counts = document.querySelectorAll('[data-anim="count"]')
      counts.forEach(el => {
        const target = parseFloat(el.dataset.target)
        const numEl = el.querySelector('.n span')
        if (!numEl) return
        const obs = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const decimals = (target % 1 !== 0) ? 2 : 0
              const obj = { v: 0 }
              gsap.to(obj, {
                v: target, duration: 1.6, ease: 'expo.out',
                onUpdate: () => {
                  numEl.textContent = decimals
                    ? obj.v.toFixed(decimals)
                    : String(Math.round(obj.v)).padStart(2, '0')
                }
              })
              obs.unobserve(entry.target)
            }
          })
        }, { threshold: 0.4 })
        obs.observe(el)
      })
    }, 120)

    return () => clearTimeout(timer)
  }, [])
}