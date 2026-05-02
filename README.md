# David Redondo — Portfolio

<img width="1900" height="868" alt="image" src="https://github.com/user-attachments/assets/c6134f52-36af-4aab-84ab-3be67ce1907d" />

<br>Portfolio personal construido como una SPA con una escena 3D isométrica interactiva como elemento principal.

---

## Descripción

El portfolio presenta las secciones habituales de un CV técnico (sobre mí, stack tecnológico, experiencia, formación y contacto) con un enfoque visual diferenciador: la sección hero incorpora una habitación 3D isométrica renderizada en tiempo real con Three.js. La habitación contiene un rack de servidores interactivo que se activa al pulsar el botón "stack" de la barra de navegación, mostrando las tecnologías del stack con sus iconos y barras de proficiencia.

El diseño sigue una estética de terminal / backend developer: tipografía monospace, títulos con formato de endpoints REST (`GET /api/about-me`), sección de skills con apariencia de logs de Spring Boot, y animaciones de scroll bidireccionales con GSAP ScrollTrigger.

El portfolio es completamente bilingüe (ES / EN) con cambio de idioma en tiempo real sin recarga de página.

---

## Secciones

| Sección | Descripción |
|---|---|
| **Hero** | Escena 3D isométrica, avatar, título animado, botones LinkedIn / GitHub |
| **About** | Descripción profesional |
| **Stack** | Grid de tecnologías con iconos SVG |
| **Work** | Timeline de experiencia con empresa, rol, fechas, duración y descripción |
| **Certificates & Skills** | Formación académica + soft skills en formato log de Spring Boot |
| **Contact** | Formulario de contacto integrado con Resend API |

---

## Stack tecnológico

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| **React** | 18.3 | Framework UI, gestión de estado de idioma y variante de escena |
| **Vite** | 5.4 | Bundler, dev server con middleware para API local |
| **Three.js** | 0.160 | Escena 3D isométrica: habitación, rack de servidores, iluminación, materiales PBR |
| **GSAP + ScrollTrigger** | 3.12 | Animaciones de entrada/salida de secciones al hacer scroll |

### Arquitectura

- **Sin CSS modules ni Tailwind** — CSS plano en un único `index.css`
- **Sin router** — SPA de una sola página con scroll nativo y anclas
- **Sin estado global** — estado de idioma y variante de escena en `App.jsx` con `useState`
- **Componentes por sección** — un fichero `.jsx` por sección en `src/components/`
- **Contenido bilingüe** — objeto `COPY` centralizado en `src/constants/copy.jsx` con valores JSX

### Integración de email

El formulario de contacto envía correos mediante **Resend API** (HTTP REST, sin SDK):

- **Desarrollo**: middleware Vite en `vite.config.js` → `/api/send`
- **Producción**: serverless function en `api/send.js` compatible con **Vercel**
- La API key se configura en `.env.local` con la variable `RESEND_API_KEY`

### Escena 3D (`src/three/hero3d.js`)

La escena usa cámara **ortográfica isométrica** desde la posición `(14, 12, 14)`. Incluye:

- Habitación con suelo, paredes, techo y elementos decorativos (reloj, estantería, mapa mundi, maceta)
- Rack de servidores con 16 slots, luces LED, pantallas de estado y lámpara colgante
- Mesa de trabajo con monitor, teclado, ratón y torre
- Tres variantes de escena: `rack` (por defecto), `logos` (tecnologías flotantes), `arch` (grafo de microservicios)
- Parallax suave con movimiento del ratón
- Zoom animado al activar la vista de stack (`window.__enterStack()`)
- Responsive: cámara con frustum reducido (`D × 0.65`) y lookTarget adaptado en móvil

---

## Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Configurar la API key de Resend (necesario para el formulario de contacto)
echo "RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx" > .env.local

# Arrancar el servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Previsualizar el build
npm run preview
```

> El proyecto no tiene test runner ni linter configurado.

---

## Despliegue

Diseñado para desplegarse en **Vercel**:

- El directorio `api/` contiene la serverless function `send.js` que Vercel detecta automáticamente
- Añadir `RESEND_API_KEY` como variable de entorno en el dashboard de Vercel
- Verificar el dominio de envío en el dashboard de Resend

---

## Estructura del proyecto

```
src/
├── main.jsx                  # Punto de entrada React
├── App.jsx                   # Estado raíz: idioma, variante de escena
├── styles/index.css          # Todo el CSS (sin módulos)
├── constants/
│   ├── copy.jsx              # Textos bilingües (ES/EN)
│   └── tech.js               # Datos del grid de tecnologías
├── components/
│   ├── Hero.jsx
│   ├── TopBar.jsx
│   ├── About.jsx
│   ├── Stack.jsx
│   ├── Work.jsx
│   ├── EduSkills.jsx
│   └── Contact.jsx
├── three/
│   └── hero3d.js             # Escena Three.js completa
├── hooks/
│   └── useScrollAnim.js      # Animaciones GSAP ScrollTrigger
└── panels/
    ├── TechLogos.jsx
    └── TweaksPanel.jsx

api/
└── send.js                   # Serverless function (Vercel)
```

---

## Contacto

**David Redondo** — Backend Engineer  
[linkedin.com/in/redondoperezdavid](https://www.linkedin.com/in/redondoperezdavid/) · [github.com/Dragons180](https://github.com/Dragons180) · redondoperezdavid@gmail.com
