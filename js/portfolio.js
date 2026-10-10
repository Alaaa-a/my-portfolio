// 作品展示：读取 data/portfolio.json 渲染项目卡片（封面截图 + 缩略图 + 点击看大图 + 跳转开发日志）
(function () {
  // 真实内容换上去之后（无论 fetch 成功还是失败）才把 <main> 显示出来，
  // 避免先闪一下写死的占位内容；4 秒兜底，防止意外卡在隐藏状态
  function reveal() {
    var main = document.querySelector("main");
    if (main) main.classList.remove("page-loading");
  }
  setTimeout(reveal, 4000);

  // ===== 点击截图看大图：最简单的灯箱，点任意处或按 Esc 关闭，多张图时 ←/→ 切换 =====
  var lightbox = null;
  var lbImages = [];
  var lbIndex = 0;

  function lbShow() {
    lightbox.querySelector("img").src = lbImages[lbIndex];
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.remove();
    lightbox = null;
    document.removeEventListener("keydown", onLightboxKey);
  }

  function onLightboxKey(e) {
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight" && lbImages.length > 1) {
      lbIndex = (lbIndex + 1) % lbImages.length;
      lbShow();
    } else if (e.key === "ArrowLeft" && lbImages.length > 1) {
      lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length;
      lbShow();
    }
  }

  function openLightbox(images, index, alt) {
    closeLightbox();
    lbImages = images;
    lbIndex = index;
    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");

    var img = document.createElement("img");
    img.alt = alt || "";
    var close = document.createElement("button");
    close.type = "button";
    close.className = "lightbox-close";
    close.setAttribute("aria-label", i18n.t("portfolio.lightboxClose"));
    close.textContent = "×";

    lightbox.appendChild(img);
    lightbox.appendChild(close);
    lightbox.addEventListener("click", closeLightbox);
    document.body.appendChild(lightbox);
    document.addEventListener("keydown", onLightboxKey);
    lbShow();
  }

  function imageButton(className, images, index, alt) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = className;
    btn.setAttribute("aria-label", i18n.t("portfolio.openImage"));
    var img = document.createElement("img");
    img.src = images[index];
    img.alt = alt;
    img.loading = "lazy";
    btn.appendChild(img);
    btn.addEventListener("click", function () {
      openLightbox(images, index, alt);
    });
    return btn;
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
      data.items.forEach(function (item) {
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
        container.appendChild(card);
      });
    })
    .catch(function () {
      // 加载失败时保留页面里"内容暂时加载失败"的提示，不做任何改动
    })
    .finally(reveal);
})();
