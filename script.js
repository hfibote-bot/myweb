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

function legacyKindFromBackgroundType(type){
  if (type === "thunderstorm") return "thunder";
  if (type === "snowy") return "snow";
  if (type === "rainy") return "rain";
  if (type === "duststorm") return "dust";
  if (type === "tornado") return "tornado";
  if (type === "cloudy" || type === "foggy") return "cloudy";
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

function getActiveWeatherLocation(){
  const select = document.getElementById("weatherPreset");
  if (select?.value === "picked") return getPickedLocation() || WEATHER_LOCATIONS.luhansk;
  return WEATHER_LOCATIONS.luhansk;
}

function describeWeatherState(wx){
  const kindText = {
    sunny: "晴天",
    cloudy: "多云/阴天",
    rainy: "雨天",
    snowy: "雪天",
    thunderstorm: "雷暴",
    foggy: "雾天",
    duststorm: "沙尘暴",
    tornado: "龙卷风",
    night_clear: "晴朗夜空"
  };
  return kindText[wx?.type] || wx?.label || "天气";
}

async function applyWeather(location){
  const lat = location.latitude.toFixed(4);
  const lon = location.longitude.toFixed(4);

  try {
    if (window.weatherBackground?.syncByCoords) {
      const result = await window.weatherBackground.syncByCoords(location.latitude, location.longitude);
      const wx = result?.weather || window.weatherBackground.getState();
      const kind = legacyKindFromBackgroundType(wx.type);
      const daypart = wx.timeOfDay === "night" ? "night" : "day";
      const tempText = typeof wx.temperature === "number" ? ` · ${Math.round(wx.temperature)}℃` : "";

      document.body.dataset.weather = kind;
      document.body.dataset.daypart = daypart;

      const dayText = daypart === "night" ? "夜间" : "白天";
      setWeatherStatus(`天气动态背景：${location.label} · ${dayText}${describeWeatherState(wx)}${tempText}（实时）`);
      return;
    }

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
    if (window.weatherBackground?.setWeather) {
      window.weatherBackground.setWeather({ type: "sunny", timeOfDay: "afternoon", cloudCover: 25, density: 35 });
    }
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

const WEATHER_LAB_PRESETS = {
  sunny: { label: "晴天", type: "sunny", density: 26, wind: 2, direction: 1, cloud: 12, lightning: 0, pressure: 12, time: "afternoon" },
  cloudy: { label: "多云", type: "cloudy", density: 42, wind: 3, direction: 1, cloud: 76, lightning: 0, pressure: 28, time: "afternoon" },
  rainy: { label: "小雨", type: "rainy", density: 48, wind: 3, direction: 1, cloud: 78, lightning: 0, pressure: 38, time: "afternoon" },
  downpour: { label: "暴雨", type: "rainy", density: 96, wind: 8, direction: 1, cloud: 94, lightning: 22, pressure: 70, time: "afternoon" },
  thunderstorm: { label: "雷暴", type: "thunderstorm", density: 90, wind: 9, direction: -1, cloud: 96, lightning: 88, pressure: 88, time: "night" },
  snowy: { label: "暴雪", type: "snowy", density: 92, wind: 6, direction: -1, cloud: 88, lightning: 0, pressure: 45, time: "night" },
  foggy: { label: "大雾", type: "foggy", density: 76, wind: 1, direction: 1, cloud: 90, lightning: 0, pressure: 42, time: "morning" },
  duststorm: { label: "沙尘暴", type: "duststorm", density: 92, wind: 10, direction: 1, cloud: 62, lightning: 0, pressure: 72, time: "sunset" },
  tornado: { label: "龙卷风", type: "tornado", density: 86, wind: 12, direction: -1, cloud: 100, lightning: 92, pressure: 100, time: "night" },
  night_clear: { label: "夜空", type: "night_clear", density: 32, wind: 2, direction: 1, cloud: 8, lightning: 0, pressure: 18, time: "night" }
};

let activeWeatherLabPreset = "thunderstorm";

function setControlValue(id, value){
  const node = document.getElementById(id);
  if (node) node.value = String(value);
}

function setControlText(id, value){
  const node = document.getElementById(id);
  if (node) node.textContent = String(value);
}

function syncWeatherLabReadouts(){
  const ids = [
    ["weatherDensity", "weatherDensityValue"],
    ["weatherWind", "weatherWindValue"],
    ["weatherCloud", "weatherCloudValue"],
    ["weatherLightning", "weatherLightningValue"],
    ["weatherPressure", "weatherPressureValue"]
  ];
  ids.forEach(([inputId, textId]) => {
    const input = document.getElementById(inputId);
    if (input) setControlText(textId, input.value);
  });
}

function setActiveWeatherLabButton(type){
  document.querySelectorAll("[data-weather-type]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.weatherType === type);
  });
}

function loadWeatherLabPreset(type){
  const preset = WEATHER_LAB_PRESETS[type];
  if (!preset) return;
  activeWeatherLabPreset = type;
  setControlValue("weatherDensity", preset.density);
  setControlValue("weatherWind", preset.wind);
  setControlValue("weatherWindDirection", preset.direction);
  setControlValue("weatherCloud", preset.cloud);
  setControlValue("weatherLightning", preset.lightning);
  setControlValue("weatherPressure", preset.pressure);
  setControlValue("weatherTimeOfDay", preset.time);
  syncWeatherLabReadouts();
  setActiveWeatherLabButton(type);
}

function readWeatherLabSettings(){
  const preset = WEATHER_LAB_PRESETS[activeWeatherLabPreset] || WEATHER_LAB_PRESETS.thunderstorm;
  const direction = Number(document.getElementById("weatherWindDirection")?.value || 1);
  const wind = Number(document.getElementById("weatherWind")?.value || preset.wind);
  return {
    label: preset.label,
    type: preset.type,
    timeOfDay: document.getElementById("weatherTimeOfDay")?.value || preset.time,
    density: Number(document.getElementById("weatherDensity")?.value || preset.density),
    windSpeed: wind * direction,
    cloudCover: Number(document.getElementById("weatherCloud")?.value || preset.cloud),
    lightningFrequency: Number(document.getElementById("weatherLightning")?.value || preset.lightning),
    pressure: Number(document.getElementById("weatherPressure")?.value || preset.pressure),
    conditionLabel: preset.label
  };
}

function applyWeatherLabSettings(){
  if (!window.weatherBackground?.setWeather) return;
  const settings = readWeatherLabSettings();
  window.weatherBackground.setWeather(settings);
  document.body.dataset.weather = legacyKindFromBackgroundType(settings.type);
  document.body.dataset.daypart = settings.timeOfDay === "night" ? "night" : "day";
  setWeatherStatus(`天气动态背景：手动调制 · ${settings.label} · 风速 ${Math.abs(settings.windSpeed)} · 密度 ${settings.density}%`);
  if (settings.type === "thunderstorm" || settings.type === "tornado") {
    window.weatherBackground.triggerLightning?.();
  }
}

function initWeatherLab(){
  const openBtn = document.getElementById("openWeatherLabBtn");
  const closeBtn = document.getElementById("closeWeatherLabBtn");
  const lab = document.getElementById("weatherLab");
  const applyBtn = document.getElementById("applyWeatherLabBtn");
  const strikeBtn = document.getElementById("strikeWeatherLabBtn");
  if (!openBtn || !lab) return;

  openBtn.addEventListener("click", () => {
    lab.hidden = !lab.hidden;
    if (!lab.hidden) loadWeatherLabPreset(activeWeatherLabPreset);
  });

  closeBtn?.addEventListener("click", () => { lab.hidden = true; });

  document.querySelectorAll("[data-weather-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.weatherType;
      if (type === "live") {
        setActiveWeatherLabButton("live");
        applyWeather(getActiveWeatherLocation());
        return;
      }
      loadWeatherLabPreset(type);
      applyWeatherLabSettings();
    });
  });

  ["weatherDensity", "weatherWind", "weatherCloud", "weatherLightning", "weatherPressure"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", syncWeatherLabReadouts);
  });

  applyBtn?.addEventListener("click", applyWeatherLabSettings);
  strikeBtn?.addEventListener("click", () => window.weatherBackground?.triggerLightning?.());
  loadWeatherLabPreset(activeWeatherLabPreset);
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
  initWeatherLab();
});