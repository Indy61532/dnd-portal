const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../config.env") });

const meRoutes = require("./routes/me");
const authRoutes = require("./routes/auth");

const app = express();

app.use(express.json());

// CORS: for single-origin setup (frontend served by this same Express), you can keep this permissive.
// If you want stricter, set CORS_ORIGIN="https://your-frontend.com, http://localhost:5500"
const corsAllowList = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (corsAllowList.length === 0) return cb(null, true);
      if (corsAllowList.includes("*")) return cb(null, true);
      if (corsAllowList.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// -----------------------------
// API routes (all under /api/*)
// -----------------------------
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/me", meRoutes);
app.use("/api/auth", authRoutes);

// Backward-compat aliases (optional; safe to keep while migrating frontend)
app.get("/health", (_req, res) => res.redirect(307, "/api/health"));

// -----------------------------
// Static frontend (server/public)
// -----------------------------
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));

// SPA fallback: send index.html for any non-API route
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  return res.sendFile(path.join(publicDir, "index.html"));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
