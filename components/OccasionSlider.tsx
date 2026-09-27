"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Occasion = {
  name: string;
  collectionSlug: string;
  image: string;
  imagePosition?: string;
};

const AUTO_ADVANCE_MS = 4000;

export default function OccasionSlider({ items }: { items: Occasion[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [active, setActive] = useState(0);

  const scrollToIndex = useCallback((i: number) => {
    const track = trackRef.current;
    const card = track?.children[i] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }, []);

  const stopAuto = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    timerRef.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % items.length;
        scrollToIndex(next);
        return next;
      });
    }, AUTO_ADVANCE_MS);
  }, [items.length, scrollToIndex, stopAuto]);

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [startAuto, stopAuto]);

  // Track which card is closest to the viewport's left edge as the user
  // scrolls/drags, so the dots and arrow state stay in sync with reality
  // rather than only with programmatic scrollToIndex calls.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      let closest = 0;
      let closestDist = Infinity;
      Array.from(track.children).forEach((child, i) => {
        const el = child as HTMLElement;
        const dist = Math.abs(el.offsetLeft - track.offsetLeft - track.scrollLeft);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      setActive(closest);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  const go = (i: number) => {
    const next = (i + items.length) % items.length;
    setActive(next);
    scrollToIndex(next);
    startAuto();
  };

  return (
    <div className="relative" onMouseEnter={stopAuto} onMouseLeave={startAuto}>
      <div
        ref={trackRef}
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2"
        onTouchStart={stopAuto}
        onTouchEnd={startAuto}
      >
        {items.map((o, i) => (
          <Link
            key={o.name}
            href={`/collections/${o.collectionSlug}`}
            className="group relative aspect-4/5 w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-lg sm:w-[46%] lg:w-[31%]"
          >
            <Image
              src={o.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 78vw"
              className={`object-cover transition duration-500 group-hover:scale-110 ${
                o.imagePosition === "right" ? "object-right" : ""
              }`}
              priority={i === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <span
              className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white ${
                i % 2 === 0 ? "bg-rose/80" : "bg-green-dark/80"
              }`}
            >
              {i < 2 ? "Daily" : "Bridal"}
            </span>
            <div className="absolute inset-x-0 bottom-0 p-4 text-left">
              <span className="block font-display text-lg text-white">{o.name}</span>
              <span className="mt-1 flex items-center gap-1 text-xs text-rose-soft opacity-0 transition group-hover:opacity-100">
                Shop now
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous"
        onClick={() => go(active - 1)}
        className="absolute left-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition hover:bg-white sm:flex"
      >
        ←
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => go(active + 1)}
        className="absolute right-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition hover:bg-white sm:flex"
      >
        →
      </button>

      <div className="mt-5 flex justify-center gap-2">
        {items.map((o, i) => (
          <button
            key={o.name}
            type="button"
            aria-label={`Go to ${o.name}`}
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-6 bg-rose" : "w-1.5 bg-rose/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
