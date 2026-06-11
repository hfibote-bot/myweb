(function(){
  const loc={wuhu:{label:"芜湖",latitude:31.3525,longitude:118.4331}};
  const P={
    sunny:["晴朗","sunny",18,2,1,8,92,0,"afternoon","afternoon"],
    cloudy:["多云","cloudy",36,3,1,70,78,0,"afternoon",""],
    overcast:["阴天","cloudy",45,4,1,95,65,0,"afternoon",""],
    foggy:["雾","foggy",62,1,1,86,28,0,"morning",""],
    rainy:["小雨","rainy",46,3,1,78,70,0,"afternoon",""],
    downpour:["大雨","rainy",90,8,1,94,44,18,"afternoon",""],
    thunderstorm:["雷雨","thunderstorm",88,9,-1,98,38,90,"night",""],
    light_snow:["小雪","snowy",38,3,-1,72,72,0,"afternoon",""],
    snowy:["大雪","snowy",100,7,-1,90,34,0,"night",""],
    dust:["沙尘","duststorm",62,7,1,56,42,0,"sunset",""],
    night_clear:["夜空","night_clear",20,2,1,6,96,0,"night","night"],
    sunrise:["日出","sunny",22,2,1,18,86,0,"morning","morning"],
    sunset:["晚霞","sunny",24,2,1,34,84,0,"sunset","sunset"]
  };
  let key="sunny",S=null,cv,ctx,w=0,h=0,t=0,flash=0,fc="rgba(190,210,255,",stars=[],clouds=[],rain=[],snow=[];
  const $=id=>document.getElementById(id);
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function addWuhu(){
    const s=$("weatherPreset"); if(!s)return;
    if(!s.querySelector('option[value="wuhu"]')){
      const o=document.createElement("option"); o.value="wuhu"; o.textContent="芜湖";
      s.insertBefore(o,s.querySelector('option[value="picked"]'));
    }
    s.addEventListener("change",()=>{
      if(s.value!=="wuhu")return;
      setTimeout(()=>{
        window.weatherBackground?.syncByCoords?.(loc.wuhu.latitude,loc.wuhu.longitude).then(r=>{
          const wx=r?.weather||{}; setWeatherStatus(`天气动态背景：芜湖 · ${wx.timeOfDay==="night"?"夜间":"白天"}${describeWeatherState(wx)}（实时）`);
        }).catch(()=>setWeatherStatus("天气动态背景：芜湖天气拉取失败，使用默认天空风格。"));
      },0);
    });
  }
  function replaceOpenButton(){
    const old=$("openWeatherLabBtn"); if(!old || old.dataset.upgraded==="1")return;
    const b=old.cloneNode(true); b.dataset.upgraded="1"; b.textContent="⛈️ 天气调制台";
    old.parentNode.replaceChild(b,old);
    b.addEventListener("click",()=>{const lab=$("weatherLab"); if(!lab)return; lab.hidden=!lab.hidden; if(!lab.hidden)build();});
  }
  function build(){
    const lab=$("weatherLab"); if(!lab || lab.dataset.clean==="1")return; lab.dataset.clean="1";
    lab.innerHTML=`
    <div class="weather-lab-head"><div><h3>天气调制台</h3><p>手动模拟天气背景，参数保留常用项，先把画面调清楚。</p></div><button id="closeWeatherLabBtn" class="weather-lab-close" type="button">×</button></div>
    <div class="weather-lab-section"><div class="weather-lab-section-title">天气类型</div><div class="weather-preset-grid">
      ${btn("live","实时天气")}${btn("sunny","晴朗")}${btn("cloudy","多云")}${btn("overcast","阴天")}${btn("foggy","雾")}${btn("rainy","小雨")}${btn("downpour","大雨")}${btn("thunderstorm","雷雨")}${btn("light_snow","小雪")}${btn("snowy","大雪")}${btn("dust","沙尘")}${btn("night_clear","夜空")}${btn("sunrise","日出")}${btn("sunset","晚霞")}
    </div></div>
    <div class="weather-lab-control-grid">
      <div class="weather-lab-section"><div class="weather-lab-section-title">天空与空气</div><div class="weather-lab-controls">
        ${range("weatherCloud","云量",0,100,8,"%")}${range("weatherVisibility","空气通透度",0,100,92,"%")}
        <label>光照时段<select id="weatherTimeOfDay"><option value="morning">清晨</option><option value="afternoon">正午</option><option value="sunset">黄昏</option><option value="night">夜晚</option></select></label>
      </div></div>
      <div class="weather-lab-section"><div class="weather-lab-section-title">降水与风</div><div class="weather-lab-controls">
        ${range("weatherDensity","降水强度",0,100,18,"%")}${range("weatherWind","风速",0,12,2,"")}
        <label>风向<select id="weatherWindDirection"><option value="1">向右飘移 →</option><option value="-1">向左飘移 ←</option></select></label>
      </div></div>
      <div class="weather-lab-section"><div class="weather-lab-section-title">雷电</div><div class="weather-lab-controls">
        ${range("weatherLightning","雷电活动",0,100,0,"%")}
        <label>闪电颜色<select id="weatherLightningColor"><option value="mixed">混合变化</option><option value="white">冷白</option><option value="violet">蓝紫</option><option value="cyan">青白</option><option value="gold">淡金</option><option value="rose">粉紫</option></select></label>
      </div></div>
    </div>
    <div class="weather-lab-actions"><button id="applyWeatherLabBtn" class="btn" type="button">应用调制</button><button id="strikeWeatherLabBtn" class="btn ghost" type="button">手动打一闪电</button></div>`;
    $("closeWeatherLabBtn").onclick=()=>lab.hidden=true;
    lab.querySelectorAll("[data-wx]").forEach(b=>b.onclick=()=>{ if(b.dataset.wx==="live"){S=null; clear(); applyWeather(getActiveWeatherLocation()); mark("live"); return;} load(b.dataset.wx); apply(); });
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
    const time=$("weatherTimeOfDay"); if(time){time.disabled=Boolean(p[9]); time.title=p[9]?"这个天气类型已固定光照时段":"";}
    readouts(); mark(k);
  }
  function state(){
    const p=P[key]||P.sunny, dir=Number($("weatherWindDirection")?.value||p[4]), wind=Number($("weatherWind")?.value||p[3]);
    return {label:p[0],type:p[1],density:Number($("weatherDensity")?.value||p[2]),windSpeed:wind*dir,cloudCover:Number($("weatherCloud")?.value||p[5]),visibility:Number($("weatherVisibility")?.value||p[6]),lightningFrequency:Number($("weatherLightning")?.value||p[7]),timeOfDay:p[9]||$("weatherTimeOfDay")?.value||p[8],lightningColor:$("weatherLightningColor")?.value||"mixed"};
  }
  function apply(){
    S=state(); ensure(); window.weatherBackground?.setWeather?.({type:S.type,timeOfDay:S.timeOfDay,density:S.density,windSpeed:S.windSpeed,cloudCover:S.cloudCover,lightningFrequency:S.lightningFrequency,conditionLabel:S.label});
    document.body.dataset.weather=legacyKindFromBackgroundType(S.type); document.body.dataset.daypart=S.timeOfDay==="night"?"night":"day";
    setWeatherStatus(`天气动态背景：当前模拟 · ${S.label} · 风速 ${Math.abs(S.windSpeed)} · 云量 ${S.cloudCover}% · 空气通透度 ${S.visibility}%`);
    if(S.type==="thunderstorm")bolt(true);
  }
  function ensure(){ if(cv)return; const stage=document.getElementById("ambient-weather-bg")||document.body; cv=document.createElement("canvas"); cv.id="weather-upgrade-canvas"; Object.assign(cv.style,{position:"fixed",inset:"0",width:"100vw",height:"100vh",pointerEvents:"none",zIndex:"1"}); stage.appendChild(cv); ctx=cv.getContext("2d"); addEventListener("resize",resize,{passive:true}); resize(); loop(); }
  function resize(){ if(!cv)return; const r=Math.min(devicePixelRatio||1,2); w=innerWidth; h=innerHeight; cv.width=w*r; cv.height=h*r; ctx.setTransform(r,0,0,r,0,0); stars=Array.from({length:180},()=>({x:Math.random()*w,y:Math.random()*h*.7,r:rnd(.4,1.7),p:Math.random()*7})); clouds=Array.from({length:14},()=>({x:Math.random()*w,y:rnd(0,h*.42),r:rnd(70,170),v:rnd(.04,.16),p:Math.random()*7})); rain=Array.from({length:260},()=>({x:rnd(-80,w+80),y:rnd(-h,h),l:rnd(12,28),v:rnd(10,20),o:rnd(.16,.5)})); snow=Array.from({length:340},()=>({x:rnd(-80,w+80),y:rnd(-h,h),r:rnd(.8,6.2),v:rnd(.5,3.2),p:Math.random()*7,o:rnd(.25,.9)})); }
  function clear(){ if(ctx)ctx.clearRect(0,0,w,h); }
  function bg(s){ if(s.timeOfDay==="night")return["#020617","#0b1226","#172554"]; if(s.timeOfDay==="morning")return["#fb923c","#fde68a","#7dd3fc"]; if(s.timeOfDay==="sunset")return["#271033","#f97316","#f9a8d4"]; if(s.type==="foggy")return["#94a3b8","#cbd5e1","#e5e7eb"]; if(s.type==="rainy"||s.type==="thunderstorm")return["#0f172a","#334155","#64748b"]; if(s.type==="snowy")return["#dbeafe","#eff6ff","#fff"]; if(s.type==="duststorm")return["#6b3f1d","#9a6a2f","#d8b069"]; return["#0ea5e9","#38bdf8","#bae6fd"]; }
  function loop(){ if(!ctx)return; t++; clear(); if(!S){requestAnimationFrame(loop);return;} const g=ctx.createLinearGradient(0,0,0,h); bg(S).forEach((c,i,a)=>g.addColorStop(i/(a.length-1),c)); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); sunmoon(); star(); cloud(); drops(); flakes(); haze(); lightning(); requestAnimationFrame(loop); }
  function sunmoon(){ if(S.timeOfDay==="night"){ctx.fillStyle="rgba(226,232,240,.85)";ctx.beginPath();ctx.arc(w*.78,h*.16,28,0,7);ctx.fill();return;} const x=S.timeOfDay==="morning"?w*.18:S.timeOfDay==="sunset"?w*.78:w*.5,y=S.timeOfDay==="sunset"?h*.52:h*.18,g=ctx.createRadialGradient(x,y,2,x,y,Math.max(w,h)*.42); g.addColorStop(0,S.timeOfDay==="sunset"?"rgba(251,146,60,.85)":"rgba(255,255,255,.75)"); g.addColorStop(.42,S.timeOfDay==="sunset"?"rgba(244,114,182,.25)":"rgba(254,240,138,.35)"); g.addColorStop(1,"rgba(255,255,255,0)"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); }
  function star(){ if(S.timeOfDay!=="night")return; const q=clamp((S.visibility/100)*(1-S.cloudCover/115),0,1),n=Math.floor(stars.length*q); for(let i=0;i<n;i++){const s=stars[i],a=(.45+Math.sin(t*.025+s.p)*.25)*q; ctx.fillStyle=`rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,7); ctx.fill();} }
  function cloud(){ if(S.cloudCover<12&&!["cloudy","rainy","thunderstorm","snowy","foggy"].includes(S.type))return; const a=clamp(S.cloudCover/100,0,1),col=S.type==="thunderstorm"?"31,41,55":S.type==="rainy"?"100,116,139":"255,255,255"; clouds.forEach((c,i)=>{c.x+=c.v+S.windSpeed*.025;if(c.x>w+c.r*2)c.x=-c.r*2;if(c.x<-c.r*2)c.x=w+c.r*2;for(let p=0;p<5;p++){const x=c.x+Math.cos(i+p*1.3)*c.r*.42,y=c.y+Math.sin(i+p)*c.r*.13,r=c.r*(.4+(p%3)*.13),gg=ctx.createRadialGradient(x,y,0,x,y,r);gg.addColorStop(0,`rgba(${col},${(.1+a*.25)*(S.type==="thunderstorm"?1.8:1)})`);gg.addColorStop(.65,`rgba(${col},${.05+a*.12})`);gg.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=gg;ctx.beginPath();ctx.ellipse(x,y,r*1.45,r*.62,0,0,7);ctx.fill();}}); }
  function drops(){ if(S.type!=="rainy"&&S.type!=="thunderstorm")return; const n=Math.floor(rain.length*clamp(S.density/100,.1,1)),wind=S.windSpeed*.9; ctx.strokeStyle=S.type==="thunderstorm"?"rgba(191,219,254,.55)":"rgba(255,255,255,.38)"; ctx.lineWidth=1.2; for(let i=0;i<n;i++){const d=rain[i]; ctx.globalAlpha=d.o; ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x+wind,d.y+d.l); ctx.stroke(); d.x+=wind; d.y+=d.v; if(d.y>h+30||d.x<-120||d.x>w+120){d.x=rnd(-80,w+80);d.y=rnd(-80,0)}} ctx.globalAlpha=1; }
  function flakes(){ if(S.type!=="snowy")return; const n=Math.floor(snow.length*clamp(S.density/100,.1,1)); for(let i=0;i<n;i++){const f=snow[i]; f.p+=.025; f.x+=Math.sin(f.p)*.8+S.windSpeed*.32; f.y+=f.v; ctx.fillStyle=`rgba(255,255,255,${f.o})`; ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,7); ctx.fill(); if(f.y>h+20||f.x<-60||f.x>w+60){f.x=rnd(-80,w+80);f.y=rnd(-60,0)}} }
  function haze(){ const z=Math.max((100-S.visibility)/100,S.type==="foggy"?.55:0,S.type==="duststorm"?.42:0); if(z<=.05)return; const col=S.type==="duststorm"?"214,180,120":"226,232,240",g=ctx.createLinearGradient(0,h*.25,0,h); g.addColorStop(0,`rgba(${col},0)`); g.addColorStop(.65,`rgba(${col},${z*.32})`); g.addColorStop(1,`rgba(${col},${z*.55})`); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); }
  function bolt(force){ const C={white:"rgba(240,249,255,",violet:"rgba(196,181,253,",cyan:"rgba(103,232,249,",gold:"rgba(254,240,138,",rose:"rgba(244,114,182,"},ks=Object.keys(C),pick=$("weatherLightningColor")?.value||"mixed"; fc=C[pick==="mixed"?ks[Math.floor(Math.random()*ks.length)]:pick]||C.white; flash=force?1.3:1; window.weatherBackground?.triggerLightning?.(); }
  function lightning(){ if(S.type==="thunderstorm"&&Math.random()<S.lightningFrequency/5000)bolt(false); if(flash<=0)return; ctx.fillStyle=`${fc}${flash*.34})`;ctx.fillRect(0,0,w,h); let x=rnd(w*.2,w*.8),y=0; ctx.save(); ctx.strokeStyle=`${fc}${Math.min(1,flash)})`; ctx.lineWidth=4.5; ctx.shadowColor=ctx.strokeStyle; ctx.shadowBlur=24; ctx.beginPath(); ctx.moveTo(x,y); for(let i=0;i<10;i++){x+=rnd(-44,44);y+=rnd(28,64);ctx.lineTo(x,y);if(y>h*.78)break;} ctx.stroke(); ctx.restore(); flash-=.035; }
  function init(){ addWuhu(); replaceOpenButton(); build(); }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true}); else init();
})();
