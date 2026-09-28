import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory" };

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
    include: { collection: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalCostValue = products.reduce((sum, p) => sum + (p.costPrice ?? 0) * p.stock, 0);
  const missingCostCount = products.filter((p) => p.costPrice === null).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Inventory</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-foreground px-4 py-2 text-sm text-white hover:bg-rose-dark"
        >
          + Add Product
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        Item code, type, description and cost for every product — the stock-taking view. Edit these from the
        product&apos;s own page.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Units in stock" value={totalUnits.toLocaleString("en-PK")} />
        <StatCard label="Stock value (at cost)" value={formatPKR(totalCostValue)} />
        <StatCard
          label="Missing cost price"
          value={String(missingCostCount)}
          warn={missingCostCount > 0}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted">
            <tr>
              <th className="p-3">Item Code</th>
              <th className="p-3">Product</th>
              <th className="p-3">Type</th>
              <th className="p-3">Description</th>
              <th className="p-3">Cost</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Stock Value</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border align-top last:border-0">
                <td className="p-3 font-mono text-xs text-foreground/80">{p.sku ?? "—"}</td>
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}`} className="text-foreground hover:text-rose-dark">
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted">{p.collection?.name ?? "—"}</p>
                </td>
                <td className="p-3 text-muted">{p.category ?? "—"}</td>
                <td className="max-w-xs p-3 text-muted">
                  <span className="line-clamp-2">{p.description}</span>
                </td>
                <td className="p-3">
                  {p.costPrice !== null ? (
                    formatPKR(p.costPrice)
                  ) : (
                    <span className="text-rose-dark">Not set</span>
                  )}
                </td>
                <td className={`p-3 ${p.stock <= 3 ? "text-rose-dark" : ""}`}>{p.stock}</td>
                <td className="p-3 text-muted">
                  {p.costPrice !== null ? formatPKR(p.costPrice * p.stock) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-6 text-sm text-muted">No products yet.</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-display text-xl ${warn ? "text-rose-dark" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
