// 桌宠彩蛋：猫猫眼睛背景，默认关闭，靠右上角"眼睛开关"左边的隐藏小圆点切换
(function () {
  var TOGGLE_KEY = "alaaa-cat-eyes-bg-enabled";
  var container = null;

  // 用户提供的手绘猫眼 SVG 原样保留（去掉了外层 <svg> 和纯黑背景矩形，
  // 让它能透在星空背景上），一对镜像的杏仁形猫眼 + 竖长瞳孔 + 高光
  var CAT_EYES_MARKUP =
    '<defs>' +
    '<clipPath id="cat-eyes-bg-clip">' +
    '<path d="M200.75 183.12 Q204.89 148.02 234.01 106.26 C245.96 98.15 256.57 90.23 268.55 83.23 C312.06 68.88 387.9 69.64 462.02 73.81 Q463.31 117.61 455.02 150.08 Q438.86 194.87 403.6 212.09 Q320.37 258.91 209.63 187.83 Z" />' +
    '</clipPath>' +
    '</defs>' +
    '<g transform="translate(503.31,0) scale(-1,1)">' +
    '<path d="M200.75 183.12 Q204.89 148.02 234.01 106.26 C245.96 98.15 256.57 90.23 268.55 83.23 C312.06 68.88 387.9 69.64 462.02 73.81 Q463.31 117.61 455.02 150.08 Q438.86 194.87 403.6 212.09 Q320.37 258.91 209.63 187.83 Z" fill="#f5d020" stroke="#0a0806" stroke-width="4" />' +
    '<rect x="240" y="-31" width="190" height="250" rx="95" ry="95" fill="#0a0806" clip-path="url(#cat-eyes-bg-clip)" />' +
    '<ellipse cx="327" cy="87" rx="14" ry="9" fill="#ffffff" clip-path="url(#cat-eyes-bg-clip)" />' +
    '</g>' +
    '<g transform="translate(364.37,0)">' +
    '<path d="M200.75 183.12 Q204.89 148.02 234.01 106.26 C245.96 98.15 256.57 90.23 268.55 83.23 C312.06 68.88 387.9 69.64 462.02 73.81 Q463.31 117.61 455.02 150.08 Q438.86 194.87 403.6 212.09 Q320.37 258.91 209.63 187.83 Z" fill="#f5d020" stroke="#0a0806" stroke-width="4" />' +
    '<rect x="240" y="-31" width="190" height="250" rx="95" ry="95" fill="#0a0806" clip-path="url(#cat-eyes-bg-clip)" />' +
    '<ellipse cx="327" cy="87" rx="14" ry="9" fill="#ffffff" clip-path="url(#cat-eyes-bg-clip)" />' +
    '</g>';

  function isEnabled() {
    try {
      var v = localStorage.getItem(TOGGLE_KEY);
      return v === "1";
    } catch (e) {
      return false;
    }
  }

  function setEnabled(enabled) {
    try {
      localStorage.setItem(TOGGLE_KEY, enabled ? "1" : "0");
    } catch (e) {}
  }

  function startBg() {
    if (container) return;
    container = document.createElement("div");
    container.className = "cat-eyes-bg";
    container.setAttribute("aria-hidden", "true");
    container.innerHTML =
      '<svg viewBox="0 0 900 300" class="cat-eyes-bg-svg">' + CAT_EYES_MARKUP + '</svg>';
    document.body.appendChild(container);
  }

  function stopBg() {
    if (container) {
      container.remove();
      container = null;
    }
  }

  function showToggleFeedback(btn, enabled) {
    var rect = btn.getBoundingClientRect();
    var tip = document.createElement("span");
    tip.className = "eyes-toggle-tip";
    tip.textContent = enabled ? "🐱 猫猫眼睛背景已开启" : "🐱 猫猫眼睛背景已关闭";
    tip.style.right = window.innerWidth - rect.left + 10 + "px";
    tip.style.top = rect.top - 4 + "px";
    document.body.appendChild(tip);

    requestAnimationFrame(function () {
      tip.classList.add("show");
    });
    setTimeout(function () {
      tip.classList.remove("show");
      setTimeout(function () {
        tip.remove();
      }, 300);
    }, 1400);
  }

  // 藏在右上角，紧挨着装饰眼睛开关的左边，同样平时几乎看不见
  function buildToggle() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cat-eyes-toggle";
    btn.setAttribute("aria-label", "切换猫猫眼睛背景彩蛋");
    document.body.appendChild(btn);

    btn.addEventListener("click", function () {
      var next = !isEnabled();
      setEnabled(next);
      if (next) {
        startBg();
      } else {
        stopBg();
      }
      showToggleFeedback(btn, next);
    });
  }

  function init() {
    buildToggle();
    if (isEnabled()) startBg();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
