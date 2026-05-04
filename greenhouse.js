const priceLib = {
  archPair: { std: 35, pro: 40, premium: 48 },
  beam6m: { std: 20, pro: 24, premium: 30 },
  brace6m: { std: 20, pro: 23, premium: 28 },
  clip: { std: 0.5, pro: 0.7, premium: 1.0 },
  frontPostSet: { std: 120, pro: 145, premium: 170 },
  poFilmM2: { std: 1, pro: 1.3, premium: 1.8 },
  slotSet6m: { std: 15, pro: 18, premium: 22 },
  greenhouseWireRoll: { std: 70, pro: 80, premium: 95 },
  roofWireJin: { std: 10, pro: 12, premium: 15 },
  threadingHoop: { std: 110, pro: 130, premium: 160 },
  dripLineM: { std: 2, pro: 2.2, premium: 3.0 }
};

const cropProfiles = {
  grape: { label: '葡萄', dripFactor: 0.22, ventFactor: 1.15 },
  vegetable: { label: '蔬菜', dripFactor: 0.15, ventFactor: 1.0 },
  berry: { label: '草莓', dripFactor: 0.18, ventFactor: 1.05 },
  flower: { label: '花卉', dripFactor: 0.17, ventFactor: 1.2 },
  seedling: { label: '育苗', dripFactor: 0.12, ventFactor: 1.3 },
  melon: { label: '瓜果', dripFactor: 0.20, ventFactor: 1.1 }
};

const materialFactors = {
  round: { arch: 1.0, beam: 1.0, note: '圆管' },
  ellipse: { arch: 1.2, beam: 1.15, note: '椭圆管' },
  galvanized: { arch: 1.35, beam: 1.25, note: '热镀锌加厚管' }
};

const coverFactors = {
  po: { film: 1.0, label: 'PO膜' },
  eva: { film: 1.2, label: 'EVA膜' },
  pe: { film: 0.85, label: 'PE膜' }
};

let lastResult = null;

function ceilDiv(a, b) { return Math.ceil(a / b); }

function computeUnitSpec(spec, cfg) {
  const len = spec.length;
  const wid = spec.width;
  const cnt = spec.count;
  const type = spec.type || 'normal';
  const bays = type === 'linked' ? Math.max(2, Number(spec.bays || 2)) : 1;

  const crop = cropProfiles[cfg.crop] || cropProfiles.vegetable;
  const mat = materialFactors[cfg.pipeType] || materialFactors.round;
  const film = coverFactors[cfg.coverType] || coverFactors.po;

  const linkedBoost = type === 'linked' ? 1.25 : 1.0;
  const archSpacing = type === 'linked' ? 1.05 : (wid >= 8 ? 0.98 : 0.93);
  const archPairs = (ceilDiv(len, archSpacing) + 1) * cnt * bays;
  const beamRows = type === 'linked' ? 4 : (wid >= 8 ? 3 : 1);
  const beam6m = ceilDiv(len / 6, 1) * beamRows * cnt * bays;
  const brace6m = Math.max(4, Math.round((len / 18) * (wid >= 8 ? 1 : 0.9) * linkedBoost)) * cnt * bays;
  const clips = archPairs * (type === 'linked' ? 5 : (wid >= 8 ? 3.7 : 1.4));
  const frontPostSet = cnt * (type === 'linked' ? 2 : 1);
  const filmWidth = wid + (type === 'linked' ? 4.5 : 3);
  const filmLength = len + (type === 'linked' ? 11 : 8.7);
  const poFilmM2 = filmWidth * filmLength * cnt * bays * crop.ventFactor;
  const slotSet6m = ceilDiv(len / 6, 1) * (type === 'linked' ? 4 : 2) * cnt * bays;
  const greenhouseWireRoll = Math.max(3, Math.round(len / 25)) * (wid >= 8 ? 2 : 1) * cnt * bays;
  const roofWireJin = Math.max(8, Math.round(len / 18)) * (wid >= 8 ? 2 : 1) * cnt * bays;
  const threadingHoop = cnt * bays;
  const dripLineM = wid * len * cnt * bays * crop.dripFactor;

  const rows = [
    ['弯钢管', `Ø25*${(wid >= 8 ? 12 : 9.6)}米`, '对', archPairs, `${mat.note} ${type === 'linked' ? '联动棚' : '普通棚'}`],
    ['大梁', 'Ø25*6米', '根', beam6m, `${beamRows}道`],
    ['斜拉', 'Ø25*6米', '根', brace6m, '加固'],
    ['卡子', '25', '个', clips, '连接件'],
    ['棚头立柱', '', '套', frontPostSet, '棚头'],
    ['覆盖膜', `${film.label} 宽${filmWidth}米*长${filmLength.toFixed(1)}米`, '平方', poFilmM2, `${cnt}组`],
    ['卡槽全套', '', '根', slotSet6m, '压膜'],
    ['大棚线', '', '卷', greenhouseWireRoll, '稳固'],
    ['根线', '', '斤', roofWireJin, '顶部'],
    ['穿线围裙', '70公分', '件', threadingHoop, '端头'],
    ['滴灌管', '16mm', '米', dripLineM, `${crop.label}方案`]
  ].map(([name, model, unit, qty, note]) => ({ name, model, unit, qty: +qty, note }));

  return { rows };
}

