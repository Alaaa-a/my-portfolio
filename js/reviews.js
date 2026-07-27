// 游戏鉴赏总结列表：读取 data/reviews.json，卡片只显示标签/标题/摘要，点进去看完整鉴赏
(function () {
  var listEl = document.getElementById("reviews-items");
  var introEl = document.getElementById("page-intro");

  function cardHTML(item) {
    return (
      '<a class="review-card" href="reviews-post.html?id=' +
      encodeURIComponent(item.id) +
      '">' +
      '<span class="devlog-tag-pill">' +
      (item.tag || "") +
      "</span>" +
      "<h2>" +
      item.title +
      "</h2>" +
      '<p class="review-excerpt">' +
      (item.excerpt || "") +
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
      if (introEl && data.intro) introEl.textContent = data.intro;

      var items = data.items || [];
      if (!items.length) {
        listEl.innerHTML = '<p class="tarot-hint">还没有鉴赏内容。</p>';
        return;
      }
      listEl.innerHTML = items.map(cardHTML).join("");
    })
    .catch(function () {
      listEl.innerHTML =
        '<p class="tarot-hint">鉴赏加载失败。若你是直接双击打开 HTML 文件，浏览器会阻止读取本地 JSON —— 请用本地服务器打开页面后重试。</p>';
    });
})();
