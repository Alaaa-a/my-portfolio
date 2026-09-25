// 开发日志列表：读取 data/devlog.json，按日期倒序展示，支持按标签筛选
(function () {
  // 真实内容换上去之后（无论 fetch 成功还是失败）才把 <main> 显示出来，
  // 避免先闪一下写死的占位内容；4 秒兜底，防止意外卡在隐藏状态
  function reveal() {
    var main = document.querySelector("main");
    if (main) main.classList.remove("page-loading");
  }
  setTimeout(reveal, 4000);

  var BOOK_ICON =
    '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 5c3-1.5 6-1.5 8 0c2-1.5 5-1.5 8 0v13c-3-1.5-6-1.5-8 0c-2-1.5-5-1.5-8 0z"/><line x1="12" y1="5" x2="12" y2="18"/></svg>';

  var listEl = document.getElementById("devlog-list");
  var tagsEl = document.getElementById("devlog-tags");
  var introEl = document.getElementById("page-intro");
  var activeTag = null;
  var posts = [];

  // tags_en 跟 tags 按位置一一对应，筛选仍然用中文原值，只是按钮/标签上显示英文；
  // 同一个中文标签在不同日志里可能只有一篇填了英文，所以先扫一遍建立 中文→英文 的对照表
  var tagEn = {};
  function tagLabel(tag) {
    return i18n.lang === "en" && tagEn[tag] ? tagEn[tag] : tag;
  }

  function cardHTML(post) {
    var thumb = post.images && post.images[0] ? '<img src="' + post.images[0] + '" alt="">' : BOOK_ICON;
    var tags = (post.tags || [])
      .map(function (t) {
        return '<span class="devlog-tag-pill">' + tagLabel(t) + "</span>";
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
      (i18n.f(post, "project") || "") +
      "</span></div>" +
      "<h2>" +
      i18n.f(post, "title") +
      "</h2>" +
      '<p class="devlog-excerpt">' +
      (i18n.f(post, "excerpt") || "") +
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
      listEl.innerHTML = '<p class="tarot-hint">' + i18n.t("devlog.empty") + "</p>";
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
      '<button class="devlog-tag-btn active" data-tag="">' + i18n.t("devlog.all") + "</button>" +
      allTags
        .map(function (t) {
          return '<button class="devlog-tag-btn" data-tag="' + t + '">' + tagLabel(t) + "</button>";
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
      if (introEl && i18n.f(data, "intro")) introEl.textContent = i18n.f(data, "intro");
      (data.posts || []).forEach(function (p) {
        (p.tags || []).forEach(function (tag, i) {
          if (p.tags_en && p.tags_en[i] && !tagEn[tag]) tagEn[tag] = p.tags_en[i];
        });
      });
      posts = (data.posts || []).slice().sort(function (a, b) {
        return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
      });
      renderTags();
      renderList();
    })
    .catch(function () {
      listEl.innerHTML = '<p class="tarot-hint">' + i18n.t("devlog.error") + "</p>";
    })
    .finally(reveal);
})();
