// Picks the AI provider. Text and vision (tagging, style, notes): Gemini when a
// key is set, otherwise demo mode, with a demo fallback if a call fails.
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

// Try-on chain: Gemini image (needs a key with billing) -> free IDM-VTON on
// Hugging Face (tops and layers) -> labelled demo preview. `note` tells the user
// why a step was skipped, so a fallback is never silent.
export const freeTryOn = process.env.FREE_TRYON !== "off";

export async function tryOn(person, garment, opts = {}) {
  const notes = [];
  if (gemini && process.env.GEMINI_TRYON !== "off") {
    try {
      return { value: await gemini.tryOn(person, garment, opts), provider: "gemini" };
    } catch (err) {
      if (err.status === 422) throw err;
      console.warn("Gemini try-on failed:", err.message);
      notes.push(/quota|429|RESOURCE_EXHAUSTED|billing/i.test(err.message)
        ? "Gemini image try-on needs billing on your key"
        : "Gemini was busy");
    }
  }
  if (freeTryOn) {
    const hf = await import("./huggingface.js");
    if (hf.SUPPORTED.has(opts.category)) {
      try {
        return { value: await hf.tryOn(person, garment, opts), provider: "idm-vton", note: notes[0] && `${notes[0]}, so the free model was used.` };
      } catch (err) {
        console.warn("Free try-on failed:", err.message);
        notes.push(/quota|exceeded|GPU/i.test(err.message)
          ? "The free try-on model's daily limit is used up (add a free HF_TOKEN for more)"
          : "The free try-on model is busy or offline");
      }
    } else {
      notes.push("The free try-on model only does tops and jackets");
    }
  }
  return {
    value: await demo.tryOn(person, garment, opts),
    provider: "demo",
    note: notes.length ? `${notes.join(". ")}. Showing a preview instead.` : undefined,
  };
}
