"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { formatPKR } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";
import AddToBagButton from "@/components/AddToBagButton";

const SPARKLES = [
  { top: "18%", left: "22%", delay: 0 },
  { top: "62%", left: "68%", delay: 0.15 },
  { top: "38%", left: "78%", delay: 0.3 },
];

export default function ProductCard({ product }: { product: ProductCardData }) {
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = onSale
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <motion.div
      className="group"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-4/5 overflow-hidden rounded-lg bg-rose-soft shadow-none transition-shadow duration-300 group-hover:shadow-lg">
          <Image
            src={product.coverImage}
            alt={product.coverImageAlt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={`object-cover transition-[transform,opacity] duration-300 group-hover:scale-105 ${
              product.hoverImage ? "group-hover:opacity-0" : ""
            }`}
          />
          {product.hoverImage && (
            <Image
              src={product.hoverImage}
              alt=""
              aria-hidden
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover opacity-0 transition-opacity duration-300 group-hover:scale-105 group-hover:opacity-100"
            />
          )}

          {/* A one-time light sweep on hover, matching the hero photo and
              occasion slider's glint — the same motif reused at product scale. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-y-0 w-1/4 -translate-x-[150%] -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[500%]" />
          </div>

          {product.special && (
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {SPARKLES.map((s, i) => (
                <motion.span
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-full bg-white"
                  style={{ top: s.top, left: s.left, boxShadow: "0 0 6px 1px rgba(255,255,255,0.8)" }}
                  animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.6, delay: s.delay, repeat: Infinity, repeatDelay: 0.6 }}
                />
              ))}
            </div>
          )}

          {onSale && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-rose px-2 py-1 text-xs text-white shadow-sm">
              -{discountPct}%
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white">
              Sold Out
            </span>
          )}
        </div>
      </Link>
      <div className="mt-3 space-y-1">
        {product.category && (
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {product.category}
          </p>
        )}
        <Link href={`/products/${product.slug}`} className="block text-sm text-foreground">
          {product.name}
        </Link>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-rose">{formatPKR(product.price)}</span>
            {onSale && (
              <span className="text-xs text-muted line-through">
                {formatPKR(product.compareAtPrice!)}
              </span>
            )}
          </div>
          <AddToBagButton
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            image={product.coverImage}
            stock={product.stock}
          />
        </div>
      </div>
    </motion.div>
  );
}
