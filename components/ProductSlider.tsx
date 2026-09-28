"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import ProductCard from "@/components/ProductCard";
import type { ProductCardData } from "@/lib/types";

export default function ProductSlider({ products }: { products: ProductCardData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const reducedMotion = useReducedMotion();

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      track.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  const scrollByCard = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[0] as HTMLElement | undefined;
    const step = (card?.offsetWidth ?? 260) + 16;
    track.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Edge fades hint that the row keeps going, without needing dots for
          up to 8 items — a hard cutoff there reads as the row simply ending. */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-300 ${
          atStart ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-300 ${
          atEnd ? "opacity-0" : "opacity-100"
        }`}
      />

      <div
        ref={trackRef}
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:gap-5"
      >
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: reducedMotion ? 0 : Math.min(i, 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous"
        onClick={() => scrollByCard(-1)}
        disabled={atStart}
        className="absolute -left-4 top-[38%] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-md transition hover:scale-105 disabled:pointer-events-none disabled:opacity-0 sm:flex"
      >
        ←
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => scrollByCard(1)}
        disabled={atEnd}
        className="absolute -right-4 top-[38%] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-md transition hover:scale-105 disabled:pointer-events-none disabled:opacity-0 sm:flex"
      >
        →
      </button>
    </div>
  );
}
