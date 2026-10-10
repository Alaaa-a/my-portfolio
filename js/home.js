// 首页 hero 区域：读取 data/home.json 渲染，加载失败时保留页面已有的占位内容兜底
(function () {
  // 真实内容换上去之后（无论 fetch 成功还是失败）才把 <main> 显示出来，
  // 避免先闪一下写死的占位内容；4 秒兜底，防止意外卡在隐藏状态
  function reveal() {
    var main = document.querySelector("main");
    if (main) main.classList.remove("page-loading");
  }
  setTimeout(reveal, 4000);

  fetch("data/home.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      var greetingEl = document.getElementById("home-greeting");
      if (greetingEl && i18n.f(data, "greeting")) greetingEl.textContent = i18n.f(data, "greeting");

      var headingEl = document.getElementById("home-heading");
      if (headingEl && i18n.f(data, "heading")) headingEl.textContent = i18n.f(data, "heading");

      var taglineEl = document.getElementById("home-tagline");
      if (taglineEl && i18n.f(data, "tagline")) taglineEl.textContent = i18n.f(data, "tagline");

      var introEl = document.getElementById("home-intro");
      if (introEl && i18n.f(data, "intro")) introEl.textContent = i18n.f(data, "intro");

      var linksEl = document.getElementById("home-links");
      if (linksEl && Array.isArray(data.links)) {
        linksEl.innerHTML = "";
        data.links.forEach(function (link) {
          var a = document.createElement("a");
          a.href = link.href || "#";
          a.textContent = (i18n.f(link, "label") || "") + " →";
          linksEl.appendChild(a);
        });
      }

      // 联系方式：有 href 的做成链接（只放行 http(s) 和 mailto），没有 href 的（比如 QQ 号）只显示文字
      var contactsEl = document.getElementById("home-contacts");
      if (contactsEl && Array.isArray(data.contacts) && data.contacts.length) {
        contactsEl.innerHTML = "";
        data.contacts.forEach(function (c) {
          if (!c.value) return;
          var li = document.createElement("li");
          var safeHref = /^(https?:|mailto:)/i.test(c.href || "");
          var node = document.createElement(safeHref ? "a" : "span");
          if (safeHref) {
            node.href = c.href;
            if (/^https?:/i.test(c.href)) {
              node.target = "_blank";
              node.rel = "noopener";
            }
          }
          var label = document.createElement("span");
          label.className = "contact-label";
          label.textContent = i18n.f(c, "label") || "";
          node.appendChild(label);
          node.appendChild(document.createTextNode(c.value));
          li.appendChild(node);
          contactsEl.appendChild(li);
        });
      }
    })
    .catch(function () {
      // 加载失败时保留原有占位 HTML，不做任何改动
    })
    .finally(reveal);
})();
