const gradeProfiles = {
  std: { label: '经济型', spacingFactor: 1.08, braceFactor: 0.9, clipFactor: 0.95, wireFactor: 0.9, note: '基础配置' },
  pro: { label: '耐用型', spacingFactor: 1, braceFactor: 1, clipFactor: 1, wireFactor: 1, note: '常规抗风配置' },
  premium: { label: '高配型', spacingFactor: 0.9, braceFactor: 1.18, clipFactor: 1.12, wireFactor: 1.15, note: '加密骨架与加固件' }
};

const cropProfiles = {
  grape: { label: '葡萄', dripFactor: 0.22, ventFactor: 1.15, rowSpacingM: 1.8 },
  vegetable: { label: '蔬菜', dripFactor: 0.15, ventFactor: 1.0, rowSpacingM: 1.2 },
  berry: { label: '草莓', dripFactor: 0.18, ventFactor: 1.05, rowSpacingM: 1.1 },
  flower: { label: '花卉', dripFactor: 0.17, ventFactor: 1.2, rowSpacingM: 1.0 },
  seedling: { label: '育苗', dripFactor: 0.12, ventFactor: 1.3, rowSpacingM: 0.9 },
  melon: { label: '瓜果', dripFactor: 0.2, ventFactor: 1.1, rowSpacingM: 1.6 }
};

const materialFactors = {
  round: { label: '圆管', archModel: 'Ø25圆管', beamModel: 'Ø25*6米', spacingFactor: 1, beamFactor: 1, braceFactor: 1, clipFactor: 1 },
  ellipse: { label: '椭圆管', archModel: '25*50椭圆管', beamModel: '椭圆管*6米', spacingFactor: 0.96, beamFactor: 1.08, braceFactor: 1.05, clipFactor: 1.08 },
  galvanized: { label: '热镀锌加厚管', archModel: '热镀锌加厚管', beamModel: '热镀锌管*6米', spacingFactor: 0.92, beamFactor: 1.15, braceFactor: 1.12, clipFactor: 1.12 }
};

const coverFactors = {
  po: { label: 'PO膜', wasteFactor: 1.1, note: '高透光，按10%搭接损耗' },
  eva: { label: 'EVA膜', wasteFactor: 1.08, note: '保温型，按8%搭接损耗' },
  pe: { label: 'PE膜', wasteFactor: 1.05, note: '经济型，按5%搭接损耗' }
};

let lastResult = null;

function ceilTo(value, step = 1) {
  return Math.ceil(value / step) * step;
}

function asPositiveNumber(value, label, index) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`第${index + 1}行 ${label} 必须是大于0的数字`);
  }
  return num;
}

function asWholeNumber(value, label, index, min, max) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new Error(`第${index + 1}行 ${label} 必须是 ${min}-${max} 之间的整数`);
  }
  return num;
}

function parseSpecs(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error('大棚参数不是有效 JSON，请检查逗号、引号和括号');
  }

  if (!Array.isArray(parsed) || !parsed.length) {
    throw new Error('请至少填写一行大棚参数');
  }

  return parsed.map((item, index) => {
    const type = item.type || 'normal';
    if (!['normal', 'linked'].includes(type)) {
      throw new Error(`第${index + 1}行 type 只能是 normal 或 linked`);
    }

    const width = asPositiveNumber(item.width, 'width', index);
    const length = asPositiveNumber(item.length, 'length', index);
    const count = asWholeNumber(item.count, 'count', index, 1, 200);
    const bays = type === 'linked' ? asWholeNumber(item.bays || 2, 'bays', index, 2, 20) : 1;

    if (width < 3 || width > 20) throw new Error(`第${index + 1}行 width 建议控制在 3-20 米`);
    if (length < 5 || length > 300) throw new Error(`第${index + 1}行 length 建议控制在 5-300 米`);

    return { type, width, length, count, bays };
  });
}

