// 彩色卡通眼睛装饰边框：沿页面四周散布手绘感的眼睛，每只眼睛的瞳孔都会缓慢游走
// 纯装饰，不接受任何交互（pointer-events: none）。视口太窄时的隐藏交给 CSS 媒体查询
// （见 style.css 里 .eyes-border 的 @media），不在这里用 JS 判断宽度——
// innerWidth/clientWidth 在页面刚加载、布局还没跑完时偶尔会读到 0（参考 cat.js 里同样的坑），
// 用 CSS 隐藏还能在窗口缩放时自动响应，不需要额外监听 resize。
(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var TOTAL_EYES = 21;
  var EDGE_MARGIN = 0.03; // 每条边两端留出的空白比例，避免眼睛全部挤在角上
  var MIN_HUE_DIST = 50; // 同一只眼睛三层颜色之间最小色相间隔（角度），避免选到两个"看着差不多"的颜色
  var NAV_CLEARANCE = 64; // 顶部导航栏高度（--nav-height），上边缘的眼睛要避开它，不然会被盖住

  // 眼白、虹膜外圈、虹膜内圈都从这个鲜艳色板里挑，同一只眼睛三层互不相同
  var PALETTE = [
    "#ff4d7d", "#29d1d1", "#ff8a3d", "#8ee06b", "#b06bff",
    "#ffd23f", "#ff5c5c", "#4da6ff", "#e64ac9", "#2bd9c9", "#ff9ecb", "#6be0a6",
    "#ff6f3c", "#4ce0d2", "#c68cff", "#ffe14d"
  ];
  var EASINGS = ["ease-in-out", "cubic-bezier(.4,0,.2,1)", "cubic-bezier(.65,0,.35,1)", "ease-out"];
  var eyeIdSeq = 0;

  var TOGGLE_KEY = "alaaa-eyes-enabled";
  var container = null;
  var pendingTimers = [];

  // 只保留杏仁形一种模板，坐标写在它自己的 viewBox 局部坐标系里。中间控制点的高度
  // （topY/botY 相对 cy 的距离）决定"睁开程度"——数值越接近半宽，眼睛越圆润饱满。
  // irisR / safeAx / safeAy 是"虹膜半径"和"虹膜中心允许偏移的椭圆安全区半轴"，
  // 是根据眼眶（sclera）的包围盒手算留出安全余量得出的，保证瞳孔怎么移动都不会越出眼眶。
  var SHAPES = {
    almond: {
      vbW: 120, vbH: 96, cx: 60, cy: 48,
      outline: function (j) {
        var topY = (10 + j()).toFixed(1);
        var botY = (86 + j()).toFixed(1);
        return '<path d="M 10 48 Q 60 ' + topY + ' 110 48 Q 60 ' + botY + ' 10 48 Z" />';
      },
      irisR: 13, safeAx: 22, safeAy: 13
    }
  };
  var SHAPE_KEYS = Object.keys(SHAPES);

  // 预先算好每个色板颜色的色相（HSL 的 H），挑颜色时只比较色相角度，
  // 不用每次都重新做 RGB→HSL 换算
  function hexToHue(hex) {
    var r = parseInt(hex.substr(1, 2), 16) / 255;
    var g = parseInt(hex.substr(3, 2), 16) / 255;
    var b = parseInt(hex.substr(5, 2), 16) / 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var d = max - min;
    var h;
    if (d === 0) h = 0;
    else if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
    return h;
  }

  var PALETTE_HUES = PALETTE.map(hexToHue);

  // 色相是环形的（0 和 360 其实是同一个点），取两个方向里更短的那个夹角
  function hueDist(a, b) {
    var d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  // 从色板里挑 n 个颜色，保证两两色相间隔都不小于 minHueDist——
  // 避免同一只眼睛的眼白/虹膜外圈/虹膜内圈选到两个"看起来很接近"的颜色。
  // 做法：把色板顺序打乱后逐个尝试，只收下跟已选颜色色相都够远的；万一色板凑不满
  // n 个（正常不会发生，色板足够大），退化成挑剩下里跟已选颜色色相差异最大的那个。
  function pickDistinctColors(n, minHueDist) {
    var indices = PALETTE.map(function (_, i) {
      return i;
    });
    for (var i = indices.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }

    var chosen = [];
    for (var k = 0; k < indices.length && chosen.length < n; k++) {
      var idx = indices[k];
      var farEnough = chosen.every(function (c) {
        return hueDist(PALETTE_HUES[idx], PALETTE_HUES[c]) >= minHueDist;
      });
      if (farEnough) chosen.push(idx);
    }

    while (chosen.length < n) {
      var best = -1;
      var bestScore = -1;
      for (var m = 0; m < PALETTE.length; m++) {
        if (chosen.indexOf(m) !== -1) continue;
        var minD = 999;
        for (var c2 = 0; c2 < chosen.length; c2++) {
          minD = Math.min(minD, hueDist(PALETTE_HUES[m], PALETTE_HUES[chosen[c2]]));
        }
        if (minD > bestScore) {
          bestScore = minD;
          best = m;
        }
      }
      chosen.push(best);
    }

    return chosen.map(function (i) {
      return PALETTE[i];
    });
  }

  // 核心边界限制：把候选偏移量 clamp 到一个椭圆形安全区内（ax/ay 是安全区的半轴）。
  // 用归一化坐标算出偏移点到安全区边界的"距离比例"，超过 1 就按比例缩回边界上，
  // 这样无论眼睛多大多小、形状多扁，瞳孔中心永远不会跑出预先算好的安全范围。
  function clampToSafeZone(dx, dy, ax, ay) {
    if (ax <= 0 || ay <= 0) return { x: 0, y: 0 };
    var nx = dx / ax;
    var ny = dy / ay;
    var d = Math.sqrt(nx * nx + ny * ny);
    if (d <= 1) return { x: dx, y: dy };
    return { x: dx / d, y: dy / d };
  }

  // 在安全椭圆内均匀取一个随机点（极坐标 + 面积均匀化，避免瞳孔总往中心堆）
  function randomPointInSafeZone(ax, ay) {
    var angle = rand(0, Math.PI * 2);
    var r = Math.sqrt(Math.random());
    return clampToSafeZone(Math.cos(angle) * r * ax, Math.sin(angle) * r * ay, ax, ay);
  }

  function buildEyeEl() {
    var shapeKey = pick(SHAPE_KEYS);
    var shape = SHAPES[shapeKey];
    var jitterAmt = rand(3, 8);
    var jitter = function () {
      return rand(-jitterAmt, jitterAmt);
    };
    var colors = pickDistinctColors(3, MIN_HUE_DIST);
    var scleraFill = colors[0];
    var irisOuterColor = colors[1];
    var irisInnerColor = colors[2];
    var strokeW = rand(2, 3.4).toFixed(1);
    var strokeColor = "rgba(10, 8, 6, 0.82)";
    var clipId = "eye-clip-" + eyeIdSeq++;

    // 静止的眼睛也随机给一个初始朝向，不是所有眼睛都直勾勾看向正前方
    var restOffset = randomPointInSafeZone(shape.safeAx, shape.safeAy);
    var irisR = shape.irisR;
    var innerR = (irisR * 0.62).toFixed(1);
    var pupilR = (irisR * 0.34).toFixed(1);

    // 眼眶轮廓只画一次，同时喂给可见的眼白 <g> 和 clipPath——两者形状完全一致，
    // 瞳孔那层套上这个 clip-path 之后，游走到眼眶边缘时会被眼眶"遮住"而不是画到外面去，
    // 这样无论安全区的椭圆近似算得多准，视觉上都不可能超出眼眶边框。
    var outlineMarkup = shape.outline(jitter);

    var svgHtml =
      '<svg viewBox="0 0 ' + shape.vbW + ' ' + shape.vbH + '" class="eye-deco-svg">' +
      '<defs><clipPath id="' + clipId + '">' + outlineMarkup + '</clipPath></defs>' +
      '<g class="eye-deco-sclera" fill="' + scleraFill + '" stroke="' + strokeColor + '" stroke-width="' + strokeW + '">' +
      outlineMarkup +
      '</g>' +
      '<g clip-path="url(#' + clipId + ')">' +
      '<g class="eye-deco-iris" transform="translate(' + restOffset.x.toFixed(1) + ' ' + restOffset.y.toFixed(1) + ')">' +
      '<circle cx="' + shape.cx + '" cy="' + shape.cy + '" r="' + irisR + '" fill="' + irisOuterColor + '" />' +
      '<circle cx="' + shape.cx + '" cy="' + shape.cy + '" r="' + innerR + '" fill="' + irisInnerColor + '" />' +
      '<circle cx="' + shape.cx + '" cy="' + shape.cy + '" r="' + pupilR + '" fill="#141414" />' +
      '</g>' +
      '</g>' +
      '</svg>';

    var wrap = document.createElement("div");
    wrap.className = "eye-deco";
    wrap.innerHTML = svgHtml;

    // 大部分眼睛维持原来的尺寸范围，约三分之一随机长得更大一些，制造大小错落感
    var baseSize = Math.random() < 0.35 ? rand(78, 108) : rand(40, 68);
    var aspect = shape.vbH / shape.vbW;
    wrap.style.width = baseSize + "px";
    wrap.style.height = baseSize * aspect + "px";
    wrap.style.transform = "rotate(" + rand(-12, 12).toFixed(1) + "deg)";

    if (!reduceMotion) {
      var irisEl = wrap.querySelector(".eye-deco-iris");
      startWander(irisEl, shape);
    }

    return wrap;
  }

  // 每只眼睛的瞳孔都会动，但各自拥有自己的"节奏"：移动间隔和过渡时长都乘上一个随机因子，
  // 让所有眼睛的转动快慢、疏密都不一样，避免整齐划一的机械感。
  function startWander(irisEl, shape) {
    var tempo = rand(0.6, 2.3);

    function step() {
      var target = randomPointInSafeZone(shape.safeAx, shape.safeAy);
      var duration = rand(500, 1300) * tempo;
      irisEl.style.transitionDuration = Math.round(duration) + "ms";
      irisEl.style.transitionTimingFunction = pick(EASINGS);
      irisEl.setAttribute("transform", "translate(" + target.x.toFixed(1) + " " + target.y.toFixed(1) + ")");

      var holdMultiplier = Math.random() < 0.2 ? rand(2.5, 4) : 1; // 偶尔发呆停久一点
      var delay = rand(900, 2600) * tempo * holdMultiplier + duration;
      pendingTimers.push(setTimeout(step, delay));
    }

    pendingTimers.push(setTimeout(step, rand(0, 1200)));
  }

  function distributeCounts(total) {
    var topN = Math.round(total / 2);
    var bottomN = total - topN;
    return { top: topN, bottom: bottomN };
  }

  function edgePositions(count) {
    var positions = [];
    for (var i = 0; i < count; i++) {
      var base = (i + 0.5) / count;
      var jitter = rand(-0.35, 0.35) / count;
      var frac = base + jitter;
      frac = Math.min(1 - EDGE_MARGIN, Math.max(EDGE_MARGIN, frac));
      positions.push(frac);
    }
    return positions;
  }

  function placeOnEdge(el, edge, frac, depth) {
    var style = el.style;
    style.left = (frac * 100).toFixed(2) + "%";
    if (edge === "top") {
      style.top = depth + "px";
    } else {
      style.bottom = depth + "px";
    }
  }

  function startEyes() {
    if (container) return;

    container = document.createElement("div");
    container.className = "eyes-border";
    container.setAttribute("aria-hidden", "true");

    var counts = distributeCounts(TOTAL_EYES);
    var edges = [
      { name: "top", n: counts.top },
      { name: "bottom", n: counts.bottom }
    ];

    var fragment = document.createDocumentFragment();

    edges.forEach(function (edge) {
      var fracs = edgePositions(edge.n);
      fracs.forEach(function (frac) {
        var el = buildEyeEl();
        el.style.position = "absolute";
        var depth = edge.name === "top" ? rand(NAV_CLEARANCE + 6, NAV_CLEARANCE + 40) : rand(6, 46);
        placeOnEdge(el, edge.name, frac, depth);
        fragment.appendChild(el);
      });
    });

    container.appendChild(fragment);
    document.body.appendChild(container);
  }

  function stopEyes() {
    pendingTimers.forEach(clearTimeout);
    pendingTimers = [];
    if (container) {
      container.remove();
      container = null;
    }
  }

  // ===== 隐藏开关：控制眼睛装饰边框的显示/隐藏，状态记在 localStorage 里，默认关闭 =====
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

  function showToggleFeedback(btn, enabled) {
    var rect = btn.getBoundingClientRect();
    var tip = document.createElement("span");
    tip.className = "eyes-toggle-tip";
    tip.textContent = enabled ? "👁 装饰眼睛已开启" : "👁 装饰眼睛已关闭";
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

  // 藏在页面右上角的小圆点，平时几乎看不见，点一下切换眼睛装饰边框的开关
  function buildToggle() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "eyes-toggle";
    btn.setAttribute("aria-label", "切换装饰眼睛显示");
    document.body.appendChild(btn);

    btn.addEventListener("click", function () {
      var next = !isEnabled();
      setEnabled(next);
      if (next) {
        startEyes();
      } else {
        stopEyes();
      }
      showToggleFeedback(btn, next);
    });
  }

  function init() {
    buildToggle();
    if (isEnabled()) startEyes();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