function calcProject(cfg) {
  const allRows = [];
  cfg.specs.forEach(sp => allRows.push(...computeUnitSpec(sp, cfg).rows));

  const grouped = new Map();
  for (const r of allRows) {
    const k = `${r.name}|${r.model}|${r.unit}|${r.note}`;
    if (!grouped.has(k)) grouped.set(k, { ...r });
    else grouped.get(k).qty += r.qty;
  }

  const rows = [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
  return { rows };
}

function parseSpecs(raw) {
  const specs = JSON.parse(raw);
  if (!Array.isArray(specs) || !specs.length) throw new Error('请至少填写一行大棚参数');
  specs.forEach((s, i) => {
    if (!(s.width > 0 && s.length > 0 && s.count > 0)) throw new Error(`第${i + 1}行参数有问题，请检查宽度/长度/数量是否大于0`);
    if (s.type && !['normal', 'linked'].includes(s.type)) throw new Error(`第${i + 1}行 type 只能是 normal 或 linked`);
  });
  return specs;
}

function buildInteractiveDrawing() {
  return `
    <h3>交互图纸（普通棚/联动棚分色）</h3>
    <p class="hint">紫色=普通棚，蓝色=联动棚；使用滑杆旋转/缩放查看。</p>
    <div class="draw-tools">
      <label>旋转角度 <input id="rotRange" type="range" min="-45" max="45" value="15"></label>
      <label>缩放 <input id="scaleRange" type="range" min="70" max="140" value="100"></label>
    </div>
    <div class="canvas-wrap"><canvas id="projectCanvas" width="1200" height="520" style="width:100%;height:380px"></canvas></div>
  `;
}

function drawProject(specs, rotDeg, zoomPct) {
  const canvas = document.getElementById('projectCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rot = (rotDeg * Math.PI) / 180;
  const zoom = zoomPct / 100;
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const baseX = 120;
  const baseY = 400;

  function proj(x, y, z) {
    const xr = x * Math.cos(rot) - y * Math.sin(rot);
    const yr = x * Math.sin(rot) + y * Math.cos(rot);
    return [baseX + xr * zoom, baseY - (yr * 0.45 + z) * zoom];
  }

  specs.forEach((s, idx) => {
    const type = s.type || 'normal';
    const bays = type === 'linked' ? Math.max(2, Number(s.bays || 2)) : 1;
    const W = s.width * 14 * bays;
    const L = s.length * 5;
    const H = type === 'linked' ? 70 : 55;
    const color = type === 'linked' ? '#38bdf8' : '#a78bfa';

    for (let i = 0; i < s.count; i++) {
      const ox = idx * 230 + i * 32;
      const oy = idx * 40 - i * 10;
      const p1 = proj(ox, oy, 0);
      const p2 = proj(ox + L, oy, 0);
      const p3 = proj(ox + L, oy + W, 0);
      const p4 = proj(ox, oy + W, 0);
      const top = proj(ox + L * 0.5, oy + W * 0.5, H);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.lineTo(...p3); ctx.lineTo(...p4); ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(...p1); ctx.lineTo(...top); ctx.lineTo(...p2);
      ctx.moveTo(...p4); ctx.lineTo(...top); ctx.lineTo(...p3);
      ctx.stroke();
    }

    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`组${idx + 1} ${type === 'linked' ? '联动棚' : '普通棚'} ${s.width}m×${s.length}m×${s.count}${type === 'linked' ? `，${bays}跨` : ''}`, 20, 28 + idx * 22);
  });
}

function render() {
  try {
    const cfg = {
      grade: document.getElementById('grade').value,
      crop: document.getElementById('crop').value,
      pipeType: document.getElementById('pipeType').value,
      coverType: document.getElementById('coverType').value,
      specs: parseSpecs(document.getElementById('specs').value)
    };
    const r = calcProject(cfg);
    lastResult = { cfg, ...r };

    const specText = cfg.specs.map(s => `${s.type === 'linked' ? '联动棚' : '普通棚'} 宽${s.width}米，长${s.length}米，${s.count}组${s.type === 'linked' ? `，${s.bays || 2}跨` : ''}`).join('；');
    const cropLabel = cropProfiles[cfg.crop]?.label || cfg.crop;
    document.getElementById('summary').innerHTML = `<h3>结果摘要</h3><p>规格：${specText}</p><p>作物：${cropLabel}；材料档次：${cfg.grade}；管材：${materialFactors[cfg.pipeType].note}；覆盖膜：${coverFactors[cfg.coverType].label}</p><p>隐私说明：不记录客户姓名和电话，不展示价格与金额。</p>`;

    const rows = r.rows.map(it => `<tr><td>${it.name}</td><td>${it.model}</td><td>${it.unit}</td><td>${it.qty.toFixed(1)}</td><td>${it.note || ''}</td></tr>`).join('');
    document.getElementById('materials').innerHTML = `<h3>材料清单（不含价格）</h3><table class="table"><thead><tr><th>名称</th><th>规格型号</th><th>单位</th><th>数量</th><th>备注</th></tr></thead><tbody>${rows}</tbody></table>`;

    document.getElementById('drawings').innerHTML = buildInteractiveDrawing();
    const rot = document.getElementById('rotRange');
    const scale = document.getElementById('scaleRange');
    const redraw = () => drawProject(cfg.specs, Number(rot.value), Number(scale.value));
    rot.addEventListener('input', redraw);
    scale.addEventListener('input', redraw);
    redraw();
  } catch (err) {
    document.getElementById('summary').innerHTML = `<p style="color:#fca5a5">输入有误：${err.message}</p>`;
  }
}

function exportCSV() {
  if (!lastResult) return;
  const header = ['名称', '规格型号', '单位', '数量', '备注'];
  const lines = [header.join(',')];
  lastResult.rows.forEach(r => lines.push([r.name, r.model, r.unit, r.qty.toFixed(1), r.note || ''].map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'greenhouse_materials.csv'; a.click();
}

function exportSVG() {
  const canvas = document.getElementById('projectCanvas');
  if (!canvas) return;
  const png = canvas.toDataURL('image/png');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}"><image href="${png}" width="100%" height="100%"/></svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'greenhouse_drawing.svg'; a.click();
}

function exportPNG() {
  const canvas = document.getElementById('projectCanvas');
  if (!canvas) return;
  const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'greenhouse_drawing.png'; a.click();
}

document.getElementById('runBtn').addEventListener('click', render);
document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
document.getElementById('exportSvgBtn').addEventListener('click', exportSVG);
document.getElementById('exportPngBtn').addEventListener('click', exportPNG);
render();
