"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/** Arch-framed photo with a offset gold outline, scroll parallax, and two
 * floating notes — the same arch motif the hero uses, applied to the story. */
export default function StoryImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [-24, 24]);
  const cardY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [24, -24]);
  const pillY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [-16, 16]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-sm pb-6 pl-4 pt-4">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-[radial-gradient(circle,var(--rose-soft),transparent_65%)] opacity-70" />

      <div className="arch pointer-events-none absolute inset-x-0 bottom-0 right-0 top-0 translate-x-3 -translate-y-3 border border-rose/60" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="arch relative aspect-4/5 overflow-hidden bg-rose-soft shadow-xl"
      >
        <motion.div style={{ y: imgY }} className="absolute inset-x-0 -inset-y-[8%]">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 384px, 100vw"
            className="object-cover"
          />
        </motion.div>
      </motion.div>

      <motion.div
        style={{ y: cardY }}
        className="absolute -left-2 bottom-16 max-w-[11rem] rounded-2xl bg-surface/95 p-3 shadow-lg backdrop-blur sm:-left-8"
      >
        <p className="font-display text-2xl leading-none text-rose">Small</p>
        <p className="mt-1 text-xs leading-snug text-foreground/70">
          on purpose. Every piece is tried on before it&apos;s listed.
        </p>
      </motion.div>

      <motion.div
        style={{ y: pillY }}
        className="absolute -right-1 top-24 rounded-full bg-green-dark px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white shadow-md sm:-right-5"
      >
        Cash on delivery
      </motion.div>
    </div>
  );
}
