"use client";

import { useRouter } from "next/navigation";
import VirtualTryOn from "@/components/tryon/VirtualTryOnLazy";
import type { TryOnItem } from "@/lib/tryon";

export default function TryOnPageClient({ items }: { items: TryOnItem[] }) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-rose-soft/30 p-8 text-center">
        <p className="font-display text-lg text-foreground">Try-on pieces are on their way</p>
        <p className="mt-2 max-w-xs text-sm text-muted">
          We&apos;re preparing camera-ready cutouts of our earrings, tikkas and necklaces — check back soon.
        </p>
      </div>
    );
  }

  return <VirtualTryOn items={items} onClose={() => router.push("/")} />;
}
