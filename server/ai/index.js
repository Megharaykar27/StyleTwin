// Picks the AI provider: Gemini when a key is set, otherwise demo mode.
// If a Gemini text call fails (quota, network), we fall back to the demo
// provider so the app keeps working. Try-on errors are shown to the user.
import * as demo from "./demo.js";

let gemini = null;
if (process.env.GEMINI_API_KEY) gemini = await import("./gemini.js");

export const mode = gemini ? "gemini" : "demo";

async function withFallback(fn, args) {
  if (!gemini) return { value: await demo[fn](...args), provider: "demo" };
  try {
    return { value: await gemini[fn](...args), provider: "gemini" };
  } catch (err) {
    console.warn(`Gemini ${fn} failed, using fallback:`, err.message);
    return { value: await demo[fn](...args), provider: "demo" };
  }
}

export const tagGarment = (buf, hint) => withFallback("tagGarment", [buf, hint]);
export const analyzeStyle = (buf, answers) => withFallback("analyzeStyle", [buf, answers]);
export const outfitNotes = (outfits, occasion) => withFallback("outfitNotes", [outfits, occasion]);

export async function tryOn(person, garment, opts) {
  if (!gemini) return { value: await demo.tryOn(person, garment, opts), provider: "demo" };
  try {
    return { value: await gemini.tryOn(person, garment, opts), provider: "gemini" };
  } catch (err) {
    if (err.status === 422) throw err;
    console.warn("Gemini try-on failed:", err.message);
    const e = new Error(/quota|429|RESOURCE_EXHAUSTED/i.test(err.message)
      ? "The free AI limit for today is used up. Please try again later."
      : "The AI service is busy. Please try again in a moment.");
    e.status = 503;
    throw e;
  }
}