function halfEllipseArc(width, height) {
  const a = width / 2;
  const b = height;
  const h = ((a - b) ** 2) / ((a + b) ** 2);
  const perimeter = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  return perimeter / 2;
}

function computeUnitSpec(spec, cfg) {
  const grade = gradeProfiles[cfg.grade] || gradeProfiles.pro;
  const crop = cropProfiles[cfg.crop] || cropProfiles.vegetable;
  const mat = materialFactors[cfg.pipeType] || materialFactors.round;
  const cover = coverFactors[cfg.coverType] || coverFactors.po;
  const typeLabel = spec.type === 'linked' ? '联动棚' : '普通棚';
  const bayMultiplier = spec.type === 'linked' ? spec.bays : 1;
  const unitCount = spec.count * bayMultiplier;
  const designHeight = spec.type === 'linked' ? Math.max(3.4, spec.width * 0.38) : Math.max(2.6, spec.width * 0.36);
  const baseSpacing = spec.type === 'linked' ? 1.05 : (spec.width >= 8 ? 0.98 : 0.93);
  const archSpacing = baseSpacing * grade.spacingFactor * mat.spacingFactor;
  const archCount = (Math.ceil(spec.length / archSpacing) + 1) * unitCount;
  const archPipeLength = halfEllipseArc(spec.width, designHeight);
  const archModelLength = ceilTo(archPipeLength + 0.6, 0.1);
  const beamRows = spec.type === 'linked' ? 4 : (spec.width >= 8 ? 3 : 2);
  const beam6m = Math.ceil((spec.length / 6) * beamRows * unitCount * mat.beamFactor);
  const brace6m = Math.ceil(Math.max(4, (spec.length / 18) * (spec.width >= 8 ? 1.15 : 1) * grade.braceFactor * mat.braceFactor) * unitCount);
  const clips = Math.ceil(archCount * (spec.type === 'linked' ? 5.2 : (spec.width >= 8 ? 3.8 : 2.2)) * grade.clipFactor * mat.clipFactor);
  const frontPostSet = spec.count * (spec.type === 'linked' ? 2 : 1);
  const filmWidth = spec.width + (spec.type === 'linked' ? 4.8 : 3.2);
  const filmLength = spec.length + (spec.type === 'linked' ? 11 : 9);
  const coverArea = filmWidth * filmLength * unitCount * crop.ventFactor * cover.wasteFactor;
  const slotSet6m = Math.ceil((spec.length / 6) * (spec.type === 'linked' ? 4 : 2) * unitCount);
  const wireRolls = Math.ceil(Math.max(3, spec.length / 25) * (spec.width >= 8 ? 2 : 1) * unitCount * grade.wireFactor);
  const roofWireJin = Math.ceil(Math.max(8, spec.length / 18) * (spec.width >= 8 ? 2 : 1) * unitCount * grade.wireFactor);
  const rowCount = Math.max(1, Math.floor(spec.width / crop.rowSpacingM)) * unitCount;
  const dripLineM = spec.length * rowCount * crop.dripFactor;
  const sideVentM = ceilTo(spec.length * unitCount * crop.ventFactor * (spec.type === 'linked' ? 1.2 : 1), 0.1);

  const rows = [
    ['弯拱管', `${mat.archModel}，单根约${archModelLength.toFixed(1)}米`, '根', archCount, `${typeLabel}，间距约${archSpacing.toFixed(2)}米`],
    ['纵向大梁', mat.beamModel, '根', beam6m, `${beamRows}道，${grade.note}`],
    ['斜撑加固管', mat.beamModel, '根', brace6m, spec.type === 'linked' ? '联动棚加密斜撑' : '棚体抗风加固'],
    ['连接卡具', '匹配管材', '个', clips, `${mat.label}专用卡具`],
    ['棚头立柱套件', '端面立柱/门头', '套', frontPostSet, '前后棚头'],
    ['覆盖膜', `${cover.label} 宽${filmWidth.toFixed(1)}米*长${filmLength.toFixed(1)}米`, '平方米', coverArea, cover.note],
    ['卡槽压膜线', '6米/根', '根', slotSet6m, '两侧与棚头压膜'],
    ['大棚线', '抗老化压膜线', '卷', wireRolls, '顶部与侧面稳固'],
    ['根线', '镀锌固定线', '斤', roofWireJin, '顶部固定'],
    ['穿线围裙', '70公分', '件', unitCount, '端头围护'],
    ['滴灌管', '16mm', '米', dripLineM, `${crop.label}行距方案`],
    ['侧通风预留', '卷膜器/通风口', '米', sideVentM, `${crop.label}通风需求`]
  ].map(([name, model, unit, qty, note]) => ({ name, model, unit, qty, note }));

  const floorArea = spec.width * spec.length * unitCount;
  return { rows, floorArea, coverArea, archCount, unitCount };
}

