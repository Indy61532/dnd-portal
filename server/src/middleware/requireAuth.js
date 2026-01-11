const supabaseAdmin = require("../supabaseAdmin");

module.exports = async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer\s+(.+)$/);

    if (!match) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = match[1];

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = { id: data.user.id, email: data.user.email };
    req.token = token;
    next();
  } catch (_e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

