// 点图片看大图（作品展示的截图、开发日志文章里的配图共用）。
// window.lightbox.open(images, index, alt)：点空白处、关闭按钮或按 Esc 关闭；
// 多张图时可以用左右箭头按钮（手机）或键盘 ←/→ 切换。必须排在 i18n.js 之后加载。
(function () {
  var box = null;
  var imgEl = null;
  var counterEl = null;
  var images = [];
  var index = 0;
  var altText = "";
  var opener = null;

  function show() {
    imgEl.src = images[index];
    imgEl.alt = altText;
    if (counterEl) counterEl.textContent = index + 1 + " / " + images.length;
  }

  function step(delta) {
    if (images.length < 2) return;
    index = (index + delta + images.length) % images.length;
    show();
  }

  function close() {
    if (!box) return;
    box.remove();
    box = null;
    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = "";
    if (opener && opener.focus) opener.focus();
    opener = null;
  }

  function onKey(e) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
  }

  function navButton(cls, label, text, delta) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "lightbox-nav " + cls;
    b.setAttribute("aria-label", label);
    b.textContent = text;
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      step(delta);
    });
    return b;
  }

  function open(list, startIndex, alt) {
    close();
    images = list;
    index = startIndex || 0;
    altText = alt || "";
    opener = document.activeElement;

    box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");

    imgEl = document.createElement("img");
    imgEl.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "lightbox-close";
    closeBtn.setAttribute("aria-label", i18n.t("lightbox.close"));
    closeBtn.textContent = "×";

    box.appendChild(imgEl);
    box.appendChild(closeBtn);

    counterEl = null;
    if (images.length > 1) {
      box.appendChild(navButton("lightbox-prev", i18n.t("lightbox.prev"), "‹", -1));
      box.appendChild(navButton("lightbox-next", i18n.t("lightbox.next"), "›", 1));
      counterEl = document.createElement("div");
      counterEl.className = "lightbox-counter";
      box.appendChild(counterEl);
    }

    box.addEventListener("click", close);
    document.body.appendChild(box);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    show();
    closeBtn.focus();
  }

  window.lightbox = { open: open };
})();
