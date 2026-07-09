// Universal Video Downloader — Express + yt-dlp backend
// Entry point. Wires middleware and mounts the /api router.

import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import apiRouter from "./routes/index.js";

const app = express();

// --- CORS ---------------------------------------------------------------
const rawOrigins = process.env.CORS_ORIGIN ?? "*";
const allowedOrigins =
  rawOrigins.trim() === "*"
    ? "*"
    : rawOrigins.split(",").map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.options("*", cors({ origin: allowedOrigins }));

// --- Core middleware ----------------------------------------------------
app.use(express.json({ limit: "16kb" }));
app.use(morgan("tiny"));

// --- Rate limiting ------------------------------------------------------
const max = Number(process.env.RATE_LIMIT_MAX ?? 30);
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// --- Health -------------------------------------------------------------
app.get("/", (_req, res) => res.json({ ok: true, service: "universal-downloader-api" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

// --- Routes -------------------------------------------------------------
app.use("/api", apiRouter);

// --- Error handler ------------------------------------------------------
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error("[api error]", err);
  res.status(err.status ?? 500).json({ error: err.message ?? "Server error" });
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`yt-dlp API listening on :${port}`);
});
