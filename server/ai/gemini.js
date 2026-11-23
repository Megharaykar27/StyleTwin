// Gemini provider. A free key from https://aistudio.google.com powers garment
// tagging (and cropping on-model photos), style analysis and stylist notes.
// The try-on image model needs billing on the key.
import { GoogleGenAI } from "@google/genai";
import { dominantColor, PALETTE } from "../lib/color.js";
import { BODY_SHAPES, cutsFor, paletteFor } from "./styleRules.js";

export const name = "gemini";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const TEXT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

const img = (buffer) => ({ inlineData: { mimeType: "image/jpeg", data: buffer.toString("base64") } });

async function askJson(parts) {
  const res = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ role: "user", parts }],
    config: { responseMimeType: "application/json", temperature: 0.4 },
  });
  return JSON.parse(res.text);
}

const validBox = (b) =>
  Array.isArray(b) && b.length === 4 && b.every((v) => Number.isFinite(Number(v))) &&
  b[2] - b[0] > 80 && b[3] - b[1] > 80; // ignore tiny or broken boxes

const clampList = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);

// ------------------------------------------------------------- tagging
export async function tagGarment(buffer, hint = {}) {
  const color = await dominantColor(buffer); // exact colour value from pixels
  const data = await askJson([
    img(buffer),
    { text: `You are a fashion cataloguer. Describe this single clothing item as JSON:
{"name": short product-style name (max 5 words),
 "category": one of top|bottom|dress|outerwear|shoes|accessory,
 "color": main colour, one of: ${PALETTE.map((p) => p[0]).join(", ")},
 "pattern": one of solid|striped|checked|floral|printed|embroidered|textured,
 "style": one of casual|smart|formal|ethnic|sporty|party|boho,
 "formality": 1 (very relaxed) to 5 (very formal),
 "seasons": array from summer|winter|monsoon|spring|autumn|all,
 "worn_by_person": true if a person (or a body part like a torso) is visible in the photo, else false,
 "box_2d": [ymin, xmin, ymax, xmax] of the main clothing item only, each 0-1000}
${hint.category ? `The user says it is a ${hint.category}.` : ""} If several items are visible, describe and box the ${hint.category || "most prominent"} one. Only JSON.` },
  ]);
  return {
    name: String(data.name || `${color.name} item`).slice(0, 60),
    category: clampList(hint.category || data.category, ["top", "bottom", "dress", "outerwear", "shoes", "accessory"], "top"),
    color: PALETTE.some((p) => p[0] === data.color) ? data.color : color.name,
    color_hex: color.hex,
    pattern: clampList(data.pattern, ["solid", "striped", "checked", "floral", "printed", "embroidered", "textured"], "solid"),
    style: clampList(data.style, ["casual", "smart", "formal", "ethnic", "sporty", "party", "boho"], "casual"),
    formality: Math.min(5, Math.max(1, Math.round(Number(data.formality) || 2))),
    seasons: Array.isArray(data.seasons) && data.seasons.length ? data.seasons.slice(0, 5) : ["all"],
    // photo shows someone wearing it: tell the caller where the garment is so it can crop
    crop: data.worn_by_person && validBox(data.box_2d) ? data.box_2d.map(Number) : null,
  };
}

// ------------------------------------------------------------- try-on
export async function tryOn(personBuf, garmentBuf, { category = "top" } = {}) {
  const res = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{
      role: "user",
      parts: [
        img(personBuf),
        img(garmentBuf),
        { text: `Virtual try-on. Image 1 is a person. Image 2 is a clothing item (${category}).
Create a photorealistic photo of the SAME person from image 1 wearing the clothing item from image 2.
Keep exactly the same face, hair, skin tone, body shape, pose, camera angle and background as image 1.
Replace only the ${category === "dress" ? "outfit" : category === "bottom" ? "lower-body clothing" : category === "shoes" ? "shoes" : "upper-body clothing"} with the item from image 2, matching its colour, pattern, texture and details exactly.
The fabric should drape and fold naturally with realistic lighting and shadows. No text, no watermark, no extra people.` },
      ],
    }],
    config: { responseModalities: ["IMAGE", "TEXT"] },
  });
  const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) {
    const err = new Error("The AI couldn't create this try-on. Try a clearer, front-facing photo.");
    err.status = 422;
    throw err;
  }
  return Buffer.from(part.inlineData.data, "base64");
}

// ------------------------------------------------------- style profile
export async function analyzeStyle(photo, answers = {}) {
  const data = await askJson([
    ...(photo ? [img(photo)] : []),
    { text: `You are a kind, body-positive personal stylist. ${photo ? "Look at this full-body photo." : ""}
Extra info from the user: ${JSON.stringify(answers)}.
Never comment on weight or say anything negative about the body. Focus on what flatters.
Return JSON:
{"body_shape": {"type": one of ${BODY_SHAPES.join("|")}, "note": one friendly sentence},
 "undertone": {"type": warm|cool|neutral, "note": one sentence explaining the sign you used},
 "color_season": e.g. "Warm Autumn",
 "signature_style": 3-6 words,
 "tips": 4 short, specific styling tips}
If the user gave a body shape or undertone, use theirs.` },
  ]);
  const shape = clampList(answers.bodyShape || data.body_shape?.type, BODY_SHAPES, "rectangle");
  const undertone = clampList(answers.undertone || data.undertone?.type, ["warm", "cool", "neutral"], "neutral");
  const pal = paletteFor(undertone);
  const cuts = cutsFor(shape);
  return {
    body_shape: { type: shape, note: data.body_shape?.note || "" },
    undertone: { type: undertone, note: data.undertone?.note || pal.note },
    color_season: data.color_season || pal.season,
    best_colors: pal.best,
    avoid_colors: pal.avoid,
    flattering_cuts: cuts.flatter,
    avoid_cuts: cuts.avoid,
    signature_style: data.signature_style || "Modern classic",
    tips: Array.isArray(data.tips) ? data.tips.slice(0, 5) : [],
  };
}

// ---------------------------------------------------- outfit stylist notes
export async function outfitNotes(outfits, occasion) {
  const data = await askJson([{ text: `You are a stylist. For each outfit below, write one short, specific sentence (max 22 words) on why it works for a ${occasion} and one styling touch.
Outfits: ${JSON.stringify(outfits.map((o) => o.items.map((g) => `${g.color} ${g.pattern} ${g.name}`)))}
Return JSON: {"notes": [string, ...]} with one note per outfit, same order.` }]);
  return Array.isArray(data.notes) ? data.notes : [];
}
