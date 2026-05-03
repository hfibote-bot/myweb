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
};

let lastResult = null;

function ceilDiv(a,b){ return Math.ceil(a/b); }
function money(v){ return `¥${v.toFixed(2)}`; }

function computeUnitSpec(spec, grade, crop){
  const len = spec.length;
  const wid = spec.width;
  const cnt = spec.count;

  const archSpacing = wid >= 8 ? 0.98 : 0.93;
  const archPairs = (ceilDiv(len, archSpacing) + 1) * cnt;
  const beamRows = wid >= 8 ? 3 : 1;
  const beam6m = ceilDiv(len / 6, 1) * beamRows * cnt;
  const brace6m = Math.max(4, Math.round((len / 18) * (wid >= 8 ? 1 : 0.9))) * cnt;
  const clips = archPairs * (wid >= 8 ? 3.7 : 1.4);
  const frontPostSet = cnt;
  const filmWidth = wid + 3;
  const filmLength = len + 8.7;
  const poFilmM2 = filmWidth * filmLength * cnt;
  const slotSet6m = ceilDiv(len / 6, 1) * 2 * cnt;
  const greenhouseWireRoll = Math.max(3, Math.round(len / 25)) * (wid >= 8 ? 2 : 1) * cnt;
  const roofWireJin = Math.max(8, Math.round(len / 18)) * (wid >= 8 ? 2 : 1) * cnt;
  const threadingHoop = cnt;
  const dripLineM = wid * len * cnt * (crop === 'grape' ? 0.22 : 0.15);

  const rows = [
    ['弯钢管', `Ø25*${(wid>=8?12:9.6)}米`, '对', archPairs, priceLib.archPair[grade], `宽${wid}米`],
    ['大梁', 'Ø25*6米', '根', beam6m, priceLib.beam6m[grade], `${beamRows}道`],
    ['斜拉', 'Ø25*6米', '根', brace6m, priceLib.brace6m[grade], '加固'],
    ['卡子', '25', '个', clips, priceLib.clip[grade], '连接件'],
    ['棚头立柱', '', '套', frontPostSet, priceLib.frontPostSet[grade], '棚头'],
    ['PO膜', `宽${filmWidth}米*长${filmLength.toFixed(1)}米`, '平方', poFilmM2, priceLib.poFilmM2[grade], `${cnt}件`],
    ['卡槽全套', '', '根', slotSet6m, priceLib.slotSet6m[grade], '压膜'],
    ['大棚线', '', '卷', greenhouseWireRoll, priceLib.greenhouseWireRoll[grade], '稳固'],
    ['根线', '', '斤', roofWireJin, priceLib.roofWireJin[grade], '顶部'],
    ['穿线围裙', '70公分', '件', threadingHoop, priceLib.threadingHoop[grade], '端头'],
    ['滴灌管', '16mm', '米', dripLineM, (grade==='premium'?3:2.2), crop==='grape'?'葡萄双线':'常规'],
  ].map(([name, model, unit, qty, unitPrice, note]) => ({name, model, unit, qty:+qty, unitPrice:+unitPrice, amount:+qty*+unitPrice, note}));

  return {rows, wid, len, cnt};
}

function calcProject(cfg){
  const allRows = [];
  cfg.specs.forEach(sp => allRows.push(...computeUnitSpec(sp, cfg.grade, cfg.crop).rows));

  const grouped = new Map();
  for(const r of allRows){
    const k = `${r.name}|${r.model}|${r.unit}|${r.unitPrice}|${r.note}`;
    if(!grouped.has(k)) grouped.set(k, {...r});
    else {
      const g = grouped.get(k);
      g.qty += r.qty;
      g.amount += r.amount;
    }
  }

  const rows = [...grouped.values()].sort((a,b)=>a.name.localeCompare(b.name));
  const subtotal = rows.reduce((s,i)=>s+i.amount,0);
  const install = subtotal * 0.12;
  const transport = subtotal * 0.04;
  const tax = subtotal * 0.03;
  const total = subtotal + install + transport + tax;
  return {rows, subtotal, install, transport, tax, total};
}

function parseSpecs(raw){
  const specs = JSON.parse(raw);
  if(!Array.isArray(specs) || !specs.length) throw new Error('规格不能为空');
  specs.forEach((s,i)=>{
    if(!(s.width>0 && s.length>0 && s.count>0)) throw new Error(`第${i+1}行参数错误`);
  });
  return specs;
}

