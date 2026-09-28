import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import { sortCategories } from "@/lib/categories";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
  const collections = await prisma.collection
    .findMany({
      where: { featured: true },
      orderBy: { sortOrder: "asc" },
      take: 5,
      select: { id: true, name: true, slug: true },
    })
    .catch(() => []);

  const menus = await Promise.all(
    collections.map(async (c) => {
      const products = await prisma.product.findMany({
        where: { collectionId: c.id, isActive: true, category: { not: null } },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      });

      const byCategory = new Map<string, typeof products>();
      for (const p of products) {
        if (!p.category || !p.images[0]?.url) continue;
        const list = byCategory.get(p.category) ?? [];
        if (list.length < 4) list.push(p);
        byCategory.set(p.category, list);
      }

      const tabs = sortCategories([...byCategory.keys()]).map((category) => ({
        label: category,
        href: `/collections/${c.slug}?category=${encodeURIComponent(category)}`,
        items: (byCategory.get(category) ?? []).map((p) => ({
          href: `/products/${p.slug}`,
          image: p.images[0]!.url,
          alt: p.images[0]!.alt,
          label: p.name,
        })),
      }));

      return { slug: c.slug, name: c.name, tabs };
    })
  );
  const menuBySlug = new Map(menus.map((m) => [m.slug, m]));

  const links = [
    ...collections.map((c) => {
      const menu = menuBySlug.get(c.slug);
      return {
        href: `/collections/${c.slug}`,
        label: c.name,
        menu:
          menu && menu.tabs.length > 0
            ? {
                collectionName: c.name,
                viewAllHref: `/collections/${c.slug}`,
                tabs: menu.tabs,
              }
            : undefined,
      };
    }),
    { href: "/our-story", label: "Our Story" },
    { href: "/track-order", label: "Track Order" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-green px-4 py-2 text-center text-xs text-white sm:px-6">
        Cash on delivery available · Free delivery on orders above {formatPKR(FREE_DELIVERY_THRESHOLD)}
      </div>
      <NavbarClient links={links} />
    </header>
  );
}
