import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import Reveal from "@/components/motion/Reveal";
import AnimatedDiamondIcon from "@/components/motion/AnimatedDiamondIcon";
import FloatingPetals from "@/components/motion/FloatingPetals";
import type { ProductCardData } from "@/lib/types";

export const revalidate = 300;

// Free-license Unsplash photos (unsplash.com license — free for commercial
// use, no attribution required), hotlinked from their CDN.
const OCCASIONS = [
  {
    name: "Everyday",
    collectionSlug: "daily-wear",
    // unsplash.com/photos/a-close-up-of-a-bracelet-1pP4erq_nbo — Jocelyn Morales
    image: "https://images.unsplash.com/photo-1655255114527-d0a834d9a774?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Office",
    collectionSlug: "daily-wear",
    // unsplash.com/photos/magic-keyboard-beside-mug-and-click-pen-VieM9BdZKFo — Leone Venter
    image: "https://images.unsplash.com/photo-1518655048521-f130df041f66?w=800&q=80&auto=format&fit=crop",
    imagePosition: "right",
  },
  {
    name: "Mehndi",
    collectionSlug: "bridal",
    // unsplash.com/photos/left-human-hand-with-henna-HF2v2nLxd7w — Mee Nee
    image: "https://images.unsplash.com/photo-1568566240146-a5e26db3b29b?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Nikkah",
    collectionSlug: "bridal",
    // unsplash.com/photos/Pxexdj3Q09g (gold diamond-studded ring on textile) — Gary Yost
    image: "https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=800&q=80&auto=format&fit=crop",
  },
];

async function getFeaturedProducts(): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 2 } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    category: p.category,
    hoverImage: p.images[1]?.url,
    special: true,
    coverImage: p.images[0]?.url ?? "/placeholder-jewelry.svg",
    coverImageAlt: p.images[0]?.alt ?? p.name,
  }));
}

async function getCollectionsWithCover() {
  const collections = await prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  return collections.map((c) => ({
    name: c.name,
    slug: c.slug,
    image: c.coverImage ?? c.products[0]?.images[0]?.url ?? null,
  }));
}

