import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Reveal from "@/components/motion/Reveal";
import FloatingPetals from "@/components/motion/FloatingPetals";
import StoryChapters from "@/components/motion/StoryChapters";
import StoryImage from "@/components/motion/StoryImage";
import QuotePlaque from "@/components/motion/QuotePlaque";
import BridalShowcase3D from "@/components/motion/BridalShowcase3DLazy";

// Free-license Unsplash photo (unsplash.com/s/photos/yellow-rose), hotlinked
// from its CDN per the Unsplash License — attribution isn't required, but
// see the photo's own page for credit if you want to add it anyway.
const ROSE_BED =
  // unsplash.com/photos/a-yellow-rose-with-a-black-background-VrBL28xxWiw — Hydra 4x
  "https://images.unsplash.com/photo-1705735777179-2731fc647f3a?w=1600&q=80&auto=format&fit=crop";

export const revalidate = 300;

export const metadata = {
  title: "Our Story",
  description:
    "Why Joyería Studio exists, how every piece is chosen, and what we promise you when you order.",
};

const CHAPTERS = [
  {
    title: "A handful of pieces",
    body: "Like most good things, it started small — a handful of pieces, sourced and tried on before they were ever listed, sold to friends before they were sold to strangers. What people kept coming back for wasn't novelty. It was pieces that held up: plating that didn't fade after two wears, clasps that didn't give out, designs that still looked right a year later.",
    highlights: ["sold to friends before they were sold to strangers"],
  },
  {
    title: "The bar every piece clears",
    body: "That's still the bar every piece has to clear before it goes on the site. We keep the catalog small on purpose — daily wear, western statement pieces, and bridal sets for the occasions that matter — because a smaller, better-chosen selection beats an endless scroll of things you'll never actually order.",
    highlights: ["a smaller, better-chosen selection"],
  },
  {
    title: "No card details upfront",
    body: "And because we know online jewelry shopping in Pakistan usually means either a random Instagram DM or a checkout that demands your card details upfront, everything here ships cash on delivery, with a real person confirming your order on WhatsApp before it leaves — not an algorithm, not a bot.",
    highlights: ["cash on delivery", "a real person"],
  },
];

const VALUES = [
  {
    title: "Thoughtfully Chosen",
    body: "Every piece earns its place in the catalog. We'd rather list twelve pieces we'd wear ourselves than a hundred we wouldn't.",
  },
  {
    title: "Made for Real Days",
    body: "Daily wear that survives a full day at work, western pieces for going out, and bridal sets built for the ceremonies that matter.",
  },
  {
    title: "Honest From Checkout to Doorstep",
    body: "The price you see is the price you pay. Cash on delivery, real stock counts, and a real person confirming your order before it ships.",
  },
];

export default async function OurStoryPage() {
  const [storyProduct, bridalProduct] = await Promise.all([
    prisma.product.findFirst({
      where: { isActive: true, isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findFirst({
      where: { isActive: true, collection: { slug: "bridal" } },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      {/* Intro */}
      <section className="relative overflow-hidden bg-rose-soft">
        <Image src={ROSE_BED} alt="" fill priority sizes="100vw" className="object-cover" />
        {/* Dark scrim — this section's text was designed for a light pastel
            background, not a busy, dark photo. */}
        <div className="absolute inset-0 bg-black/50" />
        <FloatingPetals count={12} seed={11} />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose-soft">Our Story</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-white sm:text-5xl">
            Jewelry you&apos;ll actually reach for.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/80">
            Joyería Studio started with a simple frustration: most affordable jewelry looks
            cheap, and most jewelry that doesn&apos;t is priced for a special occasion, not a
            Tuesday. We set out to close that gap — pieces considered enough for a photo,
            comfortable enough to forget you&apos;re wearing.
          </p>
        </div>
      </section>

      {/* Narrative */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <Reveal>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">
                Our beginnings
              </p>
              <h2 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
                How it started
              </h2>
            </Reveal>
            <StoryChapters chapters={CHAPTERS} />
          </div>
          {storyProduct?.images[0]?.url && (
            <StoryImage
              src={storyProduct.images[0].url}
              alt={storyProduct.images[0].alt}
            />
          )}
        </div>
      </section>

      {/* Values */}
      <Reveal as="section" className="bg-green-soft py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-green-dark">
              What We Believe
            </p>
            <h2 className="mt-2 font-display text-3xl text-foreground">
              Three things we don&apos;t compromise on
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl bg-surface p-6">
                <p className="font-display text-lg text-foreground">{v.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Pull quote */}
      <Reveal
        as="section"
        className="relative overflow-hidden bg-gradient-to-br from-rose-soft via-background to-green-soft py-24"
      >
        <FloatingPetals count={10} seed={31} />
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <BridalShowcase3D />
          <QuotePlaque />
        </div>
      </Reveal>

      {/* Bridal callout */}
      <Reveal as="section" className="grid lg:grid-cols-2">
        <div className="relative flex flex-col justify-center overflow-hidden bg-rose-soft px-6 py-16 sm:px-10 lg:px-16">
          <FloatingPetals count={8} seed={23} />
          <p className="relative text-xs font-medium uppercase tracking-[0.2em] text-rose">For the big days</p>
          <h2 className="relative mt-2 font-display text-3xl text-foreground sm:text-4xl">
            Bridal is where we slow down.
          </h2>
          <p className="relative mt-4 max-w-md text-sm text-foreground/70">
            Kundan, polki and stone sets don&apos;t get the same fast-turnaround treatment as
            daily wear. They&apos;re chosen for how they photograph under event lighting, not
            just on a plain background — because that&apos;s the one day you don&apos;t get a re-do.
          </p>
          <Link
            href="/collections/bridal"
            className="relative mt-6 inline-block w-fit rounded-full bg-green px-6 py-3 text-sm text-white hover:bg-green-dark"
          >
            Shop the Bridal Edit
          </Link>
        </div>
        <div className="relative flex items-center justify-center bg-green-soft px-6 py-16 sm:px-10 lg:px-16">
          <div className="relative aspect-4/5 w-full max-w-sm overflow-hidden rounded-lg shadow-lg">
            {bridalProduct?.images[0]?.url && (
              <Image
                src={bridalProduct.images[0].url}
                alt={bridalProduct.images[0].alt}
                fill
                sizes="(min-width: 1024px) 384px, 100vw"
                className="object-cover"
              />
            )}
          </div>
        </div>
      </Reveal>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-2xl text-foreground">Have a question before you order?</h2>
        <p className="mt-2 text-sm text-foreground/70">
          We&apos;re on WhatsApp for anything the product page doesn&apos;t answer.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-full border border-rose px-6 py-3 text-sm text-rose hover:bg-rose hover:text-white"
        >
          Get in Touch
        </Link>
      </section>
    </div>
  );
}
