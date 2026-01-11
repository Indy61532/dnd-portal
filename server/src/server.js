const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const meRoute = require("./routes/me");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/me", meRoute);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});
