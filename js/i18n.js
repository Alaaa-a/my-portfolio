// 中英双语：默认中文，导航栏右侧的按钮切换（记在 localStorage，切换后刷新页面生效）。
// - 静态文字：HTML 里带 data-i18n / data-i18n-placeholder / data-i18n-aria 的元素，英文模式下被替换
// - 脚本里的动态文字：i18n.t("key")
// - data/*.json 里的内容：i18n.f(obj, "title") 优先读 obj.title_en，没有就回退中文
// 这是全站唯一一个被其他脚本共用的文件，所以必须排在其他脚本之前加载。
(function () {
  var KEY = "alaaa-lang";

  function readLang() {
    try {
      return localStorage.getItem(KEY) === "en" ? "en" : "zh";
    } catch (e) {
      return "zh";
    }
  }

  var lang = readLang();

  var DICT = {
    "nav.home": { zh: "首页", en: "Home" },
    "nav.about": { zh: "关于我", en: "About" },
    "nav.portfolio": { zh: "作品展示", en: "Portfolio" },
    "nav.now": { zh: "最近在玩", en: "Now Playing" },
    "nav.rankings": { zh: "游戏排行榜", en: "Rankings" },
    "nav.reviews": { zh: "游戏鉴赏总结", en: "Reviews" },
    "nav.devlog": { zh: "开发日志", en: "Devlog" },
    "nav.guestbook": { zh: "留言板", en: "Guestbook" },
    "footer.text": { zh: "© 2026 Alaaa · 用星星和代码搭的小站", en: "© 2026 Alaaa · A little site built with stars and code" },

    "title.home": { zh: "Alaaa 的小星球", en: "Alaaa's Little Planet" },
    "title.about": { zh: "关于我 · Alaaa", en: "About · Alaaa" },
    "title.portfolio": { zh: "作品展示 · Alaaa", en: "Portfolio · Alaaa" },
    "title.now": { zh: "最近在玩 · Alaaa", en: "Now Playing · Alaaa" },
    "title.rankings": { zh: "喜欢的游戏排行榜 · Alaaa", en: "Favorite Games · Alaaa" },
    "title.reviews": { zh: "游戏鉴赏总结 · Alaaa", en: "Game Reviews · Alaaa" },
    "title.devlog": { zh: "开发日志 · Alaaa", en: "Devlog · Alaaa" },
    "title.guestbook": { zh: "留言板 · Alaaa", en: "Guestbook · Alaaa" },
    "titleSuffix": { zh: " · Alaaa", en: " · Alaaa" },

    "h1.about": { zh: "关于我", en: "About Me" },
    "h1.portfolio": { zh: "作品展示", en: "Portfolio" },
    "h1.now": { zh: "最近在玩", en: "Now Playing" },
    "h1.rankings": { zh: "喜欢的游戏排行榜", en: "Favorite Games" },
    "h1.reviews": { zh: "游戏鉴赏总结", en: "Game Reviews" },
    "h1.devlog": { zh: "开发日志", en: "Devlog" },
    "h1.guestbook": { zh: "留言板", en: "Guestbook" },

    "page.loading": { zh: "加载中…", en: "Loading…" },
    "reviews.loading": { zh: "鉴赏加载中…", en: "Loading reviews…" },
    "devlog.loading": { zh: "日志加载中…", en: "Loading posts…" },
    "reviews.back": { zh: "← 返回鉴赏列表", en: "← Back to reviews" },
    "devlog.back": { zh: "← 返回日志列表", en: "← Back to devlog" },
    "reviews.empty": { zh: "还没有鉴赏内容。", en: "No reviews yet." },
    "reviews.error": {
      zh: "鉴赏加载失败。若你是直接双击打开 HTML 文件，浏览器会阻止读取本地 JSON —— 请用本地服务器打开页面后重试。",
      en: "Failed to load reviews. If you opened the HTML file directly, the browser blocks reading local JSON — please use a local server and try again."
    },
    "reviews.notFound": {
      zh: "没找到这篇鉴赏，可能链接有误，或者内容还没加载出来。",
      en: "Couldn't find this review. The link may be wrong, or it hasn't loaded yet."
    },
    "devlog.empty": { zh: "这个标签下还没有日志。", en: "No posts under this tag yet." },
    "devlog.all": { zh: "全部", en: "All" },
    "devlog.error": {
      zh: "日志加载失败。若你是直接双击打开 HTML 文件，浏览器会阻止读取本地 JSON —— 请用本地服务器打开页面后重试。",
      en: "Failed to load posts. If you opened the HTML file directly, the browser blocks reading local JSON — please use a local server and try again."
    },
    "devlog.notFound": {
      zh: "没找到这篇日志，可能链接有误，或者日志还没加载出来。",
      en: "Couldn't find this post. The link may be wrong, or it hasn't loaded yet."
    },

    "guestbook.intro": {
      zh: "功能建议、Bug 反馈、单纯想说的话都欢迎～留言会先经过审核，通过之后才会显示在下面。",
      en: "Feature ideas, bug reports, or just something you want to say — all welcome! Messages are reviewed first and will appear below once approved."
    },
    "guestbook.nickname": { zh: "昵称（选填，不填就是「匿名」）", en: "Nickname (optional — defaults to “Anonymous”)" },
    "guestbook.categoryLabel": { zh: "留言分类", en: "Message category" },
    "guestbook.cat.feature": { zh: "功能建议", en: "Feature idea" },
    "guestbook.cat.bug": { zh: "Bug 反馈", en: "Bug report" },
    "guestbook.cat.chat": { zh: "单纯想说的话", en: "Just saying hi" },
    "guestbook.message": { zh: "想说点什么…", en: "What would you like to say…" },
    "guestbook.submit": { zh: "提交留言", en: "Submit" },
    "guestbook.loading": { zh: "留言加载中…", en: "Loading messages…" },
    "guestbook.anon": { zh: "匿名", en: "Anonymous" },
    "guestbook.noDb": { zh: "留言板还没接好数据库，稍后再来看看。", en: "The guestbook database isn't connected yet — please check back later." },
    "guestbook.none": { zh: "还没有留言，来做第一个吧！", en: "No messages yet — be the first!" },
    "guestbook.loadFail": { zh: "留言加载失败，刷新试试。", en: "Failed to load messages. Try refreshing." },
    "guestbook.noDbSubmit": { zh: "留言板还没接好数据库，暂时没法提交，请稍后再来。", en: "The guestbook database isn't connected yet, so messages can't be submitted right now." },
    "guestbook.emptyMsg": { zh: "留言内容不能是空的哦。", en: "The message can't be empty." },
    "guestbook.submitting": { zh: "提交中…", en: "Submitting…" },
    "guestbook.submitted": { zh: "留言已提交，等审核通过后就会显示在下面啦，谢谢你！", en: "Message submitted! It will appear below once approved. Thank you!" },
    "guestbook.submitFail": { zh: "提交失败，过一会儿再试试？", en: "Submission failed — please try again in a bit." },

    "extras.on": { zh: "✦ 小彩蛋：开", en: "✦ Extras: on" },
    "extras.off": { zh: "✦ 小彩蛋：关", en: "✦ Extras: off" },
    "lang.toggleLabel": { zh: "切换到英文", en: "Switch to Chinese" },
    "lang.toggleText": { zh: "EN", en: "中" },

    "cat.sounds": { zh: "喵~|喵？|呼噜噜", en: "Meow~|Mew?|Purrr" },
    "cat.on": { zh: "🐾 桌宠已开启", en: "🐾 Desktop cat on" },
    "cat.off": { zh: "🐾 桌宠已关闭", en: "🐾 Desktop cat off" },
    "cat.toggleLabel": { zh: "切换桌宠猫显示", en: "Toggle desktop cat" },
    "eyes.on": { zh: "👁 装饰眼睛已开启", en: "👁 Decorative eyes on" },
    "eyes.off": { zh: "👁 装饰眼睛已关闭", en: "👁 Decorative eyes off" },
    "eyes.toggleLabel": { zh: "切换装饰眼睛显示", en: "Toggle decorative eyes" },
    "catEyes.on": { zh: "🐱 猫猫眼睛背景已开启", en: "🐱 Cat-eyes background on" },
    "catEyes.off": { zh: "🐱 猫猫眼睛背景已关闭", en: "🐱 Cat-eyes background off" },
    "catEyes.toggleLabel": { zh: "切换猫猫眼睛背景彩蛋", en: "Toggle cat-eyes background" },

    "tarot.title": { zh: "今日塔罗", en: "Daily Tarot" },
    "tarot.close": { zh: "收起", en: "Close" },
    "tarot.fabLabel": { zh: "每日塔罗抽卡", en: "Draw today's tarot card" },
    "tarot.preparing": { zh: "占卜准备中…", en: "Shuffling the deck…" },
    "tarot.upright": { zh: "正位", en: "Upright" },
    "tarot.reversed": { zh: "逆位", en: "Reversed" },
    "tarot.frontUpright": { zh: "正位 · UPRIGHT", en: "UPRIGHT" },
    "tarot.frontReversed": { zh: "逆位 · REVERSED", en: "REVERSED" },
    "tarot.loadFail": {
      zh: "塔罗数据加载失败。若你是直接双击打开 HTML 文件，浏览器会阻止读取本地 JSON —— 请用本地服务器（比如 VS Code 的 Live Server，或命令行 python3 -m http.server）打开页面后重试。",
      en: "Failed to load tarot data. If you opened the HTML file directly, the browser blocks reading local JSON — please use a local server (e.g. VS Code Live Server, or python3 -m http.server) and try again."
    },
    "tarot.corrupt": { zh: "今日记录已损坏，明天再来重新抽取吧。", en: "Today's record is corrupted — come back tomorrow to draw again." },
    "tarot.alreadyDrawn": { zh: "今天的塔罗牌已经抽过啦，明天再来抽新的一张。", en: "You've already drawn today's card — come back tomorrow for a new one." },
    "tarot.draw": { zh: "抽一张牌", en: "Draw a card" },
    "tarot.notDrawn": { zh: "今天还没有抽过塔罗牌，点击按钮开始今日占卜。", en: "You haven't drawn a card today — press the button to begin." },

    "cocktail.label": { zh: "今日鸡尾酒", en: "Cocktail of the Day" },
    "cocktail.close": { zh: "收起", en: "Close" },
    "cocktail.preparing": { zh: "占卜准备中…", en: "Mixing…" },
    "cocktail.recipe": { zh: "配方", en: "Recipe" },
    "cocktail.method": { zh: "调制方法", en: "Method" },
    "cocktail.story": { zh: "小故事", en: "Story" },
    "cocktail.failTitle": { zh: "加载失败", en: "Failed to load" },
    "cocktail.failSub": { zh: "请用本地服务器打开页面", en: "Please use a local server" },
    "cocktail.loadFail": {
      zh: "鸡尾酒数据加载失败。若你是直接双击打开 HTML 文件，浏览器会阻止读取本地 JSON —— 请用本地服务器（比如 VS Code 的 Live Server，或命令行 python3 -m http.server）打开页面后重试。",
      en: "Failed to load cocktail data. If you opened the HTML file directly, the browser blocks reading local JSON — please use a local server (e.g. VS Code Live Server, or python3 -m http.server) and try again."
    }
  };

  function t(key) {
    var entry = DICT[key];
    if (!entry) return key;
    return entry[lang] || entry.zh;
  }

  // 优先取 obj[field + "_en"]（英文模式且非空），否则回退中文原字段
  function f(obj, field) {
    if (!obj) return "";
    if (lang === "en") {
      var en = obj[field + "_en"];
      if (typeof en === "string" && en.trim()) return en;
    }
    return obj[field];
  }

  function applyStatic() {
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    if (lang !== "en") return;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
  }

  function buildSwitch() {
    var nav = document.querySelector(".site-nav");
    if (!nav) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lang-toggle";
    btn.textContent = t("lang.toggleText");
    btn.setAttribute("aria-label", t("lang.toggleLabel"));
    nav.appendChild(btn);

    btn.addEventListener("click", function () {
      try {
        localStorage.setItem(KEY, lang === "en" ? "zh" : "en");
      } catch (e) {
        return;
      }
      window.location.reload();
    });
  }

  function init() {
    applyStatic();
    buildSwitch();
  }

  window.i18n = { lang: lang, t: t, f: f };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
