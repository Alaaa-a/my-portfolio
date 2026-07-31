// 彩色卡通眼睛装饰边框：沿页面四周散布手绘感的眼睛，每只眼睛的瞳孔都会缓慢游走
// 纯装饰，不接受任何交互（pointer-events: none）。视口太窄时的隐藏交给 CSS 媒体查询
// （见 style.css 里 .eyes-border 的 @media），不在这里用 JS 判断宽度——
// innerWidth/clientWidth 在页面刚加载、布局还没跑完时偶尔会读到 0（参考 cat.js 里同样的坑），
// 用 CSS 隐藏还能在窗口缩放时自动响应，不需要额外监听 resize。
(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var TOP_EYES = 15;
  var BOTTOM_EYES = 14;
  var EDGE_MARGIN = 0.03; // 每条边两端留出的空白比例，避免眼睛全部挤在角上
  var MIN_GAP_PX = 10; // 同一条边上相邻两只眼睛的包围盒之间至少留这么多像素，避免叠在一起
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
      // 两端不再收成尖角，而是用一段半径 8 的小圆弧把尖点削圆——弧的圆心分别在
      // 尖角往内 8 个单位处，弧本身跨 90°，正好在原来的尖点位置达到最外沿，
      // 视觉上就是一个被磨圆了的杏仁形，而不是完全的尖角。
      outline: function (j) {
        var topY = (10 + j()).toFixed(1);
        var botY = (86 + j()).toFixed(1);
        return (
          '<path d="M 12.3 42.3 Q 60 ' + topY + ' 107.7 42.3' +
          ' A 8 8 0 0 1 107.7 53.7 Q 60 ' + botY + ' 12.3 53.7' +
          ' A 8 8 0 0 1 12.3 42.3 Z" />'
        );
      },
      irisR: 17, safeAx: 18, safeAy: 10
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
    var strokeW = rand(2, 3.4).toFixed(1);
    var strokeColor = "rgba(10, 8, 6, 0.82)";
    var clipId = "eye-clip-" + eyeIdSeq++;

    // 静止的眼睛也随机给一个初始朝向，不是所有眼睛都直勾勾看向正前方
    var restOffset = randomPointInSafeZone(shape.safeAx, shape.safeAy);
    var outerR = shape.irisR;

    // 瞳孔（最内层）缩回最初设计版本的比例，虹膜整体大小（outerR）不变；
    // 中间这层的厚度还是随机分配，留一个最小厚度让每一层都还看得见
    var minLayerGap = outerR * 0.08;
    var pupilR = outerR * 0.34;
    var midR = rand(pupilR + minLayerGap, outerR - minLayerGap);

    // 最内层（瞳孔）固定是黑色，外圈和中圈从色板里挑两个互不相近的鲜艳色，
    // 保证不会出现黑色跑到外圈/中圈的情况
    var outerColor = colors[1];
    var midColor = colors[2];
    var pupilColor = "#141414";

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
      '<circle cx="' + shape.cx + '" cy="' + shape.cy + '" r="' + outerR.toFixed(1) + '" fill="' + outerColor + '" />' +
      '<circle cx="' + shape.cx + '" cy="' + shape.cy + '" r="' + midR.toFixed(1) + '" fill="' + midColor + '" />' +
      '<circle cx="' + shape.cx + '" cy="' + shape.cy + '" r="' + pupilR.toFixed(1) + '" fill="' + pupilColor + '" />' +
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

  // 沿一条边生成 count 只眼睛并摆位，保证同一条边上任意两只的水平范围都不会重叠。
  // 做法：先按"均匀分布 + 轻微随机抖动"算出每只眼睛想要的目标位置（保留手绘散布的随机感），
  // 再按目标位置从左到右排序，依次摆放——如果某一只跟前一只挨得太近（近到会重叠），
  // 就把它顺移到刚好紧挨着前一只、留够 MIN_GAP_PX 间距的位置，这样无论目标位置怎么抖动，
  // 最终结果里同一条边的眼睛之间必然留有间距。
  function layoutEdge(edgeName, count, vw) {
    // 每只眼睛还会随机旋转 ±12°，旋转后的视觉包围盒比未旋转时略宽，理想情况下
    // 碰撞检测按 1.15 倍宽度预留空间。但"不重叠"是硬约束，"旋转安全边距"只是
    // 有富余空间时才享受的额外保险——如果这条边上所有眼睛的真实宽度加最小间距
    // 已经快要放不下了，就按比例把这份额外安全边距压缩甚至去掉，
    // 而不是像之前那样直接把眼睛的位置怼回视口内、导致挤开前一只顶到它。
    var ROTATION_SAFETY = 1.15;

    var items = [];
    for (var i = 0; i < count; i++) {
      var el = buildEyeEl();
      var width = parseFloat(el.style.width);
      var base = (i + 0.5) / count;
      var jitter = rand(-0.35, 0.35) / count;
      var frac = Math.min(1 - EDGE_MARGIN, Math.max(EDGE_MARGIN, base + jitter));
      items.push({ el: el, width: width, desiredCenterPx: frac * vw });
    }

    var totalRawWidth = items.reduce(function (sum, it) {
      return sum + it.width;
    }, 0);
    var minGapsTotal = Math.max(0, count - 1) * MIN_GAP_PX;
    var desiredRotationPad = totalRawWidth * (ROTATION_SAFETY - 1);
    var availableSlack = Math.max(0, vw - totalRawWidth - minGapsTotal);
    var padScale = desiredRotationPad > 0 ? Math.min(1, availableSlack / desiredRotationPad) : 0;

    items.forEach(function (item) {
      item.footprint = item.width + item.width * (ROTATION_SAFETY - 1) * padScale;
    });

    items.sort(function (a, b) {
      return a.desiredCenterPx - b.desiredCenterPx;
    });

    var cursor = 0;
    items.forEach(function (item) {
      var slotLeft = Math.max(item.desiredCenterPx - item.footprint / 2, cursor);
      item.leftPx = slotLeft + (item.footprint - item.width) / 2;
      cursor = slotLeft + item.footprint + MIN_GAP_PX;
    });

    items.forEach(function (item) {
      var el = item.el;
      el.style.position = "absolute";
      el.style.left = ((item.leftPx / vw) * 100).toFixed(2) + "%";
      var depth = edgeName === "top" ? rand(NAV_CLEARANCE + 6, NAV_CLEARANCE + 40) : rand(6, 46);
      if (edgeName === "top") {
        el.style.top = depth + "px";
      } else {
        el.style.bottom = depth + "px";
      }
    });

    return items.map(function (item) {
      return item.el;
    });
  }

  function startEyes() {
    if (container) return;

    container = document.createElement("div");
    container.className = "eyes-border";
    container.setAttribute("aria-hidden", "true");

    var vw = window.innerWidth || document.documentElement.clientWidth || 1280;
    var fragment = document.createDocumentFragment();

    layoutEdge("top", TOP_EYES, vw).forEach(function (el) {
      fragment.appendChild(el);
    });
    layoutEdge("bottom", BOTTOM_EYES, vw).forEach(function (el) {
      fragment.appendChild(el);
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
