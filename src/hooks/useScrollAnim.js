import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useScrollAnim() {
  useEffect(() => {
    const timer = setTimeout(() => {

      // ── Hero entrance ────────────────────────────────────────────────────────
      gsap.from('.hero-right', { opacity: 0, duration: 1.4, ease: 'power2.out' })

      gsap.set('.hero-left', { xPercent: -100 })
      gsap.to('.hero-left',  { xPercent: 0, duration: 1.1, ease: 'expo.out', delay: 0.25 })

      const l1         = document.querySelector('[data-anim="hero-l1"]')
      const l2         = document.querySelector('[data-anim="hero-l2"]')
      const heroDesc   = document.querySelector('.hero-desc')
      const heroScroll = document.querySelector('.hero-scroll')

      gsap.set([heroDesc, heroScroll], { autoAlpha: 0, y: 12 })
      gsap.to(heroDesc,   { autoAlpha: 1, y: 0, duration: 0.9,  ease: 'expo.out', delay: 1.6  })
      gsap.to(heroScroll, { autoAlpha: 1, y: 0, duration: 0.7,  ease: 'expo.out', delay: 2.2  })

      if (l1 && l2) {
        gsap.from([l1, l2], {
          yPercent: 105, opacity: 0,
          duration: 1.1, ease: 'expo.out',
          stagger: 0.14, delay: 1.15,
        })
      }

      const ST = (trigger, extra = {}) => ({
        trigger,
        start: 'top 88%',
        end: 'top 12%',
        toggleActions: 'play reverse play reverse',
        ...extra,
      })

      // ── Reveal (fade-up) ─────────────────────────────────────────────────────
      document.querySelectorAll('[data-anim="reveal"]').forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: ST(el) }
        )
      })

      // ── Reveal-big ───────────────────────────────────────────────────────────
      document.querySelectorAll('[data-anim="reveal-big"]').forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: ST(el) }
        )
      })

      // ── Timeline items ───────────────────────────────────────────────────────
      document.querySelectorAll('[data-anim="tl-item"]').forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, x: -40 },
          { opacity: 1, x: 0, duration: 0.95, ease: 'expo.out', scrollTrigger: ST(el) }
        )
        const chips = el.querySelectorAll('.chip')
        if (chips.length) {
          gsap.fromTo(chips,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger: 0.04,
              scrollTrigger: ST(el, { start: 'top 82%' }) }
          )
        }
      })

      // ── Skill bars ───────────────────────────────────────────────────────────
      document.querySelectorAll('[data-anim="skill-bar"]').forEach(bar => {
        gsap.fromTo(bar.querySelectorAll('span.f'),
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.5, ease: 'expo.out', stagger: 0.09,
            scrollTrigger: ST(bar, { start: 'top 88%', end: 'top 20%' }) }
        )
      })

      // ── Contact links ────────────────────────────────────────────────────────
      const contactLinks = document.querySelectorAll('[data-anim="contact-link"]')
      if (contactLinks.length) {
        gsap.fromTo(contactLinks,
          { opacity: 0, x: -28 },
          { opacity: 1, x: 0, duration: 0.75, ease: 'expo.out', stagger: 0.1,
            scrollTrigger: ST(contactLinks[0], { start: 'top 90%' }) }
        )
      }

    }, 120)

    return () => {
      clearTimeout(timer)
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])
}
