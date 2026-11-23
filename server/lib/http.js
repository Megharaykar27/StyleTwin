// Shared HTTP helpers: errors, async routes, JWT auth, image uploads.
import jwt from "jsonwebtoken";
import multer from "multer";
import { one } from "./db.js";

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Lets async route handlers throw; errors go to the error middleware
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const signToken = (user) => jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const auth = wrap(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw new HttpError(401, "Please log in first.");
  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, "Your session has expired. Please log in again.");
  }
  const user = one("SELECT id, name, email FROM users WHERE id = ?", payload.sub);
  if (!user) throw new HttpError(401, "Account not found.");
  req.user = user;
  next();
});

// Images are kept in memory, then cleaned and saved by storage.js
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) =>
    /^image\/(jpeg|png|webp|heic|heif|avif)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new HttpError(400, "Please upload a JPG, PNG or WEBP image.")),
});
