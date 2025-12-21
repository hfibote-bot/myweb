<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>行星运动演示（N 体重力）</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, "Microsoft YaHei", sans-serif;
      background: #070b12;
      overflow: hidden;
    }
    canvas { display: block; width: 100vw; height: 100vh; }

    .ui {
      position: fixed;
      left: 12px;
      top: 12px;
      z-index: 10;
      padding: 12px;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      background: rgba(20, 24, 34, 0.72);
      backdrop-filter: blur(10px);
      box-shadow: 0 16px 60px rgba(0,0,0,0.45);
      max-width: min(420px, calc(100vw - 24px));
    }
    .row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .row + .row { margin-top: 10px; }
    .title { font-weight: 700; font-size: 14px; margin-bottom: 8px; opacity: 0.95; }
    button, input[type="range"] {
      font: inherit;
    }
    button {
      cursor: pointer;
      padding: 8px 10px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.16);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.92);
    }
    button:hover { filter: brightness(1.1); }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.04);
      color: rgba(255,255,255,0.86);
      font-size: 12px;
    }
    label { user-select: none; }
    .muted { opacity: 0.78; font-size: 12px; }
    .spacer { flex: 1; }
    a { color: rgba(180, 220, 255, 0.9); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .kbd {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      padding: 1px 6px;
      border: 1px solid rgba(255,255,255,0.18);
      border-bottom-color: rgba(255,255,255,0.10);
      border-radius: 8px;
      background: rgba(255,255,255,0.06);
      font-size: 12px;
    }
  </style>
</head>

<body>
  <canvas id="c"></canvas>

  <div class="ui">
    <div class="title">行星运动演示（N 体重力）</div>

    <div class="row">
      <button id="toggleBtn">⏸ 暂停</button>
      <button id="resetBtn">↺ 重置</button>
      <button id="recenterBtn">◎ 回到太阳</button>
      <div class="spacer"></div>
      <span class="pill" id="hud">time: 0 d</span>
    </div>

    <div class="row">
      <label class="pill">
        速度
        <input id="speed" type="range" min="0" max="100" value="55" />
        <span id="speedText">1x</span>
      </label>
      <label class="pill">
        步长
        <input id="step" type="range" min="1" max="40" value="10" />
        <span id="stepText">0.5 d</span>
      </label>
    </div>

    <div class="row">
      <label class="pill"><input id="trails" type="checkbox" checked /> 轨迹</label>
      <label class="pill"><input id="labels" type="checkbox" checked /> 名称</label>
      <label class="pill"><input id="nbody" type="checkbox" checked /> N体互相引力</label>
    </div>

    <div class="row muted">
      操作：鼠标滚轮缩放｜左键拖拽平移｜点击星体跟随/取消跟随｜<span class="kbd">Esc</span> 取消跟随
    </div>

    <div class="row muted">
      提示：这是“静态网页 + 前端 JS”，很适合放 GitHub Pages。
      <a href="./">回首页</a>
    </div>
  </div>

  <script src="planets.js"></script>
</body>
</html>
