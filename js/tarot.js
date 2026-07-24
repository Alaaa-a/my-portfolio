// 每日塔罗抽卡悬浮组件 —— 曜石黑金视觉模板，卡面完全由 data/tarot.json 驱动
(function () {
  var STORAGE_KEY = "alaaa-daily-tarot";
  var DATA_URL = "data/tarot.json";

  var cards = [];
  var loadError = null;
  var els = {};

  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function loadDrawnToday() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data && data.date === todayStr()) return data;
      return null;
    } catch (e) {
      return null;
    }
  }

  function saveDrawn(cardId, orientation) {
    var data = { date: todayStr(), cardId: cardId, orientation: orientation };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
    return data;
  }

  // 悬浮触发按钮用的小图标（与卡背的曼陀罗图案分开，保持按钮轻量）
  var FAB_ICON =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 2 L13.4 10.6 L22 12 L13.4 13.4 L12 22 L10.6 13.4 L2 12 L10.6 10.6 Z"/></svg>';

  // ===== 卡面插画图标注册表：78 张牌通过 card.icon 字段索引到这里 =====
  // 22 张大阿尔卡纳各自一个专属图形，56 张小阿尔卡纳按花色共用 4 个图形
  // 统一 viewBox，线宽/描边颜色交给 CSS 控制，保证风格统一
  var ICONS = {
    fool:
      '<circle cx="32" cy="21" r="7"/><circle cx="39.6" cy="25.5" r="7"/><circle cx="39.6" cy="34.5" r="7"/><circle cx="32" cy="39" r="7"/><circle cx="24.4" cy="34.5" r="7"/><circle cx="24.4" cy="25.5" r="7"/><circle cx="32" cy="30" r="3" fill="currentColor" stroke="none"/>',
    magician:
      '<circle cx="32" cy="30" r="10"/><path d="M26 20a6 6 0 0 1 12 0"/><line x1="32" y1="40" x2="32" y2="52"/><line x1="25" y1="46" x2="39" y2="46"/>',
    "high-priestess":
      '<line x1="16" y1="14" x2="16" y2="50"/><line x1="48" y1="14" x2="48" y2="50"/><path d="M38 22a10 10 0 1 0 0 20a8 8 0 0 1 0-20z"/>',
    empress:
      '<circle cx="32" cy="24" r="11"/><line x1="32" y1="35" x2="32" y2="52"/><line x1="24" y1="45" x2="40" y2="45"/>',
    emperor:
      '<path d="M20 40c0-14 4-22 12-22"/><path d="M20 40c-4-3-4-9 0-11"/><path d="M44 40c0-14-4-22-12-22"/><path d="M44 40c4-3 4-9 0-11"/>',
    hierophant:
      '<line x1="18" y1="46" x2="46" y2="18"/><circle cx="18" cy="46" r="5"/><line x1="46" y1="18" x2="40" y2="18"/><line x1="46" y1="18" x2="46" y2="24"/><line x1="46" y1="46" x2="18" y2="18"/><circle cx="46" cy="46" r="5"/><line x1="18" y1="18" x2="24" y2="18"/><line x1="18" y1="18" x2="18" y2="24"/>',
    lovers:
      '<line x1="24" y1="14" x2="24" y2="50"/><line x1="40" y1="14" x2="40" y2="50"/><line x1="18" y1="14" x2="46" y2="14"/><line x1="18" y1="50" x2="46" y2="50"/>',
    chariot:
      '<rect x="20" y="20" width="24" height="16" rx="2"/><circle cx="24" cy="42" r="6"/><circle cx="40" cy="42" r="6"/><line x1="32" y1="20" x2="32" y2="12"/>',
    strength:
      '<path d="M20 32c0-6 5-10 10-6c2 2 2 2 4 0c5-4 10 0 10 6c0 6-5 10-10 6c-2-2-2-2-4 0c-5 4-10 0-10-6z"/>',
    hermit:
      '<path d="M26 44h12l-2-24h-8z"/><line x1="32" y1="14" x2="32" y2="20"/><circle cx="32" cy="32" r="3" fill="currentColor" stroke="none"/><line x1="24" y1="50" x2="40" y2="50"/><line x1="26" y1="44" x2="26" y2="50"/><line x1="38" y1="44" x2="38" y2="50"/>',
    wheel:
      '<circle cx="32" cy="32" r="18"/><circle cx="32" cy="32" r="4"/><line x1="36" y1="32" x2="50" y2="32"/><line x1="34.8" y1="34.8" x2="44.7" y2="44.7"/><line x1="32" y1="36" x2="32" y2="50"/><line x1="29.2" y1="34.8" x2="19.3" y2="44.7"/><line x1="28" y1="32" x2="14" y2="32"/><line x1="29.2" y1="29.2" x2="19.3" y2="19.3"/><line x1="32" y1="28" x2="32" y2="14"/><line x1="34.8" y1="29.2" x2="44.7" y2="19.3"/>',
    justice:
      '<line x1="32" y1="12" x2="32" y2="50"/><line x1="18" y1="20" x2="46" y2="20"/><line x1="18" y1="20" x2="14" y2="32"/><line x1="18" y1="20" x2="22" y2="32"/><path d="M14 32a4 6 0 0 0 8 0"/><line x1="46" y1="20" x2="42" y2="32"/><line x1="46" y1="20" x2="50" y2="32"/><path d="M42 32a4 6 0 0 0 8 0"/><line x1="24" y1="50" x2="40" y2="50"/>',
    "hanged-man": '<line x1="18" y1="14" x2="46" y2="14"/><line x1="32" y1="14" x2="32" y2="34"/><circle cx="32" cy="42" r="8"/>',
    death:
      '<circle cx="32" cy="28" r="14"/><circle cx="26" cy="26" r="3" fill="currentColor" stroke="none"/><circle cx="38" cy="26" r="3" fill="currentColor" stroke="none"/><path d="M24 36q8 6 16 0"/><line x1="26" y1="42" x2="26" y2="48"/><line x1="32" y1="42" x2="32" y2="50"/><line x1="38" y1="42" x2="38" y2="48"/>',
    temperance:
      '<path d="M14 20h12l-1.5 12a4.5 4.5 0 0 1-9 0z"/><path d="M38 32h12l-1.5 12a4.5 4.5 0 0 1-9 0z"/><path d="M24 24c8 4 8 10 16 12"/>',
    devil:
      '<circle cx="32" cy="32" r="24"/><path d="M32 48 L36.8 36.3 L49.3 35.7 L39.5 28 L42.9 16 L32 23.2 L21.1 16 L24.5 28 L14.7 35.7 L27.2 36.3 Z"/>',
    tower: '<rect x="24" y="20" width="16" height="30"/><path d="M24 20l4-6h8l4 6"/><path d="M40 10l-8 12h6l-8 12"/>',
    star:
      '<circle cx="32" cy="32" r="2.5" fill="currentColor" stroke="none"/><line x1="32" y1="8" x2="32" y2="56"/><line x1="8" y1="32" x2="56" y2="32"/><line x1="15" y1="15" x2="49" y2="49"/><line x1="49" y1="15" x2="15" y2="49"/>',
    moon: '<path d="M40 20a16 16 0 1 0 0 24a13 13 0 0 1 0-24z"/><circle cx="16" cy="18" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="28" r="1" fill="currentColor" stroke="none"/>',
    sun: '<circle cx="32" cy="32" r="10"/><line x1="46" y1="32" x2="52" y2="32"/><line x1="41.9" y1="41.9" x2="46.1" y2="46.1"/><line x1="32" y1="46" x2="32" y2="52"/><line x1="22.1" y1="41.9" x2="17.9" y2="46.1"/><line x1="18" y1="32" x2="12" y2="32"/><line x1="22.1" y1="22.1" x2="17.9" y2="17.9"/><line x1="32" y1="18" x2="32" y2="12"/><line x1="41.9" y1="22.1" x2="46.1" y2="17.9"/>',
    judgement: '<path d="M16 40c8-14 20-20 32-18"/><path d="M48 22l6-4M48 22l2 6"/><path d="M16 40l-6 2M16 40l-2 6"/>',
    world:
      '<ellipse cx="32" cy="32" rx="20" ry="16"/><line x1="32" y1="14" x2="32" y2="19"/><line x1="32" y1="45" x2="32" y2="50"/><line x1="10" y1="32" x2="15" y2="32"/><line x1="49" y1="32" x2="54" y2="32"/>',
    wands: '<line x1="32" y1="10" x2="32" y2="54"/><path d="M32 10 L24 18 M32 10 L40 18 M32 10 L32 20"/>',
    cups: '<path d="M16 12h32l-3 20a13 13 0 0 1-26 0z"/><line x1="32" y1="43" x2="32" y2="52"/><line x1="22" y1="56" x2="42" y2="56"/>',
    swords:
      '<line x1="32" y1="6" x2="32" y2="46"/><path d="M24 14 L32 6 L40 14"/><line x1="20" y1="40" x2="44" y2="40"/><line x1="32" y1="46" x2="32" y2="58"/>',
    pentacles:
      '<circle cx="32" cy="32" r="24"/><path d="M32 16 L36.8 27.7 L49.3 28.3 L39.5 36 L42.9 48 L32 40.8 L21.1 48 L24.5 36 L14.7 28.3 L27.2 27.7 Z"/>',
  };

  function iconSVG(key) {
    var inner = ICONS[key] || ICONS.pentacles;
    return '<svg viewBox="0 0 64 64">' + inner + "</svg>";
  }

  function cornersHTML() {
    return (
      '<span class="tarot-corner tl">&#10022;</span>' +
      '<span class="tarot-corner tr">&#10022;</span>' +
      '<span class="tarot-corner bl">&#10022;</span>' +
      '<span class="tarot-corner br">&#10022;</span>'
    );
  }

  // 卡背：六芒星 + 日月曼陀罗，78 张牌共用同一份模板
  function backFaceHTML() {
    return (
      cornersHTML() +
      '<svg class="tarot-back-art" viewBox="0 0 64 64">' +
      '<circle cx="32" cy="32" r="27"/>' +
      '<circle cx="32" cy="32" r="22"/>' +
      '<path d="M32 8 L50 42 L14 42 Z"/>' +
      '<path d="M32 56 L14 22 L50 22 Z"/>' +
      '<circle cx="32" cy="6" r="2.5" fill="currentColor" stroke="none"/>' +
      '<path d="M29 56a5 5 0 1 0 6 0a4 4 0 0 1 -6 0z" fill="currentColor" stroke="none"/>' +
      "</svg>" +
      '<div class="tarot-back-text">Reveal the Truth</div>'
    );
  }

  // 卡面：完全由 card 数据渲染，图片素材缺失/加载失败时回退到 SVG 图标
  function renderCardFront(container, card, orientation) {
    var reversed = orientation === "reversed";
    container.innerHTML =
      cornersHTML() +
      '<div class="tarot-front-roman">' +
      card.roman +
      "</div>" +
      '<div class="tarot-front-icon' +
      (reversed ? " reversed" : "") +
      '" id="tarot-icon-slot"></div>' +
      '<div class="tarot-front-text">' +
      '<div class="tarot-front-name-en">' +
      card.nameEn.toUpperCase() +
      "</div>" +
      '<div class="tarot-front-name-cn">' +
      card.name +
      "</div>" +
      '<div class="tarot-front-orientation">' +
      (reversed ? "逆位 · REVERSED" : "正位 · UPRIGHT") +
      "</div>" +
      "</div>";

    var slot = container.querySelector("#tarot-icon-slot");
    if (card.image) {
      var img = document.createElement("img");
      img.src = card.image;
      img.alt = card.name;
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.onerror = function () {
        slot.innerHTML = iconSVG(card.icon);
      };
      slot.appendChild(img);
    } else {
      slot.innerHTML = iconSVG(card.icon);
    }
  }

  function flipCardHTML(idPrefix) {
    return (
      '<div class="tarot-flip" id="' +
      idPrefix +
      '"><div class="tarot-flip-inner" id="' +
      idPrefix +
      '-inner">' +
      '<div class="tarot-face tarot-face-back">' +
      backFaceHTML() +
      "</div>" +
      '<div class="tarot-face tarot-face-front" id="' +
      idPrefix +
      '-front"></div>' +
      "</div></div>"
    );
  }

  function buildWidget() {
    var wrap = document.createElement("div");
    wrap.className = "tarot-widget";
    wrap.innerHTML =
      '<div class="tarot-panel" id="tarot-panel" hidden>' +
      '<div class="tarot-panel-header"><span>今日塔罗</span><button class="tarot-close" id="tarot-close" aria-label="收起">&times;</button></div>' +
      '<div class="tarot-panel-body" id="tarot-panel-body"><p class="tarot-hint">占卜准备中…</p></div>' +
      "</div>" +
      '<button class="tarot-fab" id="tarot-fab" aria-label="每日塔罗抽卡">' +
      FAB_ICON +
      '<span class="tarot-fab-dot" id="tarot-fab-dot" hidden></span>' +
      "</button>";
    document.body.appendChild(wrap);

    els.panel = wrap.querySelector("#tarot-panel");
    els.body = wrap.querySelector("#tarot-panel-body");
    els.fab = wrap.querySelector("#tarot-fab");
    els.dot = wrap.querySelector("#tarot-fab-dot");
    els.closeBtn = wrap.querySelector("#tarot-close");

    els.fab.addEventListener("click", togglePanel);
    els.closeBtn.addEventListener("click", function () {
      els.panel.hidden = true;
    });
  }

  function togglePanel() {
    els.panel.hidden = !els.panel.hidden;
    if (!els.panel.hidden) {
      renderBody();
    }
  }

  function renderBody() {
    if (loadError) {
      els.body.innerHTML =
        '<p class="tarot-hint">塔罗数据加载失败。若你是直接双击打开 HTML 文件，浏览器会阻止读取本地 JSON —— 请用本地服务器（比如 VS Code 的 Live Server，或命令行 python3 -m http.server）打开页面后重试。</p>';
      return;
    }
    if (!cards.length) {
      els.body.innerHTML = '<p class="tarot-hint">占卜准备中…</p>';
      return;
    }

    var drawn = loadDrawnToday();

    if (drawn) {
      var card = cards.filter(function (c) {
        return c.id === drawn.cardId;
      })[0];
      if (!card) {
        els.body.innerHTML = '<p class="tarot-hint">今日记录已损坏，明天再来重新抽取吧。</p>';
        return;
      }
      var meaning = drawn.orientation === "reversed" ? card.reversed : card.upright;

      els.body.innerHTML =
        flipCardHTML("tarot-flip") +
        '<div class="tarot-result"><h3 id="tarot-result-title"></h3>' +
        '<p class="tarot-meaning" id="tarot-result-meaning"></p></div>' +
        '<p class="tarot-hint">今天的塔罗牌已经抽过啦，明天再来抽新的一张。</p>';

      document.getElementById("tarot-flip-inner").classList.add("flipped");
      renderCardFront(document.getElementById("tarot-flip-front"), card, drawn.orientation);
      document.getElementById("tarot-result-title").textContent =
        card.name + " · " + (drawn.orientation === "reversed" ? "逆位" : "正位");
      document.getElementById("tarot-result-meaning").textContent = meaning;

      els.dot.hidden = false;
      return;
    }

    els.dot.hidden = true;
    els.body.innerHTML =
      flipCardHTML("tarot-flip") +
      '<button class="tarot-draw-btn" id="tarot-draw-btn">抽一张牌</button>' +
      '<p class="tarot-hint">今天还没有抽过塔罗牌，点击按钮开始今日占卜。</p>';

    document.getElementById("tarot-draw-btn").addEventListener("click", handleDraw);
  }

  function handleDraw() {
    var btn = document.getElementById("tarot-draw-btn");
    var inner = document.getElementById("tarot-flip-inner");
    var front = document.getElementById("tarot-flip-front");
    if (!btn || !inner || !front) return;

    btn.disabled = true;

    var card = cards[Math.floor(Math.random() * cards.length)];
    var orientation = Math.random() < 0.5 ? "reversed" : "upright";

    renderCardFront(front, card, orientation);

    requestAnimationFrame(function () {
      inner.classList.add("flipped");
    });

    var hint = els.body.querySelector(".tarot-hint");
    var done = false;

    function finalize() {
      if (done) return;
      done = true;
      inner.removeEventListener("transitionend", finalize);
      saveDrawn(card.id, orientation);

      var meaning = orientation === "reversed" ? card.reversed : card.upright;
      var result = document.createElement("div");
      result.className = "tarot-result";

      var title = document.createElement("h3");
      title.textContent = card.name + " · " + (orientation === "reversed" ? "逆位" : "正位");

      var meaningEl = document.createElement("p");
      meaningEl.className = "tarot-meaning";
      meaningEl.textContent = meaning;

      result.appendChild(title);
      result.appendChild(meaningEl);
      if (btn.isConnected) btn.replaceWith(result);

      if (hint) hint.textContent = "今天的塔罗牌已经抽过啦，明天再来抽新的一张。";
      els.dot.hidden = false;
    }

    // 3D 翻转约 1.2s，后台标签页可能节流/跳过 transitionend，加一个兜底计时器
    inner.addEventListener("transitionend", finalize, { once: true });
    setTimeout(finalize, 1400);
  }

  function init() {
    buildWidget();

    var drawn = loadDrawnToday();
    if (drawn) els.dot.hidden = false;

    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        cards = data;
        if (!els.panel.hidden) renderBody();
      })
      .catch(function (err) {
        loadError = err;
        if (!els.panel.hidden) renderBody();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
