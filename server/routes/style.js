// GET  /api/style           my style profile
// POST /api/style           analyse (optional photo + answers)
// POST /api/style/outfits   plan outfits from my wardrobe for an occasion + weather
import { Router } from "express";
import { all, one, run } from "../lib/db.js";
import { HttpError, auth, upload, wrap } from "../lib/http.js";
import { publicUrl, saveImage } from "../lib/storage.js";
import { analyzeStyle, outfitNotes } from "../ai/index.js";
import { OCCASIONS, WEATHER, planOutfits } from "../lib/outfits.js";
import { BODY_SHAPES } from "../ai/styleRules.js";
import { toGarment } from "./wardrobe.js";

const router = Router();
router.use(auth);

const toProfile = (p) => (p ? { ...JSON.parse(p.data), photo: publicUrl(p.photo), updated_at: p.updated_at } : null);

router.get("/", (req, res) => {
  res.json({ profile: toProfile(one("SELECT * FROM style_profiles WHERE user_id = ?", req.user.id)), options: { bodyShapes: BODY_SHAPES, occasions: OCCASIONS, weather: WEATHER } });
});

router.post("/", upload.single("photo"), wrap(async (req, res) => {
  const b = req.body || {};
  const answers = {};
  if (BODY_SHAPES.includes(b.bodyShape)) answers.bodyShape = b.bodyShape;
  if (["warm", "cool", "neutral"].includes(b.undertone)) answers.undertone = b.undertone;
  if (b.styleGoal) answers.styleGoal = String(b.styleGoal).slice(0, 60);
  if (b.height) answers.heightCm = Math.min(220, Math.max(100, Number(b.height) || 0)) || undefined;

  let photoRel = one("SELECT photo FROM style_profiles WHERE user_id = ?", req.user.id)?.photo || null;
  let photoBuf = null;
  if (req.file) ({ rel: photoRel, buffer: photoBuf } = await saveImage(req.file.buffer, req.user.id, { maxSize: 1024 }));
  if (!photoBuf && !answers.bodyShape) throw new HttpError(400, "Add a full-length photo, or choose your body shape.");

  const { value: profile, provider } = await analyzeStyle(photoBuf, answers);
  profile.provider = provider;
  run(
    `INSERT INTO style_profiles (user_id, photo, data, updated_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET photo = excluded.photo, data = excluded.data, updated_at = excluded.updated_at`,
    req.user.id, photoRel, JSON.stringify(profile)
  );
  res.json({ profile: toProfile(one("SELECT * FROM style_profiles WHERE user_id = ?", req.user.id)) });
}));

router.post("/outfits", wrap(async (req, res) => {
  const b = req.body || {};
  const occasion = OCCASIONS[b.occasion] ? b.occasion : "everyday";
  const weather = WEATHER[b.weather] ? b.weather : "mild";
  const wardrobe = all("SELECT * FROM garments WHERE user_id = ? AND in_wardrobe = 1", req.user.id).map(toGarment);
  const hasBase = wardrobe.some((g) => g.category === "dress") || (wardrobe.some((g) => g.category === "top") && wardrobe.some((g) => g.category === "bottom"));
  if (!hasBase) throw new HttpError(400, "Add at least one top and one bottom (or a dress) to your wardrobe first.");

  const plan = planOutfits(wardrobe, occasion, weather, 3);
  const { value: notes, provider } = await outfitNotes(plan.outfits, OCCASIONS[occasion].label.toLowerCase());
  plan.outfits.forEach((o, i) => (o.note = notes[i] || ""));
  res.json({ ...plan, occasion, weather, provider });
}));

export default router;
