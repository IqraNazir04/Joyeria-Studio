import type { Metadata } from "next";
import { Jost, Playfair_Display } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "../globals.css";
import { auth, signOut } from "@/lib/auth";

const sans = Jost({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const serif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Joyería Studio Admin" },
  robots: { index: false, follow: false },
};

// Admin gets its own root layout (its own <html>/<body>) rather than nesting
// under the storefront's — otherwise the storefront's announcement bar, nav
// and chat widget would render on top of the admin dashboard too, since a
// nested layout can't opt out of its parent. See the (storefront) route
// group for the customer-facing equivalent of this file.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {!session ? (
          // Covers /admin/login — middleware already redirects unauthenticated
          // requests to every other /admin route here, so this is a plain pass-through.
          <div className="min-h-screen bg-background">{children}</div>
        ) : (
          <div className="min-h-screen bg-rose-soft/30">
            <header className="border-b border-border bg-surface">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <Link href="/admin" className="flex items-center gap-2 font-display text-lg text-foreground">
                    <Image src="/logo/icon.png" alt="" width={20} height={28} className="h-7 w-auto" />
                    Joyería Studio Admin
                  </Link>
                  <nav className="flex flex-wrap gap-4 text-sm">
                    <Link href="/admin/analytics" className="hover:text-rose">
                      Analytics
                    </Link>
                    <Link href="/admin/orders" className="hover:text-rose">
                      Orders
                    </Link>
                    <Link href="/admin/products" className="hover:text-rose">
                      Products
                    </Link>
                    <Link href="/admin/inventory" className="hover:text-rose">
                      Inventory
                    </Link>
                    <Link href="/admin/collections" className="hover:text-rose">
                      Collections
                    </Link>
                    <Link href="/admin/delivery" className="hover:text-rose">
                      Delivery
                    </Link>
                    <Link href="/admin/coupons" className="hover:text-rose">
                      Coupons
                    </Link>
                    <Link href="/admin/reviews" className="hover:text-rose">
                      Reviews
                    </Link>
                  </nav>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/admin/login" });
                  }}
                >
                  <button type="submit" className="text-sm text-muted hover:text-red-600">
                    Sign Out
                  </button>
                </form>
              </div>
            </header>
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}
