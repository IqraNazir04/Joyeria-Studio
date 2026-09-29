// Standard jewelry types, in the order shoppers expect to see them. Products
// keep a free-text category (so a new type can be added from the admin without
// a migration); this list only drives display order and admin suggestions.
export const PRODUCT_CATEGORIES = [
  "Bangles",
  "Bracelets",
  "Rings",
  "Earrings",
  "Necklaces",
  "Pendants",
  "Sets",
  "Tikka",
] as const;

// Occasion labels an admin can attach to a product from the admin panel.
export const PRODUCT_OCCASION_TAGS = ["Daily", "Office", "Party Wear", "Wedding"] as const;

// Color labels an admin can attach to a product from the admin panel — the
// piece's own visible color(s), not the outfit palette it's matched against.
export const PRODUCT_COLOR_TAGS = [
  "Gold",
  "Silver",
  "Rose Gold",
  "White",
  "Black",
  "Red",
  "Pink",
  "Green",
  "Blue",
  "Purple",
  "Multicolor",
] as const;

export function sortCategories(categories: string[]): string[] {
  const rank = (c: string) => {
    const i = PRODUCT_CATEGORIES.findIndex((p) => p.toLowerCase() === c.toLowerCase());
    return i === -1 ? PRODUCT_CATEGORIES.length : i;
  };
  return [...categories].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
