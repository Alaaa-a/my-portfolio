// Decap CMS OAuth 第一步：把用户带到 GitHub 的授权页面
// 对应 admin/config.yml 里的 backend.auth_endpoint: api/auth
module.exports = (req, res) => {
  const clientId = process.env.OAUTH_CLIENT_ID;

  if (!clientId) {
    res.status(500).send("缺少环境变量 OAUTH_CLIENT_ID，请在 Vercel 项目设置里配置后重新部署。");
    return;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const redirectUri = `${protocol}://${host}/api/callback`;

  const authorizeUrl =
    "https://github.com/login/oauth/authorize" +
    "?client_id=" +
    encodeURIComponent(clientId) +
    "&redirect_uri=" +
    encodeURIComponent(redirectUri) +
    "&scope=repo";

  res.writeHead(302, { Location: authorizeUrl });
  res.end();
};
