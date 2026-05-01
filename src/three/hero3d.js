import * as THREE from 'three'
import { TECH_3D } from './techData.js'

const ACCENT  = '#FF6B1A'
const ACCENT2 = '#FFB068'
const INK     = '#F2F0EA'
const BG      = '#0A0A0A'
const D       = 7.5  // orthographic half-size

export function initHero3D(mount) {
  const w = () => mount.clientWidth
  const h = () => mount.clientHeight

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(BG)

  const aspect = w() / h()
  const camera = new THREE.OrthographicCamera(-D * aspect, D * aspect, D, -D, 0.1, 200)
  camera.position.set(14, 12, 14)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w(), h())
  renderer.outputColorSpace = THREE.SRGBColorSpace
  mount.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 0.45))
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

    const wallMat  = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85, side: THREE.FrontSide })
    const backMat  = new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.9,  side: THREE.FrontSide })
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.88, metalness: 0.04 })
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 })

    // Floor: N×N square at y=0
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(N, N), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 0, 0)
    g.add(floor)

    // Left wall: N×N at x=-half, facing +x
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(N, H), wallMat)
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

    // Skirting boards
    const skirtH = new THREE.BoxGeometry(N, 0.07, 0.04)
    const skirtV = new THREE.BoxGeometry(0.04, 0.07, N)
    ;[
      { geo: skirtH, pos: [0,         0.035, -half + 0.02] },
      { geo: skirtV, pos: [-half + 0.02, 0.035, 0]         },
      { geo: skirtV, pos: [ half - 0.02, 0.035, 0]         },
    ].forEach(({ geo, pos }) => {
      const m = new THREE.Mesh(geo, skirtMat)
      m.position.set(...pos)
      g.add(m)
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
    const DX = 1.0   // desk center X (right half of room)
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

    // Chair base (5 arms + wheels)
    const armMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.7 })
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 })
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.028, 0.055), armMat)
      arm.position.set(SX + Math.cos(angle) * 0.22, 0.16, SZ + Math.sin(angle) * 0.22)
      arm.rotation.y = -angle
      g.add(arm)
      const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), wheelMat)
      wheel.position.set(SX + Math.cos(angle) * 0.42, 0.09, SZ + Math.sin(angle) * 0.42)
      g.add(wheel)
    }

    // ── PC Tower — on floor, right of desk ────────────────────────────
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.95, 0.25), towerMat)
    tower.position.set(2.6, 0.475, -2.3)
    g.add(tower)

    const towerLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(ACCENT) })
    const towerLed = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), towerLedMat)
    towerLed.position.set(2.76, 0.88, -2.17)
    g.add(towerLed)

    const ventMat2 = new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 1.0 })
    for (let v = 0; v < 4; v++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.016, 0.012), ventMat2)
      vent.position.set(2.76, 0.4 + v * 0.065, -2.17)
      g.add(vent)
    }

    // ── Monitor screen canvas helper ──────────────────────────────────
    function makeScreenTex(lines, bg = '#050f05', fg = '#3CD96E') {
      const cv = document.createElement('canvas')
      cv.width = 512; cv.height = 320
      const ctx = cv.getContext('2d')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 320)
      ctx.font = '14px monospace'; ctx.fillStyle = fg
      lines.forEach((line, i) => ctx.fillText(line, 12, 24 + i * 18))
      const tex = new THREE.CanvasTexture(cv)
      tex.colorSpace = THREE.SRGBColorSpace
      return tex
    }

    const mainScreenTex = makeScreenTex([
      'public class App {',
      '  @SpringBootApplication',
      '  public static void main(',
      '    String[] args) {',
      '    SpringApplication',
      '      .run(App.class, args);',
      '  }',
      '}',
      '',
      '> BUILD SUCCESS [0.8s]',
      '> Started App in 1.42s',
    ])

    const sideScreenTex = makeScreenTex([
      'docker ps',
      'NAME       STATUS',
      'redis      Up 3h',
      'mongo      Up 3h',
      'rabbit     Up 1h',
      '',
      'CPU  12%  ████░░░',
      'MEM  68%  ██████░',
    ], '#050510', '#5DADE2')

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

    // Fan arrangement — lateral inner edges pivot at central's outer edges.
    // Central: sw=1.05, center at DX=1.0 → left edge x=0.475, right edge x=1.525, z=-2.5
    // Pivot angle 35° (0.611 rad). Formulas:
    //   cx = edge_x ∓ (sw/2)*cos(θ),  cz = edge_z + (sw/2)*sin(±θ)
    const THETA = 0.611  // 35°
    const SW2   = 0.82 / 2  // 0.41
    const pyC = 1.155 + 0.375 + 0.318  // central  (sh=0.75)
    const pyS = 1.155 + 0.325 + 0.318  // side     (sh=0.65)
    addMonitor(g, DX,                             pyC, -2.5,                         0,      mainScreenTex, 1.05, 0.75)
    addMonitor(g, 0.475 - SW2 * Math.cos(THETA), pyS, -2.5 + SW2 * Math.sin(THETA),  THETA, sideScreenTex, 0.82, 0.65)
    addMonitor(g, 1.525 + SW2 * Math.cos(THETA), pyS, -2.5 + SW2 * Math.sin(THETA), -THETA, sideScreenTex, 0.82, 0.65)

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

    g.userData.towerLedMat = towerLedMat
  }

  // ── Variant 1: Server rack ────────────────────────────────────────────────────
  function buildRack() {
    const g = variants.rack

    buildRoom(g)
    buildDesk(g)

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
    ]
    const leds = []
    for (let i = 0; i < 12; i++) {
      const col = ledColorDefs[i]
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 8, 8),
        new THREE.MeshBasicMaterial({ color: col })
      )
      led.position.set(-1.38, 3.46 - i * 0.27, 0.77)
      led.userData.baseColor = new THREE.Color(col)
      led.userData.speed = 0.7 + Math.random() * 3.2
      led.userData.phase = Math.random() * Math.PI * 2
      rackGroup.add(led); leds.push(led)
    }

    // Bay grid: 4 rows × 3 cols
    const colX = [-0.78, 0.08, 0.94]
    const rowY = [0.55, 1.42, 2.28, 3.14]
    const BAY_W = 0.80, BAY_H = 0.72, BAY_D = 0.22
    const BAY_Z = 0.75

    const sideMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.3, metalness: 0.7 })
    const backMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.4 })
    const edgesGeo = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(BAY_W + 0.01, BAY_H + 0.01, BAY_D + 0.01)
    )

    TECH_3D.forEach((tech, idx) => {
      const col = idx % 3
      const row = Math.floor(idx / 3)

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
          new THREE.BoxGeometry(2.76, 0.022, 0.03),
          new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.7 })
        )
        sep.position.set(0.08, rowY[row] + BAY_H * 0.5 + 0.011, 0.74)
        rackGroup.add(sep)
      }

      bayMeshes.push({ mesh: bay, edgesMat, tech, hovering: false, row })
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
      // Bay hover animation
      bayMeshes.forEach(b => {
        const tz  = b.hovering ? b.mesh.userData.hoverZ   : b.mesh.userData.baseZ
        const tsc = b.hovering ? b.mesh.userData.hoverScX : b.mesh.userData.baseScX
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
    clearBayHovers()
    window.dispatchEvent(new CustomEvent('hero-variant', { detail: { variant: name } }))
  }
  window.__setHeroVariant = setVariant

  // Zoom targets (replaces old z-position targets)
  const camTargets = {
    rack:  { zoom: 1.0 },
    logos: { zoom: 1.0 },
    arch:  { zoom: 1.0 },
  }

  const mouse = { x: 0, y: 0 }
  const lookTarget = { x: 0, y: 0 }

  const onWindowMouseMove = (e) => {
    mouse.x = (e.clientX / window.innerWidth)  * 2 - 1
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1
  }

  // Bay overlay divs (HTML hit detection)
  const _bc = [
    new THREE.Vector3(-0.40, -0.36, 0.11),
    new THREE.Vector3( 0.40, -0.36, 0.11),
    new THREE.Vector3( 0.40,  0.36, 0.11),
    new THREE.Vector3(-0.40,  0.36, 0.11),
  ]
  const _tmp = new THREE.Vector3()
  const bayOverlayDivs = []

  bayMeshes.forEach(b => {
    const div = document.createElement('div')
    div.style.cssText = 'position:absolute;z-index:5;cursor:crosshair;'
    mount.appendChild(div)

    div.addEventListener('mouseenter', () => {
      if (activeBay === b) return
      if (activeBay) { activeBay.hovering = false; activeBay.edgesMat.color.set(0x2e2e2e) }
      activeBay = b
      b.hovering = true
      b.edgesMat.color.set(b.tech.color)
      showTooltip(b)
      playPress()
    })
    div.addEventListener('mouseleave', () => {
      if (activeBay !== b) return
      b.hovering = false
      b.edgesMat.color.set(0x2e2e2e)
      activeBay = null
      hideTooltip()
      playRelease()
    })

    bayOverlayDivs.push({ div, b })
  })

  function updateOverlays() {
    if (activeVariant !== 'rack') return
    const W = mount.clientWidth, H = mount.clientHeight
    const rect = renderer.domElement.getBoundingClientRect()

    bayOverlayDivs.forEach(({ div, b }) => {
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
  }

  const onMouseEnter = () => { camTargets.rack.zoom = 1.45 }
  const onMouseLeave = () => { camTargets.rack.zoom = 1.0; clearBayHovers() }

  window.addEventListener('mousemove', onWindowMouseMove)
  mount.addEventListener('mouseenter', onMouseEnter)
  mount.addEventListener('mouseleave', onMouseLeave)

  const onResize = () => {
    const asp = w() / h()
    camera.left   = -D * asp
    camera.right  =  D * asp
    camera.updateProjectionMatrix()
    renderer.setSize(w(), h())
  }
  window.addEventListener('resize', onResize)

  const clock = new THREE.Clock()
  let animId
  function tick() {
    animId = requestAnimationFrame(tick)
    const t      = clock.getElapsedTime()
    const target = camTargets[activeVariant] || camTargets.rack

    // Zoom (replaces z-position lerp)
    camera.zoom += (target.zoom - camera.zoom) * 0.04
    camera.updateProjectionMatrix()

    // Parallax via lookAt offset — base at (0, 1.5, -1) to center the room
    lookTarget.x += (mouse.x * 0.4 - lookTarget.x) * 0.04
    lookTarget.y += (1.5 - mouse.y * 0.3 - lookTarget.y) * 0.04
    camera.lookAt(lookTarget.x, lookTarget.y, -1)

    const active = variants[activeVariant]
    if (active?.userData.update) active.userData.update(t)

    renderer.render(scene, camera)
    updateOverlays()
    updateTooltipPos()
  }
  tick()

  return () => {
    cancelAnimationFrame(animId)
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('resize', onResize)
    mount.removeEventListener('mouseenter', onMouseEnter)
    mount.removeEventListener('mouseleave', onMouseLeave)
    bayOverlayDivs.forEach(({ div }) => { if (mount.contains(div)) mount.removeChild(div) })
    if (document.body.contains(tooltip)) document.body.removeChild(tooltip)
    renderer.dispose()
    if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
  }
}
