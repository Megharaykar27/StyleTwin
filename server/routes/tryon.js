// POST   /api/tryon          create a try-on (person photo + garment)
// GET    /api/tryon          my lookbook
// PATCH  /api/tryon/:id      favourite / unfavourite
// DELETE /api/tryon/:id
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { nanoid } from "nanoid";
import { all, one, run } from "../lib/db.js";
import { HttpError, auth, upload, wrap } from "../lib/http.js";
import { deleteImage, publicUrl, readImage, saveImage } from "../lib/storage.js";
import { tryOn } from "../ai/index.js";
import { createGarment, toGarment } from "./wardrobe.js";

const router = Router();
router.use(auth);

// Each AI image costs quota, so limit per user
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 30,
  keyGenerator: (req) => req.user.id,
  message: { message: "You've made a lot of try-ons this hour. Please wait a bit." },
});

const toLook = (t) => ({ ...t, person: publicUrl(t.person), garment: publicUrl(t.garment), result: publicUrl(t.result), favorite: !!t.favorite });

router.post("/", limiter, upload.fields([{ name: "person", maxCount: 1 }, { name: "garment", maxCount: 1 }]), wrap(async (req, res) => {
  const started = Date.now();
  const uid = req.user.id;
  const b = req.body || {};

  // Person: a new photo, or reuse the photo from an earlier look
  let personRel, personBuf;
  if (req.files?.person?.[0]) {
    ({ rel: personRel, buffer: personBuf } = await saveImage(req.files.person[0].buffer, uid, { maxSize: 1024 }));
  } else if (b.personFrom) {
    const prev = one("SELECT person FROM tryons WHERE id = ? AND user_id = ?", b.personFrom, uid);
    if (!prev) throw new HttpError(400, "Previous photo not found. Please upload a photo.");
    personRel = prev.person;
    personBuf = await readImage(prev.person);
  } else throw new HttpError(400, "Please add a photo of yourself.");

  // Garment: from the wardrobe, or a new upload (optionally saved to wardrobe)
  let garment;
  if (b.garmentId) {
    garment = one("SELECT * FROM garments WHERE id = ? AND user_id = ?", b.garmentId, uid);
    if (!garment) throw new HttpError(404, "Clothing item not found.");
  } else if (req.files?.garment?.[0]) {
    ({ row: garment } = await createGarment(uid, req.files.garment[0].buffer, {
      category: b.category,
      inWardrobe: b.saveToWardrobe === "true",
    }));
  } else throw new HttpError(400, "Please choose a clothing item.");

  const category = b.category || garment.category;
  const { value: image, provider } = await tryOn(personBuf, await readImage(garment.image), { category });
  const { rel: resultRel } = await saveImage(image, uid, { maxSize: 1280 });

  const id = nanoid(12);
  run(
    "INSERT INTO tryons (id, user_id, person, garment_id, garment, result, provider, seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    id, uid, personRel, garment.id, garment.image, resultRel, provider, (Date.now() - started) / 1000
  );
  res.status(201).json({ look: toLook(one("SELECT * FROM tryons WHERE id = ?", id)), garment: toGarment(garment) });
}));

router.get("/", (req, res) => {
  const filter = req.query.favorites === "true" ? "AND favorite = 1" : "";
  res.json(all(`SELECT * FROM tryons WHERE user_id = ? ${filter} ORDER BY created_at DESC LIMIT 200`, req.user.id).map(toLook));
});

router.patch("/:id", wrap(async (req, res) => {
  const t = one("SELECT * FROM tryons WHERE id = ? AND user_id = ?", req.params.id, req.user.id);
  if (!t) throw new HttpError(404, "Look not found.");
  run("UPDATE tryons SET favorite = ? WHERE id = ?", req.body?.favorite ? 1 : 0, t.id);
  res.json(toLook(one("SELECT * FROM tryons WHERE id = ?", t.id)));
}));

router.delete("/:id", wrap(async (req, res) => {
  const t = one("SELECT * FROM tryons WHERE id = ? AND user_id = ?", req.params.id, req.user.id);
  if (!t) throw new HttpError(404, "Look not found.");
  run("DELETE FROM tryons WHERE id = ?", t.id);
  await deleteImage(t.result);
  // delete the person photo only if no other look uses it
  if (!one("SELECT 1 FROM tryons WHERE person = ?", t.person) && !one("SELECT 1 FROM style_profiles WHERE photo = ?", t.person)) await deleteImage(t.person);
  res.json({ message: "Look deleted" });
}));

export default router;
