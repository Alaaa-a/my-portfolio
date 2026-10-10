// 导航栏"更多"下拉：点按钮展开/收起，点别处或按 Esc 收起（手机上也靠点击，不依赖 hover）
(function () {
  function init() {
    var wrap = document.querySelector(".nav-more");
    if (!wrap) return;
    var btn = wrap.querySelector(".nav-more-btn");
    if (!btn) return;

    function setOpen(open) {
      wrap.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!wrap.classList.contains("open"));
    });
    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
