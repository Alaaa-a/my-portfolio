// 每日鸡尾酒悬浮组件（与塔罗组件共用「每日仪式」视觉语言）
(function () {
  var DATA_URL = "data/cocktails.json";

  var cocktails = [];
  var loadError = null;
  var els = {};

  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  // 用日期字符串做种子，同一天始终得到同一个下标，次日自动切换
  function hashStr(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function pickToday(list) {
    return list[hashStr(todayStr()) % list.length];
  }

  // 占位酒杯图形（真实图片缺失/加载失败时使用）
  function glassSVG(size) {
    return (
      '<svg viewBox="0 0 24 24" width="' +
      size +
      '" height="' +
      size +
      '" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16l-8 9-8-9z"/><line x1="12" y1="13" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg>'
    );
  }

  // 用 DOM API 渲染缩略图，图片加载失败时回退到占位图形
  function renderThumb(container, cocktail, size) {
    container.innerHTML = "";
    if (cocktail.image) {
      var img = document.createElement("img");
      img.src = cocktail.image;
      img.alt = cocktail.name;
      img.onerror = function () {
        container.innerHTML = glassSVG(size);
      };
      container.appendChild(img);
    } else {
      container.innerHTML = glassSVG(size);
    }
  }

  function buildWidget() {
    var wrap = document.createElement("div");
    wrap.className = "cocktail-widget";
    wrap.innerHTML =
      '<div class="cocktail-card" id="cocktail-card">' +
      '<div class="cocktail-collapsed" id="cocktail-collapsed">' +
      '<div class="cocktail-thumb" id="cocktail-thumb">' +
      glassSVG(26) +
      "</div>" +
      '<div class="cocktail-collapsed-text">' +
      '<div class="cocktail-label">今日鸡尾酒</div>' +
      '<div class="cocktail-name" id="cocktail-name-collapsed">占卜准备中…</div>' +
      '<div class="cocktail-name-en" id="cocktail-name-en-collapsed"></div>' +
      "</div>" +
      "</div>" +
      '<div class="cocktail-expanded" id="cocktail-expanded"></div>' +
      "</div>";
    document.body.appendChild(wrap);

    els.card = wrap.querySelector("#cocktail-card");
    els.collapsed = wrap.querySelector("#cocktail-collapsed");
    els.expanded = wrap.querySelector("#cocktail-expanded");
    els.nameCollapsed = wrap.querySelector("#cocktail-name-collapsed");
    els.nameEnCollapsed = wrap.querySelector("#cocktail-name-en-collapsed");
    els.thumb = wrap.querySelector("#cocktail-thumb");

    els.collapsed.addEventListener("click", function () {
      if (!cocktails.length) return;
      els.card.classList.add("expanded");
    });
  }

  function renderExpanded(cocktail) {
    var ingredientsHTML = cocktail.ingredients
      .map(function (ing) {
        return (
          "<li><span>" + ing.name + '</span><span class="amount">' + ing.amount + "</span></li>"
        );
      })
      .join("");

    var methodHTML = cocktail.method
      .map(function (step) {
        return "<li>" + step + "</li>";
      })
      .join("");

    els.expanded.innerHTML =
      '<div class="cocktail-expanded-header">' +
      '<span class="cocktail-label">今日鸡尾酒</span>' +
      '<button class="cocktail-close" id="cocktail-close" aria-label="收起">&times;</button>' +
      "</div>" +
      '<div class="cocktail-thumb-large" id="cocktail-thumb-large"></div>' +
      "<div>" +
      '<h3 class="cocktail-name">' +
      cocktail.name +
      "</h3>" +
      '<p class="cocktail-name-en">' +
      cocktail.nameEn +
      " · " +
      cocktail.base +
      "</p>" +
      "</div>" +
      "<div>" +
      '<div class="cocktail-section-title">配方</div>' +
      '<ul class="cocktail-ingredients">' +
      ingredientsHTML +
      "</ul>" +
      "</div>" +
      "<div>" +
      '<div class="cocktail-section-title">调制方法</div>' +
      '<ol class="cocktail-method">' +
      methodHTML +
      "</ol>" +
      "</div>" +
      "<div>" +
      '<div class="cocktail-section-title">小故事</div>' +
      '<p class="cocktail-story">' +
      cocktail.story +
      "</p>" +
      "</div>";

    renderThumb(document.getElementById("cocktail-thumb-large"), cocktail, 44);

    document.getElementById("cocktail-close").addEventListener("click", function (e) {
      e.stopPropagation();
      els.card.classList.remove("expanded");
    });
  }

  function renderError() {
    els.nameCollapsed.textContent = "加载失败";
    els.nameEnCollapsed.textContent = "请用本地服务器打开页面";
    els.expanded.innerHTML =
      '<div class="cocktail-expanded-header"><span class="cocktail-label">今日鸡尾酒</span>' +
      '<button class="cocktail-close" id="cocktail-close" aria-label="收起">&times;</button></div>' +
      '<p class="tarot-hint">鸡尾酒数据加载失败。若你是直接双击打开 HTML 文件，浏览器会阻止读取本地 JSON —— 请用本地服务器（比如 VS Code 的 Live Server，或命令行 python3 -m http.server）打开页面后重试。</p>';
    document.getElementById("cocktail-close").addEventListener("click", function (e) {
      e.stopPropagation();
      els.card.classList.remove("expanded");
    });
  }

  function init() {
    buildWidget();

    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        cocktails = data;
        var today = pickToday(cocktails);
        els.nameCollapsed.textContent = today.name;
        els.nameEnCollapsed.textContent = today.nameEn;
        renderThumb(els.thumb, today, 26);
        renderExpanded(today);
      })
      .catch(function (err) {
        loadError = err;
        renderError();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
