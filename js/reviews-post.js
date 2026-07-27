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
    document.title = item.title + " · Alaaa";

    articleEl.innerHTML =
      '<div class="devlog-article-header">' +
      '<span class="devlog-tag-pill">' +
      (item.tag || "") +
      "</span>" +
      "<h1>" +
      item.title +
      "</h1>" +
      "</div>" +
      '<div class="devlog-body">' +
      renderBody(item.body) +
      "</div>";
  }

  function renderNotFound() {
    articleEl.innerHTML =
      '<p class="tarot-hint">没找到这篇鉴赏，可能链接有误，或者内容还没加载出来。</p>' +
      '<p><a class="devlog-back" href="reviews.html">← 返回鉴赏列表</a></p>';
  }

  function renderError() {
    articleEl.innerHTML =
      '<p class="tarot-hint">鉴赏加载失败。若你是直接双击打开 HTML 文件，浏览器会阻止读取本地 JSON —— 请用本地服务器打开页面后重试。</p>';
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
