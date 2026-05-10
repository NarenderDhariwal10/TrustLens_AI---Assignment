import "dotenv/config";
import express from "express";
import cors from "cors";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import { connectDb } from "./config/db.js";

const app = express();
const PORT = Number(process.env.PORT) || 5001;

const clientOrigin =
  process.env.CLIENT_ORIGIN ||
  (process.env.NODE_ENV === "production" ? true : "http://localhost:5173");

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "TruthLens AI",
    version: "1.0.0",
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
    hasTavily: Boolean(process.env.TAVILY_API_KEY),
  });
});

app.use("/api", analyzeRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = Number(err.status) >= 400 ? Number(err.status) : 500;
  res.status(status).json({
    error: err.message || "Internal server error",
    code: err.code,
  });
});

await connectDb();

const server = app.listen(PORT, () => {
  console.log(`TruthLens API listening on ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nPort ${PORT} is already in use (another Node server, PostgreSQL on :5000, etc.).\n` +
        `Fix:\n` +
        `  1. In server/.env set: PORT=5001\n` +
        `  2. In client/.env.development set: VITE_DEV_API_TARGET=http://localhost:5001\n` +
        `Then restart both server and client.\n`
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
