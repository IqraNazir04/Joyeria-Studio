"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

type Chapter = { title: string; body: string; highlights?: string[] };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Wraps key phrases in a gold underline that draws itself in on scroll. */
function Highlighted({ text, highlights = [] }: { text: string; highlights?: string[] }) {
  if (highlights.length === 0) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlights.map(escapeRegExp).join("|")})`, "g"));
  return (
    <>
      {parts.map((part, i) =>
        highlights.includes(part) ? (
          <motion.span
            key={i}
            className="font-medium text-foreground"
            style={{
              backgroundImage: "linear-gradient(var(--rose), var(--rose))",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "0 100%",
            }}
            initial={{ backgroundSize: "0% 3px" }}
            whileInView={{ backgroundSize: "100% 3px" }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
          >
            {part}
          </motion.span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function StoryChapters({ chapters }: { chapters: Chapter[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="relative mt-8 space-y-10">
      <div className="absolute bottom-2 left-5 top-2 w-px bg-border" aria-hidden />
      <motion.div
        aria-hidden
        className="absolute bottom-2 left-5 top-2 w-px origin-top bg-rose"
        style={{ scaleY: reducedMotion ? 1 : fill }}
      />

      {chapters.map((c, i) => (
        <motion.div
          key={c.title}
          className="relative pl-16"
          initial={{ opacity: 0, x: -18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-rose bg-background font-display text-sm text-rose"
            initial={{ scale: 0.6 }}
            whileInView={{ scale: [0.6, 1.15, 1] }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-rose-soft"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
            <span className="relative">{String(i + 1).padStart(2, "0")}</span>
          </motion.div>

          <h3 className="font-display text-xl text-foreground">{c.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            <Highlighted text={c.body} highlights={c.highlights} />
          </p>
        </motion.div>
      ))}
    </div>
  );
}
