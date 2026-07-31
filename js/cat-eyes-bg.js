// 桌宠彩蛋：猫猫眼睛背景，默认关闭，靠右上角"眼睛开关"左边的隐藏小圆点切换。
// 会眨眼、瞳孔会跟着鼠标看
(function () {
  var TOGGLE_KEY = "alaaa-cat-eyes-bg-enabled";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var container = null;
  var pendingTimers = [];
  var mouseMoveHandler = null;
  var rafPending = false;
  var lastMouseX = 0;
  var lastMouseY = 0;

  var MAX_OFFSET_X = 9;
  var MAX_OFFSET_Y = 6;
  var SENSITIVITY = 0.045; // 鼠标离眼睛多远时瞳孔偏移就顶到最大值，数值越小越迟钝

  // 用户提供的手绘猫眼 SVG 原样保留（去掉了外层 <svg> 和纯黑背景矩形，让它能透在
  // 星空背景上）。相比最初版本多套了两层：
  // - .cat-eye-blink 包住整只眼睛（含黄色眼形轮廓），眨眼时靠 CSS 把它压扁成一条线；
  // - .cat-eye-pupil 只包住黑色瞳孔和白色高光，跟着鼠标小幅度平移，
  //   套着同一个 clip-path，挪到边缘时会被眼形"遮住"而不会画出界。
  // data-mirror="1" 的那只眼睛套了 scale(-1,1) 镜像，瞳孔左右偏移要反着算。
  function eyeMarkup(groupTransform, mirror) {
    return (
      '<g transform="' + groupTransform + '">' +
      '<g class="cat-eye-blink"' + (mirror ? ' data-mirror="1"' : "") + '>' +
      '<path d="M200.75 183.12 Q204.89 148.02 234.01 106.26 C245.96 98.15 256.57 90.23 268.55 83.23 C312.06 68.88 387.9 69.64 462.02 73.81 Q463.31 117.61 455.02 150.08 Q438.86 194.87 403.6 212.09 Q320.37 258.91 209.63 187.83 Z" fill="#f5d020" stroke="#0a0806" stroke-width="4" />' +
      '<g clip-path="url(#cat-eyes-bg-clip)">' +
      '<g class="cat-eye-pupil">' +
      '<rect x="240" y="-31" width="190" height="250" rx="95" ry="95" fill="#0a0806" />' +
      '<ellipse cx="327" cy="87" rx="14" ry="9" fill="#ffffff" />' +
      '</g>' +
      '</g>' +
      '</g>' +
      '</g>'
    );
  }

  var CAT_EYES_MARKUP =
    '<defs>' +
    '<clipPath id="cat-eyes-bg-clip">' +
    '<path d="M200.75 183.12 Q204.89 148.02 234.01 106.26 C245.96 98.15 256.57 90.23 268.55 83.23 C312.06 68.88 387.9 69.64 462.02 73.81 Q463.31 117.61 455.02 150.08 Q438.86 194.87 403.6 212.09 Q320.37 258.91 209.63 187.83 Z" />' +
    '</clipPath>' +
    '</defs>' +
    eyeMarkup("translate(503.31,0) scale(-1,1)", true) +
    eyeMarkup("translate(364.37,0)", false);

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

  function clamp(v, min, max) {
    return Math.max(min, Math.min(v, max));
  }

  // 瞳孔跟着鼠标看：每只眼睛用自己在屏幕上的实际中心点算鼠标方向，
  // 镜像过的那只眼睛要把左右偏移反过来，不然两只眼睛会看向反方向
  function updatePupils() {
    rafPending = false;
    var pupils = container && container.querySelectorAll(".cat-eye-pupil");
    if (!pupils) return;
    pupils.forEach(function (pupilEl) {
      var eyeGroup = pupilEl.closest(".cat-eye-blink");
      var rect = eyeGroup.getBoundingClientRect();
      if (rect.width === 0) return;
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var mirror = eyeGroup.getAttribute("data-mirror") === "1";
      var dx = clamp((lastMouseX - cx) * SENSITIVITY, -MAX_OFFSET_X, MAX_OFFSET_X);
      var dy = clamp((lastMouseY - cy) * SENSITIVITY, -MAX_OFFSET_Y, MAX_OFFSET_Y);
      if (mirror) dx = -dx;
      pupilEl.setAttribute("transform", "translate(" + dx.toFixed(1) + " " + dy.toFixed(1) + ")");
    });
  }

  function onMouseMove(e) {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updatePupils);
    }
  }

  // 眨眼：两只眼睛一起压扁成一条线再弹回来，间隔随机；偶尔连眨两下更有猫的感觉。
  // 这里出现的每一个 setTimeout id 都要记进 pendingTimers，不然背景被关掉之后
  // 还在飞行中的那一个（比如正压扁到一半，或者两连眨中间那 160ms 的空档）不会被
  // stopBg() 取消，等用户很快又重新打开时就会跟新的眨眼循环并行跑出两套。
  function scheduleBlink() {
    var delay = 2400 + Math.random() * 4200;
    pendingTimers.push(
      setTimeout(function () {
        if (!container) return;
        doBlink(function () {
          if (Math.random() < 0.25) {
            pendingTimers.push(
              setTimeout(function () {
                if (!container) return;
                doBlink(scheduleBlink);
              }, 160)
            );
          } else {
            scheduleBlink();
          }
        });
      }, delay)
    );
  }

  function doBlink(onDone) {
    if (!container) return;
    var eyes = container.querySelectorAll(".cat-eye-blink");
    eyes.forEach(function (el) {
      el.classList.add("blinking");
    });
    pendingTimers.push(
      setTimeout(function () {
        eyes.forEach(function (el) {
          el.classList.remove("blinking");
        });
        if (onDone) onDone();
      }, 120)
    );
  }

  function startBg() {
    if (container) return;
    container = document.createElement("div");
    container.className = "cat-eyes-bg";
    container.setAttribute("aria-hidden", "true");
    container.innerHTML =
      '<svg viewBox="0 0 900 300" class="cat-eyes-bg-svg">' + CAT_EYES_MARKUP + '</svg>';
    document.body.appendChild(container);

    if (!reduceMotion) {
      mouseMoveHandler = onMouseMove;
      window.addEventListener("mousemove", mouseMoveHandler);
      scheduleBlink();
    }
  }

  function stopBg() {
    if (mouseMoveHandler) {
      window.removeEventListener("mousemove", mouseMoveHandler);
      mouseMoveHandler = null;
    }
    pendingTimers.forEach(clearTimeout);
    pendingTimers = [];
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
