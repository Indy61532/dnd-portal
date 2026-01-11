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
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Simple healthcheck for Railway/monitoring
app.get("/health", (_req, res) => res.type("text").send("OK"));
// JSON variant (useful for debugging)
app.get("/health.json", (_req, res) => res.json({ ok: true }));
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
