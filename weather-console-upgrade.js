(function(){
  const loc={wuhu:{label:"\u829c\u6e56",latitude:31.3525,longitude:118.4331}};
  const P={
    sunny:["\u6674\u6717","sunny",18,2,1,8,92,0,"afternoon","afternoon"],
    cloudy:["\u591a\u4e91","cloudy",36,3,1,70,78,0,"afternoon",""],
    overcast:["\u9634\u5929","cloudy",45,4,1,95,65,0,"afternoon",""],
    foggy:["\u96fe","foggy",62,1,1,86,28,0,"morning",""],
    rainy:["\u5c0f\u96e8","rainy",46,3,1,78,70,0,"afternoon",""],
    downpour:["\u5927\u96e8","rainy",90,8,1,94,44,18,"afternoon",""],
    thunderstorm:["\u96f7\u96e8","thunderstorm",88,9,-1,98,38,90,"night",""],
    light_snow:["\u5c0f\u96ea","snowy",38,3,-1,72,72,0,"afternoon",""],
    snowy:["\u5927\u96ea","snowy",100,7,-1,90,34,0,"night",""],
    dust:["\u6c99\u5c18","duststorm",62,7,1,56,42,0,"sunset",""],
    night_clear:["\u591c\u7a7a","night_clear",20,2,1,6,96,0,"night","night"],
    sunrise:["\u65e5\u51fa","sunny",22,2,1,18,86,0,"morning","morning"],
    sunset:["\u665a\u971e","sunny",24,2,1,34,84,0,"sunset","sunset"]
  };
  let key="sunny",S=null,cv,ctx,w=0,h=0,t=0,flash=0,fc="rgba(190,210,255,",stars=[],galaxy=[],clouds=[],rain=[],snow=[],boltPath=[],boltBranches=[];
  const $=id=>document.getElementById(id);
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function addWuhu(){
    const s=$("weatherPreset"); if(!s)return;
    if(!s.querySelector('option[value="wuhu"]')){
      const o=document.createElement("option"); o.value="wuhu"; o.textContent="\u829c\u6e56";
      s.insertBefore(o,s.querySelector('option[value="picked"]'));
    }
    s.addEventListener("change",()=>{
      if(s.value!=="wuhu")return;
      setTimeout(()=>{
        window.weatherBackground?.syncByCoords?.(loc.wuhu.latitude,loc.wuhu.longitude).then(r=>{
          const wx=r?.weather||{}; setWeatherStatus(`\u5929\u6c14\u52a8\u6001\u80cc\u666f\uff1a\u829c\u6e56 \u00b7 ${wx.timeOfDay==="night"?"\u591c\u95f4":"\u767d\u5929"}${describeWeatherState(wx)}\uff08\u5b9e\u65f6\uff09`);
        }).catch(()=>setWeatherStatus("\u5929\u6c14\u52a8\u6001\u80cc\u666f\uff1a\u829c\u6e56\u5929\u6c14\u62c9\u53d6\u5931\u8d25\uff0c\u4f7f\u7528\u9ed8\u8ba4\u5929\u7a7a\u98ce\u683c\u3002"));
      },0);
    });
  }
  function replaceOpenButton(){
    const old=$("openWeatherLabBtn"); if(!old || old.dataset.upgraded==="1")return;
    const b=old.cloneNode(true); b.dataset.upgraded="1"; b.textContent="\u26c8\ufe0f \u5929\u6c14\u8c03\u5236\u53f0";
    old.parentNode.replaceChild(b,old);
    b.addEventListener("click",()=>{const lab=$("weatherLab"); if(!lab)return; lab.hidden=!lab.hidden; if(!lab.hidden)build();});
  }
  function build(){
    const lab=$("weatherLab"); if(!lab || lab.dataset.clean==="1")return; lab.dataset.clean="1";
    lab.innerHTML=`
    <div class="weather-lab-head"><div><h3>\u5929\u6c14\u8c03\u5236\u53f0</h3><p>\u624b\u52a8\u6a21\u62df\u5929\u6c14\u80cc\u666f\uff0c\u53c2\u6570\u4fdd\u7559\u5e38\u7528\u9879\uff0c\u5148\u628a\u753b\u9762\u8c03\u6e05\u695a\u3002</p></div><button id="closeWeatherLabBtn" class="weather-lab-close" type="button">\u00d7</button></div>
    <div class="weather-lab-section"><div class="weather-lab-section-title">\u5929\u6c14\u7c7b\u578b</div><div class="weather-preset-grid">
      ${btn("live","\u5b9e\u65f6\u5929\u6c14")}${btn("sunny","\u6674\u6717")}${btn("cloudy","\u591a\u4e91")}${btn("overcast","\u9634\u5929")}${btn("foggy","\u96fe")}${btn("rainy","\u5c0f\u96e8")}${btn("downpour","\u5927\u96e8")}${btn("thunderstorm","\u96f7\u96e8")}${btn("light_snow","\u5c0f\u96ea")}${btn("snowy","\u5927\u96ea")}${btn("dust","\u6c99\u5c18")}${btn("night_clear","\u591c\u7a7a")}${btn("sunrise","\u65e5\u51fa")}${btn("sunset","\u665a\u971e")}
    </div></div>
    <div class="weather-lab-control-grid">
      <div class="weather-lab-section"><div class="weather-lab-section-title">\u5929\u7a7a\u4e0e\u7a7a\u6c14</div><div class="weather-lab-controls">
        ${range("weatherCloud","\u4e91\u91cf",0,100,8,"%")}${range("weatherVisibility","\u7a7a\u6c14\u901a\u900f\u5ea6",0,100,92,"%")}
        <label>\u5149\u7167\u65f6\u6bb5<select id="weatherTimeOfDay"><option value="morning">\u6e05\u6668</option><option value="afternoon">\u6b63\u5348</option><option value="sunset">\u9ec4\u660f</option><option value="night">\u591c\u665a</option></select></label>
      </div></div>
      <div class="weather-lab-section"><div class="weather-lab-section-title">\u964d\u6c34\u4e0e\u98ce</div><div class="weather-lab-controls">
        ${range("weatherDensity","\u964d\u6c34\u5f3a\u5ea6",0,100,18,"%")}${range("weatherWind","\u98ce\u901f",0,12,2,"")}
        <label>\u98ce\u5411<select id="weatherWindDirection"><option value="1">\u5411\u53f3\u98d8\u79fb \u2192</option><option value="-1">\u5411\u5de6\u98d8\u79fb \u2190</option></select></label>
      </div></div>
      <div class="weather-lab-section"><div class="weather-lab-section-title">\u96f7\u7535</div><div class="weather-lab-controls">
        ${range("weatherLightning","\u96f7\u7535\u6d3b\u52a8",0,100,0,"%")}
        <label>\u95ea\u7535\u989c\u8272<select id="weatherLightningColor"><option value="mixed">\u6df7\u5408\u53d8\u5316</option><option value="white">\u51b7\u767d</option><option value="violet">\u84dd\u7d2b</option><option value="cyan">\u9752\u767d</option><option value="gold">\u6de1\u91d1</option><option value="rose">\u7c89\u7d2b</option></select></label>
      </div></div>
    </div>
    <div class="weather-lab-actions"><button id="applyWeatherLabBtn" class="btn" type="button">\u5e94\u7528\u8c03\u5236</button><button id="strikeWeatherLabBtn" class="btn ghost" type="button">\u624b\u52a8\u6253\u4e00\u95ea\u7535</button></div>`;
    $("closeWeatherLabBtn").onclick=()=>lab.hidden=true;
    lab.querySelectorAll("[data-wx]").forEach(b=>b.onclick=()=>{ if(b.dataset.wx==="live"){mark("live");setWeatherStatus("\u5929\u6c14\u52a8\u6001\u80cc\u666f\uff1a\u6b63\u5728\u5207\u6362\u5230\u5b9e\u65f6\u5929\u6c14\u2026");Promise.resolve(applyWeather(getActiveWeatherLocation())).finally(()=>{S=null;clear();});return;} load(b.dataset.wx); apply(); });
    ["weatherCloud","weatherVisibility","weatherDensity","weatherWind","weatherLightning"].forEach(id=>$(id).oninput=readouts);
    $("applyWeatherLabBtn").onclick=apply; $("strikeWeatherLabBtn").onclick=()=>bolt(true);
    load(key);
  }
  const btn=(k,l)=>`<button type="button" data-wx="${k}">${l}</button>`;
  const range=(id,l,min,max,v,u)=>`<label>${l} <span id="${id}Value">${v}</span>${u}<input id="${id}" type="range" min="${min}" max="${max}" value="${v}"></label>`;
  function set(id,v){const n=$(id); if(n)n.value=String(v);}
  function mark(k){document.querySelectorAll("[data-wx]").forEach(b=>b.classList.toggle("is-active",b.dataset.wx===k));}
  function readouts(){["weatherCloud","weatherVisibility","weatherDensity","weatherWind","weatherLightning"].forEach(id=>{const n=$(id),v=$(id+"Value"); if(n&&v)v.textContent=n.value;});}
  function load(k){
    key=k; const p=P[k]||P.sunny; set("weatherDensity",p[2]); set("weatherWind",p[3]); set("weatherWindDirection",p[4]); set("weatherCloud",p[5]); set("weatherVisibility",p[6]); set("weatherLightning",p[7]); set("weatherTimeOfDay",p[9]||p[8]);
    const time=$("weatherTimeOfDay"); if(time){time.disabled=Boolean(p[9]); time.title=p[9]?"\u8fd9\u4e2a\u5929\u6c14\u7c7b\u578b\u5df2\u56fa\u5b9a\u5149\u7167\u65f6\u6bb5":"";}
    readouts(); mark(k);
  }
  function state(){
    const p=P[key]||P.sunny, dir=Number($("weatherWindDirection")?.value||p[4]), wind=Number($("weatherWind")?.value||p[3]);
    return {label:p[0],type:p[1],density:Number($("weatherDensity")?.value||p[2]),windSpeed:wind*dir,cloudCover:Number($("weatherCloud")?.value||p[5]),visibility:Number($("weatherVisibility")?.value||p[6]),lightningFrequency:Number($("weatherLightning")?.value||p[7]),timeOfDay:p[9]||$("weatherTimeOfDay")?.value||p[8],lightningColor:$("weatherLightningColor")?.value||"mixed"};
  }
  function apply(){
    S=state(); ensure(); window.weatherBackground?.setWeather?.({type:S.type,timeOfDay:S.timeOfDay,density:S.density,windSpeed:S.windSpeed,cloudCover:S.cloudCover,lightningFrequency:S.lightningFrequency,conditionLabel:S.label});
    document.body.dataset.weather=legacyKindFromBackgroundType(S.type); document.body.dataset.daypart=S.timeOfDay==="night"?"night":"day";
    setWeatherStatus(`\u5929\u6c14\u52a8\u6001\u80cc\u666f\uff1a\u5f53\u524d\u6a21\u62df \u00b7 ${S.label} \u00b7 \u98ce\u901f ${Math.abs(S.windSpeed)} \u00b7 \u4e91\u91cf ${S.cloudCover}% \u00b7 \u7a7a\u6c14\u901a\u900f\u5ea6 ${S.visibility}%`);
    if(S.type==="thunderstorm")bolt(true);
  }
  function ensure(){ if(cv)return; const stage=document.getElementById("ambient-weather-bg")||document.body; cv=document.createElement("canvas"); cv.id="weather-upgrade-canvas"; Object.assign(cv.style,{position:"fixed",inset:"0",width:"100vw",height:"100vh",pointerEvents:"none",zIndex:"1"}); stage.appendChild(cv); ctx=cv.getContext("2d"); addEventListener("resize",resize,{passive:true}); resize(); loop(); }
  function resize(){ if(!cv)return; const r=Math.min(devicePixelRatio||1,2); w=innerWidth; h=innerHeight; cv.width=w*r; cv.height=h*r; ctx.setTransform(r,0,0,r,0,0); stars=Array.from({length:210},()=>({x:Math.random()*w,y:Math.random()*h*.72,r:rnd(.35,1.8),p:Math.random()*7})); galaxy=Array.from({length:260},()=>({x:rnd(-w*.58,w*.58),y:rnd(-h*.12,h*.12),r:rnd(.35,1.9),o:rnd(.06,.42),c:Math.random()>.72?"180,210,255":Math.random()>.48?"255,224,190":"255,255,255"})); clouds=Array.from({length:14},()=>({x:Math.random()*w,y:rnd(0,h*.42),r:rnd(70,170),v:rnd(.04,.16),p:Math.random()*7})); rain=Array.from({length:260},()=>({x:rnd(-80,w+80),y:rnd(-h,h),l:rnd(12,28),v:rnd(10,20),o:rnd(.16,.5)})); snow=Array.from({length:360},()=>({x:rnd(-80,w+80),y:rnd(-h,h),r:rnd(.8,6.8),v:rnd(.5,3.2),p:Math.random()*7,o:rnd(.25,.9),rot:Math.random()*7})); }
  function clear(){ if(ctx)ctx.clearRect(0,0,w,h); }
  function bg(s){ if(s.timeOfDay==="night")return["#020617","#0b1226","#172554"]; if(s.timeOfDay==="morning")return["#fb923c","#fde68a","#7dd3fc"]; if(s.timeOfDay==="sunset")return["#271033","#f97316","#f9a8d4"]; if(s.type==="foggy")return["#94a3b8","#cbd5e1","#e5e7eb"]; if(s.type==="rainy"||s.type==="thunderstorm")return["#0f172a","#334155","#64748b"]; if(s.type==="snowy")return["#dbeafe","#eff6ff","#fff"]; if(s.type==="duststorm")return["#6b3f1d","#9a6a2f","#d8b069"]; return["#0ea5e9","#38bdf8","#bae6fd"]; }
  function loop(){ if(!ctx)return; t++; clear(); if(!S){requestAnimationFrame(loop);return;} const g=ctx.createLinearGradient(0,0,0,h); bg(S).forEach((c,i,a)=>g.addColorStop(i/(a.length-1),c)); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); sunmoon(); star(); cloud(); drops(); flakes(); haze(); lightning(); requestAnimationFrame(loop); }
  function sunmoon(){ if(S.timeOfDay==="night"){ctx.fillStyle="rgba(226,232,240,.85)";ctx.beginPath();ctx.arc(w*.78,h*.16,28,0,7);ctx.fill();return;} const x=S.timeOfDay==="morning"?w*.18:S.timeOfDay==="sunset"?w*.78:w*.5,y=S.timeOfDay==="sunset"?h*.52:h*.18,g=ctx.createRadialGradient(x,y,2,x,y,Math.max(w,h)*.44); g.addColorStop(0,S.timeOfDay==="sunset"?"rgba(251,146,60,.9)":"rgba(255,255,255,.95)"); g.addColorStop(.28,S.timeOfDay==="sunset"?"rgba(244,114,182,.28)":"rgba(254,240,138,.42)"); g.addColorStop(1,"rgba(255,255,255,0)"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); const core=ctx.createRadialGradient(x,y,2,x,y,S.timeOfDay==="sunset"?42:34); core.addColorStop(0,"rgba(255,255,255,1)"); core.addColorStop(.45,S.timeOfDay==="sunset"?"rgba(251,146,60,.95)":"rgba(254,240,138,.98)"); core.addColorStop(1,"rgba(253,224,71,0)"); ctx.fillStyle=core; ctx.beginPath(); ctx.arc(x,y,S.timeOfDay==="sunset"?42:34,0,7); ctx.fill(); }
  function star(){ if(S.timeOfDay!=="night")return; const q=clamp((S.visibility/100)*(1-S.cloudCover/115),0,1); ctx.save(); ctx.translate(w*.5,h*.43); ctx.rotate(-.28); const band=ctx.createRadialGradient(0,0,0,0,0,Math.max(w,h)*.62); band.addColorStop(0,`rgba(190,220,255,${q*.18})`); band.addColorStop(.28,`rgba(244,210,255,${q*.11})`); band.addColorStop(.72,`rgba(125,180,255,${q*.05})`); band.addColorStop(1,"rgba(255,255,255,0)"); ctx.scale(1,.22); ctx.fillStyle=band; ctx.beginPath(); ctx.arc(0,0,Math.max(w,h)*.62,0,7); ctx.fill(); ctx.setTransform(ctx.getTransform().a,ctx.getTransform().b,ctx.getTransform().c,ctx.getTransform().d,ctx.getTransform().e,ctx.getTransform().f); ctx.restore(); ctx.save(); ctx.translate(w*.5,h*.43); ctx.rotate(-.28); galaxy.forEach(p=>{ctx.fillStyle=`rgba(${p.c},${p.o*q})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();}); ctx.restore(); const n=Math.floor(stars.length*q); for(let i=0;i<n;i++){const s=stars[i],a=(.45+Math.sin(t*.025+s.p)*.25)*q; ctx.fillStyle=`rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,7); ctx.fill();} }
  function cloud(){ if(S.cloudCover<12&&!["cloudy","rainy","thunderstorm","snowy","foggy"].includes(S.type))return; const a=clamp(S.cloudCover/100,0,1),col=S.type==="thunderstorm"?"31,41,55":S.type==="rainy"?"100,116,139":"255,255,255"; clouds.forEach((c,i)=>{c.x+=c.v+S.windSpeed*.025;if(c.x>w+c.r*2)c.x=-c.r*2;if(c.x<-c.r*2)c.x=w+c.r*2;for(let p=0;p<5;p++){const x=c.x+Math.cos(i+p*1.3)*c.r*.42,y=c.y+Math.sin(i+p)*c.r*.13,r=c.r*(.4+(p%3)*.13),gg=ctx.createRadialGradient(x,y,0,x,y,r);gg.addColorStop(0,`rgba(${col},${(.1+a*.25)*(S.type==="thunderstorm"?1.8:1)})`);gg.addColorStop(.65,`rgba(${col},${.05+a*.12})`);gg.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=gg;ctx.beginPath();ctx.ellipse(x,y,r*1.45,r*.62,0,0,7);ctx.fill();}}); }
  function drops(){ if(S.type!=="rainy"&&S.type!=="thunderstorm")return; const n=Math.floor(rain.length*clamp(S.density/100,.1,1)),wind=S.windSpeed*.9; ctx.strokeStyle=S.type==="thunderstorm"?"rgba(191,219,254,.55)":"rgba(255,255,255,.38)"; ctx.lineWidth=1.2; for(let i=0;i<n;i++){const d=rain[i]; ctx.globalAlpha=d.o; ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x+wind,d.y+d.l); ctx.stroke(); d.x+=wind; d.y+=d.v; if(d.y>h+30||d.x<-120||d.x>w+120){d.x=rnd(-80,w+80);d.y=rnd(-80,0)}} ctx.globalAlpha=1; }
  function snowShape(f){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.rot+t*.006);ctx.globalAlpha=f.o;ctx.strokeStyle="rgba(255,255,255,.9)";ctx.lineWidth=Math.max(.55,f.r*.16);ctx.lineCap="round";for(let k=0;k<6;k++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-f.r*2.1);ctx.moveTo(0,-f.r*1.25);ctx.lineTo(f.r*.55,-f.r*1.75);ctx.moveTo(0,-f.r*1.25);ctx.lineTo(-f.r*.55,-f.r*1.75);ctx.stroke();}ctx.restore();ctx.globalAlpha=1;}
  function flakes(){ if(S.type!=="snowy")return; const n=Math.floor(snow.length*clamp(S.density/100,.1,1)); for(let i=0;i<n;i++){const f=snow[i]; f.p+=.025; f.rot+=.006; f.x+=Math.sin(f.p)*.8+S.windSpeed*.32; f.y+=f.v; if(f.r>2.4)snowShape(f);else{ctx.fillStyle=`rgba(255,255,255,${f.o})`;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,7);ctx.fill();} if(f.y>h+20||f.x<-60||f.x>w+60){f.x=rnd(-80,w+80);f.y=rnd(-60,0)}} }
  function haze(){ const z=Math.max((100-S.visibility)/100,S.type==="foggy"?.55:0,S.type==="duststorm"?.42:0); if(z<=.05)return; const col=S.type==="duststorm"?"214,180,120":"226,232,240",g=ctx.createLinearGradient(0,h*.25,0,h); g.addColorStop(0,`rgba(${col},0)`); g.addColorStop(.65,`rgba(${col},${z*.32})`); g.addColorStop(1,`rgba(${col},${z*.55})`); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); }
  function bolt(force){ const C={white:"rgba(240,249,255,",violet:"rgba(196,181,253,",cyan:"rgba(103,232,249,",gold:"rgba(254,240,138,",rose:"rgba(244,114,182,"},ks=Object.keys(C),pick=$("weatherLightningColor")?.value||"mixed"; fc=C[pick==="mixed"?ks[Math.floor(Math.random()*ks.length)]:pick]||C.white; flash=force?1.65:1.35; boltPath=[]; boltBranches=[]; let x=rnd(w*.2,w*.8),y=0; boltPath.push({x,y}); for(let i=0;i<12;i++){x+=rnd(-48,48);y+=rnd(28,58);boltPath.push({x,y}); if(i>2&&Math.random()>.62){let bx=x,by=y,br=[{x:bx,y:by}];for(let j=0;j<3;j++){bx+=rnd(-38,38);by+=rnd(16,34);br.push({x:bx,y:by});}boltBranches.push(br);} if(y>h*.82)break;} }
  function lightning(){ if(S.type==="thunderstorm"&&Math.random()<S.lightningFrequency/5200)bolt(false); if(flash<=0||boltPath.length<2)return; const a=Math.min(1,flash); ctx.fillStyle=`${fc}${flash*.22})`;ctx.fillRect(0,0,w,h); ctx.save();ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle=`${fc}${a})`;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=26;ctx.lineWidth=6;ctx.beginPath();boltPath.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.lineWidth=2.2;ctx.shadowBlur=10;boltBranches.forEach(br=>{ctx.beginPath();br.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();});ctx.restore();flash-=.018; }
  function init(){ addWuhu(); replaceOpenButton(); build(); }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true}); else init();
})();
