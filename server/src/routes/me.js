import express from "express";

import supabaseAdmin from "../supabaseAdmin.js";
import requireAuth from "../middleware/requireAuth.js";

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

export default router;

