# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server (Vite, usually port 5173 or 5174)
npm run build     # production build → dist/
npm run preview   # serve the dist/ build locally
```

No test runner or linter is configured.

## Architecture

This is a single-page React + Vite portfolio. There are **two versions** of some files in the repo root — `hero3d.js`, `scroll-anim.js`, `tech-logos.jsx`, `tweaks-panel.jsx` — these are the old UMD/Babel-standalone originals and are **not used by Vite**. The active source lives entirely under `src/`.

### `src/` layout

```
src/
├── main.jsx                  # ReactDOM.createRoot, imports index.css
├── App.jsx                   # Root: language state, heroVariant state, useScrollAnim()
├── styles/index.css          # All CSS (no CSS modules, plain classes)
├── constants/
│   ├── copy.jsx              # Bilingual COPY object — values contain JSX, must stay .jsx
│   └── tech.js               # TECH array (stack grid data)
├── components/               # One file per section component
│   ├── Hero.jsx              # Mounts the Three.js canvas via useEffect + ref
│   ├── TopBar.jsx
│   ├── About.jsx
│   ├── Stack.jsx             # Imports TechLogos and TECH
│   ├── Work.jsx
│   ├── EduSkills.jsx
│   └── Contact.jsx
├── three/
│   └── hero3d.js             # ESM Three.js scene — export initHero3D(mount) → cleanup fn
├── hooks/
│   └── useScrollAnim.js      # GSAP scroll reveals, called once in App
└── panels/
    ├── TechLogos.jsx         # SVG logo map, exported as named const TechLogos
    └── TweaksPanel.jsx       # Floating dev tweaks panel + all Tweak* controls
```

### Three.js scene (`src/three/hero3d.js`)

`initHero3D(mount)` is called in `Hero.jsx`'s `useEffect` and returns a cleanup function that cancels the animation frame, removes event listeners, and disposes the renderer. The scene has three switchable variants: `rack` (default server rack), `logos` (floating tech labels), `arch` (microservices graph). Switch with `window.__setHeroVariant('logos')` — this calls the internal `setVariant` which also fires a `hero-variant` CustomEvent that `App.jsx` listens to in order to update the `heroVariant` label in the bottom-left corner.

Key scene constants: camera starts at z=20, rack group scaled to 0.65, fog from 22→45.

### Scroll animations (`src/hooks/useScrollAnim.js`)

Uses GSAP + IntersectionObserver. Driven entirely by `data-anim` attributes on DOM elements:
- `data-anim="hero-l1"` / `hero-l2` — hero title slide-in
- `data-anim="reveal"` — generic section fade-up
- `data-anim="tech"` — stack grid stagger
- `data-anim="count"` + `data-target="N"` — number count-up (reads `.n span` inside)

### Bilingual content

`COPY` in `src/constants/copy.jsx` is a `{ es: {...}, en: {...} }` object. Several values are JSX fragments (e.g. `aboutTitle`, `contactBig`). The active `t = COPY[lang]` object is passed as prop `t` to every section component. Language state lives in `App`.
