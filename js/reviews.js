// 游戏鉴赏总结列表：读取 data/reviews.json，卡片只显示标签/标题/摘要，点进去看完整鉴赏
(function () {
  // 真实内容换上去之后（无论 fetch 成功还是失败）才把 <main> 显示出来，
  // 避免先闪一下写死的占位内容；4 秒兜底，防止意外卡在隐藏状态
  function reveal() {
    var main = document.querySelector("main");
    if (main) main.classList.remove("page-loading");
  }
  setTimeout(reveal, 4000);

  var listEl = document.getElementById("reviews-items");
  var introEl = document.getElementById("page-intro");

  function cardHTML(item) {
    return (
      '<a class="review-card" href="reviews-post.html?id=' +
      encodeURIComponent(item.id) +
      '">' +
      '<span class="devlog-tag-pill">' +
      (i18n.f(item, "tag") || "") +
      "</span>" +
      "<h2>" +
      i18n.f(item, "title") +
      "</h2>" +
      '<p class="review-excerpt">' +
      (i18n.f(item, "excerpt") || "") +
      "</p>" +
      "</a>"
    );
  }

  fetch("data/reviews.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (introEl && i18n.f(data, "intro")) introEl.textContent = i18n.f(data, "intro");

      var items = data.items || [];
      if (!items.length) {
        listEl.innerHTML = '<p class="tarot-hint">' + i18n.t("reviews.empty") + "</p>";
        return;
      }
      listEl.innerHTML = items.map(cardHTML).join("");
    })
    .catch(function () {
      listEl.innerHTML = '<p class="tarot-hint">' + i18n.t("reviews.error") + "</p>";
    })
    .finally(reveal);
})();
