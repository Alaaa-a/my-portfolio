// 最近在玩：读取 data/now.json 渲染，加载失败时保留页面已有的占位内容兜底
(function () {
  fetch("data/now.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      var introEl = document.getElementById("page-intro");
      if (introEl && data.intro) introEl.textContent = data.intro;

      var container = document.getElementById("now-items");
      if (!container || !Array.isArray(data.items)) return;

      container.innerHTML = "";
      data.items.forEach(function (item) {
        var card = document.createElement("div");
        card.className = "placeholder-card";

        var tag = document.createElement("span");
        tag.className = "placeholder-tag";
        tag.textContent = item.tag || "";

        var title = document.createElement("h2");
        title.textContent = item.title || "";

        var desc = document.createElement("p");
        desc.textContent = item.description || "";

        card.appendChild(tag);
        card.appendChild(title);
        card.appendChild(desc);
        container.appendChild(card);
      });
    })
    .catch(function () {
      // 加载失败时保留原有占位 HTML，不做任何改动
    });
})();
