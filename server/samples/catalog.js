// Sample closet: real product photos so a new user can try StyleTwin in one click.
// Images come from the example sets of two open-source try-on projects, both
// shared under CC BY-NC-SA 4.0:
//   tops and models: IDM-VTON  https://github.com/yisol/IDM-VTON  (VITON-HD)
//   bottoms, dresses and two tops: OOTDiffusion  https://github.com/levihsu/OOTDiffusion  (Dress Code)
// Tags were checked by hand, so they are exact even without an AI key.
const top = (o) => ({ category: "top", ...o });
export const SAMPLE_CLOTHES = [
  top({ file: "velvet-wrap-top.jpg", name: "Velvet wrap top", color: "navy", color_hex: "#0e2d4f", pattern: "textured", style: "party", formality: 3, seasons: ["autumn", "winter"] }),
  top({ file: "ruffle-button-tank.jpg", name: "Ruffle button tank", color: "white", color_hex: "#f3f3f3", pattern: "solid", style: "casual", formality: 2, seasons: ["summer"] }),
  top({ file: "colour-block-polo.jpg", name: "Colour-block polo", color: "navy", color_hex: "#2a2738", pattern: "solid", style: "smart", formality: 3, seasons: ["spring", "summer"] }),
  top({ file: "rose-henley-top.jpg", name: "Rose henley top", color: "pink", color_hex: "#d49094", pattern: "solid", style: "casual", formality: 2, seasons: ["spring", "autumn"] }),
  top({ file: "red-side-tie-tee.jpg", name: "Red side-tie tee", color: "red", color_hex: "#e91316", pattern: "solid", style: "casual", formality: 1, seasons: ["summer"] }),
  top({ file: "animal-print-shell-top.jpg", name: "Animal-print shell top", color: "grey", color_hex: "#939492", pattern: "printed", style: "smart", formality: 3, seasons: ["spring", "summer"] }),
  top({ file: "chain-print-blouse.jpg", name: "Chain-print blouse", color: "teal", color_hex: "#2e8a9a", pattern: "printed", style: "party", formality: 3, seasons: ["spring", "summer"] }),
  top({ file: "striped-bodysuit.jpg", name: "Striped wrap bodysuit", color: "black", color_hex: "#222222", pattern: "striped", style: "smart", formality: 3, seasons: ["all"] }),
  top({ file: "peach-high-neck-blouse.jpg", name: "Peach high-neck blouse", color: "orange", color_hex: "#e8a07c", pattern: "solid", style: "smart", formality: 4, seasons: ["spring", "summer"] }),
  top({ file: "lace-sleeve-tee.jpg", name: "Lace-sleeve tee", color: "denim blue", color_hex: "#3c51a9", pattern: "solid", style: "casual", formality: 2, seasons: ["spring", "summer"] }),
  top({ file: "black-sweetheart-bodysuit.jpg", name: "Black sweetheart bodysuit", color: "black", color_hex: "#171817", pattern: "solid", style: "party", formality: 3, seasons: ["all"] }),
  top({ file: "black-strappy-crop-top.jpg", name: "Black strappy crop top", color: "black", color_hex: "#282628", pattern: "solid", style: "party", formality: 2, seasons: ["summer"] }),
  top({ file: "pink-tiered-blouse.jpg", name: "Pink tiered blouse", color: "pink", color_hex: "#e3b8dc", pattern: "solid", style: "party", formality: 3, seasons: ["spring", "summer"] }),
  top({ file: "white-corset-blouse.jpg", name: "White corset blouse", color: "white", color_hex: "#f1f3f7", pattern: "solid", style: "smart", formality: 4, seasons: ["all"] }),
  // bottoms
  { file: "ripped-boyfriend-jeans.jpg", category: "bottom", name: "Ripped boyfriend jeans", color: "denim blue", color_hex: "#6f86a8", pattern: "textured", style: "casual", formality: 1, seasons: ["all"] },
  { file: "pink-skinny-jeans.jpg", category: "bottom", name: "Pink skinny jeans", color: "pink", color_hex: "#e7a9b0", pattern: "solid", style: "casual", formality: 2, seasons: ["spring", "summer"] },
  { file: "cream-straight-trousers.jpg", category: "bottom", name: "Cream straight trousers", color: "cream", color_hex: "#e4dacc", pattern: "solid", style: "smart", formality: 4, seasons: ["all"] },
  { file: "striped-wide-leg-trousers.jpg", category: "bottom", name: "Striped wide-leg trousers", color: "lilac", color_hex: "#b79ab8", pattern: "striped", style: "boho", formality: 2, seasons: ["summer"] },
  // dresses
  { file: "blue-floral-midi-dress.jpg", category: "dress", name: "Blue floral midi dress", color: "sky blue", color_hex: "#adcfeb", pattern: "floral", style: "boho", formality: 2, seasons: ["spring", "summer"] },
  { file: "orange-print-dress.jpg", category: "dress", name: "Orange print dress", color: "orange", color_hex: "#fb8832", pattern: "printed", style: "party", formality: 3, seasons: ["summer"] },
  { file: "green-tulle-gown.jpg", category: "dress", name: "Green tulle gown", color: "green", color_hex: "#0d7059", pattern: "textured", style: "party", formality: 5, seasons: ["all"] },
  { file: "check-puff-sleeve-dress.jpg", category: "dress", name: "Check puff-sleeve dress", color: "grey", color_hex: "#787470", pattern: "checked", style: "smart", formality: 4, seasons: ["autumn", "winter"] },
  { file: "black-floral-sheath-dress.jpg", category: "dress", name: "Black floral sheath dress", color: "black", color_hex: "#262626", pattern: "floral", style: "smart", formality: 4, seasons: ["all"] },
];

export const SAMPLE_MODELS = ["model-1.jpg", "model-2.jpg", "model-3.jpg", "model-4.jpg"];
