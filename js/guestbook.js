// 留言板（公开页）：提交新留言（进待审核）+ 展示已通过的留言
// 直接用 Supabase 的 REST API（PostgREST），不需要额外的 SDK
(function () {
  // anon key 是设计给前端公开用的，配合 Supabase 的 RLS 策略（见 supabase/schema.sql）
  // 保证访客只能新建"待审核"留言、只能读到"已通过"的留言
  var SUPABASE_URL = "https://ytzpqrqcssvhgltfjeya.supabase.co";
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0enBxcnFjc3N2aGdsdGZqZXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMDEzMjUsImV4cCI6MjEwMDc3NzMyNX0.mypDPjgJLXrWjBMtKKH6MqmZv7lHHE7UtrUrfouktb4";

  var configured = SUPABASE_URL.indexOf("YOUR-PROJECT") === -1 && SUPABASE_ANON_KEY.indexOf("YOUR-ANON-KEY") === -1;

  var listEl = document.getElementById("guestbook-list");
  var form = document.getElementById("guestbook-form");
  var categoryWrap = document.getElementById("gb-category");
  var feedbackEl = document.getElementById("gb-feedback");
  var submitBtn = document.getElementById("gb-submit");
  var selectedCategory = "功能建议";

  function restHeaders() {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY,
    };
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    var d = new Date(iso);
    var pad = function (n) {
      return String(n).padStart(2, "0");
    };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  // 分类在数据库里存的是中文原值，英文模式下只改显示文字
  var CATEGORY_KEYS = {
    "功能建议": "guestbook.cat.feature",
    "Bug反馈": "guestbook.cat.bug",
    "单纯想说的话": "guestbook.cat.chat"
  };
  function categoryLabel(value) {
    return CATEGORY_KEYS[value] ? i18n.t(CATEGORY_KEYS[value]) : value;
  }

  function cardHTML(row) {
    return (
      '<div class="guestbook-item">' +
      '<div class="meta">' +
      '<span class="guestbook-tag">' +
      escapeHtml(categoryLabel(row.category)) +
      "</span>" +
      "<span>" +
      escapeHtml(row.nickname || i18n.t("guestbook.anon")) +
      "</span>" +
      "<span>" +
      formatDate(row.created_at) +
      "</span>" +
      "</div>" +
      '<p style="margin:0;">' +
      escapeHtml(row.message).replace(/\n/g, "<br>") +
      "</p>" +
      "</div>"
    );
  }

  function loadMessages() {
    if (!configured) {
      listEl.innerHTML = '<p class="tarot-hint">' + i18n.t("guestbook.noDb") + "</p>";
      return;
    }

    fetch(SUPABASE_URL + "/rest/v1/guestbook_messages?status=eq.approved&order=created_at.desc&select=*", {
      headers: restHeaders(),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (rows) {
        if (!rows.length) {
          listEl.innerHTML = '<p class="tarot-hint">' + i18n.t("guestbook.none") + "</p>";
          return;
        }
        listEl.innerHTML = rows.map(cardHTML).join("");
      })
      .catch(function () {
        listEl.innerHTML = '<p class="tarot-hint">' + i18n.t("guestbook.loadFail") + "</p>";
      });
  }

  function showFeedback(text, isError) {
    feedbackEl.textContent = text;
    feedbackEl.hidden = false;
    feedbackEl.classList.toggle("error", !!isError);
  }

  function resetCategoryButtons() {
    selectedCategory = "功能建议";
    categoryWrap.querySelectorAll(".guestbook-category-btn").forEach(function (b, i) {
      b.classList.toggle("active", i === 0);
    });
  }

  if (categoryWrap) {
    categoryWrap.addEventListener("click", function (e) {
      var btn = e.target.closest(".guestbook-category-btn");
      if (!btn) return;
      selectedCategory = btn.dataset.value;
      categoryWrap.querySelectorAll(".guestbook-category-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
    });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!configured) {
        showFeedback(i18n.t("guestbook.noDbSubmit"), true);
        return;
      }

      var nicknameInput = document.getElementById("gb-nickname");
      var messageInput = document.getElementById("gb-message");
      var message = messageInput.value.trim();

      if (!message) {
        showFeedback(i18n.t("guestbook.emptyMsg"), true);
        return;
      }

      submitBtn.disabled = true;
      showFeedback(i18n.t("guestbook.submitting"), false);

      fetch(SUPABASE_URL + "/rest/v1/guestbook_messages", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json", Prefer: "return=minimal" }, restHeaders()),
        body: JSON.stringify({
          nickname: nicknameInput.value.trim() || null,
          category: selectedCategory,
          message: message,
          status: "pending",
        }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          showFeedback(i18n.t("guestbook.submitted"), false);
          form.reset();
          resetCategoryButtons();
        })
        .catch(function () {
          showFeedback(i18n.t("guestbook.submitFail"), true);
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  loadMessages();
})();
