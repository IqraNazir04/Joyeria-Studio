import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";

/**
 * Shared by the /track-order page's own API route and the support chat's
 * track_order tool — phone-only lookup, deliberately narrow field selection.
 * A phone number isn't a secret and this store has no customer accounts, so
 * anyone who knows or guesses a number can look it up; keeping the selection
 * to status/items/courier rather than the full row means a successful guess
 * still doesn't hand over the delivery address or name.
 */
export async function lookupOrdersByPhone(phone: string) {
  return prisma.order.findMany({
    where: { phone },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      city: true,
      courierName: true,
      trackingNumber: true,
      createdAt: true,
      items: {
        select: { id: true, productName: true, quantity: true, price: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export type OrderLookupResult = Awaited<ReturnType<typeof lookupOrdersByPhone>>;

/** Renders lookup results as plain text for the chat model to read and
 * summarize — never let the model see raw DB rows, only this formatted view. */
export function formatOrdersForChat(orders: OrderLookupResult): string {
  if (orders.length === 0) {
    return "No orders found for that phone number. Double-check the number, or it may have been placed with a different one.";
  }
  return orders
    .map((o) => {
      const items = o.items.map((i) => `${i.quantity}x ${i.productName} (${formatPKR(i.price)})`).join(", ");
      const courier =
        o.courierName || o.trackingNumber
          ? ` Courier: ${o.courierName ?? "—"}${o.trackingNumber ? `, tracking ${o.trackingNumber}` : ""}.`
          : "";
      return `Order ${o.orderNumber} — status ${o.status}, placed ${o.createdAt.toISOString().slice(0, 10)}, total ${formatPKR(o.total)}, delivering to ${o.city}. Items: ${items}.${courier}`;
    })
    .join("\n");
}
