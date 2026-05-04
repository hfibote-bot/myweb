function copySiteUrl(){
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById("copyUrlBtn");
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = "已复制 ✅";
    setTimeout(() => { btn.textContent = old; }, 1200);
  }).catch(() => {
    alert("复制失败：你的浏览器可能不允许自动复制。请手动复制地址栏链接。");
  });
}

function updateWorldClocks(){
  const nodes = document.querySelectorAll("[data-tz]");
  const now = new Date();
  for (const node of nodes) {
    const tz = node.getAttribute("data-tz");
    try {
      const fmt = new Intl.DateTimeFormat("zh-CN", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      node.textContent = fmt.format(now);
    } catch (e) {
      node.textContent = now.toLocaleString();
    }
  }
}

function initBusuanziFallback(){
  const pvNode = document.getElementById("busuanzi_page_pv");
  if (!pvNode) return;
  window.setTimeout(() => {
    if (pvNode.textContent && pvNode.textContent.includes("加载中")) pvNode.textContent = "暂不可用";
  }, 4000);
}

function setWeatherStatus(text){
  const node = document.getElementById("weatherStatus");
  if (node) node.textContent = text;
}

function weatherKindFromCode(code){
  if ([95, 96, 99].includes(code)) return "thunder";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([1, 2, 3, 45, 48].includes(code)) return "cloudy";
  return "clear";
}


function getParam(key){
  return new URLSearchParams(window.location.search).get(key);
}

const WEATHER_LOCATIONS = {
  luhansk: { label: "卢甘斯克", latitude: 48.574, longitude: 39.3078 }
};

function getPickedLocation(){
  try {
    const raw = localStorage.getItem("weatherPickedLocation");
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data?.lat !== "number" || typeof data?.lng !== "number") return null;
    return { label: data.label || "地图选点", latitude: data.lat, longitude: data.lng };
  } catch (e) {
    return null;
  }
}

async function applyWeather(location){
  const lat = location.latitude.toFixed(4);
  const lon = location.longitude.toFixed(4);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,is_day&timezone=auto`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("weather-http");
    const data = await res.json();
    const code = data?.current?.weather_code;
    const isDay = data?.current?.is_day;
    const kind = weatherKindFromCode(code);

    document.body.dataset.weather = kind;
    document.body.dataset.daypart = isDay === 0 ? "night" : "day";

    const kindText = { clear: "晴天", cloudy: "多云/阴天", rain: "雨天", snow: "雪天", thunder: "雷暴" };
    const dayText = isDay === 0 ? "夜间" : "白天";
    setWeatherStatus(`天气动态背景：${location.label} · ${dayText}${kindText[kind] || "天气"}（实时）`);
  } catch (e) {
    setWeatherStatus(`天气动态背景：${location.label}天气拉取失败，使用默认天空风格。`);
  }
}

function initWeatherPresetControl(){
  const select = document.getElementById("weatherPreset");
  if (!select) return;

  const picked = getPickedLocation();
  const fromMap = getParam("weather_picked") === "1";
  if (fromMap && picked) select.value = "picked";
  if (!picked && select.value === "picked") select.value = "luhansk";

  const run = () => {
    if (select.value === "picked") {
      const p = getPickedLocation();
      if (p) return applyWeather(p);
      setWeatherStatus("天气动态背景：还没有地图选点，先点“在地图上选择位置”。");
      return applyWeather(WEATHER_LOCATIONS.luhansk);
    }
    return applyWeather(WEATHER_LOCATIONS.luhansk);
  };

  run();
  select.addEventListener("change", run);
}

document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
  const btn = document.getElementById("copyUrlBtn");
  if (btn) btn.addEventListener("click", copySiteUrl);
  updateWorldClocks();
  setInterval(updateWorldClocks, 1000);
  initBusuanziFallback();
  initWeatherPresetControl();
});
