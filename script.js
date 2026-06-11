function copySiteUrl(){
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById("copyUrlBtn");
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = "\u5df2\u590d\u5236 \u2705";
    setTimeout(() => { btn.textContent = old; }, 1200);
  }).catch(() => {
    alert("\u590d\u5236\u5931\u8d25\uff1a\u4f60\u7684\u6d4f\u89c8\u5668\u53ef\u80fd\u4e0d\u5141\u8bb8\u81ea\u52a8\u590d\u5236\u3002\u8bf7\u624b\u52a8\u590d\u5236\u5730\u5740\u680f\u94fe\u63a5\u3002");
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
    if (pvNode.textContent && pvNode.textContent.includes("\u52a0\u8f7d\u4e2d")) pvNode.textContent = "\u6682\u4e0d\u53ef\u7528";
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

function isWeatherConsolePage(){
  return document.body.classList.contains("weather-console-page") || document.body.dataset.weatherConsole === "page";
}

const WEATHER_LOCATIONS = {
  luhansk: { label: "\u5362\u7518\u65af\u514b", latitude: 48.574, longitude: 39.3078 },
  wuhu: { label: "\u829c\u6e56", latitude: 31.3525, longitude: 118.4331 }
};

function getPickedLocation(){
  try {
    const raw = localStorage.getItem("weatherPickedLocation");
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data?.lat !== "number" || typeof data?.lng !== "number") return null;
    return { label: data.label || "\u5730\u56fe\u9009\u70b9", latitude: data.lat, longitude: data.lng };
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
    sunny: "\u6674\u6717",
    cloudy: "\u591a\u4e91/\u9634\u5929",
    rainy: "\u96e8\u5929",
    snowy: "\u96ea\u5929",
    thunderstorm: "\u96f7\u96e8",
    foggy: "\u96fe",
    duststorm: "\u6c99\u5c18",
    night_clear: "\u6674\u6717\u591c\u7a7a"
  };
  return kindText[wx?.type] || wx?.label || "\u5929\u6c14";
}

async function applyWeather(location){
  try {
    if (window.weatherBackground?.syncByCoords) {
      const result = await window.weatherBackground.syncByCoords(location.latitude, location.longitude);
      const wx = result?.weather || window.weatherBackground.getState();
      const kind = legacyKindFromBackgroundType(wx.type);
      const daypart = wx.timeOfDay === "night" ? "night" : "day";
      const tempText = typeof wx.temperature === "number" ? ` \u00b7 ${Math.round(wx.temperature)}\u2103` : "";
      document.body.dataset.weather = kind;
      document.body.dataset.daypart = daypart;
      setWeatherStatus(`\u5929\u6c14\u52a8\u6001\u80cc\u666f\uff1a${location.label} \u00b7 ${daypart === "night" ? "\u591c\u95f4" : "\u767d\u5929"}${describeWeatherState(wx)}${tempText}\uff08\u5b9e\u65f6\uff09`);
      return;
    }
    setWeatherStatus(`\u5929\u6c14\u52a8\u6001\u80cc\u666f\uff1a${location.label} \u00b7 \u5b9e\u65f6\u5929\u6c14\u6a21\u5757\u672a\u52a0\u8f7d\u3002`);
  } catch (e) {
    window.weatherBackground?.setWeather?.({ type: "sunny", timeOfDay: "afternoon", cloudCover: 25, density: 35 });
    setWeatherStatus(`\u5929\u6c14\u52a8\u6001\u80cc\u666f\uff1a${location.label}\u5929\u6c14\u62c9\u53d6\u5931\u8d25\uff0c\u4f7f\u7528\u9ed8\u8ba4\u6674\u6717\u98ce\u683c\u3002`);
  }
}

function initWeatherPresetControl(){
  const select = document.getElementById("weatherPreset");
  if (!select) return;
  if (!select.querySelector('option[value="wuhu"]')) {
    const option = document.createElement("option");
    option.value = "wuhu";
    option.textContent = "\u829c\u6e56";
    select.insertBefore(option, select.querySelector('option[value="picked"]'));
  }
  const picked = getPickedLocation();
  if (getParam("weather_picked") === "1" && picked) select.value = "picked";
  if (!picked && select.value === "picked") select.value = "luhansk";
  const run = () => {
    if (select.value === "picked" && !getPickedLocation()) {
      setWeatherStatus("\u5929\u6c14\u52a8\u6001\u80cc\u666f\uff1a\u8fd8\u6ca1\u6709\u5730\u56fe\u9009\u70b9\uff0c\u5148\u70b9\u201c\u5728\u5730\u56fe\u4e0a\u9009\u62e9\u4f4d\u7f6e\u201d\u3002");
      return applyWeather(WEATHER_LOCATIONS.luhansk);
    }
    return applyWeather(getActiveWeatherLocation());
  };
  if (!isWeatherConsolePage()) {
    run();
    select.addEventListener("change", run);
  }
}

function loadWeatherConsoleUpgrade(){
  if (document.querySelector('script[src^="weather-console-upgrade.js"]')) return;
  const script = document.createElement("script");
  script.src = "weather-console-upgrade.js?v=20260611-5";
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
