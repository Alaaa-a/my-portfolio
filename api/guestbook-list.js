// 留言审核后台用：返回全部留言（含待审核/已通过/已忽略），用密码简单保护
// 用 service_role key 直连 Supabase 的 REST API，绕过 RLS，所以这个 key 绝不能出现在前端代码里
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  var password = req.body && req.body.password;
  if (!password || password !== process.env.GUESTBOOK_ADMIN_PASSWORD) {
    res.status(401).json({ error: "密码不对" });
    return;
  }

  var url = process.env.SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    res.status(500).json({ error: "缺少环境变量 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
    return;
  }

  try {
    var upstream = await fetch(url + "/rest/v1/guestbook_messages?order=created_at.desc&select=*", {
      headers: { apikey: key, Authorization: "Bearer " + key },
    });
    var data = await upstream.json();
    if (!upstream.ok) {
      res.status(upstream.status).json(data);
      return;
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
