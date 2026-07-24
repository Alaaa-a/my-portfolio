// 星空背景：闪烁的圆点星 + 十字闪光星 + 随机划过的流星
(function () {
  var canvas = document.getElementById("stars-canvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var stars = [];
  var meteors = [];
  var width, height;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var STAR_DENSITY = 1 / 2800; // 每平方像素的星星数量
  var SPARKLE_RATIO = 0.16; // 十字闪光星占比

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createStars();
  }

  function createStars() {
    var count = Math.floor(width * height * STAR_DENSITY);
    stars = [];
    for (var i = 0; i < count; i++) {
      var isSparkle = Math.random() < SPARKLE_RATIO;
      stars.push({
        type: isSparkle ? "sparkle" : "dot",
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.3 + 0.3,
        size: Math.random() * 8 + 7, // 仅闪光星使用：星芒臂长
        baseAlpha: Math.random() * 0.6 + 0.3,
        twinkleSpeed: Math.random() * 0.006 + 0.002,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawDot(x, y, radius, alpha) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(232, 233, 245, " + alpha.toFixed(3) + ")";
    ctx.fill();
  }

  function drawSparkle(x, y, size, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;

    var hGrad = ctx.createLinearGradient(-size, 0, size, 0);
    hGrad.addColorStop(0, "rgba(232,233,245,0)");
    hGrad.addColorStop(0.5, "rgba(255,255,255,0.95)");
    hGrad.addColorStop(1, "rgba(232,233,245,0)");
    ctx.strokeStyle = hGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.stroke();

    var vGrad = ctx.createLinearGradient(0, -size, 0, size);
    vGrad.addColorStop(0, "rgba(232,233,245,0)");
    vGrad.addColorStop(0.5, "rgba(255,255,255,0.95)");
    vGrad.addColorStop(1, "rgba(232,233,245,0)");
    ctx.strokeStyle = vGrad;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.09, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawStars(time) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var alpha = reduceMotion
        ? s.baseAlpha
        : s.baseAlpha +
          Math.sin(time * s.twinkleSpeed + s.phase) * 0.35 * s.baseAlpha;
      alpha = Math.max(0, Math.min(1, alpha));
      if (s.type === "sparkle") {
        drawSparkle(s.x, s.y, s.size, alpha);
      } else {
        drawDot(s.x, s.y, s.radius, alpha);
      }
    }
  }

  // ===== 流星 =====
  function spawnMeteor() {
    var startX = width * (0.55 + Math.random() * 0.55);
    var startY = height * (-0.05 + Math.random() * 0.3);
    var angle = ((135 + (Math.random() * 12 - 6)) * Math.PI) / 180;
    var speed = 10 + Math.random() * 6;
    meteors.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: 110 + Math.random() * 70,
      life: 1,
    });
  }

  function scheduleMeteor() {
    var delay = 3500 + Math.random() * 6500; // 3.5s ~ 10s 随机间隔
    setTimeout(function () {
      spawnMeteor();
      scheduleMeteor();
    }, delay);
  }

  function updateAndDrawMeteors() {
    for (var i = meteors.length - 1; i >= 0; i--) {
      var m = meteors[i];
      m.x += m.vx;
      m.y += m.vy;
      m.life -= 0.012;

      if (m.life <= 0 || m.x < -m.len || m.y > height + m.len) {
        meteors.splice(i, 1);
        continue;
      }

      var dirLen = Math.hypot(m.vx, m.vy);
      var ux = m.vx / dirLen;
      var uy = m.vy / dirLen;
      var tailX = m.x - ux * m.len;
      var tailY = m.y - uy * m.len;
      var alpha = Math.min(1, m.life * 2.5);

      var grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      grad.addColorStop(0, "rgba(232,233,245,0)");
      grad.addColorStop(1, "rgba(255,255,255," + alpha.toFixed(3) + ")");

      ctx.beginPath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255," + alpha.toFixed(3) + ")";
      ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    drawStars(time);
    updateAndDrawMeteors();
    if (!reduceMotion) {
      requestAnimationFrame(draw);
    }
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
  if (reduceMotion) {
    draw(0);
  } else {
    scheduleMeteor();
  }
})();