function calcProject(cfg) {
  const details = cfg.specs.map(spec => computeUnitSpec(spec, cfg));
  const grouped = new Map();

  for (const detail of details) {
    for (const row of detail.rows) {
      const key = `${row.name}|${row.model}|${row.unit}|${row.note}`;
      if (!grouped.has(key)) grouped.set(key, { ...row });
      else grouped.get(key).qty += row.qty;
    }
  }

  const rows = [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
  const totals = details.reduce((acc, item) => {
    acc.floorArea += item.floorArea;
    acc.coverArea += item.coverArea;
    acc.archCount += item.archCount;
    acc.unitCount += item.unitCount;
    return acc;
  }, { floorArea: 0, coverArea: 0, archCount: 0, unitCount: 0 });

  return { rows, totals };
}

function qs(id) {
  return document.getElementById(id);
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) continue;
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'style') node.setAttribute('style', value);
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function setExportsEnabled(enabled) {
  ['exportCsvBtn', 'exportSvgBtn', 'exportPngBtn'].forEach(id => {
    const btn = qs(id);
    if (btn) btn.disabled = !enabled;
  });
}

function formatQty(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function renderSummary(cfg, result) {
  const summary = qs('summary');
  clear(summary);
  const grade = gradeProfiles[cfg.grade] || gradeProfiles.pro;
  const crop = cropProfiles[cfg.crop] || cropProfiles.vegetable;
  const mat = materialFactors[cfg.pipeType] || materialFactors.round;
  const cover = coverFactors[cfg.coverType] || coverFactors.po;
  const specText = cfg.specs.map(spec => {
    const typeLabel = spec.type === 'linked' ? '联动棚' : '普通棚';
    return `${typeLabel} 宽${spec.width}米，长${spec.length}米，${spec.count}组${spec.type === 'linked' ? `，${spec.bays}跨` : ''}`;
  }).join('；');

  summary.append(
    el('h3', { text: '结果摘要' }),
    el('p', { text: `规格：${specText}` }),
    el('p', { text: `作物：${crop.label}；材料档次：${grade.label}；管材：${mat.label}；覆盖膜：${cover.label}` }),
    el('p', { text: `合计：折算棚体 ${result.totals.unitCount} 跨/组，占地约 ${result.totals.floorArea.toFixed(1)} 平方米，覆盖膜约 ${result.totals.coverArea.toFixed(1)} 平方米，弯拱管 ${result.totals.archCount} 根。` }),
    el('p', { text: '隐私说明：本页不记录客户姓名和电话，也不输出价格与金额。' })
  );
}

function renderMaterials(rows) {
  const holder = qs('materials');
  clear(holder);
  const table = el('table', { className: 'table' });
  const thead = el('thead');
  const headerRow = el('tr');
  ['名称', '规格型号', '单位', '数量', '备注'].forEach(text => headerRow.appendChild(el('th', { text })));
  thead.appendChild(headerRow);
  const tbody = el('tbody');
  rows.forEach(row => {
    const tr = el('tr');
    [row.name, row.model, row.unit, formatQty(row.qty), row.note || ''].forEach(text => tr.appendChild(el('td', { text })));
    tbody.appendChild(tr);
  });
  table.append(thead, tbody);
  holder.append(el('h3', { text: '材料清单（不含价格）' }), table);
}

function buildInteractiveDrawing() {
  const wrap = document.createDocumentFragment();
  wrap.append(
    el('h3', { text: '交互图纸' }),
    el('p', { className: 'hint', text: '紫色=普通棚，蓝色=联动棚；滑动控制旋转和缩放，导出 SVG 会输出矢量线稿。' })
  );
  const tools = el('div', { className: 'draw-tools' });
  tools.append(
    el('label', {}, ['旋转角度 ', el('input', { id: 'rotRange', type: 'range', min: '-45', max: '45', value: '15' })]),
    el('label', {}, ['缩放 ', el('input', { id: 'scaleRange', type: 'range', min: '70', max: '140', value: '100' })])
  );
  wrap.append(tools, el('div', { className: 'canvas-wrap' }, [el('canvas', { id: 'projectCanvas', width: '1200', height: '520', style: 'width:100%;height:380px' })]));
  return wrap;
}

function buildDrawingPrimitives(specs, rotDeg, zoomPct, width, height) {
  const rot = (rotDeg * Math.PI) / 180;
  const units = specs.map(spec => ({
    spec,
    label: `${spec.type === 'linked' ? '联动棚' : '普通棚'} ${spec.width}m*${spec.length}m*${spec.count}${spec.type === 'linked' ? `，${spec.bays}跨` : ''}`,
    color: spec.type === 'linked' ? '#38bdf8' : '#a78bfa',
    length: spec.length,
    width: spec.width * (spec.type === 'linked' ? spec.bays : 1),
    height: spec.type === 'linked' ? Math.max(3.4, spec.width * 0.38) : Math.max(2.6, spec.width * 0.36)
  }));
  const maxLength = Math.max(...units.map(item => item.length), 1);
  const totalWidth = units.reduce((sum, item) => sum + item.width, 0) + Math.max(0, units.length - 1) * 6;
  const scale = Math.min((width - 180) / (maxLength + totalWidth * 0.45), (height - 120) / (totalWidth * 0.55 + 8)) * (zoomPct / 100);
  const baseX = 90;
  const baseY = height - 70;
  let yCursor = 0;
  const lines = [];
  const labels = [];

  function project(x, y, z) {
    const xr = x * Math.cos(rot) - y * Math.sin(rot);
    const yr = x * Math.sin(rot) + y * Math.cos(rot);
    return [baseX + xr * scale, baseY - (yr * 0.48 + z) * scale];
  }

  units.forEach((item, index) => {
    const ox = 0;
    const oy = yCursor;
    const p1 = project(ox, oy, 0);
    const p2 = project(ox + item.length, oy, 0);
    const p3 = project(ox + item.length, oy + item.width, 0);
    const p4 = project(ox, oy + item.width, 0);
    const top = project(ox + item.length * 0.5, oy + item.width * 0.5, item.height);
    const mid1 = project(ox, oy + item.width * 0.5, item.height * 0.35);
    const mid2 = project(ox + item.length, oy + item.width * 0.5, item.height * 0.35);
    const edges = [[p1, p2], [p2, p3], [p3, p4], [p4, p1], [p1, top], [top, p2], [p4, top], [top, p3], [mid1, mid2]];
    edges.forEach(([from, to]) => lines.push({ from, to, color: item.color, width: 2 }));
    labels.push({ x: 20, y: 30 + index * 22, text: `组${index + 1} ${item.label}`, color: '#ffffff' });
    yCursor += item.width + 6;
  });

  return { lines, labels };
}

function drawProject(specs, rotDeg, zoomPct) {
  const canvas = qs('projectCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const drawing = buildDrawingPrimitives(specs, rotDeg, zoomPct, canvas.width, canvas.height);
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let x = 80; x < canvas.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 80);
    ctx.lineTo(x, canvas.height - 50);
    ctx.stroke();
  }
  drawing.lines.forEach(line => {
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.width;
    ctx.beginPath();
    ctx.moveTo(...line.from);
    ctx.lineTo(...line.to);
    ctx.stroke();
  });
  drawing.labels.forEach(label => {
    ctx.fillStyle = label.color;
    ctx.font = '14px sans-serif';
    ctx.fillText(label.text, label.x, label.y);
  });
}

