# my-portfolio

Alaaa 的个人小站 —— 纯 HTML / CSS / JS 搭建，没有构建工具，没有框架。

深色星空主题，页面包括首页、关于我、作品展示、最近在玩、喜欢的游戏排行榜、游戏鉴赏总结、留言板，外加两个悬浮小组件：

- **每日塔罗**（右下角）：78 张塔罗牌数据驱动渲染，曜石黑金视觉风格，点击抽卡触发 3D 翻牌动画，当天锁定结果，次日自动解锁
- **每日鸡尾酒**（左下角）：50 款经典鸡尾酒，按日期固定推荐一款，点开可看配方、调制步骤和故事

## 本地预览

因为塔罗牌和鸡尾酒组件用 `fetch` 读取 `data/*.json`，直接双击打开 HTML 文件会被浏览器的 `file://` 限制挡住，需要起一个本地静态服务器：

```bash
python3 -m http.server 8420
```

然后访问 `http://localhost:8420/index.html`。

## 目录结构

```
├── index.html / about.html / ...   页面
├── css/style.css                   全站样式
├── js/                             stars.js（星空背景）、tarot.js、cocktail.js
└── data/                           tarot.json、cocktails.json
```
