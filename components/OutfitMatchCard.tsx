import ProductCard from "@/components/ProductCard";
import ProductTryOnButton from "@/components/ProductTryOnButton";
import { tryOnPlacementFor } from "@/lib/tryon";
import type { StyleProduct } from "@/lib/outfit-style";

export default function OutfitMatchCard({ product }: { product: StyleProduct }) {
  const placement = tryOnPlacementFor(product.category);

  return (
    <div>
      <ProductCard
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          stock: product.stock,
          category: product.category,
          coverImage: product.coverImage,
          coverImageAlt: product.coverImageAlt,
        }}
      />
      {placement && product.tryOnImageUrl && (
        <div className="mt-2">
          <ProductTryOnButton
            compact
            item={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              placement,
              overlayUrl: product.tryOnImageUrl,
            }}
          />
        </div>
      )}
    </div>
  );
}
