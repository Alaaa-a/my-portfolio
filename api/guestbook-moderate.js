// 留言审核后台用：approve/ignore 把留言标成"已通过"/"已忽略"（不删除）；
// delete 是真的从数据库删掉，不可恢复
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  var body = req.body || {};
  var password = body.password;
  var id = body.id;
  var action = body.action;

  if (!password || password !== process.env.GUESTBOOK_ADMIN_PASSWORD) {
    res.status(401).json({ error: "密码不对" });
    return;
  }

  if (!id || ["approve", "ignore", "delete"].indexOf(action) === -1) {
    res.status(400).json({ error: "缺少 id，或 action 不是 approve/ignore/delete" });
    return;
  }

  var url = process.env.SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    res.status(500).json({ error: "缺少环境变量 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
    return;
  }

  var endpoint = url + "/rest/v1/guestbook_messages?id=eq." + encodeURIComponent(id);

  try {
    var upstream;
    if (action === "delete") {
      upstream = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          apikey: key,
          Authorization: "Bearer " + key,
          Prefer: "return=minimal",
        },
      });
    } else {
      var status = action === "approve" ? "approved" : "ignored";
      upstream = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: "Bearer " + key,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ status: status }),
      });
    }

    if (!upstream.ok) {
      var errText = await upstream.text();
      res.status(upstream.status).send(errText);
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
