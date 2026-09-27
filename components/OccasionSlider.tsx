"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";

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
  const [paused, setPaused] = useState(false);
  const [hasSwiped, setHasSwiped] = useState(false);
  const reducedMotion = useReducedMotion();

  const scrollToIndex = useCallback((i: number) => {
    const track = trackRef.current;
    const card = track?.children[i] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }, []);

  const runInterval = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % items.length;
        scrollToIndex(next);
        return next;
      });
    }, AUTO_ADVANCE_MS);
  }, [items.length, scrollToIndex]);

  const stopAuto = useCallback(() => {
    setPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startAuto = useCallback(() => {
    setPaused(false);
    runInterval();
  }, [runInterval]);

  useEffect(() => {
    runInterval();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runInterval]);

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

  const onTouchStart = () => {
    stopAuto();
    setHasSwiped(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      onMouseEnter={stopAuto}
      onMouseLeave={startAuto}
    >
      <div
        ref={trackRef}
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2"
        onTouchStart={onTouchStart}
        onTouchEnd={startAuto}
      >
        {items.map((o, i) => (
          <motion.div
            key={o.name}
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: reducedMotion ? 0 : i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reducedMotion ? undefined : { y: -6 }}
            className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]"
          >
            <Link
              href={`/collections/${o.collectionSlug}`}
              className="group relative block aspect-4/5 overflow-hidden rounded-2xl shadow-sm transition-shadow duration-300 hover:shadow-xl"
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
              {/* A one-time light sweep across the card on hover, echoing the
                  hero photo's glint — ties the slider back to the hero's
                  jewelry-catching-light motif. */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute inset-y-0 w-1/3 -translate-x-[150%] -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[350%]" />
              </div>
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
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {!hasSwiped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-[10px] uppercase tracking-wider text-white sm:hidden"
          >
            <motion.span
              animate={reducedMotion ? undefined : { x: [0, 4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              ←
            </motion.span>
            Swipe
            <motion.span
              animate={reducedMotion ? undefined : { x: [0, -4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label="Previous"
        onClick={() => go(active - 1)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="absolute left-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition-colors hover:bg-white sm:flex"
      >
        ←
      </motion.button>
      <motion.button
        type="button"
        aria-label="Next"
        onClick={() => go(active + 1)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="absolute right-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition-colors hover:bg-white sm:flex"
      >
        →
      </motion.button>

      <div className="mt-5 flex justify-center gap-2">
        {items.map((o, i) => (
          <button
            key={o.name}
            type="button"
            aria-label={`Go to ${o.name}`}
            onClick={() => go(i)}
            className="relative h-1.5 w-6 overflow-hidden rounded-full bg-rose/25"
          >
            {i === active && (
              <motion.span
                key={`${active}-${paused}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: paused || reducedMotion ? 0.35 : 1 }}
                transition={
                  paused || reducedMotion
                    ? { duration: 0.2 }
                    : { duration: AUTO_ADVANCE_MS / 1000, ease: "linear" }
                }
                style={{ transformOrigin: "left" }}
                className="absolute inset-0 rounded-full bg-rose"
              />
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