function renderDrawing(specs) {
  const holder = qs('drawings');
  clear(holder);
  holder.appendChild(buildInteractiveDrawing());
  const rot = qs('rotRange');
  const scale = qs('scaleRange');
  const redraw = () => drawProject(specs, Number(rot.value), Number(scale.value));
  rot.addEventListener('input', redraw);
  scale.addEventListener('input', redraw);
  redraw();
}

function showError(message) {
  lastResult = null;
  setExportsEnabled(false);
  clear(qs('summary'));
  clear(qs('materials'));
  clear(qs('drawings'));
  qs('summary').appendChild(el('p', { style: 'color:#fca5a5', text: `输入有误：${message}` }));
}

function render() {
  try {
    const cfg = {
      grade: qs('grade').value,
      crop: qs('crop').value,
      pipeType: qs('pipeType').value,
      coverType: qs('coverType').value,
      specs: parseSpecs(qs('specs').value)
    };
    const result = calcProject(cfg);
    lastResult = { cfg, ...result };
    renderSummary(cfg, result);
    renderMaterials(result.rows);
    renderDrawing(cfg.specs);
    setExportsEnabled(true);
  } catch (err) {
    showError(err.message);
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function exportCSV() {
  if (!lastResult) return;
  const header = ['名称', '规格型号', '单位', '数量', '备注'];
  const lines = [header.join(',')];
  lastResult.rows.forEach(row => {
    const values = [row.name, row.model, row.unit, formatQty(row.qty), row.note || ''];
    lines.push(values.map(value => `"${String(value).replaceAll('"', '""')}"`).join(','));
  });
  downloadBlob(new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' }), 'greenhouse_materials.csv');
}

function escapeXml(value) {
  return String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function exportSVG() {
  if (!lastResult) return;
  const drawing = buildDrawingPrimitives(lastResult.cfg.specs, Number(qs('rotRange')?.value || 15), Number(qs('scaleRange')?.value || 100), 1200, 520);
  const lines = drawing.lines.map(line => `<line x1="${line.from[0].toFixed(1)}" y1="${line.from[1].toFixed(1)}" x2="${line.to[0].toFixed(1)}" y2="${line.to[1].toFixed(1)}" stroke="${line.color}" stroke-width="${line.width}" stroke-linecap="round"/>`).join('');
  const labels = drawing.labels.map(label => `<text x="${label.x}" y="${label.y}" fill="${label.color}" font-size="14" font-family="sans-serif">${escapeXml(label.text)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520"><rect width="1200" height="520" fill="#0b1220"/>${lines}${labels}</svg>`;
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'greenhouse_drawing.svg');
}

function exportPNG() {
  const canvas = qs('projectCanvas');
  if (!canvas) return;
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'greenhouse_drawing.png';
  a.click();
}

function init() {
  qs('runBtn').addEventListener('click', render);
  qs('exportCsvBtn').addEventListener('click', exportCSV);
  qs('exportSvgBtn').addEventListener('click', exportSVG);
  qs('exportPngBtn').addEventListener('click', exportPNG);
  ['grade', 'crop', 'pipeType', 'coverType'].forEach(id => qs(id).addEventListener('change', render));
  setExportsEnabled(false);
  render();
}

init();
