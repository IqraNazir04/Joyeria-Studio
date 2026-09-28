import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../lib/slugify";

const prisma = new PrismaClient();

const collections = [
  {
    name: "Daily Wear",
    slug: "daily-wear",
    description: "Lightweight, everyday pieces that go with everything.",
    featured: true,
    sortOrder: 1,
  },
  {
    name: "Western",
    slug: "western",
    description: "Bold statement pieces for going out.",
    featured: true,
    sortOrder: 2,
  },
  {
    name: "Bridal",
    slug: "bridal",
    description: "Kundan, polki and stone sets for the big day.",
    featured: true,
    sortOrder: 3,
  },
];

// One real, free-license Unsplash photo per category (verified: jewelry
// alone, no one wearing it — see each URL's own page for the photographer).
// "ring" and "tikka" have no verified match yet (a maang tikka in particular
// is worn on the forehead/hair part, so an unworn product shot is hard to
// find) and fall back to the plain-background line-art icon used before any
// of this was sourced — swap those for real photography via the admin once
// it's shot.
const CATEGORY_IMAGE: Record<string, { url: string } | null> = {
  earrings: { url: "https://images.unsplash.com/photo-1634390618228-2fe329fc7546?w=1000&q=80&auto=format&fit=crop" },
  necklace: { url: "https://images.unsplash.com/photo-1602527418517-f33773c47f8a?w=1000&q=80&auto=format&fit=crop" },
  bracelet: { url: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1000&q=80&auto=format&fit=crop" },
  "bridal-set": { url: "https://images.unsplash.com/photo-1722410180687-b05b50922362?w=1000&q=80&auto=format&fit=crop" },
  ring: null,
  tikka: null,
  // Free-license Unsplash photos, verified individually; none show a person.
  "bangles-stack": { url: "https://images.unsplash.com/photo-1758995116383-f51775896add?w=1000&q=80&auto=format&fit=crop" }, // Zayed Ahmed Zadu
  "bangles-inlay": { url: "https://images.unsplash.com/photo-1787769499046-8a94b2de1f62?w=1000&q=80&auto=format&fit=crop" }, // Zayed Ahmed Zadu
  "bangles-zircon": { url: "https://images.unsplash.com/photo-1690175867343-2af70ea57537?w=1000&q=80&auto=format&fit=crop" }, // mansi shah
  "bangles-ruby": { url: "https://images.unsplash.com/photo-1611598935678-c88dca238fce?w=1000&q=80&auto=format&fit=crop" }, // Samar Ahmad
  "ring-studded": { url: "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=1000&q=80&auto=format&fit=crop" }, // Cornelia Ng
  "ring-signet": { url: "https://images.unsplash.com/photo-1705326455036-0fab8ecba04d?w=1000&q=80&auto=format&fit=crop" }, // Atul Mohan
  "ring-blush": { url: "https://images.unsplash.com/photo-1603561596973-8166e9e089d1?w=1000&q=80&auto=format&fit=crop" }, // Sabrianna
  "pendant-bar": { url: "https://images.unsplash.com/photo-1569397288884-4d43d6738fbd?w=1000&q=80&auto=format&fit=crop" }, // Alex Azabache
  "necklace-pearl": { url: "https://images.unsplash.com/photo-1721103418312-b0057a8c31c2?w=1000&q=80&auto=format&fit=crop" }, // PRAHANT STUDIO
};

const img = (category: keyof typeof CATEGORY_IMAGE, alt: string) => ({
  url: CATEGORY_IMAGE[category]?.url ?? `/products/${category}.svg`,
  alt,
});

const products: Array<{
  name: string;
  description: string;
  material: string;
  finish: string;
  careNote: string;
  price: number;
  compareAtPrice?: number;
  costPrice: number;
  stock: number;
  category: string;
  collectionSlug: string;
  isFeatured?: boolean;
  images: { url: string; alt: string }[];
}> = [
  {
    name: "Pearl Drop Earrings",
    description:
      "Dainty gold-plated earrings with a single freshwater pearl drop. Light enough for all-day wear, dressy enough for a dawaat.",
    material: "Pearl",
    finish: "Gold-plated",
    careNote: "Keep away from perfume and water. Store in a pouch.",
    price: 850,
    costPrice: 320,
    stock: 12,
    category: "Earrings",
    collectionSlug: "daily-wear",
    isFeatured: true,
    images: [img("earrings", "Pearl drop earrings on plain background")],
  },
  {
    name: "Minimalist Gold Hoops",
    description: "Small everyday hoops that don't tug at your ears. Our best-selling daily wear piece.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Avoid contact with water and perfume.",
    price: 650,
    costPrice: 220,
    stock: 20,
    category: "Earrings",
    collectionSlug: "daily-wear",
    images: [img("earrings", "Minimalist gold hoop earrings on plain background")],
  },
  {
    name: "Simple Chain Bracelet",
    description: "A thin gold-plated chain bracelet with an adjustable clasp — layers well with a watch.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Wipe with a dry cloth after wear.",
    price: 950,
    costPrice: 380,
    stock: 8,
    category: "Bracelets",
    collectionSlug: "daily-wear",
    images: [img("bracelet", "Bracelet on a dark reflective surface")],
  },
  {
    name: "Oxidized Stud Set",
    description: "Set of 3 oxidized silver studs for everyday mixing and matching.",
    material: "Oxidized Silver",
    finish: "Oxidized",
    careNote: "Store separately to prevent tarnishing.",
    price: 550,
    costPrice: 190,
    stock: 15,
    category: "Earrings",
    collectionSlug: "daily-wear",
    images: [img("earrings", "Oxidized silver stud earrings on plain background")],
  },
  {
    name: "Layered Chain Necklace",
    description: "Triple-layer gold-plated chain necklace — an easy way to dress up a plain kurta or western top.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Remove before sleeping or showering.",
    price: 1450,
    compareAtPrice: 1800,
    costPrice: 620,
    stock: 6,
    category: "Necklaces",
    collectionSlug: "western",
    isFeatured: true,
    images: [img("necklace", "Gold necklace displayed on neutral fabric")],
  },
  {
    name: "Statement Hoop Earrings",
    description: "Large gold-plated hoops that make a plain outfit look finished.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Avoid pulling by the hoop — hold the post when removing.",
    price: 1100,
    costPrice: 420,
    stock: 10,
    category: "Earrings",
    collectionSlug: "western",
    images: [img("earrings", "Large statement gold hoop earrings on plain background")],
  },
  {
    name: "Chunky Cuff Bracelet",
    description: "Open-back gold-plated cuff that fits most wrist sizes — a strong statement piece.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Gently squeeze to adjust fit, don't overbend.",
    price: 1350,
    costPrice: 540,
    stock: 5,
    category: "Bracelets",
    collectionSlug: "western",
    images: [img("bracelet", "Bracelet on a dark reflective surface")],
  },
  {
    name: "Crystal Drop Necklace",
    description: "Gold-plated necklace with a clear crystal drop pendant — catches the light beautifully at night events.",
    material: "Crystal",
    finish: "Gold-plated",
    careNote: "Keep dry, store flat to protect the stone setting.",
    price: 1650,
    costPrice: 700,
    stock: 7,
    category: "Necklaces",
    collectionSlug: "western",
    images: [img("necklace", "Gold necklace displayed on neutral fabric")],
  },
  {
    name: "Kundan Choker Set",
    description:
      "Traditional kundan choker with matching earrings — designed for mehendi and reception looks. Comes gift-boxed.",
    material: "Kundan",
    finish: "Gold-plated",
    careNote: "Handle stones gently, avoid direct spray of perfume.",
    price: 4500,
    compareAtPrice: 5200,
    costPrice: 1900,
    stock: 3,
    category: "Sets",
    collectionSlug: "bridal",
    isFeatured: true,
    images: [img("bridal-set", "Bridal necklace and earring set displayed on a mannequin bust")],
  },
  {
    name: "Polki Jhumka Earrings",
    description: "Statement polki jhumkas with pearl drops — a bridal party favorite.",
    material: "Polki",
    finish: "Gold-plated",
    careNote: "Store in the original box to protect the jhumka shape.",
    price: 3200,
    costPrice: 1350,
    stock: 4,
    category: "Earrings",
    collectionSlug: "bridal",
    images: [img("earrings", "Polki jhumka earrings on plain background")],
  },
  {
    name: "Bridal Maang Tikka",
    description: "Stone-studded maang tikka with an adjustable chain — pairs well with the Kundan Choker Set.",
    material: "Stone",
    finish: "Gold-plated",
    careNote: "Adjust the chain gently, avoid pulling on the pendant.",
    price: 2200,
    costPrice: 900,
    stock: 6,
    category: "Tikka",
    collectionSlug: "bridal",
    images: [img("tikka", "Bridal maang tikka on plain background")],
  },
  {
    name: "Emerald Stone Necklace Set",
    description:
      "Emerald-green stone necklace and earring set for bridal green/gold outfits. Limited stock — handmade in small batches.",
    material: "Stone",
    finish: "Gold-plated",
    careNote: "Keep away from moisture, store flat in the box provided.",
    price: 5200,
    costPrice: 2200,
    stock: 2,
    category: "Sets",
    collectionSlug: "bridal",
    isFeatured: true,
    images: [img("bridal-set", "Bridal necklace and earring set displayed on a mannequin bust")],
  },
  // --- Category expansion: bangles, rings, pendants and more in every collection ---
  {
    name: "Ornate Slim Bangles",
    description: "A stack of slim, patterned gold-plated bangles — wear a few together or mix with a watch.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Wipe with a dry cloth and store flat, away from moisture.",
    price: 1200,
    costPrice: 480,
    stock: 14,
    category: "Bangles",
    collectionSlug: "daily-wear",
    images: [img("bangles-stack", "Stack of ornate gold bangles on a dark reflective surface")],
  },
  {
    name: "Stackable Studded Ring Set",
    description: "Three slim rings with stone accents, made to be worn together or on their own.",
    material: "Zircon",
    finish: "Gold-plated",
    careNote: "Remove before washing hands. Store in a soft pouch.",
    price: 750,
    costPrice: 290,
    stock: 18,
    category: "Rings",
    collectionSlug: "daily-wear",
    images: [img("ring-studded", "Stack of gold rings with stone accents on a light surface")],
  },
  {
    name: "Gold Bar Pendant Necklace",
    description: "A clean, minimal bar pendant on a fine chain — the easiest piece to wear every single day.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Keep dry and remove before sleeping.",
    price: 990,
    costPrice: 390,
    stock: 11,
    category: "Pendants",
    collectionSlug: "daily-wear",
    images: [img("pendant-bar", "Gold bar pendant necklace resting on a dark box")],
  },
  {
    name: "Dainty Gold Chain Necklace",
    description: "A fine gold-plated chain that layers under or alone, light enough to forget you have it on.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Remove before showering; wipe dry after wear.",
    price: 890,
    costPrice: 340,
    stock: 16,
    category: "Necklaces",
    collectionSlug: "daily-wear",
    images: [img("necklace", "Gold chain necklace displayed on neutral fabric")],
  },
  {
    name: "Textured Inlay Bangles",
    description: "A pair of bold, textured bangles with dark oval inlays — a statement for an evening out.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Avoid knocks against hard surfaces; store the pair together.",
    price: 1750,
    costPrice: 700,
    stock: 8,
    category: "Bangles",
    collectionSlug: "western",
    images: [img("bangles-inlay", "Pair of textured gold bangles with dark inlays on a reflective surface")],
  },
  {
    name: "Signet Statement Ring",
    description: "A chunky engraved signet-style ring that turns a plain outfit into a look.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Avoid contact with water and perfume.",
    price: 1250,
    costPrice: 480,
    stock: 9,
    category: "Rings",
    collectionSlug: "western",
    images: [img("ring-signet", "Engraved gold signet ring on a white surface")],
  },
  {
    name: "Blush Stone Cocktail Ring",
    description: "A cushion-cut blush stone in a slim rose-gold-plated band with a sparkling halo.",
    material: "Crystal",
    finish: "Rose gold-plated",
    careNote: "Store in the ring box; keep the stone dry and clean.",
    price: 1400,
    costPrice: 560,
    stock: 6,
    category: "Rings",
    collectionSlug: "western",
    images: [img("ring-blush", "Rose gold ring with a blush cushion-cut stone")],
  },
  {
    name: "Link Chain Bracelet",
    description: "A polished gold-plated link bracelet with a secure lobster clasp.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Wipe with a dry cloth after wear.",
    price: 1150,
    costPrice: 450,
    stock: 10,
    category: "Bracelets",
    collectionSlug: "western",
    images: [img("bracelet", "Gold bracelet on a dark reflective surface")],
  },
  {
    name: "Ruby Stone Bridal Bangles",
    description: "Ornate gold-plated bangles set with ruby-red stones — made to sit beside a bridal set.",
    material: "Stone",
    finish: "Gold-plated",
    careNote: "Handle the stones gently and store in the box provided.",
    price: 3800,
    compareAtPrice: 4400,
    costPrice: 1600,
    stock: 4,
    category: "Bangles",
    collectionSlug: "bridal",
    isFeatured: true,
    images: [img("bangles-ruby", "Gold bridal bangles set with red stones")],
  },
  {
    name: "Zircon Wedding Bangles",
    description: "Lightweight bamboo-style bangles studded with zircon — sparkle for the wedding week without the weight.",
    material: "Zircon",
    finish: "Gold-plated",
    careNote: "Keep away from perfume and store flat.",
    price: 2900,
    costPrice: 1200,
    stock: 5,
    category: "Bangles",
    collectionSlug: "bridal",
    images: [img("bangles-zircon", "Gold bangles studded with zircon leaning on a carved wooden box")],
  },
  {
    name: "Blush Stone Nikkah Ring",
    description: "A soft blush stone with a delicate halo on a rose-gold-plated band — quiet enough for the nikkah.",
    material: "Crystal",
    finish: "Rose gold-plated",
    careNote: "Store in the ring box and keep the stone clean and dry.",
    price: 2400,
    costPrice: 950,
    stock: 4,
    category: "Rings",
    collectionSlug: "bridal",
    images: [img("ring-blush", "Rose gold ring with a blush cushion-cut stone")],
  },
  {
    name: "Pearl Drop Bridal Necklace",
    description: "A wide gold-plated collar with a stone-set centerpiece and a fringe of pearl drops.",
    material: "Pearl",
    finish: "Gold-plated",
    careNote: "Keep away from moisture and perfume; store flat in the box.",
    price: 4800,
    compareAtPrice: 5600,
    costPrice: 2000,
    stock: 3,
    category: "Necklaces",
    collectionSlug: "bridal",
    images: [img("necklace-pearl", "Gold bridal necklace with pearl drops on a red background")],
  },
  {
    name: "Polki Bridal Bracelet",
    description: "A jewel-toned polki-style bracelet that matches the Polki Jhumka Earrings.",
    material: "Polki",
    finish: "Gold-plated",
    careNote: "Store in the original box to protect the setting.",
    price: 2600,
    costPrice: 1050,
    stock: 5,
    category: "Bracelets",
    collectionSlug: "bridal",
    images: [img("bracelet", "Gold bracelet on a dark reflective surface")],
  },
];

const deliveryRates = [
  { city: "Karachi", fee: 200 },
  { city: "Lahore", fee: 200 },
  { city: "Islamabad", fee: 200 },
  { city: "Rawalpindi", fee: 250 },
  { city: "Faisalabad", fee: 300 },
  { city: "Multan", fee: 300 },
  { city: "Peshawar", fee: 300 },
  { city: "Other", fee: 350 },
];

async function main() {
  console.log("Seeding collections...");
  const collectionRecords = new Map<string, string>();
  for (const c of collections) {
    const record = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
    collectionRecords.set(c.slug, record.id);
  }

  console.log("Seeding delivery rates...");
  for (const rate of deliveryRates) {
    await prisma.deliveryRate.upsert({
      where: { city: rate.city },
      update: { fee: rate.fee },
      create: rate,
    });
  }

  console.log("Seeding coupon...");
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      discountType: "PERCENT",
      value: 10,
      minOrderValue: 1000,
      usageLimit: 100,
      isActive: true,
    },
  });

  console.log("Seeding products...");
  for (const p of products) {
    const slug = slugify(p.name);
    const collectionId = collectionRecords.get(p.collectionSlug);
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        description: p.description,
        material: p.material,
        finish: p.finish,
        careNote: p.careNote,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        costPrice: p.costPrice,
        stock: p.stock,
        category: p.category,
        collectionId,
        isActive: true,
        isFeatured: p.isFeatured ?? false,
      },
      create: {
        name: p.name,
        slug,
        description: p.description,
        material: p.material,
        finish: p.finish,
        careNote: p.careNote,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        costPrice: p.costPrice,
        stock: p.stock,
        category: p.category,
        collectionId,
        isActive: true,
        isFeatured: p.isFeatured ?? false,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: p.images.map((image, i) => ({
        productId: product.id,
        url: image.url,
        alt: image.alt,
        isCover: i === 0,
        sortOrder: i,
      })),
    });
  }

  console.log(`Seeded ${products.length} products across ${collections.length} collections.`);

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@joyeriastudio.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: "Admin",
    },
  });
  console.log(`Seeded admin user: ${adminEmail} / ${adminPassword} (change this password!)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
