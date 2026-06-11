/* Dynamic weather background for static sites. */
(function () {
  var state = {
    type: "sunny",
    timeOfDay: "afternoon",
    windSpeed: 2,
    density: 45,
    cloudCover: 20,
    lightningFrequency: 30,
    pressure: 35,
    temperature: null,
    conditionLabel: "Sunny",
    isReady: false
  };

  var gradients = {
    morning: {
      sunny: ["#f97316", "#facc15", "#38bdf8"],
      cloudy: ["#64748b", "#cbd5e1", "#fdba74"],
      rainy: ["#2d3748", "#4a5568", "#a0aec0"],
      thunderstorm: ["#111827", "#1f2937", "#4b5563"],
      snowy: ["#e2e8f0", "#f8fafc", "#dbeafe"],
      foggy: ["#94a3b8", "#cbd5e1", "#e2e8f0"],
      duststorm: ["#7c4a21", "#a16207", "#d6a35c"],
      tornado: ["#111827", "#3f3f46", "#8b6f47"],
      night_clear: ["#020617", "#0f172a", "#1e293b"]
    },
    afternoon: {
      sunny: ["#0ea5e9", "#38bdf8", "#bae6fd"],
      cloudy: ["#94a3b8", "#cbd5e1", "#f1f5f9"],
      rainy: ["#334155", "#475569", "#64748b"],
      thunderstorm: ["#020617", "#111827", "#374151"],
      snowy: ["#e2e8f0", "#f8fafc", "#ffffff"],
      foggy: ["#94a3b8", "#cbd5e1", "#e2e8f0"],
      duststorm: ["#6b3f1d", "#9a6a2f", "#d8b069"],
      tornado: ["#020617", "#27272a", "#6b5a42"],
      night_clear: ["#020617", "#0f172a", "#1e293b"]
    },
    sunset: {
      sunny: ["#311042", "#ea580c", "#f59e0b"],
      cloudy: ["#475569", "#64748b", "#fda4af"],
      rainy: ["#1e293b", "#2d3748", "#ea580c"],
      thunderstorm: ["#111827", "#312e81", "#7c2d12"],
      snowy: ["#fda4af", "#f1f5f9", "#cbd5e1"],
      foggy: ["#fca5a5", "#cbd5e1", "#94a3b8"],
      duststorm: ["#3b1d12", "#9a3412", "#f59e0b"],
      tornado: ["#050816", "#312e81", "#78350f"],
      night_clear: ["#020617", "#0f172a", "#1e293b"]
    },
    night: {
      sunny: ["#020617", "#0f172a", "#1e293b"],
      cloudy: ["#09090b", "#18181b", "#334155"],
      rainy: ["#020205", "#09090b", "#18181b"],
      thunderstorm: ["#020205", "#09090b", "#111827"],
      snowy: ["#090d16", "#141c2f", "#38bdf8"],
      foggy: ["#090a0f", "#131622", "#2d3748"],
      duststorm: ["#120807", "#3f2413", "#7c4a21"],
      tornado: ["#020205", "#09090b", "#27272a"],
      night_clear: ["#020617", "#0f172a", "#1e293b"]
    }
  };

  var labels = {
    sunny: "Sunny",
    cloudy: "Cloudy",
    rainy: "Rain",
    thunderstorm: "Thunderstorm",
    snowy: "Snow",
    foggy: "Fog",
    duststorm: "Dust storm",
    tornado: "Tornado",
    night_clear: "Clear night"
  };

  var container, canvas, ctx;
  var width = 0;
  var height = 0;
  var frameId = 0;
  var time = 0;
  var lastLightningCheck = Date.now() + 1200;
  var lightningIntensity = 0;
  var lightningPath = [];
  var rainDrops = [];
  var splashes = [];
  var snowflakes = [];
  var sparkles = [];
  var leaves = [];
  var clouds = [];
  var glassDrops = [];
  var stars = [];
  var dust = [];
  var debris = [];

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function rand(min, max) { return min + Math.random() * (max - min); }

  function ensureStage() {
    if (container) return;
    container = document.createElement("div");
    container.id = "ambient-weather-bg";
    Object.assign(container.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      zIndex: "0",
      pointerEvents: "none",
      transition: "background 1500ms cubic-bezier(0.25, 0.8, 0.25, 1)"
    });

    canvas = document.createElement("canvas");
    canvas.id = "weather-ambient-canvas";
    Object.assign(canvas.style, { display: "block", width: "100%", height: "100%" });

    container.appendChild(canvas);
    document.body.prepend(container);
    document.documentElement.style.minHeight = "100%";
    document.body.style.minHeight = "100%";

    ctx = canvas.getContext("2d");
    window.addEventListener("resize", resize, { passive: true });
    resize();
    seedParticles();
    updateBackground();
    loop();
  }

  function resize() {
    if (!canvas) return;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    seedParticles();
  }

  function seedParticles() {
    var scale = Math.min(window.innerWidth, window.innerHeight) < 720 ? 0.62 : 1;
    var i;

    sparkles = [];
    for (i = 0; i < 55 * scale; i += 1) sparkles.push({ x: Math.random() * width, y: Math.random() * height, r: rand(0.5, 2.2), p: Math.random() * 6.28, ps: rand(0.01, 0.025), vy: -rand(0.15, 0.45) });

    leaves = [];
    for (i = 0; i < 24 * scale; i += 1) leaves.push({ x: Math.random() * width, y: Math.random() * height, s: rand(4, 10), vx: rand(-0.4, 0.6), vy: rand(0.45, 1.2), a: rand(0, 6.28), spin: rand(0.006, 0.018), sw: rand(0, 6.28), ss: rand(0.008, 0.025), color: Math.random() > 0.66 ? "pink" : Math.random() > 0.5 ? "green" : "gold" });

    clouds = [];
    for (i = 0; i < 12 * scale; i += 1) clouds.push({ x: Math.random() * width, y: rand(-20, height * 0.42), r: rand(80, 220), v: rand(0.04, 0.16), o: rand(0.08, 0.24) });

    glassDrops = [];
    for (i = 0; i < 18 * scale; i += 1) glassDrops.push({ x: Math.random() * width, y: Math.random() * height, r: rand(1.5, 4.2), v: rand(0.08, 0.28), trail: [] });

    stars = [];
    for (i = 0; i < 120 * scale; i += 1) stars.push({ x: Math.random() * width, y: Math.random() * height * 0.65, r: rand(0.4, 1.6), o: rand(0.2, 0.9), d: Math.random() > 0.5 ? 1 : -1 });

    dust = [];
    for (i = 0; i < 220 * scale; i += 1) dust.push({ x: Math.random() * width, y: Math.random() * height, s: rand(0.8, 4), v: rand(1.2, 5.5), o: rand(0.12, 0.46), w: rand(18, 70) });

    debris = [];
    for (i = 0; i < 72 * scale; i += 1) debris.push({ a: rand(0, 6.28), h: rand(0.15, 0.96), r: rand(16, 160), s: rand(0.015, 0.055), z: rand(1, 4), o: rand(0.22, 0.72) });
  }

  function normalizeWeather(input) {
    var next = Object.assign({}, state, input || {});
    next.windSpeed = clamp(Number(next.windSpeed || 0), -12, 12);
    next.density = clamp(Number(next.density || 0), 0, 100);
    next.cloudCover = clamp(Number(next.cloudCover || 0), 0, 100);
    next.lightningFrequency = clamp(Number(next.lightningFrequency || 0), 0, 100);
    next.pressure = clamp(Number(next.pressure || 0), 0, 100);
    if (!gradients[next.timeOfDay]) next.timeOfDay = "afternoon";
    if (!labels[next.type]) next.type = "sunny";
    if (next.timeOfDay === "night" && next.type === "sunny") next.type = "night_clear";
    return next;
  }

  function setWeather(input) {
    ensureStage();
    var normalized = normalizeWeather(input);
    if (!input || !Object.prototype.hasOwnProperty.call(input, "conditionLabel")) normalized.conditionLabel = labels[normalized.type] || "Weather";
    Object.assign(state, normalized);
    state.isReady = true;
    updateBackground();
    window.dispatchEvent(new CustomEvent("weather-background-change", { detail: getState() }));
  }

  function updateBackground() {
    if (!container) return;
    var type = state.type || "sunny";
    var day = state.timeOfDay || "afternoon";
    var colors = gradients[day] && gradients[day][type] ? gradients[day][type] : gradients.afternoon.sunny;
    container.style.background = "linear-gradient(to bottom, " + colors.join(", ") + ")";
  }

  function mapWeatherCode(code, isDay) {
    var n = Number(code);
    var type = "sunny";
    if ([95, 96, 99].indexOf(n) >= 0) type = "thunderstorm";
    else if ((n >= 51 && n <= 67) || (n >= 80 && n <= 82)) type = "rainy";
    else if ((n >= 71 && n <= 77) || n === 85 || n === 86) type = "snowy";
    else if ([45, 48].indexOf(n) >= 0) type = "foggy";
    else if ([2, 3].indexOf(n) >= 0) type = "cloudy";
    if (!isDay && type === "sunny") type = "night_clear";
    return type;
  }

  function resolveTimeOfDay(isDay) {
    var hour;
    if (!isDay) return "night";
    hour = new Date().getHours();
    if (hour < 10) return "morning";
    if (hour >= 17) return "sunset";
    return "afternoon";
  }

  function labelForCode(code, type) {
    var map = { 0: "Sunny", 1: "Mostly sunny", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers", 81: "Strong showers", 82: "Heavy showers", 85: "Snow showers", 86: "Heavy snow showers", 95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm" };
    return map[Number(code)] || labels[type] || "Weather";
  }

  function settingsFromCurrentWeather(current) {
    var isDay = Number(current.is_day) === 1;
    var type = mapWeatherCode(current.weather_code, isDay);
    var cloudCover = Number(current.cloud_cover || 0);
    var windSpeedKmh = Number(current.wind_speed_10m || 0);
    var rain = Number(current.rain || current.precipitation || 0);
    var snow = Number(current.snowfall || 0);
    var density = Math.max(25, cloudCover);
    if (type === "rainy") density = clamp(50 + rain * 18, 45, 95);
    if (type === "thunderstorm") density = clamp(72 + rain * 12, 65, 100);
    if (type === "snowy") density = clamp(50 + snow * 24, 45, 95);
    if (type === "foggy") density = 75;
    if (type === "sunny" || type === "night_clear") density = clamp(20 + cloudCover * 0.3, 20, 45);
    return { type: type, timeOfDay: resolveTimeOfDay(isDay), windSpeed: clamp(Math.round(windSpeedKmh / 5), -12, 12), density: density, cloudCover: cloudCover, lightningFrequency: type === "thunderstorm" ? 62 : 25, pressure: type === "thunderstorm" ? 78 : 35, temperature: current.temperature_2m, conditionLabel: labelForCode(current.weather_code, type) };
  }

  function syncByCoords(latitude, longitude) {
    ensureStage();
    var lat = Number(latitude);
    var lon = Number(longitude);
    var params;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return Promise.reject(new Error("Invalid latitude or longitude"));
    params = new URLSearchParams({ latitude: String(lat), longitude: String(lon), current: ["temperature_2m", "relative_humidity_2m", "weather_code", "wind_speed_10m", "is_day", "precipitation", "rain", "snowfall", "cloud_cover"].join(","), timezone: "auto" });
    return fetch("https://api.open-meteo.com/v1/forecast?" + params.toString()).then(function (response) {
      if (!response.ok) throw new Error("Weather request failed");
      return response.json();
    }).then(function (data) {
      setWeather(settingsFromCurrentWeather(data.current || {}));
      return { raw: data, weather: getState() };
    });
  }

  function syncFromStoredPicker(storageKey) {
    var raw = window.localStorage.getItem(storageKey || "weatherPickedLocation");
    var picked;
    if (!raw) return Promise.resolve(null);
    try { picked = JSON.parse(raw); } catch (error) { return Promise.reject(error); }
    return syncByCoords(picked.lat != null ? picked.lat : picked.latitude, picked.lng != null ? picked.lng : picked.lon != null ? picked.lon : picked.longitude);
  }

  function drawSun(type, day) {
    var sunX, sunY, radius, corona, core;
    if (day === "night" || type !== "sunny") return;
    sunX = day === "morning" ? width * 0.16 : day === "sunset" ? width * 0.82 : width * 0.5;
    sunY = day === "morning" ? height * 0.24 : day === "sunset" ? height * 0.42 : height * 0.16;
    radius = Math.max(width, height) * 0.45;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    corona = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, radius);
    corona.addColorStop(0, day === "sunset" ? "rgba(251,146,60,0.62)" : "rgba(255,255,255,0.7)");
    corona.addColorStop(0.24, day === "sunset" ? "rgba(239,68,68,0.3)" : "rgba(254,240,138,0.36)");
    corona.addColorStop(0.58, "rgba(56,189,248,0.1)");
    corona.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(sunX, sunY, radius, 0, Math.PI * 2);
    ctx.fill();
    core = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, day === "sunset" ? 42 : 32);
    core.addColorStop(0, "rgba(255,255,255,1)");
    core.addColorStop(0.35, day === "sunset" ? "rgba(251,146,60,0.9)" : "rgba(254,240,138,0.92)");
    core.addColorStop(1, "rgba(253,224,71,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(sunX, sunY, day === "sunset" ? 42 : 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStars(type, day) {
    if (day !== "night" && type !== "night_clear") return;
    stars.forEach(function (star) {
      star.o += star.d * 0.004;
      if (star.o > 0.9 || star.o < 0.18) star.d *= -1;
      ctx.fillStyle = "rgba(255,255,255," + star.o + ")";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawAurora(type, day) {
    var band, grad, x, y;
    if (day !== "night" || (type !== "night_clear" && type !== "snowy")) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (band = 0; band < 2; band += 1) {
      grad = ctx.createLinearGradient(0, height * 0.1, 0, height * 0.65);
      grad.addColorStop(0, "rgba(16,185,129,0)");
      grad.addColorStop(0.35, band ? "rgba(168,85,247,0.12)" : "rgba(52,211,153,0.16)");
      grad.addColorStop(0.78, band ? "rgba(52,211,153,0.06)" : "rgba(139,92,246,0.08)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.65);
      ctx.lineTo(0, height * (0.14 + band * 0.08));
      for (x = 0; x <= width; x += 18) {
        y = height * (0.16 + band * 0.07) + Math.sin(x * 0.008 + time * 0.25 + band) * 35 + Math.cos(x * 0.015 - time * 0.22) * 15;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height * 0.65);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawClouds(type) {
    var cover = type === "cloudy" ? Math.max(state.cloudCover, 70) : state.cloudCover;
    var opacityScale = clamp(cover / 100, 0.15, 1);
    var wind = state.windSpeed * 0.025;
    if (cover < 18 && ["rainy", "thunderstorm", "snowy", "tornado"].indexOf(type) < 0) return;
    clouds.forEach(function (cloud) {
      var alpha, color, grad;
      cloud.x += cloud.v + wind;
      if (cloud.x > width + cloud.r * 2) { cloud.x = -cloud.r * 2; cloud.y = rand(-20, height * 0.42); }
      if (cloud.x < -cloud.r * 2) { cloud.x = width + cloud.r * 2; cloud.y = rand(-20, height * 0.42); }
      alpha = cloud.o * opacityScale * (type === "thunderstorm" || type === "tornado" ? 2.35 : type === "rainy" ? 1.7 : 1.25);
      color = type === "thunderstorm" || type === "tornado" ? "35,42,60" : type === "rainy" ? "80,95,120" : "255,255,255";
      grad = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.r);
      grad.addColorStop(0, "rgba(" + color + "," + alpha + ")");
      grad.addColorStop(0.58, "rgba(" + color + "," + alpha * 0.5 + ")");
      grad.addColorStop(1, "rgba(" + color + ",0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawSparkles(type) {
    if (type !== "sunny" && type !== "night_clear") return;
    sparkles.forEach(function (spark) {
      var color = type === "sunny" ? "253,224,71" : "255,255,255";
      var alpha;
      spark.y += spark.vy;
      spark.p += spark.ps;
      if (spark.y < -10) { spark.y = height + 10; spark.x = Math.random() * width; }
      alpha = (Math.abs(Math.sin(spark.p)) * 0.38 + 0.08) * (type === "sunny" ? 0.85 : 0.6);
      ctx.fillStyle = "rgba(" + color + "," + alpha + ")";
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawLeaves(type, day) {
    if (["sunny", "cloudy", "foggy"].indexOf(type) < 0) return;
    leaves.forEach(function (leaf) {
      var color = "rgba(244,114,182,0.42)";
      leaf.a += leaf.spin;
      leaf.sw += leaf.ss;
      leaf.y += leaf.vy;
      leaf.x += leaf.vx + Math.sin(leaf.sw) * 0.45 + state.windSpeed * 0.22;
      if (leaf.y > height + 20 || leaf.x < -30 || leaf.x > width + 30) { leaf.y = -20; leaf.x = Math.random() * width; }
      if (day === "sunset" || leaf.color === "gold") color = "rgba(249,115,22,0.42)";
      if (day === "afternoon" && leaf.color === "green") color = "rgba(52,211,153,0.38)";
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.a);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -leaf.s);
      ctx.quadraticCurveTo(leaf.s * 0.6, -leaf.s * 0.35, 0, leaf.s);
      ctx.quadraticCurveTo(-leaf.s * 0.6, -leaf.s * 0.35, 0, -leaf.s);
      ctx.fill();
      ctx.restore();
    });
  }

  function triggerLightning(force) {
    var startX = rand(width * 0.15, width * 0.85);
    var steps = force ? 14 : 9 + Math.floor(Math.random() * 7);
    var stepY = height * 0.78 / steps;
    var x = startX;
    var y = 0;
    lightningPath = [{ x: x, y: y }];
    for (var i = 0; i < steps; i += 1) {
      x += rand(-55, 55);
      y += stepY + rand(-10, 12);
      lightningPath.push({ x: x, y: y });
    }
    lightningIntensity = force ? 1.25 : 1;
  }

  function drawLightning(type) {
    var now, chance, i, point;
    if (type !== "thunderstorm" && type !== "tornado") { lightningIntensity = 0; return; }
    now = Date.now();
    if (now > lastLightningCheck) {
      chance = 0.035 + state.lightningFrequency / 170;
      if (type === "tornado") chance += 0.12;
      if (Math.random() < chance) triggerLightning(type === "tornado");
      lastLightningCheck = now + rand(650, 2400);
    }
    if (lightningIntensity <= 0) return;
    ctx.fillStyle = "rgba(224,231,255," + lightningIntensity * 0.44 + ")";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.strokeStyle = "rgba(238,242,255," + Math.min(1, lightningIntensity) + ")";
    ctx.lineWidth = rand(1.5, 4.2);
    ctx.shadowColor = "#818cf8";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    for (i = 0; i < lightningPath.length; i += 1) {
      point = lightningPath[i];
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.restore();
    lightningIntensity -= 0.05 + Math.random() * 0.065;
  }

  function drawRain(type) {
    var maxRain, activeCount, wind;
    if (type !== "rainy" && type !== "thunderstorm" && type !== "tornado") { rainDrops = []; splashes = []; return; }
    maxRain = Math.floor((Math.min(width, 1300) / 1300) * (type === "tornado" ? 310 : 240));
    activeCount = Math.floor(maxRain * (state.density / 100 * 0.9 + 0.1));
    while (rainDrops.length < activeCount) rainDrops.push({ x: rand(-80, width + 80), y: rand(-height, 0), l: rand(10, type === "tornado" ? 34 : 25), v: rand(11, type === "tornado" ? 26 : 20), o: rand(0.14, 0.52) });
    if (rainDrops.length > activeCount) rainDrops.splice(activeCount);
    ctx.strokeStyle = type === "thunderstorm" || type === "tornado" ? "rgba(165,180,252,0.48)" : "rgba(255,255,255,0.34)";
    ctx.lineWidth = type === "tornado" ? 1.45 : 1.2;
    ctx.lineCap = "round";
    wind = state.windSpeed * (type === "tornado" ? 1.15 : 0.75);
    rainDrops.forEach(function (drop) {
      ctx.globalAlpha = drop.o;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + wind, drop.y + drop.l);
      ctx.stroke();
      ctx.globalAlpha = 1;
      drop.y += drop.v;
      drop.x += wind;
      if (drop.y > height - 8) {
        if (splashes.length < 60) splashes.push({ x: drop.x, y: height - rand(1, 12), r: 1, o: 0.65 });
        drop.y = rand(-30, 0);
        drop.x = rand(-80, width + 80);
      }
    });
    splashes.forEach(function (splash, index) {
      splash.r += 0.35;
      splash.o -= 0.05;
      ctx.strokeStyle = "rgba(255,255,255," + splash.o + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(splash.x, splash.y, splash.r, splash.r * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (splash.o <= 0) splashes.splice(index, 1);
    });
  }

  function drawSnow(type) {
    var maxSnow, activeCount;
    if (type !== "snowy") { snowflakes = []; return; }
    maxSnow = Math.floor((Math.min(width, 1300) / 1300) * 190);
    activeCount = Math.floor(maxSnow * (state.density / 100 * 0.85 + 0.15));
    while (snowflakes.length < activeCount) snowflakes.push({ x: rand(-75, width + 75), y: rand(-height, 0), r: rand(0.8, 3.8), v: rand(0.8, 2.5), o: rand(0.25, 0.8), sw: rand(0, 6.28), ss: rand(0.01, 0.03) });
    if (snowflakes.length > activeCount) snowflakes.splice(activeCount);
    ctx.shadowColor = "rgba(255,255,255,0.35)";
    ctx.shadowBlur = 3;
    snowflakes.forEach(function (flake) {
      flake.sw += flake.ss;
      flake.x += Math.sin(flake.sw) * 0.45 + state.windSpeed * 0.25;
      flake.y += flake.v;
      ctx.fillStyle = "rgba(255,255,255," + flake.o + ")";
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
      ctx.fill();
      if (flake.y > height + 10 || flake.x < -20 || flake.x > width + 20) { flake.y = -10; flake.x = rand(-75, width + 75); }
    });
    ctx.shadowBlur = 0;
  }

  function drawGlassDrops(type) {
    if (type !== "rainy" && type !== "thunderstorm" && type !== "tornado") return;
    glassDrops.forEach(function (drop) {
      var grad;
      drop.y += drop.v;
      if (Math.random() > 0.986) drop.x += rand(-2, 2);
      if (drop.trail.length === 0 || Math.floor(drop.y) % 7 === 0) {
        drop.trail.push({ x: drop.x, y: drop.y });
        if (drop.trail.length > 12) drop.trail.shift();
      }
      ctx.save();
      if (drop.trail.length > 1) {
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = drop.r * 0.75;
        ctx.beginPath();
        ctx.moveTo(drop.trail[0].x, drop.trail[0].y);
        drop.trail.forEach(function (p) { ctx.lineTo(p.x, p.y); });
        ctx.stroke();
      }
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      grad = ctx.createRadialGradient(drop.x - drop.r * 0.35, drop.y - drop.r * 0.35, drop.r * 0.1, drop.x, drop.y, drop.r);
      grad.addColorStop(0, "rgba(255,255,255,0.75)");
      grad.addColorStop(0.35, "rgba(255,255,255,0.28)");
      grad.addColorStop(0.8, "rgba(0,0,0,0.22)");
      grad.addColorStop(1, "rgba(255,255,255,0.12)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (drop.y > height + 20) { drop.y = -10; drop.x = Math.random() * width; drop.r = rand(1.5, 4.2); drop.trail = []; }
    });
  }

  function drawFog(type) {
    var intensity, grad;
    if (type !== "foggy" && state.cloudCover < 70) return;
    intensity = type === "foggy" ? 0.55 : (state.cloudCover - 60) * 0.006;
    grad = ctx.createLinearGradient(0, height * 0.48, 0, height);
    grad.addColorStop(0, "rgba(226,232,240,0)");
    grad.addColorStop(0.52, "rgba(226,232,240," + intensity * 0.5 + ")");
    grad.addColorStop(1, "rgba(226,232,240," + intensity + ")");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  function drawDust(type) {
    var active = type === "duststorm" || type === "tornado";
    var wind, count;
    if (!active) return;
    wind = (state.windSpeed || 6) * (type === "tornado" ? 1.9 : 1.35);
    count = Math.floor(dust.length * (state.density / 100 * 0.85 + 0.15));
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (var i = 0; i < count; i += 1) {
      var p = dust[i];
      var wobble = Math.sin(time * 0.025 + p.y * 0.01) * 1.8;
      p.x += wind + wobble;
      p.y += Math.sin(time * 0.01 + p.x * 0.003) * 0.5;
      if (p.x > width + 90) { p.x = -90; p.y = Math.random() * height; }
      if (p.x < -90) { p.x = width + 90; p.y = Math.random() * height; }
      ctx.strokeStyle = "rgba(255,210,128," + p.o + ")";
      ctx.lineWidth = p.s;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.w - Math.abs(wind) * 3, p.y + wind * 0.12);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = type === "tornado" ? "rgba(47,31,18,0.22)" : "rgba(120,68,24,0.20)";
    ctx.fillRect(0, 0, width, height);
  }

  function drawTornado(type) {
    var cx, baseY, topY, i;
    if (type !== "tornado") return;
    cx = width * 0.58 + Math.sin(time * 0.018) * width * 0.05;
    baseY = height * 0.96;
    topY = height * 0.18;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    for (i = 0; i < 44; i += 1) {
      var t = i / 43;
      var y = topY + (baseY - topY) * t;
      var funnel = 34 + t * t * 170;
      var twist = Math.sin(time * 0.05 + t * 12) * funnel * 0.26;
      var alpha = 0.13 + t * 0.18;
      var grad = ctx.createRadialGradient(cx + twist, y, 4, cx + twist, y, funnel);
      grad.addColorStop(0, "rgba(245,245,245," + alpha * 0.28 + ")");
      grad.addColorStop(0.38, "rgba(75,85,99," + alpha + ")");
      grad.addColorStop(1, "rgba(17,24,39,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx + twist, y, funnel, 9 + t * 22, Math.sin(time * 0.03 + t) * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    debris.forEach(function (d) {
      var y = topY + (baseY - topY) * d.h;
      var funnel = 42 + d.h * d.h * 180;
      d.a += d.s + Math.abs(state.windSpeed) * 0.002;
      var x = cx + Math.cos(d.a + time * 0.03) * Math.min(d.r, funnel);
      var yy = y + Math.sin(d.a * 1.4) * 18;
      ctx.fillStyle = "rgba(230,215,190," + d.o + ")";
      ctx.beginPath();
      ctx.arc(x, yy, d.z, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawPressure(type) {
    var amount = state.pressure / 100;
    if (type === "tornado") amount = Math.max(amount, 0.82);
    if (type === "thunderstorm") amount = Math.max(amount, 0.65);
    if (type === "duststorm") amount = Math.max(amount, 0.45);
    if (amount <= 0.08) return;
    var grad = ctx.createRadialGradient(width * 0.5, height * 0.42, Math.min(width, height) * 0.2, width * 0.5, height * 0.5, Math.max(width, height) * 0.78);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0," + amount * 0.58 + ")");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  function loop() {
    if (!ctx) return;
    time += 1;
    ctx.clearRect(0, 0, width, height);
    var type = state.type;
    var day = state.timeOfDay;
    drawSun(type, day);
    drawStars(type, day);
    drawAurora(type, day);
    drawClouds(type);
    drawLeaves(type, day);
    drawSparkles(type);
    drawDust(type);
    drawTornado(type);
    drawLightning(type);
    drawRain(type);
    drawSnow(type);
    drawGlassDrops(type);
    drawFog(type);
    drawPressure(type);
    frameId = window.requestAnimationFrame(loop);
  }

  function getState() {
    return {
      type: state.type,
      label: state.conditionLabel || labels[state.type],
      timeOfDay: state.timeOfDay,
      windSpeed: state.windSpeed,
      density: state.density,
      cloudCover: state.cloudCover,
      lightningFrequency: state.lightningFrequency,
      pressure: state.pressure,
      temperature: state.temperature,
      isReady: state.isReady
    };
  }

  function destroy() {
    if (frameId) window.cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
    if (container && container.parentNode) container.parentNode.removeChild(container);
    container = null;
    canvas = null;
    ctx = null;
  }

  window.weatherBackground = {
    init: ensureStage,
    setWeather: setWeather,
    syncByCoords: syncByCoords,
    syncFromStoredPicker: syncFromStoredPicker,
    triggerLightning: function () { triggerLightning(true); },
    getState: getState,
    destroy: destroy
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureStage, { once: true });
  else ensureStage();
})();
