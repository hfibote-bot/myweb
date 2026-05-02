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
    if (pvNode.textContent && pvNode.textContent.includes("加载中")) {
      pvNode.textContent = "暂不可用";
    }
  }, 4000);
}

document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const btn = document.getElementById("copyUrlBtn");
  if (btn) btn.addEventListener("click", copySiteUrl);

  updateWorldClocks();
  setInterval(updateWorldClocks, 1000);

  initBusuanziFallback();
});
