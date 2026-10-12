// 留言审核页：密码登录（记住这台设备 30 天）+ 按状态分 3 个标签页 + 通过/忽略操作
(function () {
  var STORAGE_KEY = "alaaa-guestbook-admin-pw";
  var REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;

  var loginWrap = document.getElementById("gb-admin-login");
  var loginForm = document.getElementById("gb-admin-login-form");
  var loginFeedback = document.getElementById("gb-admin-login-feedback");
  var passwordInput = document.getElementById("gb-admin-password");

  var panel = document.getElementById("gb-admin-panel");
  var tabsEl = document.getElementById("gb-admin-tabs");
  var listEl = document.getElementById("gb-admin-list");

  var password = null;
  var messages = [];
  var activeStatus = "pending";

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDateTime(iso) {
    var d = new Date(iso);
    var pad = function (n) {
      return String(n).padStart(2, "0");
    };
    return (
      d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes())
    );
  }

  function showLoginError(text) {
    loginFeedback.textContent = text;
    loginFeedback.hidden = false;
    loginFeedback.classList.add("error");
  }

  function cardHTML(row) {
    var actions = "";
    if (row.status === "pending") {
      actions =
        '<div class="guestbook-admin-actions">' +
        '<button type="button" class="guestbook-admin-approve" data-id="' +
        row.id +
        '">通过</button>' +
        '<button type="button" class="guestbook-admin-ignore" data-id="' +
        row.id +
        '">忽略</button>' +
        "</div>";
    } else {
      actions =
        '<div class="guestbook-admin-actions">' +
        '<button type="button" class="guestbook-admin-delete" data-id="' +
        row.id +
        '">删除</button>' +
        "</div>";
    }

    return (
      '<div class="guestbook-item">' +
      '<div class="meta">' +
      '<span class="guestbook-tag">' +
      escapeHtml(row.category) +
      "</span>" +
      "<span>" +
      escapeHtml(row.nickname || "匿名") +
      "</span>" +
      "<span>" +
      formatDateTime(row.created_at) +
      "</span>" +
      "</div>" +
      '<p style="margin:0 0 10px;">' +
      escapeHtml(row.message).replace(/\n/g, "<br>") +
      "</p>" +
      actions +
      "</div>"
    );
  }

  function renderList() {
    var filtered = messages.filter(function (m) {
      return m.status === activeStatus;
    });

    if (!filtered.length) {
      var emptyText =
        activeStatus === "pending" ? "暂时没有待审核的留言。" : activeStatus === "approved" ? "还没有已通过的留言。" : "还没有已忽略的留言。";
      listEl.innerHTML = '<p class="tarot-hint">' + emptyText + "</p>";
      return;
    }

    listEl.innerHTML = filtered.map(cardHTML).join("");
  }

  function handleAction(id, action) {
    fetch("/api/guestbook-moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password, id: id, action: action }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        if (action === "delete") {
          messages = messages.filter(function (m) {
            return String(m.id) !== String(id);
          });
        } else {
          var target = messages.filter(function (m) {
            return String(m.id) === String(id);
          })[0];
          if (target) target.status = action === "approve" ? "approved" : "ignored";
        }
        renderList();
      })
      .catch(function () {
        alert("操作失败，刷新页面再试一次。");
      });
  }

  listEl.addEventListener("click", function (e) {
    var approveBtn = e.target.closest(".guestbook-admin-approve");
    var ignoreBtn = e.target.closest(".guestbook-admin-ignore");
    var deleteBtn = e.target.closest(".guestbook-admin-delete");
    if (approveBtn) handleAction(approveBtn.dataset.id, "approve");
    if (ignoreBtn) handleAction(ignoreBtn.dataset.id, "ignore");
    if (deleteBtn) {
      if (window.confirm("确定要永久删除这条留言吗？删除后没法恢复。")) {
        handleAction(deleteBtn.dataset.id, "delete");
      }
    }
  });

  tabsEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".devlog-tag-btn");
    if (!btn) return;
    activeStatus = btn.dataset.status;
    tabsEl.querySelectorAll(".devlog-tag-btn").forEach(function (b) {
      b.classList.toggle("active", b === btn);
    });
    renderList();
  });

  function loadMessages(pw) {
    return fetch("/api/guestbook-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    }).then(function (res) {
      if (!res.ok) {
        var err = new Error("HTTP " + res.status);
        err.status = res.status;
        throw err;
      }
      return res.json();
    });
  }

  // 密码存在这台设备的 localStorage 里，30 天后自动失效，需要重新输入
  function saveRemembered(pw) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pw: pw, exp: Date.now() + REMEMBER_MS }));
    } catch (e) {}
  }

  function readRemembered() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.pw || !data.exp || data.exp < Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data.pw;
    } catch (e) {
      return null;
    }
  }

  function forgetRemembered() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function tryLogin(pw) {
    return loadMessages(pw).then(function (rows) {
      password = pw;
      messages = rows;
      saveRemembered(pw);
      loginWrap.hidden = true;
      panel.hidden = false;
      renderList();
    });
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var pw = passwordInput.value;
    if (!pw) return;
    loginFeedback.hidden = true;
    tryLogin(pw).catch(function (err) {
      if (err && err.status === 401) {
        showLoginError("密码不对。");
      } else {
        showLoginError("服务器出错了（可能是留言数据库连不上，或者环境变量没配好），密码本身不一定有问题。");
      }
    });
  });

  var logoutBtn = document.getElementById("gb-admin-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      forgetRemembered();
      window.location.reload();
    });
  }

  // 这台设备之前登录过（30 天内），直接沿用，不用再输密码。
  // 只有服务器明确说"密码不对"（401）才清掉记住的密码；数据库临时连不上这类错误不清，
  // 否则 Supabase 一出问题就会把已记住的正确密码丢了
  var saved = readRemembered();
  if (saved) {
    tryLogin(saved).catch(function (err) {
      if (err && err.status === 401) {
        forgetRemembered();
      } else {
        showLoginError("服务器出错了（可能是留言数据库连不上），已记住的密码没有丢，等数据库恢复后刷新即可。");
      }
    });
  }
})();
