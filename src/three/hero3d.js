import * as THREE from 'three'
import gsap from 'gsap'
import { TECH_3D } from './techData.js'

const ACCENT  = '#FF6B1A'
const ACCENT2 = '#FFB068'
const INK     = '#F2F0EA'
const BG      = '#141210'
const D       = 7.5  // orthographic half-size

export function initHero3D(mount) {
  const w = () => mount.clientWidth
  const h = () => mount.clientHeight

  const scene = new THREE.Scene()

  const initD  = window.innerWidth < 900 ? D * 0.65 : D
  const aspect = w() / h()
  const camera = new THREE.OrthographicCamera(-initD * aspect, initD * aspect, initD, -initD, 0.1, 200)
  camera.position.set(14, 12, 14)
  camera.lookAt(0, 2.5, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w(), h())
  renderer.outputColorSpace = THREE.SRGBColorSpace
  mount.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 0.3))
  const dir = new THREE.DirectionalLight(0xffffff, 0.6)
  dir.position.set(5, 8, 5)
  scene.add(dir)
  const p1 = new THREE.PointLight(ACCENT, 0.7, 20)
  p1.position.set(-3, 3, 3)
  scene.add(p1)
  const p2 = new THREE.PointLight(ACCENT2, 0.4, 20)
  p2.position.set(4, -2, 2)
  scene.add(p2)
  // Warm desk light (over back wall area)
  const deskLight = new THREE.PointLight(0xffe4c4, 1.2, 8)
  deskLight.position.set(1, 4, -2)
  scene.add(deskLight)
  // Cool rack accent
  const rackLight = new THREE.PointLight(0x4488ff, 0.5, 6)
  rackLight.position.set(-2, 3, 0)
  scene.add(rackLight)

  const monitorKills = []

  const variants = { rack: new THREE.Group(), logos: new THREE.Group(), arch: new THREE.Group() }
  Object.values(variants).forEach(g => { g.visible = false; scene.add(g) })

  // ── Keycap sounds ────────────────────────────────────────────────────────────
  const sndPress   = new Audio('/keycap-sounds/press.mp3')
  const sndRelease = new Audio('/keycap-sounds/release.mp3')
  sndPress.volume   = 0.35
  sndRelease.volume = 0.25

  function playPress()   { sndPress.currentTime   = 0; sndPress.play().catch(() => {}) }
  function playRelease() { sndRelease.currentTime = 0; sndRelease.play().catch(() => {}) }

  // ── Tooltip ──────────────────────────────────────────────────────────────────
  const tooltip = document.createElement('div')
  Object.assign(tooltip.style, {
    position: 'fixed', pointerEvents: 'none', zIndex: '9999', display: 'none',
    background: 'rgba(8,8,8,0.96)', backdropFilter: 'blur(12px)',
    padding: '12px 16px', width: '196px',
    fontFamily: "'JetBrains Mono',monospace",
    border: '1px solid #333',
  })
  document.body.appendChild(tooltip)

  let activeBay = null

  function showTooltip(entry) {
    const t   = entry.tech
    const barW = Math.round(t.lvl * 1.64)
    tooltip.style.border    = `1px solid ${t.color}`
    tooltip.style.boxShadow = `0 0 20px ${t.color}33`
    tooltip.innerHTML =
      `<div style="font-size:9px;color:${t.color};text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px">${t.tag}</div>` +
      `<div style="font-size:16px;font-weight:600;color:#F2F0EA;font-family:'Space Grotesk',sans-serif;letter-spacing:-.01em;margin-bottom:4px">${t.name}</div>` +
      `<div style="font-size:11px;color:#9A968C;line-height:1.55;margin-bottom:10px">${t.desc}</div>` +
      `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">` +
        `<span style="font-size:9px;color:#9A968C;text-transform:uppercase;letter-spacing:.1em">exp</span>` +
        `<span style="font-size:11px;color:${t.color}">${t.years} yr${t.years !== 1 ? 's' : ''}</span>` +
      `</div>` +
      `<div style="height:2px;background:#1e1e1e;border-radius:1px;overflow:hidden">` +
        `<div style="height:100%;width:${barW}px;background:${t.color};border-radius:1px"></div>` +
      `</div>`
    tooltip.style.display = 'block'
  }

  function hideTooltip() { tooltip.style.display = 'none' }

  function updateTooltipPos() {
    if (!activeBay) return
    const vw  = window.innerWidth
    const vh  = window.innerHeight
    const ttw = tooltip.offsetWidth  || 196
    const tth = tooltip.offsetHeight || 110
    const bvpX = activeBay.mesh.userData.vpX ?? vw * 0.75
    const bvpY = activeBay.mesh.userData.vpY ?? vh * 0.5
    let tx = bvpX - ttw * 0.5
    let ty = bvpY - tth - 14
    tx = Math.max(8, Math.min(vw - ttw - 8, tx))
    ty = Math.max(8, Math.min(vh - tth - 8, ty))
    tooltip.style.left = tx + 'px'
    tooltip.style.top  = ty + 'px'
  }

  // ── Bay mesh list ────────────────────────────────────────────────────────────
  const bayMeshes = []

  // ── Texture helpers ──────────────────────────────────────────────────────────
  function makeSvgUrl(tech) {
    const inner = tech.svg.replace(/\$C/g, tech.color)
    const wrap  = tech.svgStroke
      ? `fill="none" stroke="${tech.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`
      : `fill="${tech.color}"`
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" ${wrap}>${inner}</svg>`
    )
  }

  const TW = 256, TH = 230

  function makeLogoTex(tech) {
    const cv  = document.createElement('canvas')
    cv.width = TW; cv.height = TH
    const ctx = cv.getContext('2d')
    ctx.fillStyle = '#111111'
    ctx.fillRect(0, 0, TW, TH)
    ctx.strokeStyle = tech.color; ctx.globalAlpha = 0.18; ctx.lineWidth = 2
    ctx.strokeRect(1, 1, TW - 2, TH - 2); ctx.globalAlpha = 1
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
    const logoSize = 74
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, (TW - logoSize) / 2, (TH - logoSize) / 2, logoSize, logoSize)
      tex.needsUpdate = true
    }
    img.src = makeSvgUrl(tech)
    return tex
  }

  // ── Room ─────────────────────────────────────────────────────────────────────
  function buildRoom(g) {
    // Square room: all faces are 6×6
    const N = 6
    const H = N  // height = width = depth
    const half = N / 2  // 3

    function makeWallTex() {
      const S = 512
      const cv = document.createElement('canvas'); cv.width = S; cv.height = S
      const ctx = cv.getContext('2d')
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(0, 0, S, S)
      // Subtle plaster grain: random noise dots
      for (let i = 0; i < 18000; i++) {
        const x = Math.random() * S, y = Math.random() * S
        const v = Math.random()
        const a = (0.018 + v * 0.025).toFixed(3)
        ctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`
        ctx.fillRect(x, y, 1, 1)
      }
      // Very faint horizontal brushstroke streaks
      ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 1
      for (let y = 6; y < S; y += 9 + Math.random() * 8) {
        ctx.beginPath(); ctx.moveTo(0, y)
        for (let x = 0; x <= S; x += 32) ctx.lineTo(x, y + (Math.random() - 0.5) * 1.5)
        ctx.stroke()
      }
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 2)
      return tex
    }
    function makeBackWallTex() {
      const W = 512, H = 512
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H
      const ctx = cv.getContext('2d')
      // Gradient: darker top → slightly lighter bottom (navy blue range)
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0,   '#071428')
      grad.addColorStop(0.5, '#0d1f3c')
      grad.addColorStop(1,   '#112548')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H)
      // Fine horizontal scan lines (tech CRT aesthetic)
      ctx.strokeStyle = 'rgba(30,80,160,0.12)'; ctx.lineWidth = 1
      for (let y = 0; y < H; y += 4) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
      // Subtle vertical vignette edges
      const vgL = ctx.createLinearGradient(0, 0, W * 0.25, 0)
      vgL.addColorStop(0, 'rgba(0,0,0,0.18)'); vgL.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = vgL; ctx.fillRect(0, 0, W, H)
      const vgR = ctx.createLinearGradient(W, 0, W * 0.75, 0)
      vgR.addColorStop(0, 'rgba(0,0,0,0.18)'); vgR.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = vgR; ctx.fillRect(0, 0, W, H)
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; return tex
    }
    function makeLeftWallTex() {
      const S = 512
      const cv = document.createElement('canvas'); cv.width = S; cv.height = S
      const ctx = cv.getContext('2d')
      ctx.fillStyle = '#262c20'; ctx.fillRect(0, 0, S, S)  // dark olive-sage
      for (let i = 0; i < 16000; i++) {
        const x = Math.random() * S, y = Math.random() * S
        const v = Math.random()
        const a = (0.016 + v * 0.022).toFixed(3)
        ctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`
        ctx.fillRect(x, y, 1, 1)
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.018)'; ctx.lineWidth = 1
      for (let y = 6; y < S; y += 9 + Math.random() * 8) {
        ctx.beginPath(); ctx.moveTo(0, y)
        for (let x = 0; x <= S; x += 32) ctx.lineTo(x, y + (Math.random() - 0.5) * 1.5)
        ctx.stroke()
      }
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 2)
      return tex
    }
    const leftWallMat = new THREE.MeshStandardMaterial({ map: makeLeftWallTex(), roughness: 0.88, metalness: 0.02, side: THREE.FrontSide })
    const wallMat  = new THREE.MeshStandardMaterial({ map: makeWallTex(),     roughness: 0.88, metalness: 0.02, side: THREE.FrontSide })
    const backMat  = new THREE.MeshStandardMaterial({ map: makeBackWallTex(), roughness: 0.9,  metalness: 0.0,  side: THREE.FrontSide })
    function makeFloorTex() {
      const S = 1024
      const cv = document.createElement('canvas'); cv.width = S; cv.height = S
      const ctx = cv.getContext('2d')
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(0, 0, S, S)
      const ph = S / 7  // 7 tablones
      // Líneas de tablón
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 4
      for (let i = 1; i < 7; i++) { ctx.beginPath(); ctx.moveTo(0, i*ph); ctx.lineTo(S, i*ph); ctx.stroke() }
      // Juntas verticales (escalonadas)
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2
      for (let row = 0; row < 7; row++) {
        const offset = (row % 2) * (S / 3)
        for (let s = 0; s < 3; s++) {
          const x = (offset + s * (S / 3)) % S
          ctx.beginPath(); ctx.moveTo(x, row*ph); ctx.lineTo(x, (row+1)*ph); ctx.stroke()
        }
      }
      // Veta de madera
      ctx.strokeStyle = 'rgba(30,14,4,0.10)'; ctx.lineWidth = 1
      for (let y = 8; y < S; y += 14) {
        ctx.beginPath(); ctx.moveTo(0, y)
        for (let x = 0; x <= S; x += 40) ctx.lineTo(x, y + (Math.random()-0.5)*3)
        ctx.stroke()
      }
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; return tex
    }
    const floorMat = new THREE.MeshStandardMaterial({ map: makeFloorTex(), roughness: 0.88, metalness: 0.04 })
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x2C1206, roughness: 0.72, metalness: 0.06 })

    // Floor: N×N square at y=0
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(N, N), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 0, 0)
    g.add(floor)

    // Left wall: N×N at x=-half, facing +x
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(N, H), leftWallMat)
    leftWall.rotation.y = Math.PI / 2
    leftWall.position.set(-half, H / 2, 0)
    g.add(leftWall)

    // Back wall: N×N at z=-half, facing +z
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(N, H), backMat)
    backWall.position.set(0, H / 2, -half)
    g.add(backWall)

    // Right wall: N×N at x=+half, facing -x
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(N, H), wallMat)
    rightWall.rotation.y = -Math.PI / 2
    rightWall.position.set(half, H / 2, 0)
    g.add(rightWall)

    // Ceiling: N×N at y=H, facing down into room
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.0 })
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(N, N), ceilMat)
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(0, H, 0)
    g.add(ceil)

    // ── Wooden room trim ─────────────────────────────────────────────────────
    const TK = 0.12  // trim thickness

    // Vertical corner posts — esquinas izquierda + esquina trasera-derecha
    const postGeo = new THREE.BoxGeometry(TK, H, TK)
    ;[[-half, -half], [-half, half], [half, -half]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, trimMat)
      post.position.set(px, H / 2, pz)
      g.add(post)
    })

    // Top horizontal beams — pared trasera y pared izquierda únicamente
    ;[
      { geo: new THREE.BoxGeometry(N + TK, TK, TK),    pos: [0,    H, -half] },  // pared trasera
      { geo: new THREE.BoxGeometry(TK,     TK, N + TK), pos: [-half, H, 0]    },  // pared izquierda
    ].forEach(({ geo, pos }) => {
      const b = new THREE.Mesh(geo, trimMat)
      b.position.set(...pos)
      g.add(b)
    })

    // Rodapiés — pared trasera y pared izquierda únicamente
    ;[
      { geo: new THREE.BoxGeometry(N + TK, 0.18, TK),  pos: [0,             0.09, -half] },
      { geo: new THREE.BoxGeometry(TK, 0.18, N + TK),  pos: [-half + 0.001, 0.09, 0]     },
    ].forEach(({ geo, pos }) => {
      const s = new THREE.Mesh(geo, trimMat)
      s.position.set(...pos)
      g.add(s)
    })
  }

  // ── Desk + chair + monitors ───────────────────────────────────────────────────
  // Room is 6×6. Back wall at z=-3. Desk center against back wall.
  function buildDesk(g) {
    const deskWoodMat = new THREE.MeshStandardMaterial({ color: 0x8B6433, roughness: 0.75 })
    const legMat      = new THREE.MeshStandardMaterial({ color: 0x5a3a10, roughness: 0.8 })
    const chairMat    = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 })
    const monFrameMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.6 })
    const towerMat    = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.4, metalness: 0.5 })

    // Desk surface: 3.0 wide × 1.2 deep, against back wall (z=-3)
    // Back edge at z=-3, front at z=-1.8, center at z=-2.4
    const DX = 0     // desk center X (centred on back wall)
    const DZ = -2.4  // desk center Z
    const desk = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 1.2), deskWoodMat)
    desk.position.set(DX, 1.1, DZ)
    g.add(desk)

    // Desk legs (4)
    const legGeo = new THREE.BoxGeometry(0.09, 1.1, 0.09)
    ;[[-1.3, -0.5], [1.3, -0.5], [-1.3, 0.5], [1.3, 0.5]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat)
      leg.position.set(DX + lx, 0.55, DZ + lz)
      g.add(leg)
    })

    // ── Chair — tucked under desk, backrest toward viewer ────────────
    // Desk front edge at z=-1.8; seat center tucked to z=-2.05 (under desk)
    const SX = DX, SZ = -2.05
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.09, 1.0), chairMat)
    seat.position.set(SX, 0.76, SZ)
    g.add(seat)

    // Backrest on the viewer-facing side (+z from seat)
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.08), chairMat)
    back.position.set(SX, 1.28, SZ + 0.48)
    g.add(back)

    // Chair stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 8), chairMat)
    stem.position.set(SX, 0.44, SZ)
    g.add(stem)

    // Chair base (5 arms + wheels cilíndricos)
    const armMat   = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.7 })
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.5 })
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.028, 0.055), armMat)
      arm.position.set(SX + Math.cos(angle) * 0.22, 0.16, SZ + Math.sin(angle) * 0.22)
      arm.rotation.y = -angle
      g.add(arm)
      // Rueda cilíndrica (caster wheel)
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.055, 8), wheelMat)
      wheel.rotation.x = Math.PI / 2
      wheel.rotation.y = angle
      wheel.position.set(SX + Math.cos(angle) * 0.42, 0.075, SZ + Math.sin(angle) * 0.42)
      g.add(wheel)
    }

    // Reposabrazos
    const restMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.5 })
    const padMat  = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.7 })
    ;[-0.54, 0.54].forEach(ax => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.30, 0.045), restMat)
      post.position.set(SX + ax, 0.91, SZ + 0.04)
      g.add(post)
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.038, 0.42), padMat)
      pad.position.set(SX + ax, 1.07, SZ + 0.04)
      g.add(pad)
    })

    // ── PC Tower — on floor, right of desk ────────────────────────────
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.95, 0.25), towerMat)
    tower.position.set(1.9, 0.475, -2.3)
    g.add(tower)

    const towerLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(ACCENT) })
    const towerLed = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), towerLedMat)
    towerLed.position.set(2.06, 0.88, -2.17)
    g.add(towerLed)

    const ventMat2 = new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 1.0 })
    for (let v = 0; v < 4; v++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.016, 0.012), ventMat2)
      vent.position.set(2.06, 0.4 + v * 0.065, -2.17)
      g.add(vent)
    }

    // Panel lateral de cristal (cara izquierda de la torre)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88aacc, transparent: true, opacity: 0.18,
      roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide,
    })
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.82, 0.22), glassMat)
    glass.position.set(1.9 - 0.162, 0.48, -2.3)
    g.add(glass)

    // Internos visibles (motherboard + GPU + fans + RAM)
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x0a2010, roughness: 0.8 })
    const gpuMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.6 })
    const fanMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 })
    const ramMat = new THREE.MeshStandardMaterial({ color: 0x1a0830, roughness: 0.5 })

    // Placa base
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.62, 0.19), pcbMat)
    pcb.position.set(1.884, 0.5, -2.3)
    g.add(pcb)
    // GPU
    const gpu = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.095, 0.17), gpuMat)
    gpu.position.set(1.875, 0.36, -2.3)
    g.add(gpu)
    // Ventilador CPU (disco plano)
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.018, 10), fanMat)
    fan.rotation.z = Math.PI / 2
    fan.position.set(1.875, 0.62, -2.29)
    g.add(fan)
    // RAM (2 sticks)
    ;[-2.26, -2.34].forEach(rz => {
      const ram = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.17, 0.025), ramMat)
      ram.position.set(1.882, 0.60, rz)
      g.add(ram)
    })
    // Logo frontal (placa pequeña con acento)
    const logoMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(ACCENT) })
    const logo = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.035, 0.055), logoMat)
    logo.position.set(2.068, 0.70, -2.3)
    g.add(logo)

    // ── Monitor screens — live typewriter terminals ──────────────────────────
    function makeTypingMonitor(allLines, bg, fg, delay = 0) {
      const CW = 512, CH = 320
      const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH
      const ctx = cv.getContext('2d')
      const tex = new THREE.CanvasTexture(cv)
      tex.colorSpace = THREE.SRGBColorSpace

      let typed    = allLines.map(() => '')
      let cursorOn = true
      let curLine  = 0

      function lineColor(line) {
        if (line.startsWith('$') || line.startsWith('  ✓') || line.startsWith('> ')) return '#3CD96E'
        if (/feat:|fix:/.test(line))                     return '#A8A49A'
        if (/Up |CPU|MEM|msgs|uptime/.test(line))        return '#A8C8E8'
        if (/NAME|STATUS/.test(line))                    return '#555'
        return fg
      }

      function redraw() {
        ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH)
        ctx.font = '12px "JetBrains Mono", monospace'
        for (let i = 0; i <= Math.min(curLine, allLines.length - 1); i++) {
          ctx.fillStyle = lineColor(allLines[i])
          const t = typed[i] ?? ''
          ctx.fillText((i === curLine && cursorOn) ? t + '█' : t, 10, 20 + i * 17)
        }
        tex.needsUpdate = true
      }

      const tl = gsap.timeline({
        delay,
        repeat: -1,
        repeatDelay: 3,
        onRepeat() { typed = allLines.map(() => ''); curLine = 0 },
      })

      allLines.forEach((line, idx) => {
        tl.call(() => { curLine = idx })
        if (line.length === 0) {
          tl.to({}, { duration: 0.12 })
        } else {
          const obj = { n: 0 }
          tl.to(obj, {
            n: line.length,
            duration: Math.max(0.1, line.length * 0.018),
            ease: 'none',
            onUpdate() { typed[idx] = line.slice(0, Math.round(obj.n)); redraw() },
            onComplete() { typed[idx] = line },
          })
          tl.to({}, { duration: 0.06 })
        }
      })

      const blinkTl = gsap.to({}, {
        duration: 0.45, repeat: -1, yoyo: true,
        onRepeat() { cursorOn = !cursorOn; redraw() },
      })

      redraw()
      return { tex, kill() { tl.kill(); blinkTl.kill() } }
    }

    const mainMon = makeTypingMonitor([
      '$ ./start-services.sh',
      '',
      '  Booting portfolio-api v2.4',
      '  Loading Spring context...',
      '  DataSource: mongodb ready',
      '  RabbitMQ → amqp://broker',
      '  Redis cache  (128 MB)',
      '  REST /api/v1/** mapped',
      '  GraphQL /graphql ready',
      '  Started App in 2.84s',
      '',
      '  ✓ System ready · :8080',
    ], '#020d02', '#3CD96E', 0.4)

    const leftMon = makeTypingMonitor([
      '$ docker ps',
      'NAME     STATUS',
      'api      Up  8m',
      'mongo    Up  8m',
      'rabbit   Up  8m',
      'redis    Up  8m',
      '',
      'CPU  ████░  71%',
      'MEM  ███░░  58%',
    ], '#020210', '#5DADE2', 1.2)

    const rightMon = makeTypingMonitor([
      '$ git log --oneline',
      'a3f1c2 feat:3D hero',
      'b2e9d1 fix:monitors',
      'c4a8b3 feat:rack UI',
      '',
      '$ ./metrics.sh',
      '  msgs/s:  42 138',
      '  uptime: 99.97%',
    ], '#020210', '#5DADE2', 1.8)

    monitorKills.push(() => mainMon.kill(), () => leftMon.kill(), () => rightMon.kill())

    function addMonitor(grpParent, px, py, pz, rotY, screenTex, sw, sh) {
      const grp = new THREE.Group()
      grp.position.set(px, py, pz)
      grp.rotation.y = rotY

      grp.add(new THREE.Mesh(new THREE.BoxGeometry(sw + 0.1, sh + 0.09, 0.065), monFrameMat))

      const screenMats = [
        monFrameMat, monFrameMat, monFrameMat, monFrameMat,
        new THREE.MeshBasicMaterial({ map: screenTex }),
        monFrameMat,
      ]
      const screen = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, 0.01), screenMats)
      screen.position.z = 0.038
      grp.add(screen)

      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.07), monFrameMat)
      stem.position.y = -(sh / 2 + 0.15)
      grp.add(stem)

      const base = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.035, 0.26), monFrameMat)
      base.position.y = -(sh / 2 + 0.3 + 0.018)
      grp.add(base)

      grpParent.add(grp)
      return grp
    }

    // Fan arrangement — monitors flush to desk back edge, 0.11 gap between screens
    const THETA = 0.611  // 35°
    const SW2   = 0.82 / 2  // 0.41
    const MZ    = -2.88     // back edge of desk
    const pyC = 1.155 + 0.375 + 0.318  // central  (sh=0.75)
    const pyS = 1.155 + 0.325 + 0.318  // side     (sh=0.65)
    addMonitor(g, DX,                                         pyC, MZ,                          0,      mainMon.tex,  1.05, 0.75)
    addMonitor(g, (DX - 0.635) - SW2 * Math.cos(THETA),      pyS, MZ + SW2 * Math.sin(THETA),  THETA,  leftMon.tex,  0.82, 0.65)
    addMonitor(g, (DX + 0.635) + SW2 * Math.cos(THETA),      pyS, MZ + SW2 * Math.sin(THETA), -THETA,  rightMon.tex, 0.82, 0.65)

    // Keyboard
    const kb = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.035, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.5, metalness: 0.3 }))
    kb.position.set(DX - 0.2, 1.16, DZ + 0.35)
    g.add(kb)

    // Mouse (to the right of the keyboard)
    const mouseMat = new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.4, metalness: 0.3 })
    const mouseBody = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.21), mouseMat)
    mouseBody.position.set(DX + 0.7, 1.178, DZ + 0.35)
    g.add(mouseBody)
    // Scroll wheel
    const scrollMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 })
    const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 8), scrollMat)
    scroll.rotation.z = Math.PI / 2
    scroll.position.set(DX + 0.7, 1.205, DZ + 0.3)
    g.add(scroll)

    // Regleta de enchufes bajo el tablero
    const stripMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6, metalness: 0.4 })
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.045, 0.058), stripMat)
    strip.position.set(DX - 0.3, 1.052, DZ - 0.44)
    g.add(strip)
    for (let p = 0; p < 4; p++) {
      const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }))
      plug.rotation.x = Math.PI / 2
      plug.position.set(DX - 0.57 + p * 0.20, 1.052, DZ - 0.47)
      g.add(plug)
    }

    // Grommet (paso de cables en la mesa)
    const grommetMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.4 })
    const grommet = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.012, 6, 16), grommetMat)
    grommet.rotation.x = Math.PI / 2
    grommet.position.set(DX + 0.9, 1.157, DZ - 0.3)
    g.add(grommet)

    // Taza de café
    const mugMat    = new THREE.MeshStandardMaterial({ color: 0x1c1c2e, roughness: 0.5 })
    const coffeeMatl = new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 1.0 })
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.088, 10), mugMat)
    mug.position.set(DX - 0.85, 1.2, DZ + 0.28)
    g.add(mug)
    const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.008, 10), coffeeMatl)
    coffee.position.set(DX - 0.85, 1.246, DZ + 0.28)
    g.add(coffee)
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.007, 5, 10, Math.PI), mugMat)
    handle.rotation.y = Math.PI / 2
    handle.position.set(DX - 0.815, 1.2, DZ + 0.28)
    g.add(handle)

    g.userData.towerLedMat = towerLedMat
  }

  // ── Room decoration ───────────────────────────────────────────────────────────
  function buildDecor(g) {
    // Rug
    const rugBorder = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 2.7),
      new THREE.MeshStandardMaterial({ color: 0xC4A052, roughness: 0.95 }))
    rugBorder.rotation.x = -Math.PI / 2
    rugBorder.position.set(0.5, 0.002, 0.5)
    g.add(rugBorder)

    const rugMain = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x6B2333, roughness: 0.97 }))
    rugMain.rotation.x = -Math.PI / 2
    rugMain.position.set(0.5, 0.004, 0.5)
    g.add(rugMain)

    // Plant — grande, proporcional a la habitación (6 × 6 m)
    function addPlant(px, pz) {
      const potMat   = new THREE.MeshStandardMaterial({ color: 0xC1440E, roughness: 0.8 })
      const soilMat  = new THREE.MeshStandardMaterial({ color: 0x2D1B00, roughness: 1.0 })
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3B2A1A, roughness: 0.9 })
      const leaf1Mat = new THREE.MeshStandardMaterial({ color: 0x1B5E20, roughness: 0.7 })
      const leaf2Mat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.7 })

      // Maceta
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.23, 0.48, 12), potMat)
      pot.position.set(px, 0.24, pz)
      g.add(pot)

      // Tierra
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.04, 12), soilMat)
      soil.position.set(px, 0.50, pz)
      g.add(soil)

      // Tronco
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.058, 0.72, 8), trunkMat)
      trunk.position.set(px, 0.88, pz)
      g.add(trunk)

      // Follaje central principal
      const main = new THREE.Mesh(new THREE.SphereGeometry(0.54, 11, 9), leaf1Mat)
      main.scale.set(1, 0.88, 1)
      main.position.set(px, 1.50, pz)
      g.add(main)

      // Clusters secundarios
      ;[
        [ 0.35, 1.58, -0.12, 0.42, leaf2Mat],
        [-0.32, 1.50,  0.10, 0.38, leaf1Mat],
        [ 0.13, 1.85,  0.20, 0.32, leaf2Mat],
        [-0.15, 1.82, -0.15, 0.30, leaf1Mat],
        [ 0.06, 1.12,  0.30, 0.27, leaf2Mat],
      ].forEach(([ox, oy, oz, r, mat]) => {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 7), mat)
        leaf.position.set(px + ox, oy, pz + oz)
        g.add(leaf)
      })
    }
    addPlant(-2.1, -2.65)

    // Cable: rack → PC tower (runs along left and back walls)
    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.5,  0.06,  0.8),
      new THREE.Vector3(-2.7,  0.06, -0.5),
      new THREE.Vector3(-2.7,  0.06, -2.5),
      new THREE.Vector3( 1.5,  0.06, -2.7),
      new THREE.Vector3( 1.9,  0.22, -2.3),
    ])
    const cableMesh = new THREE.Mesh(
      new THREE.TubeGeometry(cableCurve, 28, 0.025, 6, false),
      new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.9 })
    )
    g.add(cableMesh)

    // World map on back wall (above monitors)
    function makeWorldMapTex() {
      const W = 1024, H = 512
      const cv = document.createElement('canvas')
      cv.width = W; cv.height = H
      const ctx = cv.getContext('2d')
      ctx.clearRect(0, 0, W, H)

      ctx.strokeStyle = 'rgba(255,107,26,0.07)'
      ctx.lineWidth = 0.5
      for (let lon = -180; lon <= 180; lon += 30) {
        const x = (lon + 180) / 360 * W
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let lat = -60; lat <= 90; lat += 30) {
        const y = (90 - lat) / 180 * H
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      function ll(lon, lat) { return [(lon + 180) / 360 * W, (90 - lat) / 180 * H] }

      ctx.fillStyle   = 'rgba(255,107,26,0.28)'
      ctx.strokeStyle = 'rgba(255,107,26,0.55)'
      ctx.lineWidth   = 1.2

      const continents = [
        // América del Norte
        [
          [-78,9],[-83,9],[-90,14],[-104,19],[-110,24],[-117,32],
          [-122,37],[-124,48],[-125,50],[-130,55],[-138,57],[-149,61],
          [-162,60],[-168,55],[-168,66],[-157,71],[-140,70],[-120,68],
          [-100,74],[-80,73],[-65,68],[-65,63],[-57,52],[-52,47],
          [-60,46],[-67,44],[-70,42],[-74,40],[-76,35],[-80,26],
          [-81,25],[-82,27],[-90,29],[-97,26],[-97,22],[-90,20],
          [-88,22],[-87,16],[-84,10],[-77,9],
        ],
        // América del Sur
        [
          [-77,8],[-73,12],[-63,11],[-60,7],[-52,4],[-49,0],
          [-38,-4],[-35,-6],[-35,-11],[-40,-20],[-43,-23],[-46,-24],
          [-51,-33],[-58,-34],[-57,-38],[-65,-52],[-68,-55],
          [-74,-50],[-75,-37],[-71,-30],[-70,-18],[-77,-12],
          [-80,-3],[-80,0],[-77,3],[-77,8],
        ],
        // Europa (costa Atlántica + Mediterráneo + Adriático + Báltico)
        [
          [-6,36],[-2,37],[0,40],[3,43],[7,44],[10,44],[13,45],
          [16,44],[18,42],[20,40],[22,37],[26,38],[28,41],
          [30,46],[26,50],[22,54],[18,55],[14,54],[10,55],
          [4,52],[0,51],[-2,48],[-5,48],[-2,47],[-2,44],
          [-8,44],[-9,43],[-9,37],[-6,36],
        ],
        // Italia (bota)
        [[8,44],[8,46],[12,46],[15,45],[16,41],[18,40],[16,38],[14,38],[12,37],[8,38],[8,44]],
        // Escandinavia
        [[5,57],[10,57],[18,55],[22,60],[28,65],[25,70],[18,72],[14,68],[5,62],[5,57]],
        // África (con costa norte mediterránea)
        [[-18,15],[-5,36],[10,38],[25,31],[37,30],[37,22],[40,15],[42,12],[50,8],[44,0],[36,-5],[32,-28],[25,-35],[18,-35],[8,-5],[-5,-5],[-18,15]],
        // Asia (Turquía → Cáucaso → Irán → costa India → SE Asia → E Asia → Siberia → Ártico)
        [
          [26,42],[36,37],[32,41],[42,42],[50,40],
          [50,26],[57,22],[60,25],
          [73,19],[77,8],[80,14],[88,20],[92,22],
          [96,17],[100,5],[104,2],[110,2],[114,22],
          [122,30],[122,37],[130,40],[142,47],[163,55],
          [170,64],[170,70],[140,72],[100,72],
          [60,70],[30,70],[26,70],[26,42],
        ],
        // Península Arábiga
        [[37,22],[55,22],[58,22],[54,17],[49,14],[45,13],[43,12],[38,14],[37,22]],
        // SE Asia (Malasia + Borneo)
        [[100,6],[104,2],[108,2],[118,6],[118,-2],[108,-4],[100,0],[100,6]],
        // Sumatra
        [[96,6],[104,0],[106,-6],[96,2],[96,6]],
        // Australia
        [[114,-24],[126,-14],[140,-14],[152,-24],[150,-38],[122,-38],[114,-32],[114,-24]],
        // Groenlandia
        [[-58,60],[-25,63],[-18,72],[-40,80],[-58,82],[-65,75],[-58,60]],
        // Japón
        [[130,31],[132,33],[136,35],[141,36],[145,42],[142,43],[130,40],[130,31]],
        // Reino Unido
        [[-6,50],[2,51],[2,54],[-1,58],[-5,58],[-6,50]],
      ]
      continents.forEach(pts => {
        ctx.beginPath()
        const [x0, y0] = ll(...pts[0])
        ctx.moveTo(x0, y0)
        for (let i = 1; i < pts.length; i++) { const [x, y] = ll(...pts[i]); ctx.lineTo(x, y) }
        ctx.closePath(); ctx.fill(); ctx.stroke()
      })

      const tex = new THREE.CanvasTexture(cv)
      tex.colorSpace = THREE.SRGBColorSpace
      return tex
    }

    const mapPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 2.1),
      new THREE.MeshBasicMaterial({ map: makeWorldMapTex(), transparent: true, opacity: 0.88 })
    )
    mapPlane.position.set(0, 3.5, -2.97)
    g.add(mapPlane)

    // Server node cities [lon, lat]
    const cityPositions = [
      [-74, 40.7], [-0.1, 51.5], [139.7, 35.7], [-46.6, -23.5], [103.8, 1.3],
      [151.2, -33.9], [72.8, 18.9], [8.7, 50.1], [127, 37.5], [-79.4, 43.7],
    ]
    const mapNodes = []
    cityPositions.forEach(([lon, lat]) => {
      const mx = (lon / 180) * 2.1
      const my = 3.5 + (lat / 90) * 1.05
      const spd = 0.8 + Math.random() * 2.5
      const ph  = Math.random() * Math.PI * 2

      const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(ACCENT), transparent: true })
      const dotMesh = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), dotMat)
      dotMesh.position.set(mx, my, -2.93)
      g.add(dotMesh)

      const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(ACCENT), transparent: true, side: THREE.DoubleSide })
      const ringMesh = new THREE.Mesh(new THREE.RingGeometry(0.042, 0.058, 12), ringMat)
      ringMesh.position.set(mx, my, -2.925)
      g.add(ringMesh)

      mapNodes.push({ mat: dotMat,  speed: spd,       phase: ph,              isRing: false })
      mapNodes.push({ mat: ringMat, speed: spd * 0.5, phase: ph + Math.PI,    isRing: true  })
    })

    const mapLight = new THREE.PointLight(0x3CD96E, 0.5, 5.5)
    mapLight.position.set(0, 3.6, -2.5)
    g.add(mapLight)

    g.userData.mapNodes = mapNodes

    // ── Estantería flotante en pared izquierda ────────────────────────────────
    const shelfWoodMat = new THREE.MeshStandardMaterial({ color: 0x5C3010, roughness: 0.72 })
    const shelfMetMat  = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.4, metalness: 0.8 })

    // Tablón principal
    const shelfBoard = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, 1.5), shelfWoodMat)
    shelfBoard.position.set(-2.93, 3.5, 1.1)
    g.add(shelfBoard)

    // Soportes en L
    ;[0.42, 1.78].forEach(sz => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.055), shelfMetMat)
      bracket.position.set(-2.93, 3.43, sz)
      g.add(bracket)
      const bracketH = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.12), shelfMetMat)
      bracketH.position.set(-2.91, 3.47, sz)
      g.add(bracketH)
    })

    // Libros sobre la estantería
    const bookDefs = [
      { color: 0xC0392B, w: 0.055, h: 0.24 },
      { color: 0x2471A3, w: 0.065, h: 0.20 },
      { color: 0xD4AC0D, w: 0.048, h: 0.22 },
      { color: 0x1E8449, w: 0.060, h: 0.26 },
      { color: 0x7D3C98, w: 0.055, h: 0.21 },
      { color: 0xE67E22, w: 0.050, h: 0.23 },
    ]
    let bz = 0.44
    bookDefs.forEach(({ color, w, h }) => {
      const bm = new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.07, h, w), bm)
      book.position.set(-2.88, 3.527 + h / 2, bz + w / 2)
      g.add(book)
      bz += w + 0.008
    })

    // Figurita/coleccionable (cubo estilizado en acento)
    const figMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(ACCENT), roughness: 0.4, metalness: 0.3 })
    const figBase = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), figMat)
    figBase.rotation.y = Math.PI / 5
    figBase.position.set(-2.88, 3.562, 0.46)
    g.add(figBase)
    const figTop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.04), figMat)
    figTop.rotation.y = Math.PI / 4
    figTop.position.set(-2.88, 3.625, 0.46)
    g.add(figTop)

    // Plantita en la estantería
    const spMat = new THREE.MeshStandardMaterial({ color: 0xA03010, roughness: 0.8 })
    const spPot = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.048, 0.09, 8), spMat)
    spPot.position.set(-2.88, 3.572, 1.72)
    g.add(spPot)
    const spLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 6),
      new THREE.MeshStandardMaterial({ color: 0x1B5E20, roughness: 0.7 }))
    spLeaf.position.set(-2.88, 3.69, 1.72)
    g.add(spLeaf)
    const spLeaf2 = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.7 }))
    spLeaf2.position.set(-2.85, 3.74, 1.75)
    g.add(spLeaf2)

    // ── Cuadro enmarcado en pared izquierda ───────────────────────────────────
    function makeArtTex() {
      const W = 512, H = 320
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H
      const ctx = cv.getContext('2d')
      ctx.fillStyle = '#080c14'; ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#FF6B1A'; ctx.lineWidth = 3
      ctx.strokeRect(3, 3, W - 6, H - 6)
      const lines = [
        ['const hero3d = () => {', ACCENT],
        ['  scene.add(desk)',      '#3CD96E'],
        ['  scene.add(rack)',      '#3CD96E'],
        ['  render(camera)',       '#5DADE2'],
        ['}',                     ACCENT],
        ['',                      ''],
        ['// D. Redondo · v2',    '#444444'],
      ]
      ctx.font = 'bold 28px monospace'
      lines.forEach(([text, color], i) => {
        if (!text) return
        ctx.fillStyle = color; ctx.fillText(text, 22, 54 + i * 38)
      })
      const tex = new THREE.CanvasTexture(cv)
      tex.colorSpace = THREE.SRGBColorSpace; return tex
    }
    const frameMat  = new THREE.MeshStandardMaterial({ color: 0x2C1206, roughness: 0.7 })
    const artFrame  = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.56, 0.78), frameMat)
    artFrame.position.set(-2.95, 4.22, 2.3)
    g.add(artFrame)
    const artCanvas = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.48, 0.70),
      new THREE.MeshBasicMaterial({ map: makeArtTex() })
    )
    artCanvas.position.set(-2.935, 4.22, 2.3)
    g.add(artCanvas)

    // ── Papelera junto al escritorio ──────────────────────────────────────────
    const binMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.3 })
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.09, 0.28, 10), binMat)
    bin.position.set(1.55, 0.14, -1.45)
    g.add(bin)
    // Aro superior
    const binRingMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.7 })
    const binRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.008, 5, 16), binRingMat)
    binRing.rotation.x = Math.PI / 2
    binRing.position.set(1.55, 0.28, -1.45)
    g.add(binRing)
    // Líneas decorativas
    for (let l = 0; l < 6; l++) {
      const lineAngle = (l / 6) * Math.PI * 2
      const lineMesh = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.24, 0.006), binRingMat)
      lineMesh.position.set(
        1.55 + Math.cos(lineAngle) * 0.105,
        0.14,
        -1.45 + Math.sin(lineAngle) * 0.105
      )
      g.add(lineMesh)
    }

    // ── Reloj analógico en pared izquierda ────────────────────────────────────
    const clkX = -2.93, clkY = 3.8, clkZ = -1.8
    const clkBezMat  = new THREE.MeshStandardMaterial({ color: 0x2C1206, roughness: 0.65, metalness: 0.12 })
    const clkFaceMat = new THREE.MeshStandardMaterial({ color: 0xEFEBE2, roughness: 0.9 })
    const clkHandMat = new THREE.MeshStandardMaterial({ color: 0x0d0905, roughness: 0.6 })

    // Bisel exterior
    const clkBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.055, 18), clkBezMat)
    clkBezel.rotation.z = Math.PI / 2
    clkBezel.position.set(clkX, clkY, clkZ)
    g.add(clkBezel)

    // Esfera blanca
    const clkFace = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.022, 18), clkFaceMat)
    clkFace.rotation.z = Math.PI / 2
    clkFace.position.set(clkX + 0.022, clkY, clkZ)
    g.add(clkFace)

    // 12 marcas horarias
    for (let tick = 0; tick < 12; tick++) {
      const angle = (tick / 12) * Math.PI * 2
      const isMain = tick % 3 === 0
      const tm = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, isMain ? 0.07 : 0.04, isMain ? 0.015 : 0.010),
        clkHandMat
      )
      const r = 0.245
      tm.position.set(clkX + 0.038, clkY + Math.cos(angle) * r, clkZ - Math.sin(angle) * r)
      g.add(tm)
    }

    // Aguja horaria (apuntando a ~10 — rotation.x = -2π/3)
    const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.017, 0.16, 0.014), clkHandMat)
    hourHand.rotation.x = -Math.PI * 2 / 3
    hourHand.position.set(clkX + 0.042, clkY + Math.cos(-Math.PI * 2 / 3) * 0.08, clkZ + Math.sin(-Math.PI * 2 / 3) * 0.08)
    g.add(hourHand)

    // Aguja minutera (apuntando a ~2 — rotation.x = π/3)
    const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.22, 0.013), clkHandMat)
    minHand.rotation.x = Math.PI / 3
    minHand.position.set(clkX + 0.048, clkY + Math.cos(Math.PI / 3) * 0.11, clkZ - Math.sin(Math.PI / 3) * 0.11)
    g.add(minHand)

    // Pin central (acento naranja)
    const clkPin = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(ACCENT), roughness: 0.3, metalness: 0.7 }))
    clkPin.position.set(clkX + 0.05, clkY, clkZ)
    g.add(clkPin)

    // ── Tira LED bajo el escritorio ───────────────────────────────────────────
    const ledStripMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ACCENT2), emissive: new THREE.Color(ACCENT2), emissiveIntensity: 0.9,
      roughness: 0.9
    })
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.018, 0.022), ledStripMat)
    ledStrip.position.set(0, 1.135, -2.65)
    g.add(ledStrip)
    // Luz suave de ambiente naranja-cálido bajo el escritorio
    const ledLight = new THREE.PointLight(0xFFB068, 0.6, 2.2)
    ledLight.position.set(0, 1.08, -2.55)
    g.add(ledLight)
  }

  // ── Variant 1: Server rack ────────────────────────────────────────────────────
  function buildRack() {
    const g = variants.rack

    buildRoom(g)
    buildDesk(g)
    buildDecor(g)

    // ── Desk lamp ─────────────────────────────────────────────────────────────
    const DLX = 1.3, DLZ = -2.2
    const dLampMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.3, metalness: 0.7 })
    const dLampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.04, 10), dLampMat)
    dLampBase.position.set(DLX, 1.175, DLZ)
    g.add(dLampBase)

    const dLampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.40, 6), dLampMat)
    dLampArm.position.set(DLX + 0.04, 1.175 + 0.20, DLZ)
    dLampArm.rotation.z = -0.2
    g.add(dLampArm)

    const dLampShadeMat = new THREE.MeshStandardMaterial({ color: 0x335577, roughness: 0.6, side: THREE.DoubleSide })
    const dLampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.14, 0.18, 10, 1, true), dLampShadeMat)
    dLampShade.position.set(DLX + 0.06, 1.175 + 0.40 + 0.07, DLZ)
    g.add(dLampShade)

    const deskLampLight = new THREE.PointLight(0xFFE4A0, 1.0, 3.5)
    deskLampLight.position.set(DLX + 0.06, 1.55, DLZ)
    g.add(deskLampLight)

    // ── Pendant lamp hanging from ceiling ─────────────────────────────────────
    const pendantCordMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 })
    const pendantCord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.3, 4), pendantCordMat)
    pendantCord.position.set(0, 5.35, -1)
    g.add(pendantCord)

    const pendantShadeMat = new THREE.MeshStandardMaterial({ color: 0xD4A843, roughness: 0.6, side: THREE.DoubleSide })
    const pendantShade = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.22, 0.18, 12, 1, true), pendantShadeMat)
    pendantShade.position.set(0, 4.9, -1)
    g.add(pendantShade)

    const pendantLight = new THREE.PointLight(0xFFF0CC, 2.2, 11)
    pendantLight.position.set(0, 4.7, -1)
    g.add(pendantLight)

    // Rack group positioned against left wall, rotated to face into room (+X)
    g.position.set(0, 0, 0)
    g.scale.setScalar(1)

    const rackGroup = new THREE.Group()
    rackGroup.position.set(-2.5, 0, 0)
    rackGroup.rotation.y = Math.PI / 2
    rackGroup.scale.setScalar(0.65)
    g.add(rackGroup)

    // Chassis
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 4.0, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.3 })
    )
    frame.position.set(0, 2.0, 0)
    rackGroup.add(frame)

    // Hover / stack outline (invisible by default, animated via sceneState)
    const rackOutlineMat = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 })
    const rackOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(3.26, 4.06, 1.46)),
      rackOutlineMat
    )
    rackOutline.position.set(0, 2.0, 0)
    rackGroup.add(rackOutline)

    // Bezel top ridge
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.08, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x262626, roughness: 0.4, metalness: 0.6 })
    )
    bezel.position.set(0, 3.96, 0.73)
    rackGroup.add(bezel)

    // LED column
    const ledBacking = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 3.60, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9 })
    )
    ledBacking.position.set(-1.38, 2.0, 0.74)
    rackGroup.add(ledBacking)

    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 3.60, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 0.5, metalness: 0.8 })
    )
    rail.position.set(-1.27, 2.0, 0.74)
    rackGroup.add(rail)

    const ledColorDefs = [
      '#3CD96E','#3CD96E','#3CD96E', ACCENT2,
      '#3CD96E','#3CD96E', ACCENT,  '#3CD96E',
      '#3CD96E', ACCENT2, '#3CD96E', ACCENT,
      '#3CD96E','#3CD96E', ACCENT2, '#3CD96E',
    ]
    const leds = []
    for (let i = 0; i < 16; i++) {
      const col = ledColorDefs[i]
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 8, 8),
        new THREE.MeshBasicMaterial({ color: col })
      )
      led.position.set(-1.38, 3.46 - i * 0.21, 0.77)
      led.userData.baseColor = new THREE.Color(col)
      led.userData.speed = 0.7 + Math.random() * 3.2
      led.userData.phase = Math.random() * Math.PI * 2
      rackGroup.add(led); leds.push(led)
    }

    // Bay grid: 4 rows × 4 cols
    const colX = [-0.89, -0.20, 0.49, 1.18]
    const rowY = [0.55, 1.42, 2.28, 3.14]
    const BAY_W = 0.64, BAY_H = 0.72, BAY_D = 0.22
    const BAY_Z = 0.75

    const sideMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.3, metalness: 0.7 })
    const backMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.4 })
    const edgesGeo = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(BAY_W + 0.01, BAY_H + 0.01, BAY_D + 0.01)
    )

    TECH_3D.forEach((tech, idx) => {
      const col = idx % 4
      const row = Math.floor(idx / 4)

      const faceMat  = new THREE.MeshBasicMaterial({ map: makeLogoTex(tech), color: 0xffffff })
      const bayMats  = [sideMat, sideMat, sideMat, sideMat, faceMat, backMat]

      const bay = new THREE.Mesh(new THREE.BoxGeometry(BAY_W, BAY_H, BAY_D), bayMats)
      bay.position.set(colX[col], rowY[row], BAY_Z)
      bay.userData.baseZ    = BAY_Z
      bay.userData.hoverZ   = BAY_Z + 0.28
      bay.userData.baseScX  = 1.0
      bay.userData.hoverScX = 1.04
      rackGroup.add(bay)

      const edgesMat = new THREE.LineBasicMaterial({ color: 0x2e2e2e })
      const edges = new THREE.LineSegments(edgesGeo, edgesMat)
      bay.add(edges)

      if (row < 3 && col === 0) {
        const sep = new THREE.Mesh(
          new THREE.BoxGeometry(2.74, 0.022, 0.03),
          new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.7 })
        )
        sep.position.set(0.145, rowY[row] + BAY_H * 0.5 + 0.011, 0.74)
        rackGroup.add(sep)
      }

      bayMeshes.push({
        mesh: bay, edgesMat, tech, hovering: false, row,
        idlePhase: 'rest',
        idleNextTime: 1.5 + Math.random() * 14,
        idleOutZ: BAY_Z + 0.15,
      })
    })

    // Ventilation slots
    const ventMat = new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 0.95 })
    for (let v = 0; v < 3; v++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.018, 0.025), ventMat)
      vent.position.set(0.08, 3.84 + v * 0.038, 0.715)
      rackGroup.add(vent)
    }
    for (let v = 0; v < 3; v++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.018, 0.025), ventMat)
      vent.position.set(0.08, 0.022 + v * 0.038, 0.715)
      rackGroup.add(vent)
    }

    // Power button + LED ring
    const pwrBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.018, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.2, metalness: 0.8 })
    )
    pwrBtn.rotation.x = Math.PI / 2
    pwrBtn.position.set(1.40, 0.14, 0.716)
    rackGroup.add(pwrBtn)
    const pwrRingMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(ACCENT) })
    const pwrRing = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.006, 6, 24), pwrRingMat)
    pwrRing.rotation.x = Math.PI / 2
    pwrRing.position.set(1.40, 0.14, 0.718)
    rackGroup.add(pwrRing)

    // Status display panel
    const statusCv = document.createElement('canvas')
    statusCv.width = 512; statusCv.height = 64
    const statusCtx = statusCv.getContext('2d')
    const statusTex = new THREE.CanvasTexture(statusCv)
    statusTex.colorSpace = THREE.SRGBColorSpace
    function drawStatus() {
      const up   = `${String(Math.floor(Math.random() * 99 + 1)).padStart(2, '0')}d ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}h`
      const temp = `${(52 + Math.random() * 22).toFixed(0)}°C`
      const cpu  = `CPU ${(8 + Math.random() * 64).toFixed(0)}%`
      statusCtx.fillStyle = '#050505'
      statusCtx.fillRect(0, 0, 512, 64)
      statusCtx.font = 'bold 22px monospace'
      statusCtx.fillStyle = '#3CD96E'
      statusCtx.fillText(`UP ${up}  T:${temp}  ${cpu}`, 14, 42)
      statusTex.needsUpdate = true
    }
    drawStatus()
    const statusPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.10, 0.008),
      new THREE.MeshBasicMaterial({ map: statusTex })
    )
    statusPanel.position.set(0.24, 3.74, 0.72)
    rackGroup.add(statusPanel)
    let lastStatusUpdate = 0

    // Rack ears with screws
    const earMat    = new THREE.MeshStandardMaterial({ color: 0x131313, roughness: 0.5, metalness: 0.6 })
    const screwMat  = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.3, metalness: 0.9 })
    const mScrewGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.014, 6)
    ;[-1.74, 1.74].forEach(ex => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.14, 4.02, 0.12), earMat)
      ear.position.set(ex, 2.0, 0.64)
      rackGroup.add(ear)
      ;[0.30, 3.72].forEach(sy => {
        const sc = new THREE.Mesh(mScrewGeo, screwMat)
        sc.rotation.x = Math.PI / 2
        sc.position.set(ex, sy, 0.71)
        rackGroup.add(sc)
      })
    })

    // Port strip
    const portFaceMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8 })
    const portHoleMat = new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 1.0 })
    ;[0.92, 1.06].forEach(px => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.05, 0.018), portFaceMat)
      body.position.set(px, 0.20, 0.722)
      rackGroup.add(body)
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.028, 0.016), portHoleMat)
      slot.position.set(px, 0.20, 0.728)
      rackGroup.add(slot)
    })
    const rj = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.064, 0.018), portFaceMat)
    rj.position.set(1.22, 0.20, 0.722)
    rackGroup.add(rj)

    // Corner bezel screws
    const bezelScrewGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.016, 6)
    ;[[-1.52, 3.92], [1.52, 3.92], [-1.52, 0.08], [1.52, 0.08]].forEach(([cx, cy]) => {
      const sc = new THREE.Mesh(bezelScrewGeo, screwMat)
      sc.rotation.x = Math.PI / 2
      sc.position.set(cx, cy, 0.716)
      rackGroup.add(sc)
    })

    // Per-row activity LEDs
    const rowLEDs = []
    rowY.forEach((ry, ri) => {
      const rled = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 6, 6),
        new THREE.MeshBasicMaterial({ color: new THREE.Color('#3CD96E') })
      )
      rled.position.set(1.34, ry, 0.77)
      rackGroup.add(rled)
      rowLEDs.push(rled)
    })

    // Cable bundles
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.9 })
    ;[-0.82, -0.22, 0.38, 0.92].forEach((cx, ci) => {
      const cable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028 + ci * 0.005, 0.028 + ci * 0.005, 0.9, 8),
        cableMat
      )
      cable.position.set(cx, -0.12, -0.34)
      rackGroup.add(cable)
    })

    // Model plate
    const plateCv = document.createElement('canvas')
    plateCv.width = 512; plateCv.height = 64
    const plateCtx = plateCv.getContext('2d')
    plateCtx.fillStyle = '#0d0d0d'
    plateCtx.fillRect(0, 0, 512, 64)
    plateCtx.font = 'bold 20px monospace'
    plateCtx.fillStyle = '#FF6B1A'
    plateCtx.fillText('DS-4800', 14, 40)
    plateCtx.fillStyle = '#4a4a4a'
    plateCtx.fillText('· REV.2 | SN: DR-2024', 148, 40)
    const plateTex = new THREE.CanvasTexture(plateCv)
    plateTex.colorSpace = THREE.SRGBColorSpace
    const modelPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.076, 0.008),
      new THREE.MeshBasicMaterial({ map: plateTex })
    )
    modelPlate.position.set(-0.30, 0.10, 0.722)
    rackGroup.add(modelPlate)

    // Top accent line
    const topLine = new THREE.Mesh(
      new THREE.BoxGeometry(2.76, 0.035, 0.02),
      new THREE.MeshBasicMaterial({ color: ACCENT })
    )
    topLine.position.set(0.08, 3.56, 0.74)
    rackGroup.add(topLine)

    // Save reference for overlay projection
    g.userData.rackGroup = rackGroup

    g.userData.update = (t) => {
      // Column LED blink
      leds.forEach(led => {
        const b = (Math.sin(t * led.userData.speed + led.userData.phase) + 1) * 0.5
        const c = led.userData.baseColor
        led.material.color.setRGB(c.r * b, c.g * b, c.b * b)
      })
      // Bay hover + idle pop animation
      bayMeshes.forEach(b => {
        if (sceneState !== 'stack_active' && !b.hovering) {
          if (t >= b.idleNextTime) {
            if (b.idlePhase === 'rest') {
              b.idlePhase = 'out'
              b.idleNextTime = t + 0.45 + Math.random() * 0.7
            } else {
              b.idlePhase = 'rest'
              b.idleNextTime = t + 4 + Math.random() * 10
            }
          }
        }
        const idlePopped = !b.hovering && b.idlePhase === 'out' && sceneState !== 'stack_active'
        const tz  = b.hovering ? b.mesh.userData.hoverZ   : (idlePopped ? b.idleOutZ  : b.mesh.userData.baseZ)
        const tsc = b.hovering ? b.mesh.userData.hoverScX : (idlePopped ? 1.02        : b.mesh.userData.baseScX)
        b.mesh.position.z += (tz  - b.mesh.position.z)   * 0.14
        b.mesh.scale.x    += (tsc - b.mesh.scale.x)      * 0.14
        b.mesh.scale.y    += (tsc - b.mesh.scale.y)      * 0.14
      })
      // Power ring pulse
      const pwr = (Math.sin(t * 2.4) + 1) * 0.5
      const pwrI = 0.3 + pwr * 0.7
      pwrRingMat.color.setRGB(1.0 * pwrI, 0.42 * pwrI, 0.10 * pwrI)
      // Tower LED pulse (same rhythm)
      if (g.userData.towerLedMat) {
        g.userData.towerLedMat.color.setRGB(1.0 * pwrI, 0.42 * pwrI, 0.10 * pwrI)
      }
      // Status panel refresh every 6 s
      if (t - lastStatusUpdate > 6) { lastStatusUpdate = t; drawStatus() }
      // Row activity LEDs
      rowLEDs.forEach((rled, ri) => {
        const rowHot = bayMeshes.some(b => b.hovering && b.row === ri)
        const spd = rowHot ? 9 : 1.8
        const bv  = (Math.sin(t * spd + ri * 1.1) + 1) * 0.5
        rled.material.color.setRGB(0.235 * bv, 0.85 * bv, 0.431 * bv)
      })
      // Rack outline pulse based on scene state
      const outlineTarget = sceneState === 'rack_highlighted'
        ? 0.55 + (Math.sin(t * 3.5) + 1) * 0.225
        : 0.0
      rackOutlineMat.opacity += (outlineTarget - rackOutlineMat.opacity) * 0.1
      // Map node blink
      if (g.userData.mapNodes) {
        g.userData.mapNodes.forEach(n => {
          const bv = (Math.sin(t * n.speed + n.phase) + 1) * 0.5
          if (n.isRing) {
            n.mat.opacity = bv * 0.45
          } else {
            n.mat.opacity = 0.35 + bv * 0.65
            const iv = 0.35 + bv * 0.65
            n.mat.color.setRGB(iv * 1.0, iv * 0.42, iv * 0.10)
          }
        })
      }
    }
  }

  // ── Variant 2: Tech labels ───────────────────────────────────────────────────
  function makeTextSprite(text, color) {
    const canvas = document.createElement('canvas')
    canvas.width = 2048; canvas.height = 512
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = color
    ctx.font = '600 280px "Space Grotesk", system-ui, sans-serif'
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
    return new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.6),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    )
  }

  function buildLogos() {
    const g = variants.logos
    const techs = [
      { label:'JAVA',    pos:[-3, 2, 0],       color: ACCENT   },
      { label:'SPRING',  pos:[3, 1.5, -1],     color:'#3CD96E' },
      { label:'DOCKER',  pos:[-2.5, -1, 1],    color:'#5DADE2' },
      { label:'REDIS',   pos:[2.8, -1.2, 0.5], color:'#E74C3C' },
      { label:'MONGO',   pos:[-1, 3, -1.5],    color:'#3CD96E' },
      { label:'RABBIT',  pos:[1, -2.5, 0],     color: ACCENT2  },
      { label:'MYSQL',   pos:[3.5, 3, 0],      color: INK      },
      { label:'AWS',     pos:[-3.8, 0.5, -1],  color: ACCENT   },
      { label:'MAVEN',   pos:[0, 0.5, 1.5],    color: INK      },
      { label:'GRAPHQL', pos:[0, -3.5, -1],    color:'#E74C3C' },
    ]
    const items = []
    techs.forEach((t, i) => {
      const sprite = makeTextSprite(t.label, t.color)
      sprite.position.set(...t.pos)
      sprite.userData.basePos = sprite.position.clone()
      sprite.userData.phase = i * 0.7
      sprite.userData.speed = 0.6 + i * 0.05
      g.add(sprite)
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 12, 12),
        new THREE.MeshBasicMaterial({ color: t.color })
      )
      dot.position.set(...t.pos)
      dot.userData.basePos = dot.position.clone()
      dot.userData.phase = sprite.userData.phase
      dot.userData.speed = sprite.userData.speed
      g.add(dot); items.push(sprite, dot)
    })
    g.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshBasicMaterial({ color: ACCENT })
    ))
    g.userData.update = (t) => {
      items.forEach(it => {
        it.position.y = it.userData.basePos.y + Math.sin(t * it.userData.speed + it.userData.phase) * 0.12
        it.position.x = it.userData.basePos.x + Math.cos(t * it.userData.speed * 0.6 + it.userData.phase) * 0.04
        if (it.isMesh && it.geometry.type === 'PlaneGeometry') it.lookAt(camera.position)
      })
      g.rotation.y = Math.sin(t * 0.1) * 0.15
    }
  }

  // ── Variant 3: Microservices arch ────────────────────────────────────────────
  function buildArch() {
    const g = variants.arch
    const nodeData = [
      { p:[0, 2, 0],       l:'GATEWAY', a:true  },
      { p:[-2.5, 0, 1.2],  l:'AUTH',    a:false },
      { p:[2.5, 0, 1.2],   l:'ORDERS',  a:true  },
      { p:[-2.5, 0, -1.2], l:'USERS',   a:false },
      { p:[2.5, 0, -1.2],  l:'MARKET',  a:false },
      { p:[0, -2, 0],      l:'QUEUE',   a:true  },
      { p:[-1.5, -2, 1.5], l:'CACHE',   a:false },
      { p:[1.5, -2, 1.5],  l:'DB',      a:false },
    ]
    const edges = [[0,1],[0,2],[0,3],[0,4],[1,5],[2,5],[3,5],[4,5],[5,6],[5,7],[2,4],[1,3]]
    const nodes = nodeData.map(n => {
      const group = new THREE.Group()
      group.position.set(...n.p)
      group.userData.baseY = n.p[1]; group.userData.phase = n.p[0]
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.5, 0.9),
        new THREE.MeshStandardMaterial({
          color: n.a ? 0x1a0f08 : 0x141414, roughness: 0.3, metalness: 0.5,
          emissive: n.a ? new THREE.Color(ACCENT) : new THREE.Color(0x000000),
          emissiveIntensity: n.a ? 0.4 : 0,
        })
      )
      group.add(cube)
      group.add(new THREE.LineSegments(
        new THREE.EdgesGeometry(cube.geometry),
        new THREE.LineBasicMaterial({ color: n.a ? new THREE.Color(ACCENT) : 0x333333 })
      ))
      const lbl = makeTextSprite(n.l, n.a ? ACCENT : INK)
      lbl.scale.setScalar(0.45); lbl.position.y = 0.55
      group.add(lbl); group.userData.label = lbl
      g.add(group); return group
    })
    edges.forEach(([from, to]) => {
      const geo = new THREE.BufferGeometry().setFromPoints([nodes[from].position, nodes[to].position])
      g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x2a2a2a, transparent: true, opacity: 0.6 })))
    })
    const reqs = []
    edges.forEach(([from, to], i) => {
      const s = new THREE.Vector3(...nodeData[from].p), e = new THREE.Vector3(...nodeData[to].p)
      const mid = s.clone().add(e).multiplyScalar(0.5); mid.y += 0.5
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 10, 10),
        new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? ACCENT : i % 4 === 1 ? ACCENT2 : INK })
      )
      g.add(m); reqs.push({ curve: new THREE.QuadraticBezierCurve3(s, mid, e), mesh: m, speed: 0.3 + Math.random() * 0.4, offset: Math.random() })
    })
    g.userData.update = (t) => {
      nodes.forEach(n => {
        n.position.y = n.userData.baseY + Math.sin(t + n.userData.phase) * 0.08
        if (n.userData.label) n.userData.label.lookAt(camera.position)
      })
      reqs.forEach(r => { r.mesh.position.copy(r.curve.getPointAt((t * r.speed + r.offset) % 1)) })
      g.rotation.y = Math.sin(t * 0.1) * 0.2
    }
  }

  buildRack(); buildLogos(); buildArch()

  let activeVariant = 'rack'
  variants.rack.visible = true

  function clearBayHovers() {
    bayMeshes.forEach(b => {
      if (b.hovering) { b.hovering = false; b.edgesMat.color.set(0x2e2e2e) }
    })
    activeBay = null
    hideTooltip()
  }

  function setVariant(name) {
    if (!variants[name]) return
    Object.entries(variants).forEach(([k, v]) => v.visible = k === name)
    activeVariant = name
    sceneState = 'idle'
    if (backBtn)    { backBtn.style.opacity = '0'; backBtn.style.pointerEvents = 'none' }
    if (vignetteDiv) vignetteDiv.style.background = 'rgba(0,0,0,0)'
    clearBayHovers()
    window.dispatchEvent(new CustomEvent('hero-variant', { detail: { variant: name } }))
  }
  window.__setHeroVariant = setVariant
  window.__enterStack = () => {
    setVariant('rack')
    setTimeout(() => enterStack(), 50)
  }

  const mouse      = { x: 0, y: 0 }
  const isMobile    = () => window.innerWidth < 900
  const lookTarget  = { x: -0.5, y: isMobile() ? 2.2 : 3.8, z: -1.0 }

  // Scene state machine: 'idle' | 'rack_highlighted' | 'stack_active'
  let sceneState = 'idle'
  const camPos      = new THREE.Vector3(14, 12, 14)
  const CAM_DEFAULT = new THREE.Vector3(14, 12, 14)
  const CAM_STACK   = new THREE.Vector3(8, 2.0, 0.2)
  // DOM element refs — assigned during setup below
  let vignetteDiv = null, stackLabelDiv = null, backBtn = null, rackBgDiv = null

  const onWindowMouseMove = (e) => {
    mouse.x = (e.clientX / window.innerWidth)  * 2 - 1
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1
  }

  // Bay overlay divs (HTML hit detection)
  const _bc = [
    new THREE.Vector3(-0.32, -0.36, 0.11),
    new THREE.Vector3( 0.32, -0.36, 0.11),
    new THREE.Vector3( 0.32,  0.36, 0.11),
    new THREE.Vector3(-0.32,  0.36, 0.11),
  ]
  const _tmp = new THREE.Vector3()
  const _rackCorners = [
    [-2.8, 0,   -1.04], [-0.7, 0,   -1.04],
    [-2.8, 2.6, -1.04], [-0.7, 2.6, -1.04],
    [-2.8, 0,    1.04], [-0.7, 0,    1.04],
    [-2.8, 2.6,  1.04], [-0.7, 2.6,  1.04],
  ].map(p => new THREE.Vector3(...p))
  const bayOverlayDivs = []

  bayMeshes.forEach(b => {
    const div = document.createElement('div')
    div.style.cssText = 'position:absolute;z-index:5;cursor:crosshair;'
    mount.appendChild(div)

    div.addEventListener('mouseenter', () => {
      if (sceneState !== 'stack_active') return
      if (activeBay === b) return
      if (activeBay) { activeBay.hovering = false; activeBay.edgesMat.color.set(0x2e2e2e) }
      activeBay = b
      b.hovering = true
      b.edgesMat.color.set(b.tech.color)
      showTooltip(b)
      playPress()
    })
    div.addEventListener('mouseleave', () => {
      if (sceneState !== 'stack_active' || activeBay !== b) return
      b.hovering = false
      b.edgesMat.color.set(0x2e2e2e)
      activeBay = null
      hideTooltip()
      playRelease()
    })

    bayOverlayDivs.push({ div, b })
  })

  // ── Vignette (fondo oscuro en stack_active) ─────────────────────────────
  vignetteDiv = document.createElement('div')
  vignetteDiv.style.cssText = 'position:absolute;inset:0;z-index:1;pointer-events:none;background:rgba(0,0,0,0);transition:background 0.4s ease;'
  mount.appendChild(vignetteDiv)

  // ── Label "STACK" (visible en rack_highlighted) ──────────────────────────
  stackLabelDiv = document.createElement('div')
  Object.assign(stackLabelDiv.style, {
    position: 'absolute', zIndex: '10', pointerEvents: 'auto', display: 'none',
    transform: 'translateX(-50%) translateY(-110%)',
    fontFamily: "'JetBrains Mono',monospace", fontSize: '11px',
    letterSpacing: '.12em', textTransform: 'uppercase',
    color: ACCENT, background: 'rgba(8,8,8,0.92)', border: `1px solid ${ACCENT}`,
    padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'box-shadow .2s',
  })
  stackLabelDiv.textContent = 'STACK'
  stackLabelDiv.addEventListener('mouseenter', () => { stackLabelDiv.style.boxShadow = `0 0 14px ${ACCENT}55` })
  stackLabelDiv.addEventListener('mouseleave', () => { stackLabelDiv.style.boxShadow = '' })
  stackLabelDiv.addEventListener('click', (e) => { e.stopPropagation(); enterStack() })
  mount.appendChild(stackLabelDiv)

  // ── Botón "← BACK" (visible en stack_active) ─────────────────────────────
  backBtn = document.createElement('div')
  Object.assign(backBtn.style, {
    position: 'absolute', bottom: '18px', left: '18px', zIndex: '20',
    fontFamily: "'JetBrains Mono',monospace", fontSize: '11px',
    letterSpacing: '.1em', textTransform: 'uppercase',
    color: ACCENT, background: 'rgba(8,8,8,0.92)', border: `1px solid ${ACCENT}`,
    padding: '7px 14px', cursor: 'pointer',
    opacity: '0', pointerEvents: 'none',
    transition: 'opacity .3s ease, box-shadow .2s',
  })
  backBtn.textContent = '← BACK'
  backBtn.addEventListener('mouseenter', () => { backBtn.style.boxShadow = `0 0 10px ${ACCENT}55` })
  backBtn.addEventListener('mouseleave', () => { backBtn.style.boxShadow = '' })
  backBtn.addEventListener('click', (e) => { e.stopPropagation(); returnToIdle() })
  mount.appendChild(backBtn)

  // ── Rack background overlay div (z-index 2, bajo todo lo demás) ──────────
  rackBgDiv = document.createElement('div')
  rackBgDiv.style.cssText = 'position:absolute;z-index:2;pointer-events:auto;display:none;cursor:pointer;'
  mount.appendChild(rackBgDiv)
  rackBgDiv.addEventListener('mouseenter', () => {
    if (sceneState === 'idle') sceneState = 'rack_highlighted'
  })
  rackBgDiv.addEventListener('mouseleave', (e) => {
    if (sceneState !== 'rack_highlighted') return
    const toLabel = e.relatedTarget === stackLabelDiv
    const toOtherBay = bayOverlayDivs.some(({ div }) => div === e.relatedTarget)
    if (!toLabel && !toOtherBay) sceneState = 'idle'
  })
  rackBgDiv.addEventListener('click', (e) => { e.stopPropagation(); enterStack() })

  // Click fuera del rack en stack_active → volver a idle
  mount.addEventListener('click', (e) => {
    if (sceneState !== 'stack_active') return
    const onBay  = bayOverlayDivs.some(({ div }) => div === e.target || div.contains(e.target))
    const onBack = backBtn.contains(e.target)
    if (!onBay && !onBack) returnToIdle()
  })

  function enterStack() {
    if (sceneState === 'stack_active') return
    sceneState = 'stack_active'
    backBtn.style.opacity = '1'
    backBtn.style.pointerEvents = 'auto'
    vignetteDiv.style.background = 'rgba(0,0,0,0.22)'
    stackLabelDiv.style.display = 'none'
    rackBgDiv.style.pointerEvents = 'none'
    playPress()
  }

  function returnToIdle() {
    sceneState = 'idle'
    clearBayHovers()
    backBtn.style.opacity = '0'
    backBtn.style.pointerEvents = 'none'
    vignetteDiv.style.background = 'rgba(0,0,0,0)'
    rackBgDiv.style.pointerEvents = 'auto'
    const now = clock.getElapsedTime()
    bayMeshes.forEach(b => { b.idlePhase = 'rest'; b.idleNextTime = now + 1 + Math.random() * 6 })
  }

  function updateOverlays() {
    const isRack = activeVariant === 'rack'
    if (!isRack) {
      rackBgDiv.style.display = 'none'
      stackLabelDiv.style.display = 'none'
      return
    }
    const W = mount.clientWidth, H = mount.clientHeight
    const rect = renderer.domElement.getBoundingClientRect()

    // Bay overlays — solo interactivos en stack_active
    bayOverlayDivs.forEach(({ div, b }) => {
      if (sceneState !== 'stack_active') { div.style.display = 'none'; return }
      const xs = [], ys = []
      let behind = false
      for (let i = 0; i < _bc.length; i++) {
        _tmp.copy(_bc[i])
        b.mesh.localToWorld(_tmp)
        _tmp.project(camera)
        if (_tmp.z > 1) { behind = true; break }
        xs.push((_tmp.x + 1) * 0.5 * W)
        ys.push((-_tmp.y + 1) * 0.5 * H)
      }
      if (behind) { div.style.display = 'none'; return }
      const x0 = Math.min(...xs), x1 = Math.max(...xs)
      const y0 = Math.min(...ys), y1 = Math.max(...ys)
      div.style.display = 'block'
      div.style.left    = x0 + 'px'
      div.style.top     = y0 + 'px'
      div.style.width   = (x1 - x0) + 'px'
      div.style.height  = (y1 - y0) + 'px'
      b.mesh.userData.vpX = rect.left + (x0 + x1) * 0.5
      b.mesh.userData.vpY = rect.top  + y0
    })

    // Rack AABB → rackBgDiv
    let rx0 = Infinity, ry0 = Infinity, rx1 = -Infinity, ry1 = -Infinity
    _rackCorners.forEach(c => {
      _tmp.copy(c).project(camera)
      const sx = (_tmp.x *  0.5 + 0.5) * W
      const sy = (-_tmp.y * 0.5 + 0.5) * H
      if (sx < rx0) rx0 = sx;  if (sx > rx1) rx1 = sx
      if (sy < ry0) ry0 = sy;  if (sy > ry1) ry1 = sy
    })
    rackBgDiv.style.display = sceneState !== 'stack_active' ? 'block' : 'none'
    rackBgDiv.style.left   = (rx0 - 6) + 'px'
    rackBgDiv.style.top    = (ry0 - 6) + 'px'
    rackBgDiv.style.width  = (rx1 - rx0 + 12) + 'px'
    rackBgDiv.style.height = (ry1 - ry0 + 12) + 'px'

    // Label "STACK" — encima del rack, solo en rack_highlighted
    if (sceneState === 'rack_highlighted') {
      _tmp.set(-2.0, 2.75, 0.5).project(camera)
      const lx = (_tmp.x * 0.5 + 0.5) * W
      const ly = (-_tmp.y * 0.5 + 0.5) * H
      stackLabelDiv.style.display = 'block'
      stackLabelDiv.style.left = lx + 'px'
      stackLabelDiv.style.top  = ly + 'px'
    } else {
      stackLabelDiv.style.display = 'none'
    }
  }

  const onMouseLeave = () => { if (sceneState === 'rack_highlighted') sceneState = 'idle'; clearBayHovers() }

  window.addEventListener('mousemove', onWindowMouseMove)
  mount.addEventListener('mouseleave', onMouseLeave)

  const onResize = () => {
    const d   = window.innerWidth < 900 ? D * 0.65 : D
    const asp = w() / h()
    camera.left   = -d * asp
    camera.right  =  d * asp
    camera.top    =  d
    camera.bottom = -d
    camera.updateProjectionMatrix()
    renderer.setSize(w(), h())
  }
  window.addEventListener('resize', onResize)
  const ro = new ResizeObserver(onResize)
  ro.observe(mount)

  const clock = new THREE.Clock()
  let animId
  function tick() {
    animId = requestAnimationFrame(tick)
    const t = clock.getElapsedTime()

    // Camera position — lerp hacia vista frontal del rack en stack_active
    camPos.lerp(sceneState === 'stack_active' ? CAM_STACK : CAM_DEFAULT,
                sceneState === 'stack_active' ? 0.06 : 0.04)
    camera.position.copy(camPos)

    // Zoom
    const zoomGoal = sceneState === 'stack_active' ? (isMobile() ? 2.8 : 3.8) : 1.0
    camera.zoom += (zoomGoal - camera.zoom) * 0.04
    camera.updateProjectionMatrix()

    // LookAt
    if (sceneState === 'stack_active') {
      lookTarget.x += (-2.0  - lookTarget.x) * 0.06
      lookTarget.y += ((isMobile() ? 0.8 : 1.5) - lookTarget.y) * 0.06
      lookTarget.z += (-0.05 - lookTarget.z) * 0.06
    } else {
      lookTarget.x += (mouse.x * 0.4 - 0.5 - lookTarget.x) * 0.04
      lookTarget.y += ((isMobile() ? 2.2 : 3.8) - mouse.y * 0.3 - lookTarget.y) * 0.04
      lookTarget.z += (-1.0 - lookTarget.z) * 0.04
    }
    camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z)

    const active = variants[activeVariant]
    if (active?.userData.update) active.userData.update(t)

    renderer.render(scene, camera)
    updateOverlays()
    updateTooltipPos()
  }
  tick()

  return () => {
    monitorKills.forEach(k => k())
    cancelAnimationFrame(animId)
    window.removeEventListener('mousemove', onWindowMouseMove)
    ro.disconnect()
    window.removeEventListener('resize', onResize)
    mount.removeEventListener('mouseleave', onMouseLeave)
    if (rackBgDiv    && mount.contains(rackBgDiv))    mount.removeChild(rackBgDiv)
    if (vignetteDiv  && mount.contains(vignetteDiv))  mount.removeChild(vignetteDiv)
    if (stackLabelDiv && mount.contains(stackLabelDiv)) mount.removeChild(stackLabelDiv)
    if (backBtn      && mount.contains(backBtn))      mount.removeChild(backBtn)
    bayOverlayDivs.forEach(({ div }) => { if (mount.contains(div)) mount.removeChild(div) })
    if (document.body.contains(tooltip)) document.body.removeChild(tooltip)
    renderer.dispose()
    if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
  }
}
