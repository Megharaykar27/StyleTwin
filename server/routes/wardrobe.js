// GET    /api/wardrobe            my clothes (+ stats and gaps)
// POST   /api/wardrobe            upload 1–10 photos, AI tags each one
// PATCH  /api/wardrobe/:id        edit tags
// DELETE /api/wardrobe/:id
import { Router } from "express";
import { nanoid } from "nanoid";
import { all, one, run } from "../lib/db.js";
import { HttpError, auth, upload, wrap } from "../lib/http.js";
import { deleteImage, publicUrl, saveImage } from "../lib/storage.js";
import { tagGarment } from "../ai/index.js";
import { wardrobeGaps } from "../lib/outfits.js";
import { SAMPLE_CLOTHES } from "../samples/catalog.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "samples", "clothes");

const router = Router();
router.use(auth);

export const CATEGORIES = ["top", "bottom", "dress", "outerwear", "shoes", "accessory"];

export const toGarment = (g) => ({ ...g, seasons: JSON.parse(g.seasons), image: publicUrl(g.image) });

export async function createGarment(userId, buffer, { category, inWardrobe = true } = {}) {
  const saved = await saveImage(buffer, userId, { maxSize: 900, background: "#ffffff" });
  const { value: t, provider } = await tagGarment(saved.buffer, { category: CATEGORIES.includes(category) ? category : undefined });
  const id = nanoid(12);
  run(
    `INSERT INTO garments (id, user_id, image, name, category, color, color_hex, pattern, style, formality, seasons, in_wardrobe, tagged_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, userId, saved.rel, t.name, t.category, t.color, t.color_hex, t.pattern, t.style, t.formality, JSON.stringify(t.seasons), inWardrobe ? 1 : 0, provider
  );
  return { row: one("SELECT * FROM garments WHERE id = ?", id), buffer: saved.buffer };
}

router.get("/", (req, res) => {
  const items = all("SELECT * FROM garments WHERE user_id = ? AND in_wardrobe = 1 ORDER BY created_at DESC", req.user.id).map(toGarment);
  const count = (c) => items.filter((g) => g.category === c).length;
  res.json({
    items,
    stats: { total: items.length, ...Object.fromEntries(CATEGORIES.map((c) => [c, count(c)])) },
    gaps: wardrobeGaps(items),
  });
});

// One click: add the sample closet (real product photos, hand-checked tags)
router.post("/samples", wrap(async (req, res) => {
  const have = new Set(all("SELECT name FROM garments WHERE user_id = ? AND tagged_by = 'sample'", req.user.id).map((g) => g.name));
  const created = [];
  for (const s of SAMPLE_CLOTHES) {
    if (have.has(s.name)) continue;
    const saved = await saveImage(await fs.readFile(path.join(SAMPLE_DIR, s.file)), req.user.id, { maxSize: 900, background: "#ffffff" });
    const id = nanoid(12);
    run(
      `INSERT INTO garments (id, user_id, image, name, category, color, color_hex, pattern, style, formality, seasons, in_wardrobe, tagged_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'sample')`,
      id, req.user.id, saved.rel, s.name, s.category, s.color, s.color_hex, s.pattern, s.style, s.formality, JSON.stringify(s.seasons)
    );
    created.push(toGarment(one("SELECT * FROM garments WHERE id = ?", id)));
  }
  res.status(201).json({ items: created, message: created.length ? `${created.length} sample pieces added` : "The sample closet is already in your wardrobe" });
}));

router.post("/", upload.array("images", 10), wrap(async (req, res) => {
  if (!req.files?.length) throw new HttpError(400, "Please choose at least one photo.");
  const created = [];
  for (const f of req.files) created.push(toGarment((await createGarment(req.user.id, f.buffer, { category: req.body?.category })).row));
  res.status(201).json({ items: created, message: `${created.length} item${created.length > 1 ? "s" : ""} added and tagged` });
}));

router.patch("/:id", wrap(async (req, res) => {
  const g = one("SELECT * FROM garments WHERE id = ? AND user_id = ?", req.params.id, req.user.id);
  if (!g) throw new HttpError(404, "Item not found.");
  const b = req.body || {};
  const next = {
    name: b.name !== undefined ? String(b.name).slice(0, 60) : g.name,
    category: CATEGORIES.includes(b.category) ? b.category : g.category,
    pattern: b.pattern || g.pattern,
    style: b.style || g.style,
    formality: b.formality ? Math.min(5, Math.max(1, Number(b.formality))) : g.formality,
    seasons: Array.isArray(b.seasons) ? JSON.stringify(b.seasons) : g.seasons,
    in_wardrobe: b.in_wardrobe !== undefined ? (b.in_wardrobe ? 1 : 0) : g.in_wardrobe,
  };
  run(
    "UPDATE garments SET name=?, category=?, pattern=?, style=?, formality=?, seasons=?, in_wardrobe=?, tagged_by='user' WHERE id=?",
    next.name, next.category, next.pattern, next.style, next.formality, next.seasons, next.in_wardrobe, g.id
  );
  res.json(toGarment(one("SELECT * FROM garments WHERE id = ?", g.id)));
}));

router.delete("/:id", wrap(async (req, res) => {
  const g = one("SELECT * FROM garments WHERE id = ? AND user_id = ?", req.params.id, req.user.id);
  if (!g) throw new HttpError(404, "Item not found.");
  const usedInTryon = one("SELECT 1 FROM tryons WHERE garment = ?", g.image);
  run("DELETE FROM garments WHERE id = ?", g.id);
  if (!usedInTryon) await deleteImage(g.image); // keep the image if a saved look still shows it
  res.json({ message: "Removed from wardrobe" });
}));

export default router;
