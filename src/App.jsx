import { useState, useEffect } from 'react'
import { COPY } from './constants/copy'
import { useScrollAnim } from './hooks/useScrollAnim'
import { useParticles } from './hooks/useParticles'
import { TopBar } from './components/TopBar'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { Work } from './components/Work'
import { EduSkills } from './components/EduSkills'
import { Contact } from './components/Contact'

export default function App() {
  const [lang, setLang] = useState('es')
  const [heroVariant, setHeroVariant] = useState('rack')

  useScrollAnim()
  useParticles()

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.variant) setHeroVariant(e.detail.variant)
    }
    window.addEventListener('hero-variant', handler)
    return () => window.removeEventListener('hero-variant', handler)
  }, [])

  const t = COPY[lang]

  return (
    <>
      <TopBar lang={lang} setLang={setLang} t={t} />
      <Hero t={t} heroVariant={heroVariant} />
      <About t={t} />
      <Work t={t} lang={lang} />
      <EduSkills t={t} lang={lang} />
      <Contact t={t} lang={lang} />
    </>
  )
}