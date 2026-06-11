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
      const fmt = new Intl.DateTimeFormat("zh-CN", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
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

function legacyKindFromBackgroundType(type){
  if (type === "thunderstorm") return "thunder";
  if (type === "snowy") return "snow";
  if (type === "rainy") return "rain";
  if (type === "duststorm") return "dust";
  if (type === "cloudy" || type === "foggy") return "cloudy";
  return "clear";
}

function getParam(key){
  return new URLSearchParams(window.location.search).get(key);
}

const WEATHER_LOCATIONS = {
  luhansk: { label: "卢甘斯克", latitude: 48.574, longitude: 39.3078 },
  wuhu: { label: "芜湖", latitude: 31.3525, longitude: 118.4331 }
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

function getActiveWeatherLocation(){
  const select = document.getElementById("weatherPreset");
  if (select?.value === "picked") return getPickedLocation() || WEATHER_LOCATIONS.luhansk;
  return WEATHER_LOCATIONS[select?.value] || WEATHER_LOCATIONS.luhansk;
}

function describeWeatherState(wx){
  const kindText = {
    sunny: "晴朗",
    cloudy: "多云/阴天",
    rainy: "雨天",
    snowy: "雪天",
    thunderstorm: "雷雨",
    foggy: "雾",
    duststorm: "沙尘",
    night_clear: "晴朗夜空"
  };
  return kindText[wx?.type] || wx?.label || "天气";
}

async function applyWeather(location){
  try {
    if (window.weatherBackground?.syncByCoords) {
      const result = await window.weatherBackground.syncByCoords(location.latitude, location.longitude);
      const wx = result?.weather || window.weatherBackground.getState();
      const kind = legacyKindFromBackgroundType(wx.type);
      const daypart = wx.timeOfDay === "night" ? "night" : "day";
      const tempText = typeof wx.temperature === "number" ? ` · ${Math.round(wx.temperature)}℃` : "";
      document.body.dataset.weather = kind;
      document.body.dataset.daypart = daypart;
      setWeatherStatus(`天气动态背景：${location.label} · ${daypart === "night" ? "夜间" : "白天"}${describeWeatherState(wx)}${tempText}（实时）`);
      return;
    }
    setWeatherStatus(`天气动态背景：${location.label} · 实时天气模块未加载。`);
  } catch (e) {
    window.weatherBackground?.setWeather?.({ type: "sunny", timeOfDay: "afternoon", cloudCover: 25, density: 35 });
    setWeatherStatus(`天气动态背景：${location.label}天气拉取失败，使用默认晴朗风格。`);
  }
}

function initWeatherPresetControl(){
  const select = document.getElementById("weatherPreset");
  if (!select) return;
  if (!select.querySelector('option[value="wuhu"]')) {
    const option = document.createElement("option");
    option.value = "wuhu";
    option.textContent = "芜湖";
    select.insertBefore(option, select.querySelector('option[value="picked"]'));
  }
  const picked = getPickedLocation();
  if (getParam("weather_picked") === "1" && picked) select.value = "picked";
  if (!picked && select.value === "picked") select.value = "luhansk";
  const run = () => {
    if (select.value === "picked" && !getPickedLocation()) {
      setWeatherStatus("天气动态背景：还没有地图选点，先点“在地图上选择位置”。");
      return applyWeather(WEATHER_LOCATIONS.luhansk);
    }
    return applyWeather(getActiveWeatherLocation());
  };
  run();
  select.addEventListener("change", run);
}

function loadWeatherConsoleUpgrade(){
  if (document.querySelector('script[src^="weather-console-upgrade.js"]')) return;
  const script = document.createElement("script");
  script.src = "weather-console-upgrade.js?v=20260611-2";
  script.defer = true;
  document.body.appendChild(script);
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
  loadWeatherConsoleUpgrade();
});
