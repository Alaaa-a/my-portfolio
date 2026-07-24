// Decap CMS OAuth 第二步：GitHub 带着 code 跳回这里，用 client_secret 换成 access_token，
// 再通过 postMessage 把 token 交给打开这个弹窗的 admin 页面（Decap CMS 官方约定的握手协议）
module.exports = async (req, res) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const code = req.query && req.query.code;

  if (!clientId || !clientSecret) {
    res.status(500).send("缺少环境变量 OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET，请在 Vercel 项目设置里配置后重新部署。");
    return;
  }

  if (!code) {
    res.status(400).send("缺少 GitHub 返回的 code 参数。");
    return;
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const data = await tokenRes.json();

    if (!data.access_token) {
      res
        .status(400)
        .send("GitHub OAuth 失败：" + (data.error_description || data.error || "未知错误"));
      return;
    }

    const messageStr =
      "authorization:github:success:" +
      JSON.stringify({ token: data.access_token, provider: "github" });

    const html =
      "<!DOCTYPE html><html><body><script>" +
      "(function() {" +
      "function receiveMessage(e) {" +
      "window.opener.postMessage(" +
      JSON.stringify(messageStr) +
      ", e.origin);" +
      'window.removeEventListener("message", receiveMessage, false);' +
      "}" +
      'window.addEventListener("message", receiveMessage, false);' +
      'window.opener.postMessage("authorizing:github", "*");' +
      "})();" +
      "</script>登录成功，这个窗口可以关闭了。</body></html>";

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send("OAuth 回调处理失败：" + err.message);
  }
};
