// 游戏鉴赏详情：按 URL 上的 ?id= 从 data/reviews.json 里找到对应鉴赏并渲染
(function () {
  var articleEl = document.getElementById("review-article");

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // 极简 Markdown 子集：空行分段、**加粗**、*斜体*，先转义再替换，避免注入
  function renderBody(md) {
    var paragraphs = (md || "").split(/\n\s*\n/);
    return paragraphs
      .map(function (p) {
        p = p.trim();
        if (!p) return "";
        var html = escapeHtml(p).replace(/\n/g, "<br>");
        html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
        return "<p>" + html + "</p>";
      })
      .join("");
  }

  function render(item) {
    document.title = i18n.f(item, "title") + i18n.t("titleSuffix");

    articleEl.innerHTML =
      '<div class="devlog-article-header">' +
      '<span class="devlog-tag-pill">' +
      (i18n.f(item, "tag") || "") +
      "</span>" +
      "<h1>" +
      i18n.f(item, "title") +
      "</h1>" +
      "</div>" +
      '<div class="devlog-body">' +
      renderBody(i18n.f(item, "body")) +
      "</div>";
  }

  function renderNotFound() {
    articleEl.innerHTML =
      '<p class="tarot-hint">' + i18n.t("reviews.notFound") + "</p>" +
      '<p><a class="devlog-back" href="reviews.html">' + i18n.t("reviews.back") + "</a></p>";
  }

  function renderError() {
    articleEl.innerHTML = '<p class="tarot-hint">' + i18n.t("reviews.error") + "</p>";
  }

  var id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    renderNotFound();
    return;
  }

  fetch("data/reviews.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      var item = (data.items || []).filter(function (p) {
        return p.id === id;
      })[0];
      if (!item) {
        renderNotFound();
        return;
      }
      render(item);
    })
    .catch(renderError);
})();
