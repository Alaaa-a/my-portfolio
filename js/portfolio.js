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
