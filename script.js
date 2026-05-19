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

function getParam(key){
  return new URLSearchParams(window.location.search).get(key);
}

function readStorage(key){
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function writeStorage(key, value){
  try { localStorage.setItem(key, value); } catch (e) {}
}

const WEATHER_LOCATIONS = {
  luhansk: { label: "卢甘斯克", latitude: 48.574, longitude: 39.3078 },
  beijing: { label: "北京", latitude: 39.9042, longitude: 116.4074 },
  london: { label: "伦敦", latitude: 51.5074, longitude: -0.1278 },
  newyork: { label: "纽约", latitude: 40.7128, longitude: -74.006 },
  la: { label: "洛杉矶", latitude: 34.0522, longitude: -118.2437 }
};

const WEATHER_TEXT = {
  clear: "晴天",
  cloudy: "多云/阴天",
  rain: "雨天",
  snow: "雪天",
  thunder: "雷暴"
};

function weatherKindFromCode(code){
  if ([95, 96, 99].includes(code)) return "thunder";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([1, 2, 3, 45, 48].includes(code)) return "cloudy";
  return "clear";
}

function getPickedLocation(){
  try {
    const raw = localStorage.getItem("weatherPickedLocation");
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data?.lat !== "number" || typeof data?.lng !== "number") return null;
    if (Math.abs(data.lat) > 90 || Math.abs(data.lng) > 180) return null;
    return { label: data.label || "地图选点", latitude: data.lat, longitude: data.lng };
  } catch (e) {
    return null;
  }
}

function setWeatherScene(kind, isDay){
  const safeKind = WEATHER_TEXT[kind] ? kind : "cloudy";
  document.body.dataset.weather = safeKind;
  document.body.dataset.daypart = isDay === 0 ? "night" : "day";
}

function fallbackDaypart(){
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? 1 : 0;
}

function browserLocation(){
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("geolocation-unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        label: "当前位置",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }),
      reject,
      { enableHighAccuracy: false, timeout: 6500, maximumAge: 10 * 60 * 1000 }
    );
  });
}

async function resolveWeatherLocation(preset){
  if (preset === "picked") {
    const picked = getPickedLocation();
    if (picked) return picked;
    setWeatherStatus("天气动态背景：还没有地图选点，先在地图上选择位置。已暂用默认城市。");
    return WEATHER_LOCATIONS.luhansk;
  }

  if (preset === "auto") {
    setWeatherStatus("天气动态背景：正在请求当前位置…");
    try {
      return await browserLocation();
    } catch (e) {
      setWeatherStatus("天气动态背景：浏览器没有提供位置，已暂用默认城市。");
      return WEATHER_LOCATIONS.luhansk;
    }
  }

  return WEATHER_LOCATIONS[preset] || WEATHER_LOCATIONS.luhansk;
}

async function applyWeather(location){
  const lat = location.latitude.toFixed(4);
  const lon = location.longitude.toFixed(4);
  const debugKind = getParam("weather");
  const debugDaypart = getParam("daypart") === "night" ? 0 : 1;
  if (WEATHER_TEXT[debugKind]) {
    setWeatherScene(debugKind, debugDaypart);
    setWeatherStatus(`天气动态背景：调试模式 · ${WEATHER_TEXT[debugKind]}`);
    return;
  }

  setWeatherStatus(`天气动态背景：正在获取 ${location.label} 的实时天气…`);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,is_day&timezone=auto`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("weather-http");
    const data = await res.json();
    const code = data?.current?.weather_code;
    const isDay = data?.current?.is_day;
    const kind = weatherKindFromCode(code);
    const daypart = isDay === 0 ? 0 : 1;

    setWeatherScene(kind, daypart);
    const dayText = daypart === 0 ? "夜间" : "白天";
    setWeatherStatus(`天气动态背景：${location.label} · ${dayText}${WEATHER_TEXT[kind]}（实时）`);
  } catch (e) {
    const daypart = fallbackDaypart();
    setWeatherScene("cloudy", daypart);
    setWeatherStatus(`天气动态背景：${location.label} 天气拉取失败，已使用明显的多云背景兜底。`);
  }
}

function hasOption(select, value){
  return Array.from(select.options).some(option => option.value === value);
}

function initWeatherPresetControl(){
  const select = document.getElementById("weatherPreset");
  if (!select) return;

  const picked = getPickedLocation();
  const fromMap = getParam("weather_picked") === "1";
  const saved = readStorage("weatherPreset");

  if (fromMap && picked && hasOption(select, "picked")) select.value = "picked";
  else if (saved && hasOption(select, saved)) select.value = saved;
  else select.value = "auto";

  if (select.value === "picked" && !picked) select.value = "auto";

  const run = async () => {
    const preset = select.value;
    writeStorage("weatherPreset", preset);
    const location = await resolveWeatherLocation(preset);
    await applyWeather(location);
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
