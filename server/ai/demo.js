// Demo provider: used when no GEMINI_API_KEY is set, so the whole app
// works without any account. Garment tagging still uses real colour
// analysis; the try-on result is clearly marked as a demo preview.
import sharp from "sharp";
import { dominantColor } from "../lib/color.js";
import { cutsFor, paletteFor } from "./styleRules.js";

export const name = "demo";

export async function tagGarment(buffer, hint = {}) {
  const { width, height } = await sharp(buffer).metadata();
  const color = await dominantColor(buffer);
  const ratio = height / width;
  // A rough guess from the photo's shape; the user can edit everything.
  const category = hint.category || (ratio > 1.5 ? "dress" : ratio > 1.15 ? "bottom" : ratio < 0.8 ? "shoes" : "top");
  return {
    name: `${color.name[0].toUpperCase()}${color.name.slice(1)} ${category}`,
    category, color: color.name, color_hex: color.hex,
    pattern: "solid", style: "casual", formality: 2, seasons: ["all"],
  };
}

export async function tryOn(personBuf, garmentBuf) {
  const person = sharp(personBuf);
  const { width, height } = await person.metadata();
  const cardW = Math.round(width * 0.34);
  const garment = await sharp(garmentBuf).resize(cardW - 24, cardW - 24, { fit: "contain", background: "#ffffff" }).png().toBuffer();
  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>
      <rect x="${width - cardW - 20}" y="${height - cardW - 78}" width="${cardW}" height="${cardW + 58}" rx="18" fill="white" fill-opacity="0.92"/>
      <rect x="0" y="0" width="${width}" height="44" fill="url(#g)"/>
      <text x="${width / 2}" y="29" font-family="Arial" font-size="18" font-weight="700" fill="white" text-anchor="middle">DEMO PREVIEW · add a Gemini key for real AI try-on</text>
      <text x="${width - cardW / 2 - 20}" y="${height - 34}" font-family="Arial" font-size="15" fill="#4c1d95" text-anchor="middle">Selected garment</text>
    </svg>`);
  return person
    .composite([{ input: svg, top: 0, left: 0 }, { input: garment, top: height - cardW - 66, left: width - cardW - 8 }])
    .jpeg({ quality: 88 })
    .toBuffer();
}

export async function analyzeStyle(_photo, answers = {}) {
  const shape = answers.bodyShape || "rectangle";
  const undertone = answers.undertone || "neutral";
  const pal = paletteFor(undertone);
  const cuts = cutsFor(shape);
  return {
    body_shape: { type: shape, note: "Based on the shape you selected. Add a Gemini key to analyse it from your photo." },
    undertone: { type: undertone, note: pal.note },
    color_season: pal.season,
    best_colors: pal.best,
    avoid_colors: pal.avoid,
    flattering_cuts: cuts.flatter,
    avoid_cuts: cuts.avoid,
    signature_style: answers.styleGoal ? `${answers.styleGoal} with a personal twist` : "Relaxed modern classic",
    tips: [
      "Build outfits around 2–3 colours from your palette, plus one neutral.",
      "Tailoring changes everything: hem trousers to just touch your shoes.",
      "Repeat your best colours near your face (tops, scarves, earrings).",
    ],
  };
}

export async function outfitNotes(outfits, occasion) {
  return outfits.map((o) => {
    const neutrals = o.parts.colour > 0.85;
    return neutrals
      ? `A balanced ${occasion} look: the neutral pieces let one colour stand out without clashing.`
      : `A bolder ${occasion} look: contrasting colours, so keep accessories simple.`;
  });
}
