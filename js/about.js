// 关于我：读取 data/about.json 渲染，加载失败时保留页面已有的占位内容兜底
(function () {
  fetch("data/about.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      var introEl = document.getElementById("page-intro");
      if (introEl && data.intro) introEl.textContent = data.intro;

      var container = document.getElementById("about-sections");
      if (!container || !Array.isArray(data.sections)) return;

      container.innerHTML = "";
      data.sections.forEach(function (section) {
        var card = document.createElement("div");
        card.className = "placeholder-card";

        var tag = document.createElement("span");
        tag.className = "placeholder-tag";
        tag.textContent = section.tag || "";

        var title = document.createElement("h2");
        title.textContent = section.title || "";

        var body = document.createElement("p");
        body.textContent = section.body || "";

        card.appendChild(tag);
        card.appendChild(title);
        card.appendChild(body);
        container.appendChild(card);
      });
    })
    .catch(function () {
      // 加载失败（比如直接双击打开 file:// 页面）时保留原有占位 HTML，不做任何改动
    });
})();
