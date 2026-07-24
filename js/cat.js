// 桌宠小黑猫：随机游走 + 避开主内容区 + 靠近反应 + 点击特效
(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CAT_W = 60;
  var CAT_H = 40;
  var MARGIN = 16;
  var SPEED = 55; // px/s
  var ALERT_RADIUS = 90;
  var ALERT_COOLDOWN = 1500;

  var cat;
  var pos = { x: 0, y: 0 };
  var target = null;
  var facing = 1;
  var walking = false;
  var lastFrameTime = null;
  var lastAlertAt = 0;
  var stateTimeout = null;

  // 需要避开的区域：主内容、导航栏、页脚——凡是可能有文字的地方都算
  function noGoRects() {
    var selectors = ["main", ".site-nav", ".site-footer"];
    var rects = [];
    selectors.forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      var r = el.getBoundingClientRect();
      rects.push({
        left: r.left - 20,
        top: r.top - 20,
        right: r.right + 20,
        bottom: r.bottom + 20,
      });
    });
    return rects;
  }

  function inAnyRect(x, y, rects) {
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (x + CAT_W > r.left && x < r.right && y + CAT_H > r.top && y < r.bottom) return true;
    }
    return false;
  }

  // 极少数情况下 innerWidth/innerHeight 会在布局完成前读到 0，兜底一个合理默认值，
  // 避免后面算出负坐标把猫甩到视口外面
  function viewportSize() {
    return {
      w: window.innerWidth || document.documentElement.clientWidth || 320,
      h: window.innerHeight || document.documentElement.clientHeight || 480,
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(v, max));
  }

  function clampPoint(p, vw, vh) {
    return {
      x: clamp(p.x, MARGIN, Math.max(MARGIN, vw - MARGIN - CAT_W)),
      y: clamp(p.y, MARGIN, Math.max(MARGIN, vh - MARGIN - CAT_H)),
    };
  }

  function randomPoint() {
    var v = viewportSize();
    return {
      x: MARGIN + Math.random() * Math.max(1, v.w - MARGIN * 2 - CAT_W),
      y: MARGIN + Math.random() * Math.max(1, v.h - MARGIN * 2 - CAT_H),
    };
  }

  // 直线走位如果两个点分别在内容区两侧，中途会穿过文字。
  // 大概率让下一个目标留在当前这一侧（同一条缝隙里），从源头上减少穿过内容区的情况
  function sameSidePoint(mainRect, v) {
    var onLeft = pos.x + CAT_W / 2 < mainRect.left;
    var onRight = pos.x > mainRect.right;
    if (onLeft) {
      return {
        x: MARGIN + Math.random() * Math.max(1, mainRect.left - MARGIN * 2 - CAT_W),
        y: randomPoint().y,
      };
    }
    if (onRight) {
      return {
        x: mainRect.right + MARGIN + Math.random() * Math.max(1, v.w - mainRect.right - MARGIN * 2 - CAT_W),
        y: randomPoint().y,
      };
    }
    return null;
  }

  function pickTarget() {
    var rects = noGoRects();
    var v = viewportSize();
    var mainEl = document.querySelector("main");
    var mainRect = mainEl ? mainEl.getBoundingClientRect() : null;
    var bias = mainRect && Math.random() < 0.65;

    for (var i = 0; i < 20; i++) {
      var p = (bias && sameSidePoint(mainRect, v)) || randomPoint();
      if (!inAnyRect(p.x, p.y, rects)) return clampPoint(p, v.w, v.h);
    }
    // 找不到安全点就贴着视口底部边缘走，通常那里内容较少
    var fallback = { x: MARGIN + Math.random() * Math.max(1, v.w - MARGIN * 2 - CAT_W), y: v.h - CAT_H - MARGIN };
    return clampPoint(fallback, v.w, v.h);
  }

  function setState(state) {
    cat.classList.remove("sitting", "walking");
    cat.classList.add(state);
  }

  function scheduleNextMove(delay) {
    clearTimeout(stateTimeout);
    stateTimeout = setTimeout(startWalking, delay);
  }

  function startSitting() {
    walking = false;
    target = null;
    setState("sitting");
    scheduleNextMove(1800 + Math.random() * 2600);
  }

  function startWalking() {
    target = pickTarget();
    facing = target.x >= pos.x ? 1 : -1;
    walking = true;
    setState("walking");
  }

  function applyTransform() {
    cat.style.transform = "translate(" + pos.x + "px, " + pos.y + "px) scaleX(" + facing + ")";
  }

  function tick(now) {
    if (lastFrameTime == null) lastFrameTime = now;
    var dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (walking && target) {
      var dx = target.x - pos.x;
      var dy = target.y - pos.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var step = SPEED * dt;

      if (dist <= step || dist < 1.5) {
        pos.x = target.x;
        pos.y = target.y;
        applyTransform();
        startSitting();
      } else {
        pos.x += (dx / dist) * step;
        pos.y += (dy / dist) * step;
        applyTransform();
      }
    }

    requestAnimationFrame(tick);
  }

  function onMouseMove(e) {
    if (reduceMotion) return;
    var now = performance.now();
    if (now - lastAlertAt < ALERT_COOLDOWN) return;

    var rect = cat.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var dx = e.clientX - cx;
    var dy = e.clientY - cy;
    if (Math.sqrt(dx * dx + dy * dy) <= ALERT_RADIUS) {
      lastAlertAt = now;
      cat.classList.add("alert");
      setTimeout(function () {
        cat.classList.remove("alert");
      }, 450);
    }
  }

  function spawnFx(kind) {
    var rect = cat.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top;

    var el = document.createElement("div");
    el.className = "cat-fx";
    el.style.left = x + "px";
    el.style.top = y + "px";

    if (kind === "heart") {
      el.className += " cat-fx-heart";
      el.textContent = "♥";
      document.body.appendChild(el);
      setTimeout(function () {
        el.remove();
      }, 1000);
      return;
    }

    if (kind === "bubble") {
      el.className += " cat-fx-bubble";
      el.textContent = ["喵~", "喵？", "呼噜噜"][Math.floor(Math.random() * 3)];
      document.body.appendChild(el);
      setTimeout(function () {
        el.remove();
      }, 1100);
      return;
    }

    // spark：随机方向甩出三个小星芒
    for (var i = 0; i < 3; i++) {
      var spark = document.createElement("div");
      spark.className = "cat-fx cat-fx-spark";
      spark.style.left = x + "px";
      spark.style.top = y + "px";
      spark.textContent = "✦";
      var angle = Math.random() * Math.PI * 2;
      var dist = 18 + Math.random() * 14;
      spark.style.setProperty("--fx-dx", Math.cos(angle) * dist + "px");
      spark.style.setProperty("--fx-dy", Math.sin(angle) * dist + "px");
      document.body.appendChild(spark);
      (function (node) {
        setTimeout(function () {
          node.remove();
        }, 700);
      })(spark);
    }
  }

  function onClick() {
    cat.classList.remove("clicked");
    void cat.offsetWidth;
    cat.classList.add("clicked");

    var effects = ["heart", "bubble", "spark"];
    spawnFx(effects[Math.floor(Math.random() * effects.length)]);
  }

  function buildCat() {
    var wrap = document.createElement("div");
    wrap.className = "desktop-cat sitting";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML =
      '<svg class="cat-svg" viewBox="0 0 60 40">' +
      '<path class="cat-tail" d="M12 22 Q2 18 6 8 Q8 4 12 6"/>' +
      '<ellipse class="cat-body" cx="26" cy="24" rx="15" ry="9"/>' +
      '<path class="cat-ear-l" d="M40 9 L43 1 L47 8 Z"/>' +
      '<path class="cat-ear-r" d="M46 8 L50 0 L53 7 Z"/>' +
      '<circle class="cat-head" cx="46" cy="14" r="8"/>' +
      '<ellipse class="cat-eye" cx="49" cy="12.5" rx="1.4" ry="1.9"/>' +
      '<line class="cat-leg-back" x1="16" y1="31" x2="16" y2="39"/>' +
      '<line class="cat-leg-front" x1="38" y1="31" x2="38" y2="39"/>' +
      "</svg>";
    document.body.appendChild(wrap);
    return wrap;
  }

  function init() {
    cat = buildCat();

    var start = pickTarget();
    pos.x = start.x;
    pos.y = start.y;
    applyTransform();

    cat.addEventListener("click", onClick);

    if (reduceMotion) {
      // 减少动态效果：猫保持坐姿静止，仍可点击互动
      return;
    }

    window.addEventListener("mousemove", onMouseMove);
    requestAnimationFrame(tick);
    scheduleNextMove(1200 + Math.random() * 1800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
