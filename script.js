function pad2(n){ return String(n).padStart(2, "0"); }

function formatNow(){
  const d = new Date();
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

function updateTime(){
  const el = document.getElementById("now");
  if (el) el.textContent = formatNow();
}

function updateVisits(){
  const key = "demo_site_visits_v1";
  const current = Number(localStorage.getItem(key) || "0") + 1;
  localStorage.setItem(key, String(current));
  const el = document.getElementById("visits");
  if (el) el.textContent = String(current);
}

function copySiteUrl(){
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById("copyUrlBtn");
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = "已复制 ✅";
    setTimeout(() => btn.textContent = old, 1200);
  }).catch(() => {
    alert("复制失败：你的浏览器可能不允许自动复制。请手动复制地址栏链接。");
  });
}

// ✅ 世界时间：根据 data-tz 自动更新
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
      // 某些非常旧的浏览器可能不支持 timeZone
      node.textContent = now.toLocaleString();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateTime();
  setInterval(updateTime, 1000);

  updateVisits();

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const btn = document.getElementById("copyUrlBtn");
  if (btn) btn.addEventListener("click", copySiteUrl);

  // 世界时间每秒更新
  updateWorldClocks();
  setInterval(updateWorldClocks, 1000);
});
