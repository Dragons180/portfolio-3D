// hero3d.js — Three.js vanilla scene with 3 hero variants
// No modules, no imports. Uses global THREE from UMD.
(function(){
  'use strict';

  const ACCENT  = '#FF6B1A';
  const ACCENT2 = '#FFB068';
  const INK     = '#F2F0EA';
  const BG      = '#0A0A0A';

  // Wait for the React shell to mount the canvas container
  function whenReady(cb){
    const tick = () => {
      const el = document.getElementById('hero-canvas-mount');
      if (el && window.THREE) cb(el);
      else requestAnimationFrame(tick);
    };
    tick();
  }

  whenReady((mount) => {
    const THREE = window.THREE;
    const w = () => mount.clientWidth;
    const h = () => mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 10, 30);

    const camera = new THREE.PerspectiveCamera(42, w()/h(), 0.1, 100);
    camera.position.set(0, 0.5, 20);

    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w(), h());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(5, 8, 5);
    scene.add(dir);
    const p1 = new THREE.PointLight(ACCENT, 0.8, 20);
    p1.position.set(-3, 3, 3);
    scene.add(p1);
    const p2 = new THREE.PointLight(ACCENT2, 0.5, 20);
    p2.position.set(4, -2, 2);
    scene.add(p2);

    // ==== Variant containers ====
    const variants = {
      rack:  new THREE.Group(),
      logos: new THREE.Group(),
      arch:  new THREE.Group(),
    };
    Object.values(variants).forEach(g => { g.visible = false; scene.add(g); });

    // ============================================================
    // VARIANT 1 — Server rack with travelling data packets
    // ============================================================
    function buildRack(){
      const g = variants.rack;
      g.position.set(0, -3, 0);
      g.scale.setScalar(0.65);

      const rackHeight = 8, units = 8, unitH = rackHeight / units;

      // Frame
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, rackHeight, 1.4),
        new THREE.MeshStandardMaterial({ color:0x1A1A1A, roughness:0.6, metalness:0.2 })
      );
      frame.position.y = rackHeight/2 - unitH/2;
      g.add(frame);

      // Server units
      for (let i=0; i<units; i++){
        const y = i * unitH;
        const isAccent = (i===2 || i===5);
        const unit = new THREE.Group();
        unit.position.set(0, y, 0.71);

        const face = new THREE.Mesh(
          new THREE.BoxGeometry(3.0, unitH * 0.86, 0.05),
          new THREE.MeshStandardMaterial({ color:0x0F0F0F, roughness:0.4, metalness:0.5 })
        );
        unit.add(face);

        // LEDs
        for (let j=0; j<8; j++){
          let col = '#222';
          if ((j+i)%3===0) col = ACCENT;
          else if (j%2===0) col = '#3CD96E';
          const led = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.04, 0.01),
            new THREE.MeshBasicMaterial({ color: col })
          );
          led.position.set(-1.3 + j*0.12, 0, 0.03);
          unit.add(led);
        }
        // Drive bays
        for (let k=0; k<4; k++){
          const bay = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, unitH*0.55, 0.01),
            new THREE.MeshStandardMaterial({ color: isAccent ? 0x2a1810 : 0x161616 })
          );
          bay.position.set(0.25 + k*0.35, 0, 0.03);
          unit.add(bay);
        }
        g.add(unit);
      }

      // Top accent
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.04, 0.02),
        new THREE.MeshBasicMaterial({ color: ACCENT })
      );
      top.position.set(0, rackHeight - unitH/2, 0.71);
      g.add(top);

      // Floor + grid
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(40,40),
        new THREE.MeshStandardMaterial({ color:0x0A0A0A, roughness:0.3, metalness:0.7 })
      );
      floor.rotation.x = -Math.PI/2;
      floor.position.y = -0.5;
      g.add(floor);
      const grid = new THREE.GridHelper(40, 40, 0x1a1a1a, 0x141414);
      grid.position.y = -0.49;
      g.add(grid);

      // Data packets
      const anchors = [
        new THREE.Vector3(-3.5, 1.2, 0.7), new THREE.Vector3(3.5, 1.2, 0.7),
        new THREE.Vector3(-3.5, 4.2, 0.7), new THREE.Vector3(3.5, 4.2, 0.7),
        new THREE.Vector3(0, -1.5, 1.2),    new THREE.Vector3(0, 8.2, 0.7),
        new THREE.Vector3(-3.5, 6.5, 0.7), new THREE.Vector3(3.5, 6.5, 0.7),
      ];
      const packets = [];
      const packetGeo = new THREE.SphereGeometry(1, 12, 12);
      const colors = [ACCENT, ACCENT2, INK];
      for (let i=0; i<22; i++){
        const a = anchors[Math.floor(Math.random()*anchors.length)];
        let b = anchors[Math.floor(Math.random()*anchors.length)];
        while (b===a) b = anchors[Math.floor(Math.random()*anchors.length)];
        const mid = a.clone().add(b).multiplyScalar(0.5);
        mid.y += 1.4; mid.z += 0.5;
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);

        // Path line
        const pts = curve.getPoints(40);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color:0x26241F, transparent:true, opacity:0.4 }));
        g.add(line);

        // Packet
        const colorPick = Math.random()>0.7 ? colors[1] : (Math.random()>0.4 ? colors[0] : colors[2]);
        const sphere = new THREE.Mesh(packetGeo, new THREE.MeshBasicMaterial({ color: colorPick }));
        sphere.scale.setScalar(0.06);
        g.add(sphere);

        packets.push({
          curve,
          mesh: sphere,
          speed: 0.15 + Math.random()*0.35,
          offset: Math.random()
        });
      }
      g.userData.packets = packets;
      g.userData.update = (t) => {
        g.rotation.y = Math.sin(t * 0.15) * 0.3;
        for (const p of packets){
          const u = ((t * p.speed + p.offset) % 1);
          const pt = p.curve.getPointAt(u);
          p.mesh.position.copy(pt);
          p.mesh.scale.setScalar(0.06 + Math.sin(u*Math.PI)*0.04);
        }
      };
    }

    // ============================================================
    // VARIANT 2 — Floating tech text labels (canvas textures)
    // ============================================================
    function makeTextSprite(text, color){
      const canvas = document.createElement('canvas');
      const size = 512;
      canvas.width = size * 4; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = color;
      ctx.font = '600 280px "Space Grotesk", system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(text, canvas.width/2, canvas.height/2);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent:true });
      // Plane sized for ~4:1 aspect
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), mat);
      return plane;
    }

    function buildLogos(){
      const g = variants.logos;
      const techs = [
        { label:'JAVA',    pos:[-3, 2, 0],     color:ACCENT },
        { label:'SPRING',  pos:[3, 1.5, -1],   color:'#3CD96E' },
        { label:'DOCKER',  pos:[-2.5, -1, 1],  color:'#5DADE2' },
        { label:'REDIS',   pos:[2.8, -1.2, 0.5], color:'#E74C3C' },
        { label:'MONGO',   pos:[-1, 3, -1.5],  color:'#3CD96E' },
        { label:'RABBIT',  pos:[1, -2.5, 0],   color:ACCENT2 },
        { label:'MYSQL',   pos:[3.5, 3, 0],    color:INK },
        { label:'AWS',     pos:[-3.8, 0.5, -1], color:ACCENT },
        { label:'MAVEN',   pos:[0, 0.5, 1.5],  color:INK },
        { label:'GRAPHQL', pos:[0, -3.5, -1],  color:'#E74C3C' },
      ];
      const items = [];
      techs.forEach((t,i) => {
        const sprite = makeTextSprite(t.label, t.color);
        sprite.position.set(...t.pos);
        sprite.userData.basePos = sprite.position.clone();
        sprite.userData.phase = i * 0.7;
        sprite.userData.speed = 0.6 + i*0.05;
        g.add(sprite);

        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 12, 12),
          new THREE.MeshBasicMaterial({ color: t.color })
        );
        dot.position.set(...t.pos);
        dot.userData.basePos = dot.position.clone();
        dot.userData.phase = sprite.userData.phase;
        dot.userData.speed = sprite.userData.speed;
        g.add(dot);

        items.push(sprite, dot);
      });

      // Central core
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 16, 16),
        new THREE.MeshBasicMaterial({ color: ACCENT })
      );
      g.add(core);

      g.userData.update = (t) => {
        items.forEach(it => {
          it.position.y = it.userData.basePos.y + Math.sin(t * it.userData.speed + it.userData.phase) * 0.12;
          it.position.x = it.userData.basePos.x + Math.cos(t * it.userData.speed * 0.6 + it.userData.phase) * 0.04;
          if (it.isMesh && it.geometry.type === 'PlaneGeometry') {
            it.lookAt(camera.position);
          }
        });
        g.rotation.y = Math.sin(t * 0.1) * 0.15;
      };
    }

    // ============================================================
    // VARIANT 3 — Microservices architecture
    // ============================================================
    function buildArch(){
      const g = variants.arch;
      const nodeData = [
        { p:[0, 2, 0],     l:'GATEWAY', a:true  },
        { p:[-2.5, 0, 1.2],  l:'AUTH',    a:false },
        { p:[2.5, 0, 1.2],   l:'ORDERS',  a:true  },
        { p:[-2.5, 0, -1.2], l:'USERS',   a:false },
        { p:[2.5, 0, -1.2],  l:'MARKET',  a:false },
        { p:[0, -2, 0],    l:'QUEUE',   a:true  },
        { p:[-1.5, -2, 1.5], l:'CACHE',   a:false },
        { p:[1.5, -2, 1.5],  l:'DB',      a:false },
      ];
      const edges = [
        [0,1],[0,2],[0,3],[0,4],
        [1,5],[2,5],[3,5],[4,5],
        [5,6],[5,7],
        [2,4],[1,3]
      ];

      const nodes = nodeData.map(n => {
        const group = new THREE.Group();
        group.position.set(...n.p);
        group.userData.baseY = n.p[1];
        group.userData.phase = n.p[0];

        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.5, 0.9),
          new THREE.MeshStandardMaterial({
            color: n.a ? 0x1a0f08 : 0x141414,
            roughness:0.3, metalness:0.5,
            emissive: n.a ? new THREE.Color(ACCENT) : new THREE.Color(0x000000),
            emissiveIntensity: n.a ? 0.4 : 0
          })
        );
        group.add(cube);

        // Edges (wireframe lines)
        const edgesGeo = new THREE.EdgesGeometry(cube.geometry);
        const edgeLines = new THREE.LineSegments(
          edgesGeo,
          new THREE.LineBasicMaterial({ color: n.a ? new THREE.Color(ACCENT) : 0x333333 })
        );
        group.add(edgeLines);

        // Label sprite
        const lbl = makeTextSprite(n.l, n.a ? ACCENT : INK);
        lbl.scale.setScalar(0.45);
        lbl.position.y = 0.55;
        group.add(lbl);
        group.userData.label = lbl;

        g.add(group);
        return group;
      });

      // Edges between nodes
      edges.forEach(([from,to]) => {
        const a = nodes[from].position;
        const b = nodes[to].position;
        const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color:0x2a2a2a, transparent:true, opacity:0.6 }));
        g.add(line);
      });

      // Travelling requests on edges
      const reqs = [];
      const reqGeo = new THREE.SphereGeometry(0.06, 10, 10);
      edges.forEach(([from,to], i) => {
        const a = nodeData[from].p, b = nodeData[to].p;
        const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
        const mid = start.clone().add(end).multiplyScalar(0.5);
        mid.y += 0.5;
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const col = i%4===0 ? ACCENT : (i%4===1 ? ACCENT2 : INK);
        const m = new THREE.Mesh(reqGeo, new THREE.MeshBasicMaterial({ color: col }));
        g.add(m);
        reqs.push({
          curve, mesh:m,
          speed: 0.3 + Math.random()*0.4,
          offset: Math.random()
        });
      });

      g.userData.update = (t) => {
        nodes.forEach(n => {
          n.position.y = n.userData.baseY + Math.sin(t + n.userData.phase) * 0.08;
          if (n.userData.label) n.userData.label.lookAt(camera.position);
        });
        for (const r of reqs){
          const u = (t * r.speed + r.offset) % 1;
          r.mesh.position.copy(r.curve.getPointAt(u));
        }
        g.rotation.y = Math.sin(t * 0.1) * 0.2;
      };
    }

    buildRack();
    buildLogos();
    buildArch();

    // ==== Variant switcher ====
    let activeVariant = 'rack';
    variants.rack.visible = true;

    function setVariant(name){
      if (!variants[name]) return;
      Object.entries(variants).forEach(([k,v]) => v.visible = (k===name));
      activeVariant = name;
      window.dispatchEvent(new CustomEvent('hero-variant', { detail:{ variant:name } }));
    }
    window.__setHeroVariant = setVariant;

    // Camera targets
    const camTargets = {
      rack:  { x:0, y:0.5, z:20 },
      logos: { x:0, y:0,   z:8 },
      arch:  { x:0, y:0.5, z:8 }
    };

    // Mouse parallax
    const mouse = { x:0, y:0 };
    window.addEventListener('mousemove', (e) => {
      const r = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width)  * 2 - 1;
      mouse.y = ((e.clientY - r.top)  / r.height) * 2 - 1;
    });

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = w()/h();
      camera.updateProjectionMatrix();
      renderer.setSize(w(), h());
    });

    // Animation loop
    const clock = new THREE.Clock();
    function tick(){
      const t = clock.getElapsedTime();
      const target = camTargets[activeVariant] || camTargets.rack;
      camera.position.x += ((target.x + mouse.x*1.2) - camera.position.x) * 0.04;
      camera.position.y += ((target.y - mouse.y*0.6) - camera.position.y) * 0.04;
      camera.position.z += (target.z - camera.position.z) * 0.04;
      camera.lookAt(0, activeVariant==='rack' ? 0.5 : 0, 0);

      const active = variants[activeVariant];
      if (active && active.userData.update) active.userData.update(t);

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();
  });
})();
