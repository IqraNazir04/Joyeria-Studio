import { prisma } from "@/lib/prisma";
import { tryOnPlacementFor, type TryOnItem } from "@/lib/tryon";
import TryOnPageClient from "@/components/tryon/TryOnPageClient";

export const revalidate = 300;

export const metadata = {
  title: "Virtual Try-On",
  description: "See earrings, tikkas and necklaces on your own face, live, before you buy.",
};

export default async function TryOnPage() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      tryOnImageUrl: { not: null },
      category: { in: ["Earrings", "Tikka", "Necklace", "Necklaces"] },
    },
    select: { id: true, name: true, slug: true, category: true, tryOnImageUrl: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const items: TryOnItem[] = products.flatMap((p) => {
    const placement = tryOnPlacementFor(p.category);
    if (!placement || !p.tryOnImageUrl) return [];
    return [{ id: p.id, name: p.name, slug: p.slug, placement, overlayUrl: p.tryOnImageUrl }];
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">Virtual Try-On</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">See it on, before you buy it</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-foreground/70">
          Swipe through earrings, tikkas and necklaces and see each one live on your own camera.
        </p>
      </div>

      <div className="mx-auto mt-8 h-[70vh] max-h-[640px]">
        <TryOnPageClient items={items} />
      </div>
    </div>
  );
}
