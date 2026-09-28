"use client";

import Link from "next/link";
import { motion } from "motion/react";

type Chip = { label: string; href: string; active: boolean };

export default function CollectionFilters({ sortChips }: { sortChips: Chip[] }) {
  return (
    <div className="mt-6 flex justify-end">
      <span className="flex items-center gap-1 rounded-full border border-border/70 bg-background/60 p-1">
        {sortChips.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-300 ${
              c.active ? "text-white" : "text-muted hover:text-rose"
            }`}
          >
            {c.active && (
              <motion.span
                layoutId="sort-pill-bg"
                className="absolute inset-0 -z-10 rounded-full bg-green"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            {c.label}
          </Link>
        ))}
      </span>
    </div>
  );
}
