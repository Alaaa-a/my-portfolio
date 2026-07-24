// 游戏排行榜：读取 data/rankings.json 渲染，列表顺序即排名，加载失败时保留占位内容兜底
(function () {
  fetch("data/rankings.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      var introEl = document.getElementById("page-intro");
      if (introEl && data.intro) introEl.textContent = data.intro;

      var list = document.getElementById("rankings-list");
      if (!list || !Array.isArray(data.items)) return;

      list.innerHTML = "";
      data.items.forEach(function (item, index) {
        var li = document.createElement("li");

        var num = document.createElement("span");
        num.className = "rank-num";
        num.textContent = String(index + 1);

        var wrap = document.createElement("div");

        var title = document.createElement("h2");
        title.style.margin = "0";
        title.style.fontFamily = "var(--font-display)";
        title.style.fontSize = "1.25rem";
        title.style.fontWeight = "400";
        title.style.letterSpacing = "0.03em";
        title.textContent = item.title || "";

        var reason = document.createElement("p");
        reason.style.margin = "4px 0 0";
        reason.style.color = "var(--text-dim)";
        reason.style.fontSize = "0.9rem";
        reason.textContent = item.reason || "";

        wrap.appendChild(title);
        wrap.appendChild(reason);
        li.appendChild(num);
        li.appendChild(wrap);
        list.appendChild(li);
      });
    })
    .catch(function () {
      // 加载失败时保留原有占位 HTML，不做任何改动
    });
})();
