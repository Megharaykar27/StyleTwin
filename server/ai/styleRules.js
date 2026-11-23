// Classic styling rules (from fashion stylists' guidelines), used to
// enrich the AI answer and as the offline fallback.

export const BODY_SHAPES = ["hourglass", "pear", "apple", "rectangle", "inverted triangle"];

const CUTS = {
  hourglass: { flatter: ["Wrap dresses and tops", "High-waisted trousers", "Belted jackets", "Pencil skirts"], avoid: ["Boxy, shapeless tops", "Dropped waists"] },
  pear: { flatter: ["Boat and square necklines", "A-line skirts", "Structured shoulders", "Dark, straight or bootcut bottoms"], avoid: ["Very skinny bottoms with tiny tops", "Heavy details at the hips"] },
  apple: { flatter: ["V-necks", "Empire-waist dresses", "Flowy tunics", "Straight-leg trousers"], avoid: ["Tight belts at the middle", "Clingy fabrics at the waist"] },
  rectangle: { flatter: ["Peplum tops", "Belted dresses", "Layered outfits", "Ruffles or volume at bust and hips"], avoid: ["Very straight, column shapes head to toe"] },
  "inverted triangle": { flatter: ["V-necks and scoop necks", "Wide-leg trousers", "Full or pleated skirts", "Darker tops, brighter bottoms"], avoid: ["Puff sleeves", "Wide boat necks", "Shoulder pads"] },
};

const PALETTES = {
  warm: {
    season: "Autumn / Spring", note: "Gold jewellery usually looks best on you, and earthy colours make your skin glow.",
    best: [["camel", "#b8865b"], ["olive", "#6b6b2e"], ["rust", "#a8482a"], ["mustard", "#c9a227"], ["cream", "#f1e6cf"], ["teal", "#1f7a7a"]],
    avoid: [["icy grey", "#c9d1d9"], ["neon pink", "#ff2fa0"]],
  },
  cool: {
    season: "Winter / Summer", note: "Silver jewellery usually suits you, and jewel tones look sharp.",
    best: [["navy", "#1f2a52"], ["emerald", "#0f7a55"], ["lavender", "#b9a7e8"], ["raspberry", "#c2185b"], ["pure white", "#ffffff"], ["sky blue", "#8ec5ea"]],
    avoid: [["orange", "#e8782a"], ["mustard", "#c9a227"]],
  },
  neutral: {
    season: "Soft / Neutral", note: "Both gold and silver work on you, so you can wear most colours. Soft, muted shades are your best.",
    best: [["dusty rose", "#d4a5a5"], ["sage", "#9caf88"], ["soft white", "#f4f1ea"], ["jade", "#3e9b84"], ["taupe", "#8b7d6b"], ["denim blue", "#4a6a95"]],
    avoid: [["neon yellow", "#e9ff3b"]],
  },
};

export const cutsFor = (shape) => CUTS[shape] || CUTS.rectangle;
export const paletteFor = (undertone) => {
  const p = PALETTES[undertone] || PALETTES.neutral;
  const map = (list) => list.map(([name, hex]) => ({ name, hex }));
  return { ...p, best: map(p.best), avoid: map(p.avoid) };
};
