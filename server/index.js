// StyleTwin API — AI virtual try-on, smart wardrobe and outfit planner
import "dotenv/config"; // must be first: AI provider reads the key on import
import express from "express";
import cors from "cors";
import helmet from "helmet";
import crypto from "node:crypto";
import { UPLOAD_DIR } from "./lib/storage.js";
import { mode } from "./ai/index.js";
import authRoutes from "./routes/auth.js";
import wardrobeRoutes from "./routes/wardrobe.js";
import tryonRoutes from "./routes/tryon.js";
import styleRoutes from "./routes/style.js";

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
  console.warn("JWT_SECRET not set in .env, so logins reset when the server restarts.");
}

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // lets the React app show uploaded images
app.use(cors({ origin: (process.env.CLIENT_URL || "http://localhost:5173").split(",") }));
app.use(express.json({ limit: "100kb" }));
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d", fallthrough: false }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/config", (_req, res) => res.json({ aiMode: mode }));
app.use("/api/auth", authRoutes);
app.use("/api/wardrobe", wardrobeRoutes);
app.use("/api/tryon", tryonRoutes);
app.use("/api/style", styleRoutes);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.originalUrl}` }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message;
  if (err.code === "LIMIT_FILE_SIZE") { status = 400; message = "That image is too big (max 10 MB)."; }
  if (/unsupported image format|Input buffer/i.test(message)) { status = 400; message = "We couldn't read that image. Try a JPG or PNG."; }
  if (status >= 500) { console.error(err); message = "Something went wrong. Please try again."; }
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`StyleTwin API on http://localhost:${PORT} (AI mode: ${mode})`));
