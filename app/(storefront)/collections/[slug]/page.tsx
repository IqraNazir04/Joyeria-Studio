import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import CollectionFilters from "@/components/CollectionFilters";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    category?: string;
  }>;
};

async function getCollection(slug: string) {
  return prisma.collection.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return {};
  return {
    title: collection.name,
    description: collection.description ?? `Shop ${collection.name} at Joyería Studio.`,
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sort, category } = await searchParams;

  const collection = await getCollection(slug);
  if (!collection) notFound();

  const orderBy =
    sort === "price-asc"
      ? { price: "asc" as const }
      : sort === "price-desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const products = await prisma.product.findMany({
    where: {
      collectionId: collection.id,
      isActive: true,
      ...(category ? { category } : {}),
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 2 } },
    orderBy,
  });

  const sortChips = [
    {
      label: "Newest",
      href: buildHref(slug, { category }),
      active: sort !== "price-asc" && sort !== "price-desc",
    },
    {
      label: "Price ↑",
      href: buildHref(slug, { sort: "price-asc", category }),
      active: sort === "price-asc",
    },
    {
      label: "Price ↓",
      href: buildHref(slug, { sort: "price-desc", category }),
      active: sort === "price-desc",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">{collection.name}</h1>
      {collection.description && (
        <p className="mt-2 max-w-2xl text-muted">{collection.description}</p>
      )}

      <CollectionFilters sortChips={sortChips} />

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              stock: product.stock,
              category: product.category,
              hoverImage: product.images[1]?.url,
              special: product.isFeatured,
              coverImage: product.images[0]?.url ?? "/placeholder-jewelry.svg",
              coverImageAlt: product.images[0]?.alt ?? product.name,
            }}
          />
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-10 text-sm text-muted">
          No products match these filters.{" "}
          <a href={`/collections/${slug}`} className="text-rose hover:underline">
            Clear filters
          </a>
        </p>
      )}
    </div>
  );
}

function buildHref(slug: string, params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  return query ? `/collections/${slug}?${query}` : `/collections/${slug}`;
}
