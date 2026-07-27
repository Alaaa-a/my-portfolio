// 开发日志详情：按 URL 上的 ?id= 从 data/devlog.json 里找到对应文章并渲染
(function () {
  var articleEl = document.getElementById("devlog-article");

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

  function render(post) {
    document.title = post.title + " · Alaaa";

    var tags = (post.tags || [])
      .map(function (t) {
        return '<span class="devlog-tag-pill">' + t + "</span>";
      })
      .join("");

    var gallery = "";
    if (post.images && post.images.length) {
      gallery =
        '<div class="devlog-article-gallery">' +
        post.images
          .map(function (src) {
            return '<img src="' + src + '" alt="">';
          })
          .join("") +
        "</div>";
    }

    articleEl.innerHTML =
      '<div class="devlog-article-header">' +
      '<div class="devlog-meta"><span class="devlog-date">' +
      post.date +
      "</span><span>" +
      (post.project || "") +
      "</span></div>" +
      "<h1>" +
      post.title +
      "</h1>" +
      '<div class="devlog-tag-list">' +
      tags +
      "</div>" +
      "</div>" +
      gallery +
      '<div class="devlog-body">' +
      renderBody(post.body) +
      "</div>";
  }

  function renderNotFound() {
    articleEl.innerHTML =
      '<p class="tarot-hint">没找到这篇日志，可能链接有误，或者日志还没加载出来。</p>' +
      '<p><a class="devlog-back" href="devlog.html">← 返回日志列表</a></p>';
  }

  function renderError() {
    articleEl.innerHTML =
      '<p class="tarot-hint">日志加载失败。若你是直接双击打开 HTML 文件，浏览器会阻止读取本地 JSON —— 请用本地服务器打开页面后重试。</p>';
  }

  var id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    renderNotFound();
    return;
  }

  fetch("data/devlog.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      var post = (data.posts || []).filter(function (p) {
        return p.id === id;
      })[0];
      if (!post) {
        renderNotFound();
        return;
      }
      render(post);
    })
    .catch(renderError);
})();
