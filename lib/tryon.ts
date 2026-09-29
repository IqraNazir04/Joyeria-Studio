export type TryOnPlacement = "earrings" | "tikka" | "necklace";

/** Only these categories have a defined AR placement — bangles/bracelets/rings
 * would need hand tracking, which is a separate feature. Matches loosely
 * against the free-text `category` field (see lib/categories.ts). */
export function tryOnPlacementFor(category: string | null | undefined): TryOnPlacement | null {
  if (!category) return null;
  const c = category.trim().toLowerCase();
  if (c === "earrings") return "earrings";
  if (c === "tikka") return "tikka";
  if (c === "necklace" || c === "necklaces") return "necklace";
  return null;
}

export type TryOnItem = {
  id: string;
  name: string;
  slug: string;
  placement: TryOnPlacement;
  overlayUrl: string;
};
