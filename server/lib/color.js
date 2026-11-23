// Colour helpers: find a garment's main colour, name it, and judge
// which colours look good together (used by the outfit planner).
import sharp from "sharp";

export const PALETTE = [
  ["black", "#111111"], ["charcoal", "#36454f"], ["grey", "#8e8e8e"], ["white", "#f5f5f2"], ["cream", "#f1e6cf"],
  ["beige", "#d9c3a0"], ["camel", "#b8865b"], ["brown", "#6b4428"], ["navy", "#1f2a52"], ["denim blue", "#4a6a95"],
  ["sky blue", "#8ec5ea"], ["teal", "#1f7a7a"], ["olive", "#6b6b2e"], ["green", "#2f8a4c"], ["mint", "#a8e6c4"],
  ["yellow", "#f2cf3a"], ["mustard", "#c9a227"], ["orange", "#e8782a"], ["rust", "#a8482a"], ["red", "#c62828"],
  ["maroon", "#6d1a2a"], ["pink", "#f2a3bf"], ["hot pink", "#e0337d"], ["lilac", "#c7b2e6"], ["purple", "#6a3d9a"],
  ["lavender", "#b9a7e8"], ["gold", "#c8a24a"], ["silver", "#c0c4c8"],
];
export const NEUTRALS = new Set(["black", "charcoal", "grey", "white", "cream", "beige", "camel", "brown", "navy", "denim blue", "silver", "gold"]);

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

export function nearestName(rgb) {
  let best = PALETTE[0], d = Infinity;
  for (const p of PALETTE) {
    const [r, g, b] = hexToRgb(p[1]);
    // weighted distance: human eyes are most sensitive to green
    const dist = 2 * (r - rgb[0]) ** 2 + 4 * (g - rgb[1]) ** 2 + 3 * (b - rgb[2]) ** 2;
    if (dist < d) { d = dist; best = p; }
  }
  return best[0];
}

// Main colour of a garment photo: shrink the image, ignore the
// near-white / near-uniform background, then average the rest.
export async function dominantColor(buffer) {
  const { data, info } = await sharp(buffer).resize(64, 64, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let i = 0; i < data.length; i += 3) px.push([data[i], data[i + 1], data[i + 2]]);
  // background = colour of the corners
  const corner = [0, info.width - 1, (info.height - 1) * info.width, info.height * info.width - 1].map((i) => px[i]);
  const bg = corner.reduce((a, c) => a.map((v, k) => v + c[k] / 4), [0, 0, 0]);
  const fg = px.filter((p) => Math.hypot(p[0] - bg[0], p[1] - bg[1], p[2] - bg[2]) > 40);
  const use = fg.length > px.length * 0.08 ? fg : px;
  // bucket into coarse colours and take the most common bucket
  const buckets = new Map();
  for (const p of use) {
    const key = p.map((v) => v >> 5).join(",");
    const b = buckets.get(key) || { n: 0, sum: [0, 0, 0] };
    b.n++; b.sum = b.sum.map((v, k) => v + p[k]);
    buckets.set(key, b);
  }
  const top = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  const rgb = top.sum.map((v) => v / top.n);
  return { name: nearestName(rgb), hex: toHex(rgb) };
}

function hue(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return { h: 0, s: 0 };
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s: d / (1 - Math.abs(max + min - 1)) };
}

// 0..1 score for how well two garment colours go together
export function harmony(a, b) {
  const an = NEUTRALS.has(a.color), bn = NEUTRALS.has(b.color);
  if (an && bn) return a.color === b.color ? 0.75 : 0.9; // neutrals always work
  if (an || bn) return 0.95;                              // one colour + one neutral: classic
  const d = Math.abs(hue(a.color_hex).h - hue(b.color_hex).h);
  const diff = Math.min(d, 360 - d);
  if (diff < 25) return 0.8;               // tonal / monochrome
  if (diff > 150) return 0.7;              // complementary: bold
  if (diff > 100) return 0.55;             // triadic-ish
  return 0.35;                             // clashing middle
}
