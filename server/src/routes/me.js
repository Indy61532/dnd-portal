const express = require("express");
const supabaseAdmin = require("../supabaseAdmin");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, name, created_at")
    .eq("id", req.user.id)
    .single();

  if (error) {
    return res.status(500).json({ error: "Failed to load profile" });
  }

  return res.json({
    user: req.user,
    profile: data,
  });
});

module.exports = router;