function build3DSvg(specs){
  let x = 40, y = 300;
  let layers = '';
  specs.forEach((s,idx)=>{
    const w = 55 + s.width * 7;
    const l = 160 + s.length * 1.8;
    const h = 38 + s.width * 4;
    for(let c=0;c<s.count;c++){
      const ox = x + c*24;
      const oy = y - c*12;
      layers += `<polygon points="${ox},${oy} ${ox+l},${oy} ${ox+l-40},${oy-h} ${ox-40},${oy-h}" fill="rgba(125,211,252,.24)" stroke="#7dd3fc"/>`;
      layers += `<path d="M${ox-40} ${oy-h} Q${ox+w/2} ${oy-h-56} ${ox+w+20} ${oy-h}" stroke="#a78bfa" fill="none" stroke-width="2"/>`;
      layers += `<line x1="${ox}" y1="${oy}" x2="${ox-40}" y2="${oy-h}" stroke="#9ca3af"/>`;
      layers += `<line x1="${ox+l}" y1="${oy}" x2="${ox+l-40}" y2="${oy-h}" stroke="#9ca3af"/>`;
    }
    layers += `<text x="${x}" y="${y+22}" fill="#fff" font-size="12">组${idx+1}: ${s.width}m×${s.length}m×${s.count}</text>`;
    y -= 86;
  });
  return `<svg id="projectSvg" viewBox="0 0 1200 620" width="100%" height="380" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="620" fill="#0b1220"/><text x="20" y="32" fill="#fff" font-size="18">温室三维搭建示意（轴测图）</text>${layers}</svg>`;
}

function render(){
  try{
    const cfg = {
      client: document.getElementById('client').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      grade: document.getElementById('grade').value,
      crop: document.getElementById('crop').value,
      specs: parseSpecs(document.getElementById('specs').value)
    };
    const r = calcProject(cfg);
    lastResult = {cfg, ...r};

    const specText = cfg.specs.map(s=>`宽${s.width}米，长${s.length}米，${s.count}个棚`).join('；');
    document.getElementById('summary').innerHTML = `<h3>项目摘要</h3><p>客户：${cfg.client} ${cfg.phone || ''}</p><p>规格：${specText}</p><p>作物：${cfg.crop==='grape'?'葡萄':cfg.crop==='vegetable'?'蔬菜':'育苗'}；材料等级：${cfg.grade}</p>`;

    const rows = r.rows.map(it=>`<tr><td>${it.name}</td><td>${it.model}</td><td>${it.unit}</td><td>${it.qty.toFixed(1)}</td><td>${money(it.unitPrice)}</td><td>${money(it.amount)}</td><td>${it.note||''}</td></tr>`).join('');
    document.getElementById('materials').innerHTML = `<h3>大棚清单</h3><table class="table"><thead><tr><th>名称</th><th>规格型号</th><th>单位</th><th>数量</th><th>单价</th><th>金额</th><th>备注</th></tr></thead><tbody>${rows}<tr><td colspan="5">材料小计</td><td>${money(r.subtotal)}</td><td></td></tr><tr><td colspan="5">安装费</td><td>${money(r.install)}</td><td></td></tr><tr><td colspan="5">运输费</td><td>${money(r.transport)}</td><td></td></tr><tr><td colspan="5">税费</td><td>${money(r.tax)}</td><td></td></tr><tr><td colspan="5"><b>合计</b></td><td><b>${money(r.total)}</b></td><td></td></tr></tbody></table>`;

    document.getElementById('drawings').innerHTML = `<h3>工程图</h3><div class="svg-wrap">${build3DSvg(cfg.specs)}</div>`;
  }catch(err){
    document.getElementById('summary').innerHTML = `<p style="color:#fca5a5">参数错误：${err.message}</p>`;
  }
}

function exportCSV(){
  if(!lastResult) return;
  const header = ['名称','规格型号','单位','数量','单价','金额','备注'];
  const lines = [header.join(',')];
  lastResult.rows.forEach(r=>lines.push([r.name,r.model,r.unit,r.qty.toFixed(1),r.unitPrice.toFixed(2),r.amount.toFixed(2),r.note||''].map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')));
  lines.push(`"合计",,,,,"${lastResult.total.toFixed(2)}",`);
  const blob = new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'greenhouse_bom.csv'; a.click();
}

function exportSVG(){
  const svg = document.getElementById('projectSvg');
  if(!svg) return;
  const blob = new Blob([svg.outerHTML],{type:'image/svg+xml;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'greenhouse_drawing.svg'; a.click();
}

function exportPNG(){
  const svg = document.getElementById('projectSvg');
  if(!svg) return;
  const data = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.outerHTML);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600; canvas.height = 900;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'greenhouse_drawing.png'; a.click();
  };
  img.src = data;
}

document.getElementById('runBtn').addEventListener('click', render);
document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
document.getElementById('exportSvgBtn').addEventListener('click', exportSVG);
document.getElementById('exportPngBtn').addEventListener('click', exportPNG);
render();
