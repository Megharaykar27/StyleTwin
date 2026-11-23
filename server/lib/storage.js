// Saves uploaded photos. Every image is cleaned with sharp:
// rotated the right way up (phone EXIF), resized, re-encoded as JPEG.
// Re-encoding also strips hidden metadata such as GPS location.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { nanoid } from "nanoid";

const here = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(here, "..", "uploads");

export async function saveImage(buffer, userId, { maxSize = 1024, background } = {}) {
  let img = sharp(buffer, { failOn: "error" }).rotate().resize(maxSize, maxSize, { fit: "inside", withoutEnlargement: true });
  if (background) img = img.flatten({ background });
  const out = await img.jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  const rel = `${userId}/${nanoid(21)}.jpg`; // long random name, impossible to guess
  await fs.mkdir(path.join(UPLOAD_DIR, userId), { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, rel), out);
  return { rel, buffer: out };
}

export const readImage = (rel) => fs.readFile(path.join(UPLOAD_DIR, rel));

export async function deleteImage(rel) {
  if (!rel) return;
  await fs.rm(path.join(UPLOAD_DIR, rel), { force: true });
}

export const publicUrl = (rel) => (rel ? `/uploads/${rel}` : null);
