// 首页 hero 区域：读取 data/home.json 渲染，加载失败时保留页面已有的占位内容兜底
(function () {
  fetch("data/home.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      var greetingEl = document.getElementById("home-greeting");
      if (greetingEl && data.greeting) greetingEl.textContent = data.greeting;

      var headingEl = document.getElementById("home-heading");
      if (headingEl && data.heading) headingEl.textContent = data.heading;

      var introEl = document.getElementById("home-intro");
      if (introEl && data.intro) introEl.textContent = data.intro;

      var linksEl = document.getElementById("home-links");
      if (linksEl && Array.isArray(data.links)) {
        linksEl.innerHTML = "";
        data.links.forEach(function (link) {
          var a = document.createElement("a");
          a.href = link.href || "#";
          a.textContent = (link.label || "") + " →";
          linksEl.appendChild(a);
        });
      }
    })
    .catch(function () {
      // 加载失败时保留原有占位 HTML，不做任何改动
    });
})();
