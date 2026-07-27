// 开发日志列表：读取 data/devlog.json，按日期倒序展示，支持按标签筛选
(function () {
  var BOOK_ICON =
    '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 5c3-1.5 6-1.5 8 0c2-1.5 5-1.5 8 0v13c-3-1.5-6-1.5-8 0c-2-1.5-5-1.5-8 0z"/><line x1="12" y1="5" x2="12" y2="18"/></svg>';

  var listEl = document.getElementById("devlog-list");
  var tagsEl = document.getElementById("devlog-tags");
  var introEl = document.getElementById("page-intro");
  var activeTag = null;
  var posts = [];

  function cardHTML(post) {
    var thumb = post.images && post.images[0] ? '<img src="' + post.images[0] + '" alt="">' : BOOK_ICON;
    var tags = (post.tags || [])
      .map(function (t) {
        return '<span class="devlog-tag-pill">' + t + "</span>";
      })
      .join("");

    return (
      '<a class="devlog-card" href="devlog-post.html?id=' +
      encodeURIComponent(post.id) +
      '">' +
      '<div class="devlog-thumb">' +
      thumb +
      "</div>" +
      '<div class="devlog-card-body">' +
      '<div class="devlog-meta"><span class="devlog-date">' +
      post.date +
      "</span><span>" +
      (post.project || "") +
      "</span></div>" +
      "<h2>" +
      post.title +
      "</h2>" +
      '<p class="devlog-excerpt">' +
      (post.excerpt || "") +
      "</p>" +
      '<div class="devlog-tag-list">' +
      tags +
      "</div>" +
      "</div>" +
      "</a>"
    );
  }

  function renderList() {
    var filtered = activeTag
      ? posts.filter(function (p) {
          return (p.tags || []).indexOf(activeTag) !== -1;
        })
      : posts;

    if (!filtered.length) {
      listEl.innerHTML = '<p class="tarot-hint">这个标签下还没有日志。</p>';
      return;
    }

    listEl.innerHTML = filtered.map(cardHTML).join("");
  }

  function renderTags() {
    var allTags = [];
    posts.forEach(function (p) {
      (p.tags || []).forEach(function (t) {
        if (allTags.indexOf(t) === -1) allTags.push(t);
      });
    });

    if (!allTags.length) return;

    tagsEl.hidden = false;
    tagsEl.innerHTML =
      '<button class="devlog-tag-btn active" data-tag="">全部</button>' +
      allTags
        .map(function (t) {
          return '<button class="devlog-tag-btn" data-tag="' + t + '">' + t + "</button>";
        })
        .join("");

    tagsEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".devlog-tag-btn");
      if (!btn) return;
      activeTag = btn.dataset.tag || null;
      tagsEl.querySelectorAll(".devlog-tag-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      renderList();
    });
  }

  fetch("data/devlog.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (introEl && data.intro) introEl.textContent = data.intro;
      posts = (data.posts || []).slice().sort(function (a, b) {
        return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
      });
      renderTags();
      renderList();
    })
    .catch(function () {
      listEl.innerHTML =
        '<p class="tarot-hint">日志加载失败。若你是直接双击打开 HTML 文件，浏览器会阻止读取本地 JSON —— 请用本地服务器打开页面后重试。</p>';
    });
})();
