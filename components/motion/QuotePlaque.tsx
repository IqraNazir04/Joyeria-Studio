"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import AnimatedQuoteMark from "@/components/motion/AnimatedQuoteMark";

/** The pull-quote staged as an engraved glass/gold plaque in 3D space: it
 * tilts up into place on scroll, then tracks the cursor with a subtle
 * perspective tilt — restrained, not playful, the same physical-object
 * language as the hero's cursor-tilt photo cluster. */
export default function QuotePlaque() {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(rawY, { stiffness: 150, damping: 20 });

  const ref = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rawY.set(px * 7);
    rawX.set(py * -7);
  }

  function onMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 sm:px-6" style={{ perspective: 1200 }}>
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        initial={{ opacity: 0, rotateX: -22, y: 36 }}
        whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative overflow-hidden rounded-2xl border border-rose/25 bg-surface/70 px-8 py-14 text-center shadow-[0_30px_60px_-25px_rgba(34,54,42,0.35)] backdrop-blur-sm sm:px-14"
      >
        {/* Gold edge glow, set slightly back in z so it reads as a frame. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            transform: "translateZ(-1px)",
            boxShadow: "inset 0 0 0 1px var(--rose), inset 0 0 40px -20px var(--rose)",
            opacity: 0.5,
          }}
        />

        {/* A one-time light sweep across the glass, timed with the reveal. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          initial={{ x: "-160%" }}
          whileInView={{ x: "360%" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.1, delay: 0.35, ease: "easeInOut" }}
        />

        <div style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}>
          <AnimatedQuoteMark className="text-4xl sm:text-5xl" />
          <p className="-mt-4 font-display text-2xl leading-relaxed text-foreground sm:text-3xl">
            We&apos;re not trying to be everything to everyone.
            <br />
            We&apos;re trying to be{" "}
            <span className="text-gold-shimmer">the jewelry drawer you actually open.</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
