import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";
import { FREE_DELIVERY_THRESHOLD, listCities } from "@/lib/delivery";
import { ADVANCE_PAYMENT_THRESHOLD } from "@/lib/payment";

const STORE_POLICIES = `
STORE POLICIES

Ordering & Payment
- Checkout is guest-only — no account needed. Just name, phone, address and city.
- Cash on Delivery is available for orders under ${formatPKR(ADVANCE_PAYMENT_THRESHOLD)}.
- Orders at or above ${formatPKR(ADVANCE_PAYMENT_THRESHOLD)} require advance payment instead of COD — Bank Transfer, JazzCash or Easypaisa, with the customer sending a screenshot of the payment over WhatsApp after ordering.
- Every order starts as PENDING and is confirmed by the store over WhatsApp before it ships — this is a manual confirmation step, not a delay or a problem with the order.
- A coupon code can be applied at checkout if the customer has one; the assistant doesn't have a list of active codes to share unprompted.

Delivery
- The delivery fee depends on city and is shown at checkout (see DELIVERY FEES BY CITY below). Orders above ${formatPKR(FREE_DELIVERY_THRESHOLD)} get free delivery.
- Typical delivery time is 2–4 business days after the order is confirmed, courier-dependent.
- Customers can check a specific order's status, items and courier/tracking info right here in this chat — ask for the phone number the order was placed with and use the track_order tool. They can also check anytime themselves at /track-order.

Returns & Exchanges
- Exchanges only — no cash refunds.
- Only for a manufacturing defect (not a change of mind), reported within 3 days of delivery.
- The piece must be unworn, undamaged by the customer, and in its original packaging.
- To start an exchange: message the store on WhatsApp with the order number and photos of the issue. The store will confirm the exchange and arrange pickup/replacement from there — the assistant cannot process an exchange itself.

Services
- Gift-ready packaging is available on every order — add a note at checkout to request it.
- Order confirmation and any exchange handling happens over WhatsApp with a real person, not an automated system.
- No in-house resizing/customization service exists today — if a customer asks for a custom size or design, point them to WhatsApp so the store can advise case by case.

Jewelry Care (general — see a product's own care note for anything more specific)
- Keep pieces away from perfume, lotion and water where possible; apply these before putting jewelry on, not after.
- Store in the pouch/box provided rather than loose in a bag or drawer, to reduce scratching and tarnishing.
- Gold- and rhodium-plated pieces last longest with gentle wear — avoid swimming, sleeping or exercising in them.

Escalation
- For anything the assistant can't resolve from this information — sizing advice beyond a product's listed details, a custom order, a complaint, or changing/cancelling an order after it's placed — tell the customer to message the store on WhatsApp using the "Order on WhatsApp" button on the site.
`.trim();

/**
 * Builds the grounding context for the support chatbot: current products,
 * collections and delivery rates pulled live from the database, plus static
 * store policy text. The catalog is small enough (a couple dozen items) to
 * include in full on every request, which is simpler and more accurate here
 * than embedding-based retrieval. If the catalog grows into the hundreds,
 * replace this with a real vector search (e.g. pgvector) over product
 * embeddings — the chat route only depends on this function returning a
 * text block, so that swap wouldn't touch anything else.
 */
export async function buildStoreContext(): Promise<string> {
  const [products, collections, cities, ratings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        category: true,
        material: true,
        collection: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.collection.findMany({ select: { name: true, slug: true, description: true } }),
    listCities(),
    prisma.review.groupBy({
      by: ["productId"],
      where: { isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const ratingByProduct = new Map(
    ratings.map((r) => [r.productId, { avg: r._avg.rating ?? 0, count: r._count._all }])
  );

  const productLines = products.map((p) => {
    const stockNote = p.stock === 0 ? "OUT OF STOCK" : `${p.stock} in stock`;
    const saleNote =
      p.compareAtPrice && p.compareAtPrice > p.price
        ? ` (was ${formatPKR(p.compareAtPrice)})`
        : "";
    const rating = ratingByProduct.get(p.id);
    const ratingNote = rating ? ` Rating: ${rating.avg.toFixed(1)}/5 (${rating.count} review${rating.count === 1 ? "" : "s"}).` : "";
    return `- [${p.name}](/products/${p.slug}) — ${formatPKR(p.price)}${saleNote}, ${stockNote}. Category: ${p.category ?? "—"}. Collection: ${p.collection?.name ?? "—"}. Material: ${p.material ?? "—"}.${ratingNote} ${p.description}`;
  });

  const collectionLines = collections.map(
    (c) => `- [${c.name}](/collections/${c.slug})${c.description ? `: ${c.description}` : ""}`
  );

  const cityLines = cities.map((c) => `- ${c.city}: ${formatPKR(c.fee)} delivery`);

  return `
CURRENT PRODUCTS (${products.length} active)
${productLines.join("\n") || "No products currently active."}

COLLECTIONS
${collectionLines.join("\n") || "None."}

DELIVERY FEES BY CITY
${cityLines.join("\n")}

${STORE_POLICIES}
`.trim();
}
