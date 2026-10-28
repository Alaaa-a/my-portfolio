// 作品展示：读取 data/portfolio.json 渲染项目卡片（封面截图 + 缩略图 + 点击看大图（js/lightbox.js）+ 跳转开发日志）
(function () {
  // 真实内容换上去之后（无论 fetch 成功还是失败）才把 <main> 显示出来，
  // 避免先闪一下写死的占位内容；4 秒兜底，防止意外卡在隐藏状态
  function reveal() {
    var main = document.querySelector("main");
    if (main) main.classList.remove("page-loading");
  }
  setTimeout(reveal, 4000);

  function imageButton(className, images, index, alt) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = className;
    btn.setAttribute("aria-label", i18n.t("lightbox.open"));
    var img = document.createElement("img");
    img.src = images[index];
    img.alt = alt;
    img.loading = "lazy";
    btn.appendChild(img);
    btn.addEventListener("click", function () {
      lightbox.open(images, index, alt);
    });
    return btn;
  }

  function buildCard(item) {
    var title = i18n.f(item, "title") || "";
    var card = document.createElement("div");
    card.className = "placeholder-card portfolio-card";

    var images = (item.images || []).filter(Boolean);
    if (images.length) {
      card.appendChild(imageButton("portfolio-cover", images, 0, title));
      if (images.length > 1) {
        var thumbs = document.createElement("div");
        thumbs.className = "portfolio-thumbs";
        images.forEach(function (_, i) {
          thumbs.appendChild(imageButton("", images, i, title));
        });
        card.appendChild(thumbs);
      }
    }

    var body = document.createElement("div");
    body.className = "portfolio-card-body";

    var tag = document.createElement("span");
    tag.className = "placeholder-tag";
    tag.textContent = i18n.f(item, "tag") || "";

    var h2 = document.createElement("h2");
    h2.textContent = title;

    var desc = document.createElement("p");
    desc.textContent = i18n.f(item, "description") || "";

    body.appendChild(tag);
    body.appendChild(h2);
    body.appendChild(desc);

    if (item.devlog_tag) {
      var link = document.createElement("a");
      link.className = "portfolio-devlog-link";
      link.href = "devlog.html?tag=" + encodeURIComponent(item.devlog_tag);
      link.textContent = i18n.t("portfolio.viewDevlog");
      body.appendChild(link);
    }

    card.appendChild(body);
    return card;
  }

  // 轮播：同一时间中间一张最大，左右两张缩小变暗；可以拖动/滑动、点两侧卡片、点箭头或圆点、
  // 按键盘左右键切换。所有卡片叠在同一个格子里，靠 CSS 变量 --d（离中间几格）摆位置，
  // 所以切换时每张卡片都是平滑地"移动 + 缩放"，不是闪一下换内容。
  function buildCarousel(container, cards, items) {
    var count = cards.length;
    if (!count) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var index = 0;

    var root = document.createElement("div");
    root.className = "portfolio-carousel";
    root.setAttribute("role", "region");
    root.setAttribute("aria-roledescription", "carousel");

    var stage = document.createElement("div");
    stage.className = "portfolio-stage";
    stage.tabIndex = 0;

    var slides = cards.map(function (card, i) {
      var slide = document.createElement("div");
      slide.className = "portfolio-slide";
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", i + 1 + " / " + count);
      slide.appendChild(card);
      slide.addEventListener("click", function () {
        if (i !== index && !dragMoved) go(i);
      });
      stage.appendChild(slide);
      return slide;
    });
    root.appendChild(stage);

    var prevBtn = null;
    var nextBtn = null;
    var dots = [];
    if (count > 1) {
      var controls = document.createElement("div");
      controls.className = "portfolio-controls";

      prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "portfolio-arrow";
      prevBtn.textContent = "‹";
      prevBtn.setAttribute("aria-label", i18n.t("portfolio.prev"));
      prevBtn.addEventListener("click", function () {
        go(index - 1);
      });

      nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "portfolio-arrow";
      nextBtn.textContent = "›";
      nextBtn.setAttribute("aria-label", i18n.t("portfolio.next"));
      nextBtn.addEventListener("click", function () {
        go(index + 1);
      });

      var dotWrap = document.createElement("div");
      dotWrap.className = "portfolio-dots";
      items.forEach(function (item, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "portfolio-dot";
        dot.setAttribute("aria-label", i18n.f(item, "title") || String(i + 1));
        dot.addEventListener("click", function () {
          go(i);
        });
        dotWrap.appendChild(dot);
        dots.push(dot);
      });

      controls.appendChild(prevBtn);
      controls.appendChild(dotWrap);
      controls.appendChild(nextBtn);
      root.appendChild(controls);
    }

    function update() {
      slides.forEach(function (slide, i) {
        var d = i - index;
        var near = Math.abs(d) <= 1;
        slide.style.setProperty("--d", Math.max(-2, Math.min(2, d)));
        slide.style.zIndex = String(10 - Math.abs(d));
        slide.classList.toggle("is-active", d === 0);
        slide.classList.toggle("is-near", Math.abs(d) === 1);
        slide.classList.toggle("is-far", !near);
        slide.setAttribute("aria-hidden", d === 0 ? "false" : "true");
        // 看不见/不在中间的卡片里的链接和按钮不进 Tab 顺序，免得键盘焦点跑到屏幕外
        slide.querySelectorAll("a, button").forEach(function (el) {
          if (d === 0) el.removeAttribute("tabindex");
          else el.tabIndex = -1;
        });
      });
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === count - 1;
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-current", i === index);
        if (i === index) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    }

    function go(i) {
      index = Math.max(0, Math.min(count - 1, i));
      stage.style.removeProperty("--drag");
      update();
    }

    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        go(index - 1);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        go(index + 1);
        e.preventDefault();
      }
    });

    // 拖动/滑动：手指或鼠标横向拖过一定距离就翻页；拖动过程中卡片会跟着手走。
    // 移动超过 6px 才算拖动，之前按下去再抬起仍然是普通点击（点封面看大图、点侧边卡片切换）
    var dragMoved = false;
    var startX = 0;
    var startY = 0;
    var startT = 0;
    var tracking = false;
    var dragging = false;
    var pointerId = null;

    stage.addEventListener("pointerdown", function (e) {
      if (count < 2 || (e.pointerType === "mouse" && e.button !== 0)) return;
      tracking = true;
      dragging = false;
      dragMoved = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startT = Date.now();
    });

    stage.addEventListener("pointermove", function (e) {
      if (!tracking || e.pointerId !== pointerId) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        // 主要是竖着滑就让给页面滚动
        if (Math.abs(dy) > Math.abs(dx)) {
          tracking = false;
          return;
        }
        dragging = true;
        dragMoved = true;
        stage.classList.add("is-dragging");
        try {
          stage.setPointerCapture(pointerId);
        } catch (err) {}
      }
      // 到头了再往外拖就加点阻力
      var atEdge = (index === 0 && dx > 0) || (index === count - 1 && dx < 0);
      stage.style.setProperty("--drag", (atEdge ? dx * 0.3 : dx) + "px");
    });

    function endDrag(e) {
      if (!tracking || e.pointerId !== pointerId) return;
      tracking = false;
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-dragging");
      var dx = e.clientX - startX;
      var fast = Math.abs(dx) > 25 && Date.now() - startT < 300;
      if (dx <= -50 || (fast && dx < 0)) go(index + 1);
      else if (dx >= 50 || (fast && dx > 0)) go(index - 1);
      else go(index);
      // 拖完松手会触发一次 click，下一个事件循环再清标记，让它被上面的 click 处理忽略
      setTimeout(function () {
        dragMoved = false;
      }, 0);
    }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    // 拖动松手后浏览器还会补发一次 click（比如落在封面上），拦掉，免得误开大图
    stage.addEventListener(
      "click",
      function (e) {
        if (dragMoved) {
          e.stopPropagation();
          e.preventDefault();
        }
      },
      true
    );

    // 拖动时别把图片本身当成"拖拽图片"
    stage.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });

    if (reduceMotion) root.classList.add("reduce-motion");

    container.appendChild(root);
    update();
  }

  fetch("data/portfolio.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      var introEl = document.getElementById("page-intro");
      if (introEl && i18n.f(data, "intro")) introEl.textContent = i18n.f(data, "intro");

      var container = document.getElementById("portfolio-items");
      if (!container || !Array.isArray(data.items)) return;

      container.innerHTML = "";
      var cards = data.items.map(buildCard);
      buildCarousel(container, cards, data.items);
    })
    .catch(function () {
      // 加载失败时保留页面里"内容暂时加载失败"的提示，不做任何改动
    })
    .finally(reveal);
})();
