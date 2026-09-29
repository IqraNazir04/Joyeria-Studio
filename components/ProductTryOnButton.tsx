"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { TryOnItem } from "@/lib/tryon";

// Only loaded once someone actually taps the button — MediaPipe + the camera
// pipeline have no reason to load for the vast majority of product-page visits.
const VirtualTryOn = dynamic(() => import("@/components/tryon/VirtualTryOn"), { ssr: false });

export default function ProductTryOnButton({
  item,
  compact = false,
}: {
  item: TryOnItem;
  /** The grid on /style-my-outfit needs a button sized for a small card,
   * not the full-width product-detail-page treatment. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-center gap-1.5 rounded-full border border-rose text-rose hover:bg-rose hover:text-white ${
          compact ? "px-3 py-1.5 text-xs" : "gap-2 px-6 py-3 text-sm"
        }`}
      >
        <SparkleIcon className={compact ? "h-3 w-3" : "h-4 w-4"} />
        Try it on
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-8"
          onClick={() => setOpen(false)}
        >
          <div
            className="h-[80vh] w-full max-w-sm sm:h-[85vh] sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <VirtualTryOn items={[item]} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