export default async function Home() {
  const [featured, collections, bridalHero, recentImages] = await Promise.all([
    getFeaturedProducts(),
    getCollectionsWithCover(),
    prisma.product.findFirst({
      where: { isActive: true, collection: { slug: "bridal" } },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.productImage.findMany({
      orderBy: { id: "desc" },
      take: 6,
      select: { url: true, alt: true },
    }),
  ]);

  const heroImage = featured[0]?.coverImage ?? featured[1]?.coverImage ?? null;
  const heroImageAlt = featured[0]?.coverImageAlt ?? "Featured piece";
  const secondaryHeroImage = featured[1]?.coverImage ?? featured[0]?.coverImage ?? null;

  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL;

  return (
    <div>
      <HeroSection
        heroImage={heroImage}
        heroImageAlt={heroImageAlt}
        secondaryHeroImage={secondaryHeroImage}
      />

      {/* Shop by category */}
      {collections.length > 0 && (
        <Reveal as="section" className="bg-rose-soft/40 py-16">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">Browse</p>
            <h2 className="mt-2 font-display text-3xl text-foreground">Shop by category</h2>
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {collections.map((c, i) => (
                <Link key={c.slug} href={`/collections/${c.slug}`} className="group text-left">
                  <div
                    className={`arch relative aspect-square overflow-hidden ${
                      i % 2 === 0 ? "bg-rose-soft" : "bg-green-soft"
                    }`}
                  >
                    {c.image ? (
                      <Image
                        src={c.image}
                        alt={c.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <AnimatedDiamondIcon
                          className={`h-8 w-8 ${i % 2 === 0 ? "text-rose" : "text-green"}`}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    <span className="text-xs text-rose">Explore</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* New arrivals */}
      <Reveal as="section" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">Just In</p>
            <h2 className="mt-2 font-display text-3xl text-foreground">New arrivals</h2>
          </div>
          <Link href="/collections/daily-wear" className="text-sm text-rose hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {featured.length === 0 && (
          <p className="mt-4 text-sm text-muted">
            No featured products yet — mark some as featured in the admin, or run the seed script.
          </p>
        )}
      </Reveal>

      {/* Shop by occasion */}
      <Reveal as="section" className="bg-green-soft py-16">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-green-dark">
            Find Your Piece
          </p>
          <h2 className="mt-2 font-display text-3xl text-foreground">Shop by occasion</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {OCCASIONS.map((o, i) => (
              <Link
                key={o.name}
                href={`/collections/${o.collectionSlug}`}
                className="group relative aspect-4/5 overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-lg"
              >
                <Image
                  src={o.image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className={`object-cover transition duration-500 group-hover:scale-110 ${
                    o.imagePosition === "right" ? "object-right" : ""
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span
                  className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white ${
                    i % 2 === 0 ? "bg-rose/80" : "bg-green-dark/80"
                  }`}
                >
                  {i < 2 ? "Daily" : "Bridal"}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                  <span className="block font-display text-lg text-white">{o.name}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-rose-soft opacity-0 transition group-hover:opacity-100">
                    Shop now
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* The Bridal Edit */}
      <Reveal as="section" className="grid lg:grid-cols-2">
        <div className="relative aspect-square bg-green lg:aspect-auto">
          {bridalHero?.images[0]?.url ? (
            <Image
              src={bridalHero.images[0].url}
              alt={bridalHero.images[0].alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <AnimatedDiamondIcon className="h-12 w-12 text-white/70" />
            </div>
          )}
        </div>
        <div className="relative flex flex-col justify-center overflow-hidden bg-rose-soft px-6 py-16 sm:px-10 lg:px-16">
          <FloatingPetals count={8} seed={17} />
          <p className="relative text-xs font-medium uppercase tracking-[0.2em] text-rose">
            The Bridal Edit
          </p>
          <h2 className="relative mt-2 font-display text-3xl text-foreground sm:text-4xl">
            For the days you will remember.
          </h2>
          <p className="relative mt-4 max-w-md text-sm text-foreground/70">
            Necklace sets, earrings and matching pieces, ready for nikkah, mehndi and walima.
          </p>
          <Link
            href="/collections/bridal"
            className="relative mt-6 inline-block w-fit rounded-full bg-green px-6 py-3 text-sm text-white hover:bg-green-dark"
          >
            Shop bridal sets
          </Link>
        </div>
      </Reveal>

      {/* Trust bar */}
      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
          <Reveal delay={0}>
            <TrustItem
              icon={<CashIcon className="h-6 w-6 text-green-dark" />}
              title="Cash on delivery"
              description="Pay when your order reaches you."
              className="bg-rose-soft"
              badgeShape="rounded-full"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <TrustItem
              icon={<ChatIcon className="h-6 w-6 text-green-dark" />}
              title="Order on WhatsApp"
              description="Message us to order or ask about a piece."
              className="bg-green-soft"
              badgeShape="rounded-2xl"
            />
          </Reveal>
          <Reveal delay={0.2}>
            <TrustItem
              icon={<GiftIcon className="h-6 w-6 text-rose" />}
              title="Gift-ready packaging"
              description="Add a note at checkout and we will wrap it with care."
              className="border border-dashed border-rose/40 bg-surface"
              badgeShape="rounded-full ring-1 ring-rose/30"
            />
          </Reveal>
        </div>
      </section>

      {/* Follow along */}
      {instagramUrl && recentImages.length > 0 && (
        <Reveal as="section" className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">Follow Along</p>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-display text-2xl text-foreground hover:text-rose"
          >
            @joyeriastudio on Instagram
          </a>
          <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {recentImages.map((img, i) => (
              <a
                key={i}
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-md"
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 640px) 16vw, 33vw"
                  className="object-cover"
                />
              </a>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}

function TrustItem({
  icon,
  title,
  description,
  className = "",
  badgeShape = "rounded-full",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  badgeShape?: string;
}) {
  return (
    <div
      className={`flex h-full items-start gap-3 rounded-2xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center bg-surface ${badgeShape}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
    </div>
  );
}

function CashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.2-3.4A7.96 7.96 0 0 1 4 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="8" width="18" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12h18M12 8v13" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 8c-2-4-8-3-6 0 1 2 4 1.5 6 0Zm0 0c2-4 8-3 6 0-1 2-4 1.5-6 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
