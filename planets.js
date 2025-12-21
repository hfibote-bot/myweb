let scene, camera, renderer, controls;
const planets = [];

function init() {
  // 1. 场景
  scene = new THREE.Scene();
  // 添加一些迷雾，增加深邃感
  scene.fog = new THREE.FogExp2(0x050510, 0.0005);

  // 2. 相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
  camera.position.set(0, 300, 500);

  // 3. 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // 4. 控制器
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 5. 灯光
  // 环境光：调亮一点，确保背光面能看见颜色
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // 太阳点光源
  const sunLight = new THREE.PointLight(0xffffff, 1.2, 3000);
  scene.add(sunLight);

  // 6. 创建内容
  createProceduralStars(); // 代码生成星空
  createSun();             // 代码生成太阳
  createPlanets();         // 代码生成行星

  animate();
  window.addEventListener('resize', onResize, false);
}

// --- 核心技术：用代码画纹理 (Canvas) ---
// 这样就不需要去下载 jpg 图片了
function createNoiseTexture(baseColorHex, noiseType) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // 填充底色
  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, size, size);

  // 绘制噪点/条纹
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 30; // 噪点强度
    // 简单的条纹效果 (适用于木星/土星)
    let stripe = 0;
    if (noiseType === 'striped') {
      const y = Math.floor(i / 4 / size);
      stripe = Math.sin(y * 0.05) * 20;
    }

    data[i] = Math.min(255, Math.max(0, data[i] + noise + stripe));       // R
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + stripe)); // G
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + stripe)); // B
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// --- 创建星空背景 ---
function createProceduralStars() {
  const starGeo = new THREE.BufferGeometry();
  const count = 5000;
  const positions = [];
  const colors = [];

  for (let i = 0; i < count; i++) {
    // 随机分布在远处
    const r = 2000 + Math.random() * 1000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions.push(x, y, z);

    // 星星颜色微调 (蓝白、黄白)
    const starType = Math.random();
    let col = new THREE.Color();
    if (starType > 0.8) col.setHex(0xaabfff);      // 蓝
    else if (starType > 0.6) col.setHex(0xffddaa); // 黄
    else col.setHex(0xffffff);                     // 白

    colors.push(col.r, col.g, col.b);
  }

  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 2, vertexColors: true, sizeAttenuation: true
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
}

// --- 创建太阳 (带光晕) ---
function createSun() {
  // 太阳本体
  const geometry = new THREE.SphereGeometry(20, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const sun = new THREE.Mesh(geometry, material);
  scene.add(sun);

  // 制作光晕 (Sprite)
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 150, 0, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.4)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const spriteMat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    color: 0xffcc00,
    blending: THREE.AdditiveBlending,
    transparent: true
  });
  const glow = new THREE.Sprite(spriteMat);
  glow.scale.set(120, 120, 1);
  scene.add(glow);
}

// --- 创建行星 ---
function createPlanets() {
  // 数据配置
  const data = [
    { name: "水星", color: "#A9A9A9", size: 2.4, dist: 40, speed: 0.02 },
    { name: "金星", color: "#D4AF37", size: 4.0, dist: 60, speed: 0.015 },
    { name: "地球", color: "#1E90FF", size: 4.2, dist: 85, speed: 0.01, noise: 'cloud' },
    { name: "火星", color: "#FF4500", size: 3.2, dist: 110, speed: 0.008 },
    { name: "木星", color: "#DEB887", size: 12.0, dist: 160, speed: 0.004, noise: 'striped' },
    { name: "土星", color: "#F4A460", size: 10.0, dist: 210, speed: 0.003, ring: true, noise: 'striped' },
    { name: "天王星", color: "#00FFFF", size: 7.0, dist: 260, speed: 0.002 },
    { name: "海王星", color: "#4169E1", size: 6.8, dist: 300, speed: 0.001 }
  ];

  data.forEach(p => {
    const pivot = new THREE.Object3D();
    pivot.rotation.y = Math.random() * Math.PI * 2;
    scene.add(pivot);

    // 生成程序化纹理
    const tex = createNoiseTexture(p.color, p.noise);

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.8,
      metalness: 0.2,
      emissive: new THREE.Color(p.color), // 自发光一点点，防止背面全黑
      emissiveIntensity: 0.15
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.size, 32, 32), mat);
    mesh.position.x = p.dist;
    pivot.add(mesh);

    // 轨道线
    const orbitGeo = new THREE.RingGeometry(p.dist - 0.2, p.dist + 0.2, 64);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0x444444, side: THREE.DoubleSide, transparent: true, opacity: 0.3
    });
    const orbit = new THREE.Mesh(orbitGeo, orbitMat);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);

    // 土星环
    if (p.ring) {
      const ringGeo = new THREE.RingGeometry(p.size * 1.4, p.size * 2.2, 64);
      // 简单的半透明环
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xccaa88, side: THREE.DoubleSide, transparent: true, opacity: 0.6
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);
    }

    planets.push({ pivot: pivot, mesh: mesh, speed: p.speed });
  });
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  planets.forEach(p => {
    p.pivot.rotation.y += p.speed; // 公转
    p.mesh.rotation.y += 0.01;     // 自转
  });
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
