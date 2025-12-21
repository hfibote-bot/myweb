// planets.js — Three.js 太阳系（程序化纹理）+ 暂停按钮
// 依赖：three.js r128 + OrbitControls（在 planets.html 里用 <script> 引入）

(() => {
  // ---------- 小工具 ----------
  const TAU = Math.PI * 2;

  // 可复现随机（让每次刷新差不多）
  function seededRand(seed) {
    let s = seed >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  }

  function makeCanvasTexture(drawFn, size = 512, renderer = null) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    drawFn(g, size);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;

    if (renderer) {
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }
    tex.needsUpdate = true;
    return tex;
  }

  function clamp255(x) {
    return Math.max(0, Math.min(255, x));
  }

  // ---------- 程序化纹理 ----------
  function textureRock(baseHex, seed, renderer) {
    const r = seededRand(seed);
    return makeCanvasTexture((g, n) => {
      g.fillStyle = baseHex;
      g.fillRect(0, 0, n, n);

      const img = g.getImageData(0, 0, n, n);
      const d = img.data;

      for (let i = 0; i < d.length; i += 4) {
        const noise = (r() - 0.5) * 60;
        d[i] = clamp255(d[i] + noise);
        d[i + 1] = clamp255(d[i + 1] + noise);
        d[i + 2] = clamp255(d[i + 2] + noise);
      }
      g.putImageData(img, 0, 0);
    }, 512, renderer);
  }

  function textureStriped(base1, base2, seed, renderer) {
    const r = seededRand(seed);
    return makeCanvasTexture((g, n) => {
      for (let y = 0; y < n; y++) {
        const t = y / n;
        const s = Math.sin(t * TAU * 10 + r() * 2) * 0.5 + 0.5;
        g.fillStyle = s > 0.5 ? base1 : base2;
        g.fillRect(0, y, n, 1);
      }

      const img = g.getImageData(0, 0, n, n);
      const d = img.data;

      for (let i = 0; i < d.length; i += 4) {
        const noise = (r() - 0.5) * 30;
        d[i] = clamp255(d[i] + noise);
        d[i + 1] = clamp255(d[i + 1] + noise);
        d[i + 2] = clamp255(d[i + 2] + noise);
      }
      g.putImageData(img, 0, 0);
    }, 512, renderer);
  }

  function textureEarth(seed, renderer) {
    const r = seededRand(seed);
    return makeCanvasTexture((g, n) => {
      // 海洋
      g.fillStyle = "#1a3b8f";
      g.fillRect(0, 0, n, n);

      // 陆地斑块
      for (let i = 0; i < 230; i++) {
        const x = r() * n, y = r() * n;
        const w = 20 + r() * 90;
        const h = 12 + r() * 70;
        g.fillStyle = `rgba(${40 + Math.floor(r() * 60)}, ${120 + Math.floor(r() * 80)}, ${40 + Math.floor(r() * 40)}, 0.85)`;
        g.beginPath();
        g.ellipse(x, y, w, h, r() * Math.PI, 0, TAU);
        g.fill();
      }

      // 冰帽
      const cap1 = g.createRadialGradient(n * 0.5, n * 0.03, 0, n * 0.5, n * 0.03, n * 0.18);
      cap1.addColorStop(0, "rgba(240,240,255,0.95)");
      cap1.addColorStop(1, "rgba(240,240,255,0)");
      g.fillStyle = cap1;
      g.fillRect(0, 0, n, n);

      const cap2 = g.createRadialGradient(n * 0.5, n * 0.97, 0, n * 0.5, n * 0.97, n * 0.18);
      cap2.addColorStop(0, "rgba(240,240,255,0.95)");
      cap2.addColorStop(1, "rgba(240,240,255,0)");
      g.fillStyle = cap2;
      g.fillRect(0, 0, n, n);

      // 轻微噪点
      const img = g.getImageData(0, 0, n, n);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const noise = (r() - 0.5) * 18;
        d[i] = clamp255(d[i] + noise);
        d[i + 1] = clamp255(d[i + 1] + noise);
        d[i + 2] = clamp255(d[i + 2] + noise);
      }
      g.putImageData(img, 0, 0);
    }, 512, renderer);
  }

  function textureClouds(seed, renderer) {
    const r = seededRand(seed);
    return makeCanvasTexture((g, n) => {
      g.clearRect(0, 0, n, n);
      for (let i = 0; i < 650; i++) {
        const x = r() * n, y = r() * n;
        const rr = 6 + r() * 26;
        const a = 0.04 + r() * 0.08;
        const grd = g.createRadialGradient(x, y, 0, x, y, rr);
        grd.addColorStop(0, `rgba(255,255,255,${a})`);
        grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.arc(x, y, rr, 0, TAU);
        g.fill();
      }
    }, 512, renderer);
  }

  function textureRing(seed, renderer) {
    const r = seededRand(seed);
    return makeCanvasTexture((g, n) => {
      g.clearRect(0, 0, n, n);
      const cx = n / 2, cy = n / 2;
      for (let i = 0; i < 230; i++) {
        const rad = i / 230;
        const alpha = 0.07 + (1 - rad) * 0.25 + (r() - 0.5) * 0.02;
        const gray = 160 + Math.floor((r() - 0.5) * 30);
        g.strokeStyle = `rgba(${gray},${gray},${gray},${Math.max(0, alpha)})`;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(cx, cy, rad * (n * 0.48), 0, TAU);
        g.stroke();
      }
    }, 512, renderer);
  }

  // ---------- UI：暂停按钮 ----------
  let paused = false;

  function createUI() {
    const ui = document.createElement("div");
    ui.style.cssText = `
      position:fixed; left:12px; top:12px; z-index:9999;
      padding:10px 12px; border-radius:12px;
      background:rgba(20,20,30,0.75); color:rgba(255,255,255,0.92);
      border:1px solid rgba(255,255,255,0.14);
      backdrop-filter: blur(10px);
      font-family: system-ui, -apple-system, "Microsoft YaHei", sans-serif;
      display:flex; align-items:center; gap:10px;
    `;

    const btn = document.createElement("button");
    btn.id = "pauseBtn";
    btn.textContent = "⏸ 暂停";
    btn.style.cssText = `
      cursor:pointer; padding:8px 10px; border-radius:10px;
      border:1px solid rgba(255,255,255,0.16);
      background:rgba(255,255,255,0.06);
      color:rgba(255,255,255,0.92);
    `;

    const tip = document.createElement("span");
    tip.textContent = "空格键：暂停/继续";
    tip.style.cssText = `font-size:12px; opacity:.8;`;

    ui.appendChild(btn);
    ui.appendChild(tip);
    document.body.appendChild(ui);

    function togglePause() {
      paused = !paused;
      btn.textContent = paused ? "▶ 继续" : "⏸ 暂停";
    }

    btn.addEventListener("click", togglePause);
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePause();
      }
    });
  }

  // ---------- 主程序 ----------
  let scene, camera, renderer, controls;
  const planets = [];

  function init() {
    // 场景
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060812, 0.00055);

    // 相机
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.set(0, 150, 280);

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    // 控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 80;
    controls.maxDistance = 900;

    // 灯光
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    const sunLight = new THREE.PointLight(0xffffff, 2.2, 2500);
    scene.add(sunLight);

    // 星空
    addStars();

    // 太阳
    const sun = addSun();
    sunLight.position.copy(sun.position);

    // 行星
    createPlanets();

    // UI
    createUI();

    // resize
    window.addEventListener("resize", onResize, false);

    // 开始渲染
    animate();
  }

  function addStars() {
    const count = 12000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const r = seededRand(12345);

    for (let i = 0; i < count; i++) {
      const x = (r() - 0.5) * 2600;
      const y = (r() - 0.5) * 2600;
      const z = (r() - 0.5) * 2600;
      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // 星色：蓝白 / 黄白 / 白
      const t = r();
      let c = new THREE.Color(0xffffff);
      if (t > 0.85) c.setHex(0xaabfff);
      else if (t > 0.70) c.setHex(0xffe1b5);

      const brightness = 0.6 + r() * 0.8;
      col[i * 3 + 0] = c.r * brightness;
      col[i * 3 + 1] = c.g * brightness;
      col[i * 3 + 2] = c.b * brightness;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true
    });

    const stars = new THREE.Points(geo, mat);
    scene.add(stars);
  }

  function addSun() {
    // 太阳本体
    const sunGeo = new THREE.SphereGeometry(15, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffb14a });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);

    // 光晕 sprite
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,200,90,1)");
    grd.addColorStop(0.35, "rgba(255,140,30,0.5)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;

    const sm = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sp = new THREE.Sprite(sm);
    sp.scale.set(140, 140, 1);
    scene.add(sp);

    return sun;
  }

  function addOrbit(distance) {
    const seg = 180;
    const pts = [];
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * TAU;
      pts.push(new THREE.Vector3(Math.cos(a) * distance, 0, Math.sin(a) * distance));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
  }

  function createPlanets() {
    // 你可以改这些参数：size（半径）、distance（轨道半径）、speed（公转速度）
    const data = [
      { name: "水星", size: 2.0, distance: 28,  speed: 0.040, tex: () => textureRock("#7e7e7e", 1, renderer) },
      { name: "金星", size: 3.5, distance: 45,  speed: 0.015, tex: () => textureRock("#d6b15a", 2, renderer) },
      { name: "地球", size: 3.8, distance: 65,  speed: 0.010, tex: () => textureEarth(3, renderer), clouds: true },
      { name: "火星", size: 3.0, distance: 85,  speed: 0.008, tex: () => textureRock("#b94a2b", 4, renderer) },
      { name: "木星", size: 10,  distance: 130, speed: 0.002, tex: () => textureStriped("#d9b38c", "#c79c74", 5, renderer) },
      { name: "土星", size: 8.5, distance: 170, speed: 0.0015, tex: () => textureStriped("#f2c88f", "#d9b076", 6, renderer), ring: true },
      { name: "天王星", size: 6.0, distance: 210, speed: 0.0010, tex: () => textureRock("#6fd7d7", 7, renderer) },
      { name: "海王星", size: 5.8, distance: 250, speed: 0.0008, tex: () => textureRock("#2f58c9", 8, renderer) }
    ];

    data.forEach((d, idx) => {
      addOrbit(d.distance);

      const pivot = new THREE.Object3D();
      pivot.rotation.y = Math.random() * TAU;
      scene.add(pivot);

      const mapTex = d.tex();

      const mat = new THREE.MeshStandardMaterial({
        map: mapTex,
        roughness: 0.85,
        metalness: 0.02
      });

      const mesh = new THREE.Mesh(new THREE.SphereGeometry(d.size, 48, 48), mat);
      mesh.position.x = d.distance;

      // 轴倾角（简单一点点，观感更自然）
      mesh.rotation.z = (idx % 3 === 0 ? 0.08 : idx % 3 === 1 ? -0.12 : 0.18);

      pivot.add(mesh);

      // 地球云层 + 大气（可选）
      if (d.clouds) {
        const cloudTex = textureClouds(99, renderer);
        const cloudMat = new THREE.MeshStandardMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.85,
          depthWrite: false
        });
        const cloud = new THREE.Mesh(new THREE.SphereGeometry(d.size * 1.02, 48, 48), cloudMat);
        mesh.add(cloud);

        const atmoMat = new THREE.MeshBasicMaterial({
          color: 0x6cc6ff,
          transparent: true,
          opacity: 0.10,
          blending: THREE.AdditiveBlending
        });
        const atmo = new THREE.Mesh(new THREE.SphereGeometry(d.size * 1.06, 48, 48), atmoMat);
        mesh.add(atmo);
      }

      // 土星环
      if (d.ring) {
        const ringTex = textureRing(777, renderer);
        const ringGeo = new THREE.RingGeometry(d.size * 1.35, d.size * 2.25, 96);
        const ringMat = new THREE.MeshStandardMaterial({
          map: ringTex,
          transparent: true,
          opacity: 0.95,
          side: THREE.DoubleSide,
          roughness: 1.0,
          metalness: 0.0
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
      }

      planets.push({ pivot, mesh, speed: d.speed, name: d.name });
    });
  }

  function animate() {
    requestAnimationFrame(animate);

    controls.update();

    // ✅ 暂停时只停止运动，不影响相机拖拽/缩放
    if (!paused) {
      for (const p of planets) {
        p.pivot.rotation.y += p.speed; // 公转
        p.mesh.rotation.y += 0.02;     // 自转
      }
    }

    renderer.render(scene, camera);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  // ---------- 启动 ----------
  init();
})();
