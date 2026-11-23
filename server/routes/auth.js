// POST /api/auth/register · POST /api/auth/login · GET /api/auth/me · DELETE /api/auth/me
import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { nanoid } from "nanoid";
import fs from "node:fs/promises";
import path from "node:path";
import { one, run } from "../lib/db.js";
import { HttpError, auth, signToken, wrap } from "../lib/http.js";
import { UPLOAD_DIR } from "../lib/storage.js";

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, message: { message: "Too many attempts. Try again in a few minutes." } });

router.post("/register", limiter, wrap(async (req, res) => {
  const name = String(req.body.name || "").trim().slice(0, 60);
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Please enter your name and a valid email.");
  if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters.");
  if (one("SELECT 1 FROM users WHERE email = ?", email)) throw new HttpError(400, "This email is already registered.");
  const user = { id: nanoid(12), name, email };
  run("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)", user.id, name, email, await bcrypt.hash(password, 10));
  res.status(201).json({ token: signToken(user), user });
}));

router.post("/login", limiter, wrap(async (req, res) => {
  const row = one("SELECT * FROM users WHERE email = ?", String(req.body.email || "").trim().toLowerCase());
  if (!row || !(await bcrypt.compare(String(req.body.password || ""), row.password_hash)))
    throw new HttpError(400, "Invalid email or password.");
  const user = { id: row.id, name: row.name, email: row.email };
  res.json({ token: signToken(user), user });
}));

router.get("/me", auth, (req, res) => res.json(req.user));

// Delete account and every photo (privacy)
router.delete("/me", auth, wrap(async (req, res) => {
  run("DELETE FROM users WHERE id = ?", req.user.id); // cascades to garments, try-ons, profile
  await fs.rm(path.join(UPLOAD_DIR, req.user.id), { recursive: true, force: true });
  res.json({ message: "Your account and all your photos were deleted." });
}));

export default router;
