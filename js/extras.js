// 纯净版总开关：默认不加载塔罗、鸡尾酒、桌宠、装饰眼睛、猫猫眼睛背景这些小组件，
// 页脚里这个小按钮打开后才会出现（塔罗 + 鸡尾酒；桌宠和两个眼睛效果仍靠各自的隐藏小圆点开启）。
// 各组件脚本自己读同一个 localStorage key 决定要不要加载，这里切换后刷新页面生效。
(function () {
  var KEY = "alaaa-extras-enabled";

  function isOn() {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function init() {
    var footer = document.querySelector(".site-footer");
    if (!footer) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "extras-toggle";
    btn.setAttribute("aria-pressed", isOn() ? "true" : "false");
    btn.textContent = isOn() ? "✦ 小彩蛋：开" : "✦ 小彩蛋：关";
    footer.appendChild(btn);

    btn.addEventListener("click", function () {
      try {
        localStorage.setItem(KEY, isOn() ? "0" : "1");
      } catch (e) {
        return;
      }
      window.location.reload();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
