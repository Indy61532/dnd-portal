import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import meRoutes from "./routes/me.js";

dotenv.config({ path: "./config.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
const corsAllowList = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / server-to-server calls (no Origin header)
      if (!origin) return cb(null, true);

      // If no allowlist is configured, allow any origin (reflected) for easier setup.
      if (corsAllowList.length === 0) return cb(null, true);

      // Allow wildcard or exact matches. Also allow "null" origin if explicitly listed.
      if (corsAllowList.includes("*")) return cb(null, true);
      if (corsAllowList.includes(origin)) return cb(null, true);
      if (origin === "null" && corsAllowList.includes("null")) return cb(null, true);

      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Healthcheck (JSON is more useful for clients)
app.get("/health", (_req, res) => res.json({ ok: true }));
// Plain-text variant (nice for dumb monitors / curl)
app.get("/health.txt", (_req, res) => res.type("text").send("OK"));
app.use("/me", meRoutes);

const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));

// Root should always return something useful (Railway health-check / manual browser test).
// If a static frontend exists, serve it; otherwise return JSON.
app.get("/", (_req, res) => {
  const indexPath = path.join(publicDir, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.json({ ok: true, service: "dnd-portal backend" });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
