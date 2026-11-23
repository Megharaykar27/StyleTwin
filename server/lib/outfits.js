// Outfit planner: builds every possible outfit from the wardrobe and
// scores it on 4 things: right formality for the occasion, colours that
// go together, right for the weather, and not too many patterns.
import { harmony, NEUTRALS } from "./color.js";

export const OCCASIONS = {
  college: { label: "College", formality: 1.6 },
  everyday: { label: "Everyday", formality: 2 },
  office: { label: "Office", formality: 3.6 },
  date: { label: "Date night", formality: 3 },
  party: { label: "Party", formality: 3.6 },
  festive: { label: "Wedding / festive", formality: 4.5 },
  interview: { label: "Interview", formality: 4.2 },
};
export const WEATHER = {
  hot: { label: "Hot", seasons: ["summer", "all"], needsLayer: false },
  mild: { label: "Mild", seasons: ["spring", "autumn", "all", "summer"], needsLayer: false },
  cold: { label: "Cold", seasons: ["winter", "autumn", "all"], needsLayer: true },
  rainy: { label: "Rainy", seasons: ["monsoon", "autumn", "all", "spring"], needsLayer: true },
};

const seasonsOf = (g) => (Array.isArray(g.seasons) ? g.seasons : JSON.parse(g.seasons || '["all"]'));
const fitsWeather = (g, w) => seasonsOf(g).some((s) => WEATHER[w].seasons.includes(s));

function pairHarmony(items) {
  let total = 0, n = 0;
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) { total += harmony(items[i], items[j]); n++; }
  return n ? total / n : 1;
}

function score(items, occasion, weather) {
  const target = OCCASIONS[occasion].formality;
  const main = items.filter((g) => ["top", "bottom", "dress"].includes(g.category));
  const avgF = main.reduce((s, g) => s + g.formality, 0) / main.length;
  const formality = 1 - Math.min(1, Math.abs(avgF - target) / 3);
  const colour = pairHarmony(items.filter((g) => g.category !== "accessory"));
  const weatherFit = items.filter((g) => fitsWeather(g, weather)).length / items.length;
  const patterned = items.filter((g) => g.pattern !== "solid").length;
  const patternFit = patterned <= 1 ? 1 : patterned === 2 ? 0.6 : 0.3;
  const total = 0.38 * formality + 0.32 * colour + 0.18 * weatherFit + 0.12 * patternFit;
  return { total, parts: { formality, colour, weather: weatherFit, pattern: patternFit } };
}

const best = (list, base, occasion, weather) =>
  list.map((g) => ({ g, s: score([...base, g], occasion, weather).total })).sort((a, b) => b.s - a.s)[0]?.g;

export function planOutfits(wardrobe, occasion = "everyday", weather = "mild", limit = 3) {
  const by = (c) => wardrobe.filter((g) => g.category === c);
  const tops = by("top"), bottoms = by("bottom"), dresses = by("dress");
  const shoes = by("shoes"), layers = by("outerwear"), accessories = by("accessory");

  // 1. every base: top + bottom, or a dress on its own
  const bases = [...dresses.map((d) => [d])];
  for (const t of tops) for (const b of bottoms) bases.push([t, b]);

  // 2. complete each base with the best shoes / layer / accessory
  const outfits = bases.map((base) => {
    const items = [...base];
    const s = best(shoes, items, occasion, weather); if (s) items.push(s);
    if (WEATHER[weather].needsLayer) { const l = best(layers, items, occasion, weather); if (l) items.push(l); }
    const a = best(accessories, items, occasion, weather);
    if (a && score([...items, a], occasion, weather).total >= score(items, occasion, weather).total) items.push(a);
    const sc = score(items, occasion, weather);
    return { items, score: Math.round(sc.total * 100), parts: sc.parts };
  });

  // 3. top results, but avoid showing the same main piece twice
  outfits.sort((a, b) => b.score - a.score);
  const picked = [], used = new Set();
  for (const o of outfits) {
    const key = o.items[0].id;
    if (used.has(key) && outfits.length > limit * 2) continue;
    picked.push(o); used.add(key);
    if (picked.length === limit) break;
  }
  return { outfits: picked, possible: outfits.filter((o) => o.score >= 65).length, combinations: outfits.length };
}

// Wardrobe health: what's missing to make more outfits
export function wardrobeGaps(wardrobe) {
  const by = (c) => wardrobe.filter((g) => g.category === c);
  const gaps = [];
  const neutralBottoms = by("bottom").filter((g) => NEUTRALS.has(g.color));
  if (by("top").length && !by("bottom").length) gaps.push({ piece: "A pair of trousers or jeans", why: "Your tops have nothing to pair with yet." });
  else if (by("bottom").length && !neutralBottoms.length) gaps.push({ piece: "Neutral bottoms (black, beige or denim)", why: "They match almost every top you own." });
  if (!by("shoes").length) gaps.push({ piece: "One versatile pair of shoes", why: "White sneakers or nude flats finish most outfits." });
  if (!by("outerwear").length) gaps.push({ piece: "A light layer (denim jacket or blazer)", why: "Needed for cold, rainy or office days." });
  if (![...by("top"), ...by("dress")].some((g) => g.formality >= 4)) gaps.push({ piece: "One formal piece", why: "For interviews, weddings and formal events." });
  return gaps;
}
