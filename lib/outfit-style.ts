export type RGB = { r: number; g: number; b: number };
export type Warmth = "warm" | "cool" | "neutral";
export type Depth = "light" | "dark" | "medium";

export type OutfitPalette = {
  warmth: Warmth;
  depth: Depth;
  swatches: string[]; // hex, largest cluster first — shown back to the customer for trust
};

function toHex({ r, g, b }: RGB): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function dist2(a: RGB, b: RGB): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h, s, l };
}

/** Reads pixels from a downsampled draw of the image (cheap, no need for
 * full resolution) and runs a small k-means pass to find dominant colors. */
export function extractPalette(img: HTMLImageElement, k = 5): OutfitPalette {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { warmth: "neutral", depth: "medium", swatches: [] };
  ctx.drawImage(img, 0, 0, size, size);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    // A cross-origin image without CORS headers taints the canvas — can't
    // read it back. Caller falls back to a neutral palette in that case.
    return { warmth: "neutral", depth: "medium", swatches: [] };
  }

  const pixels: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // skip transparent
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }
  if (pixels.length === 0) return { warmth: "neutral", depth: "medium", swatches: [] };

  let centroids = Array.from({ length: k }, (_, i) => pixels[Math.floor((i / k) * pixels.length)]);
  const assignments = new Array(pixels.length).fill(0);

  for (let iter = 0; iter < 6; iter++) {
    for (let i = 0; i < pixels.length; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = dist2(pixels[i], centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      assignments[i] = best;
    }
    const sums = centroids.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (let i = 0; i < pixels.length; i++) {
      const c = assignments[i];
      sums[c].r += pixels[i].r;
      sums[c].g += pixels[i].g;
      sums[c].b += pixels[i].b;
      sums[c].count++;
    }
    centroids = sums.map((s, idx) => (s.count > 0 ? { r: s.r / s.count, g: s.g / s.count, b: s.b / s.count } : centroids[idx]));
  }

  const counts = new Array(centroids.length).fill(0);
  assignments.forEach((a) => counts[a]++);
  const clusters = centroids
    .map((color, i) => ({ color, weight: counts[i] }))
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  // Weighted-circular hue average and mean lightness/saturation across
  // clusters, weighted by how many pixels landed in each one.
  const totalWeight = clusters.reduce((sum, c) => sum + c.weight, 0);
  let sumSin = 0;
  let sumCos = 0;
  let sumS = 0;
  let sumL = 0;
  for (const { color, weight } of clusters) {
    const { h, s, l } = rgbToHsl(color);
    const rad = (h * Math.PI) / 180;
    sumSin += Math.sin(rad) * weight;
    sumCos += Math.cos(rad) * weight;
    sumS += s * weight;
    sumL += l * weight;
  }
  const avgHue = ((Math.atan2(sumSin, sumCos) * 180) / Math.PI + 360) % 360;
  const avgSat = sumS / totalWeight;
  const avgLight = sumL / totalWeight;

  const warmth: Warmth =
    avgSat < 0.12
      ? "neutral" // low saturation — greys/near-black/near-white carry no hue signal
      : avgHue <= 70 || avgHue >= 320
        ? "warm" // reds, oranges, yellows, pinks/magentas
        : avgHue >= 150 && avgHue <= 280
          ? "cool" // greens, blues, purples
          : "neutral";

  const depth: Depth = avgLight < 0.35 ? "dark" : avgLight > 0.68 ? "light" : "medium";

  return { warmth, depth, swatches: clusters.slice(0, 5).map((c) => toHex(c.color)) };
}

export type StyleProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  category: string | null;
  material: string | null;
  finish: string | null;
  isFeatured: boolean;
  tryOnImageUrl: string | null;
  coverImage: string;
  coverImageAlt: string;
};

function finishWarmth(finish: string | null): Warmth {
  const f = (finish ?? "").toLowerCase();
  if (f.includes("gold")) return "warm";
  if (f.includes("oxid") || f.includes("silver")) return "cool";
  return "neutral";
}

function materialDepth(material: string | null): Depth {
  const m = (material ?? "").toLowerCase();
  if (["pearl", "zircon", "crystal", "polki"].includes(m)) return "light";
  if (m.includes("oxidized")) return "dark";
  return "medium";
}

/** Rule-based, transparent scoring against a customer's outfit palette — not
 * a black-box model. Warm/cool comes from the metal finish (the strongest
 * visual color cue a piece has); light/dark is a secondary nudge from the
 * stone/material. Both fall back to a small "neutral pairs with anything"
 * bonus rather than excluding a piece outright. */
export function scoreProductForPalette(p: StyleProduct, palette: OutfitPalette): number {
  let score = 0;
  const fw = finishWarmth(p.finish);
  if (fw === palette.warmth) score += 3;
  else if (fw === "neutral") score += 1;

  const md = materialDepth(p.material);
  if (md === palette.depth) score += 2;
  else if (md === "medium") score += 1;

  if (p.isFeatured) score += 0.5;
  return score;
}

export function rankProductsForPalette(products: StyleProduct[], palette: OutfitPalette): StyleProduct[] {
  return [...products]
    .filter((p) => p.stock > 0)
    .sort((a, b) => scoreProductForPalette(b, palette) - scoreProductForPalette(a, palette));
}
