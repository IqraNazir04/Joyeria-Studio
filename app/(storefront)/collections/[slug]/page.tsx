import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import PriceFilterPopover from "@/components/PriceFilterPopover";
import { sortCategories } from "@/lib/categories";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    material?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
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
  const { sort, material, category: categoryParam, minPrice: minPriceParam, maxPrice: maxPriceParam } =
    await searchParams;

  const collection = await getCollection(slug);
  if (!collection) notFound();

  const orderBy =
    sort === "price-asc"
      ? { price: "asc" as const }
      : sort === "price-desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const [priceBounds, materials, categoryRows] = await Promise.all([
    prisma.product.aggregate({
      where: { collectionId: collection.id, isActive: true },
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.product.findMany({
      where: { collectionId: collection.id, isActive: true, material: { not: null } },
      select: { material: true },
      distinct: ["material"],
    }),
    prisma.product.groupBy({
      by: ["category"],
      where: { collectionId: collection.id, isActive: true, category: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const categories = sortCategories(
    categoryRows.flatMap((r) => (r.category ? [r.category] : []))
  );
  const counts = new Map(categoryRows.map((r) => [r.category, r._count._all]));
  // Only honor a category that actually exists in this collection — a stray
  // query string shows everything rather than an empty page.
  const category = categoryParam && categories.includes(categoryParam) ? categoryParam : undefined;

  const bounds = {
    min: priceBounds._min.price ?? 0,
    max: priceBounds._max.price ?? 0,
  };

  // Only honor a price param that's a real number within the collection's
  // actual range — anything else is treated as "no filter" rather than
  // silently clamped, so a stray/tampered query string can't hide products.
  const minPrice = parseBoundedPrice(minPriceParam, bounds);
  const maxPrice = parseBoundedPrice(maxPriceParam, bounds);

  const products = await prisma.product.findMany({
    where: {
      collectionId: collection.id,
      isActive: true,
      ...(material ? { material } : {}),
      ...(category ? { category } : {}),
      ...(minPrice !== null || maxPrice !== null
        ? {
            price: {
              ...(minPrice !== null ? { gte: minPrice } : {}),
              ...(maxPrice !== null ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 2 } },
    orderBy,
  });

  const otherParams = { sort, material, category };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">{collection.name}</h1>
      {collection.description && (
        <p className="mt-2 max-w-2xl text-muted">{collection.description}</p>
      )}

      {categories.length > 1 && (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="mr-1 text-xs font-medium uppercase tracking-[0.15em] text-muted">Type</span>
          <FilterChip
            href={buildHref(slug, { sort, material, minPrice: minPriceParam, maxPrice: maxPriceParam })}
            active={!category}
            label="All"
          />
          {categories.map((c) => (
            <FilterChip
              key={c}
              href={buildHref(slug, { sort, material, category: c, minPrice: minPriceParam, maxPrice: maxPriceParam })}
              active={category === c}
              label={c}
              count={counts.get(c)}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        {materials.length > 0 && (
          <span className="mr-1 text-xs font-medium uppercase tracking-[0.15em] text-muted">Material</span>
        )}
        {materials.length > 0 && (
          <FilterChip
            href={buildHref(slug, { sort, category, minPrice: minPriceParam, maxPrice: maxPriceParam })}
            active={!material}
            label="All"
          />
        )}
        {materials.map(
          (m) =>
            m.material && (
              <FilterChip
                key={m.material}
                href={buildHref(slug, {
                  sort,
                  material: m.material,
                  category,
                  minPrice: minPriceParam,
                  maxPrice: maxPriceParam,
                })}
                active={material === m.material}
                label={m.material}
              />
            )
        )}

        {bounds.max > bounds.min && (
          <PriceFilterPopover
            basePath={`/collections/${slug}`}
            bounds={bounds}
            currentMin={minPrice}
            currentMax={maxPrice}
            otherParams={otherParams}
          />
        )}

        <span className="ml-auto flex gap-2">
          <a
            href={buildHref(slug, { sort: "price-asc", material, category, minPrice: minPriceParam, maxPrice: maxPriceParam })}
            className="text-muted hover:text-rose"
          >
            Price: Low to High
          </a>
          <a
            href={buildHref(slug, { sort: "price-desc", material, category, minPrice: minPriceParam, maxPrice: maxPriceParam })}
            className="text-muted hover:text-rose"
          >
            Price: High to Low
          </a>
        </span>
      </div>

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

function parseBoundedPrice(
  raw: string | undefined,
  bounds: { min: number; max: number }
): number | null {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  if (value < bounds.min || value > bounds.max) return null;
  return value;
}

function buildHref(slug: string, params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  return query ? `/collections/${slug}?${query}` : `/collections/${slug}`;
}

function FilterChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <a
      href={href}
      className={`rounded-full border px-3 py-1.5 transition-colors ${
        active
          ? "border-rose bg-rose text-white"
          : "border-border text-foreground/80 hover:border-rose hover:text-rose"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1.5 text-xs ${active ? "text-white/80" : "text-muted"}`}>{count}</span>
      )}
    </a>
  );
}
