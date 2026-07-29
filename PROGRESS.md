# 项目现状总结

最后更新：2026-07-29

Alaaa 的个人网站，纯静态 HTML/CSS/JS（没有构建工具、没有框架，每个 JS 文件都是独立的 IIFE，不共享代码）。部署链路：GitHub 仓库 [`Alaaa-a/my-portfolio`](https://github.com/Alaaa-a/my-portfolio) → Vercel（`my-portfolio-six-gray-45.vercel.app`），push 到 `main` 自动触发重新部署。

整体视觉：深色星空背景贯穿全站（`js/stars.js`），标题字体 Cormorant + Noto Serif SC（细字重、拉宽字距），塔罗牌卡片用"曜石黑金"风格（`--tarot-obsidian` / `--tarot-gold` 这两个 CSS 变量），其余内容页走朴素的深色卡片风格。

---

## 已完成功能

### 页面骨架（7 个静态展示页 + 2 组列表/详情）
`index` `about` `portfolio` `now` `rankings` `reviews`（列表 + `reviews-post` 详情）`devlog`（列表 + `devlog-post` 详情）`guestbook`。除首页 hero 外，每页内容都是"读 `data/*.json` 渲染，fetch 失败时保留页面里写死的占位内容当兜底"这个统一模式（对应 `js/about.js` `js/portfolio.js` `js/now.js` `js/rankings.js` `js/reviews.js` `js/devlog.js` `js/home.js` 等）。

### 悬浮小组件（全站共用，出现在每个页面）
- **每日塔罗**（`js/tarot.js` + `data/tarot.json`）：78 张牌数据驱动，每张牌有中英文名、罗马数字、SVG 图标 key、正/逆位牌义。点击抽卡触发 3D 翻牌动画（~1.2s），当天锁定同一张（localStorage），次日自动解锁。卡面视觉是"曜石黑金"风格：黑底金框、四角星芒、六芒星+日月卡背。
- **每日鸡尾酒**（`js/cocktail.js` + `data/cocktails.json`）：50 款经典鸡尾酒，用日期做种子固定推荐一款（不需要 localStorage，纯函数），收起时是小卡片，点开展示配方/步骤/故事。
- **桌宠小黑猫**（`js/cat.js`）：纯 SVG 画的猫（发光蓝眼睛），CSS 帧动画做走路/坐下。JS 状态机随机游走、避开 `main`/`nav`/`footer` 区域（同侧偏好减少穿过文字的概率）、鼠标靠近有反应、点击随机触发爱心/对话气泡/星芒特效。左上角藏了一个 8px 小圆点，点击可以整体开关这只猫（状态存 localStorage）。**贴图支持的架构已经搭好**（探测 `assets/cat/sprite.png` 是否存在，存在就切换成雪碧图逐帧播放，不存在就用现在的 SVG 兜底）——目前还没有真实素材，用户说会自己找/画。

### 内容管理（Decap CMS）
`/admin/` 是 Decap CMS 后台，backend 是 `github`（不是 Netlify Identity）。因为项目部署在 Vercel，GitHub OAuth 的令牌交换是自己实现的两个 Vercel serverless function：`api/auth.js`（跳转到 GitHub 授权页）+ `api/callback.js`（用 code 换 token，通过 postMessage 传给弹窗 opener）。`admin/config.yml` 里现在有 7 个 collection：`home` `about` `portfolio` `now` `rankings` `devlog` `reviews`，全部是"file 类型 collection + list 字段"的模式（单个 JSON 文件，不是每条内容一个文件——这样才能在纯静态站点上不依赖构建步骤就读出全部数据）。用户已经在实际使用后台写了不少真实内容（关于我、作品展示、最近在玩、排行榜、开发日志、7 篇游戏鉴赏长文）。

### 留言板（Supabase 数据库 + 独立审核后台）
- 公开页 `guestbook.html`：真实表单（昵称选填/分类单选/正文），直接用 `fetch()` 调 Supabase 的 REST API（PostgREST），不用额外 SDK。
- 数据表 `guestbook_messages`（建表 SQL 在 `supabase/schema.sql`），开了 Row Level Security：anon key 只能插入 `status='pending'` 的行，只能读 `status='approved'` 的行。
- 独立审核页 `guestbook-admin.html`（**没有**放进 Decap CMS，因为 Decap 是纯 Git 文件型 CMS，管不了数据库；也没放进导航栏，属于"知道链接才能访问"）：密码登录（`GUESTBOOK_ADMIN_PASSWORD` 环境变量），三个标签页（待审核/已通过/已忽略），待审核可以"通过"或"忽略"，已通过/已忽略的留言可以"删除"（真删，有二次确认）。审核用的两个 serverless function（`api/guestbook-list.js` `api/guestbook-moderate.js`）用 `SUPABASE_SERVICE_ROLE_KEY` 绕过 RLS，这个 key 只存在于 Vercel 环境变量里，不会出现在任何前端代码中。
- Supabase 项目已创建、建表 SQL 已跑、`SUPABASE_URL`/`anon key` 已经填进 `js/guestbook.js`，`SUPABASE_SERVICE_ROLE_KEY`/`GUESTBOOK_ADMIN_PASSWORD` 已经配置进 Vercel 环境变量。**端到端测试过一次真实提交，成功；审核后台的 API 部署健康度也验证过**（用错误密码测试拿到了预期的 401，说明环境变量确实生效了），但还没有用户本人用真实密码登录审核页确认能看到并操作那条测试留言。

---

## 部分完成 / 明确延后的部分

- **塔罗牌 × 留言板联动**：需求里提到"提交留言时自动抽一张塔罗牌，牌面决定留言展示的视觉样式"，用户明确要求先跑通核心链路（表单/待审核/审核/公开展示）再做这个，核心链路已经完成，**这部分还没开始做**。
- **桌宠猫贴图素材**：架构已就绪（见上），等用户提供实际图片文件。
- **游戏鉴赏配图**：在合并 CMS 内容时发现用户尝试过给"Final Fantasy II/III"两篇插图（`data/reviews.json` 里还留着两处 `!image.png` 占位文字，实际没关联到真实图片），也确实上传过两张截图到 `assets/uploads/`。当时问过用户要不要现在加图片字段，**用户还没回复要不要做**。

---

## 已知问题 /需要注意的坑

1. **本地预览的浏览器缓存**：本地用 `python3 -m http.server` 起服务时，浏览器会比较激进地缓存 `.js` 文件，改完代码不生效经常是缓存问题，需要硬刷新（Mac 上 `Cmd+Shift+R`）。线上 Vercel 没遇到这个问题。
2. **`file://` 协议限制**：所有 `fetch()` 读 JSON 数据的功能（塔罗/鸡尾酒/各内容页/留言板）都要求通过 http(s) 访问，不能直接双击 HTML 文件打开，本地测试必须起服务器。
3. **留言板没有防刷/防垃圾信息机制**：anon key 是公开的（Supabase 的设计就是如此，靠 RLS 限制权限），任何人理论上可以脚本化批量提交留言（会进"待审核"，不会直接公开，但审核队列可能被灌水）。目前没做 rate limit / 验证码，是个已知但还没处理的风险点。
4. **`data/reviews.json` 里有历史遗留的 `!image.png` 占位符**（见上一节），不会报错，只是显示成没意义的文字。

---

## 下一步计划（按讨论顺序）

1. 确认留言板用真实密码登录 `guestbook-admin.html`，验证能看到并操作测试留言，然后清理掉那条测试数据
2. 塔罗牌 × 留言板视觉联动：提交留言时抽一张牌，牌的属性（花色/正逆位等）映射成留言卡片的配色或装饰
3. 等用户提供桌宠猫的贴图素材后接入 `assets/cat/sprite.png`，按需调整 `js/cat.js` 里 `SPRITE` 配置（帧尺寸、帧序列、缩放）
4. 视情况决定要不要给游戏鉴赏加配图字段（`data/reviews.json` + `admin/config.yml` + `reviews-post.js` 渲染逻辑），处理掉遗留的 `!image.png` 占位符
5. 留言板的基础防刷保护（如果垃圾留言真的成为问题再做，目前只是已知风险，不算紧急）

---

## 关键文件速查

| 做什么 | 看哪里 |
|---|---|
| 全站样式 / CSS 变量 | `css/style.css` |
| 星空背景 | `js/stars.js` |
| 塔罗牌数据 / 逻辑 | `data/tarot.json` / `js/tarot.js` |
| 鸡尾酒数据 / 逻辑 | `data/cocktails.json` / `js/cocktail.js` |
| 桌宠猫逻辑 | `js/cat.js` |
| 各页面数据 | `data/home.json` `data/about.json` `data/portfolio.json` `data/now.json` `data/rankings.json` `data/reviews.json` `data/devlog.json` |
| CMS 后台配置 | `admin/config.yml`（collection 定义）/ `admin/index.html`（Decap 入口） |
| GitHub OAuth 令牌交换 | `api/auth.js` `api/callback.js` |
| 留言板前台 | `guestbook.html` / `js/guestbook.js` |
| 留言板数据表 + 权限 | `supabase/schema.sql` |
| 留言审核后台 | `guestbook-admin.html` / `js/guestbook-admin.js` |
| 留言审核用的 serverless function | `api/guestbook-list.js` / `api/guestbook-moderate.js` |
| 部署/托管说明 | `README.md` |

## 需要用户自己保管的密钥（不在仓库里，配置在 Vercel 环境变量）

- `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET`：GitHub OAuth App，供 Decap CMS 登录用
- `SUPABASE_SERVICE_ROLE_KEY`：留言审核后台绕过 RLS 用，绝不能出现在前端代码
- `GUESTBOOK_ADMIN_PASSWORD`：留言审核后台的登录密码

（`SUPABASE_URL` 和 anon key 不是密钥，已经直接写在 `js/guestbook.js` 里。）
