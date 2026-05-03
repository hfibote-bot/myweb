const priceLib = {
  tubeKg: { std: 5.8, pro: 6.6, premium: 7.5 },
  filmM2: { std: 8, pro: 11, premium: 16 },
  insectM2: { std: 3.5, pro: 4.2, premium: 5.8 },
  wireM: { std: 1.2, pro: 1.5, premium: 1.9 },
  clampSet: { std: 2.8, pro: 3.5, premium: 4.6 },
  dripM: { std: 1.8, pro: 2.2, premium: 3.0 },
  anchorEach: { std: 12, pro: 15, premium: 20 }
};

function factors(type){
  if(type==='linked') return {archSpacing:1.2, tubeKgPerM:8.8, filmFactor:1.25};
  if(type==='wide') return {archSpacing:1.0, tubeKgPerM:10.2, filmFactor:1.4};
  return {archSpacing:1.1, tubeKgPerM:7.2, filmFactor:1.2};
}

function calc(cfg){
  const f = factors(cfg.type);
  const areaSingle = cfg.width * cfg.length;
  const totalArea = areaSingle * cfg.count;
  const archesPerHouse = Math.ceil(cfg.length / f.archSpacing) + 1;
  const perimeterEq = 2 * cfg.length + 2 * cfg.width;
  const tubeKg = cfg.count * (cfg.length * f.tubeKgPerM + archesPerHouse * cfg.width * 2.4);
  const filmM2 = totalArea * f.filmFactor;
  const insectM2 = totalArea * 0.23;
  const wireM = cfg.count * perimeterEq * 2.2;
  const clampSet = cfg.count * archesPerHouse * 14;
  const dripM = totalArea * (cfg.crop==='grape' ? 1.8 : 1.2);
  const anchorEach = cfg.count * archesPerHouse;

  const items = [
    ['椭圆钢管（kg）', tubeKg, priceLib.tubeKg[cfg.grade]],
    ['棚膜（m²）', filmM2, priceLib.filmM2[cfg.grade]],
    ['防虫网（m²）', insectM2, priceLib.insectM2[cfg.grade]],
    ['压膜线（m）', wireM, priceLib.wireM[cfg.grade]],
    ['卡槽卡簧（套）', clampSet, priceLib.clampSet[cfg.grade]],
    ['滴灌管（m）', dripM, priceLib.dripM[cfg.grade]],
    ['地锚（个）', anchorEach, priceLib.anchorEach[cfg.grade]],
  ].map(([name, qty, unit]) => ({name, qty, unit, subtotal: qty*unit}));

  const install = items.reduce((s,i)=>s+i.subtotal,0) * 0.16;
  const transport = items.reduce((s,i)=>s+i.subtotal,0) * 0.05;
  const total = items.reduce((s,i)=>s+i.subtotal,0) + install + transport;

  return {areaSingle,totalArea,archesPerHouse,items,install,transport,total};
}

function money(v){return `¥${v.toFixed(2)}`}

function render(){
  const cfg = {
    count:+document.getElementById('count').value,
    width:+document.getElementById('width').value,
    length:+document.getElementById('length').value,
    type:document.getElementById('type').value,
    grade:document.getElementById('grade').value,
    crop:document.getElementById('crop').value,
  };
  const r = calc(cfg);

  document.getElementById('summary').innerHTML = `
    <h3>计算摘要</h3>
    <p>方案：${cfg.count} 个，单棚 ${cfg.width}m × ${cfg.length}m，总面积 ${r.totalArea.toFixed(1)} m²；每棚约 ${r.archesPerHouse} 榀拱架。</p>
    <p>针对葡萄建议：优先高透光 PO 膜 + 肩高通风 + 双路滴灌，增强夏季降温与病害控制。</p>
  `;

  const rows = r.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty.toFixed(1)}</td><td>${money(i.unit)}</td><td>${money(i.subtotal)}</td></tr>`).join('');
  document.getElementById('materials').innerHTML = `
    <h3>材料清单与报价（估算）</h3>
    <table class="table"><thead><tr><th>材料</th><th>数量</th><th>单价</th><th>小计</th></tr></thead>
    <tbody>${rows}
    <tr><td>安装费</td><td>-</td><td>-</td><td>${money(r.install)}</td></tr>
    <tr><td>运输费</td><td>-</td><td>-</td><td>${money(r.transport)}</td></tr>
    <tr><td><b>合计</b></td><td>-</td><td>-</td><td><b>${money(r.total)}</b></td></tr>
    </tbody></table>
    <p class="sub">注意：报价为演示估算，会随钢价、膜材品牌、地区施工费浮动。</p>
  `;

  const widthPx = 500, lengthPx = 900;
  const bays = Math.min(cfg.count, 8);
  let top = '';
  for(let i=0;i<bays;i++){
    top += `<rect x="${40+i*100}" y="60" width="80" height="300" fill="none" stroke="#7dd3fc"/><text x="${80+i*100}" y="380" fill="#fff" font-size="12" text-anchor="middle">#${i+1}</text>`;
  }

  document.getElementById('drawings').innerHTML = `
    <h3>工程示意图（实体+搭建）</h3>
    <div class="svg-wrap">
      <svg viewBox="0 0 ${lengthPx} ${widthPx}" width="100%" height="260" aria-label="平面布置图">
        <text x="20" y="30" fill="#fff" font-size="14">平面布置（最多显示8个棚位）</text>
        ${top}
        <line x1="40" y1="420" x2="840" y2="420" stroke="#fff"/>
        <text x="430" y="445" fill="#fff" font-size="12">总长方向</text>
      </svg>
    </div>
    <div class="svg-wrap">
      <svg viewBox="0 0 700 360" width="100%" height="260" aria-label="剖面搭建图">
        <text x="20" y="28" fill="#fff" font-size="14">单棚剖面（椭圆管拱架示意）</text>
        <path d="M100 300 Q350 70 600 300" stroke="#a78bfa" fill="none" stroke-width="4"/>
        <line x1="100" y1="300" x2="600" y2="300" stroke="#fff"/>
        <line x1="170" y1="300" x2="170" y2="210" stroke="#7dd3fc"/>
        <line x1="530" y1="300" x2="530" y2="210" stroke="#7dd3fc"/>
        <text x="285" y="335" fill="#fff" font-size="12">宽 ${cfg.width}m（比例示意）</text>
        <text x="290" y="120" fill="#fff" font-size="12">顶高约 ${(cfg.width*0.52).toFixed(1)}m</text>
      </svg>
    </div>
  `;
}

document.getElementById('runBtn').addEventListener('click', render);
render();
