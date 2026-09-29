"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { extractPalette, rankProductsForPalette, type OutfitPalette, type StyleProduct } from "@/lib/outfit-style";
import OutfitMatchCard from "@/components/OutfitMatchCard";

const PALETTE_LABEL: Record<string, string> = {
  "warm-light": "Warm & light",
  "warm-medium": "Warm & rich",
  "warm-dark": "Warm & deep",
  "cool-light": "Cool & light",
  "cool-medium": "Cool & rich",
  "cool-dark": "Cool & deep",
  "neutral-light": "Soft neutrals",
  "neutral-medium": "Balanced neutrals",
  "neutral-dark": "Deep neutrals",
};

export default function StyleMyOutfitClient({ products }: { products: StyleProduct[] }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<OutfitPalette | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setPalette(null);
    setAnalyzing(true);
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
  }

  function onImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    try {
      const result = extractPalette(img);
      setPalette(result);
    } catch {
      setError("Couldn't read that photo's colors — try a different one.");
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPalette(null);
    setError(null);
  }

  const matches = palette ? rankProductsForPalette(products, palette).slice(0, 12) : [];
  const paletteLabel = palette ? PALETTE_LABEL[`${palette.warmth}-${palette.depth}`] : null;

  return (
    <div>
      {!photoUrl && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInput.current?.click()}
          className="mx-auto flex max-w-lg cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-rose/40 bg-rose-soft/30 px-6 py-16 text-center transition-colors hover:border-rose"
        >
          <UploadIcon className="h-10 w-10 text-rose" />
          <p className="font-display text-lg text-foreground">Upload a photo of your outfit</p>
          <p className="max-w-xs text-sm text-muted">
            A clear photo of the dress or outfit you&apos;re wearing — we&apos;ll pick out its colors and find pieces
            that go with it.
          </p>
          <span className="mt-2 rounded-full bg-rose px-5 py-2 text-sm text-white hover:bg-rose-dark">
            Choose a photo
          </span>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {photoUrl && (
        <div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
            <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element -- a locally chosen blob: URL, not a storefront asset next/image can optimize */}
              <img ref={imgRef} src={photoUrl} alt="Your uploaded outfit" onLoad={onImageLoad} className="h-full w-full object-cover" />
            </div>
            <div className="text-center sm:text-left">
              {analyzing ? (
                <p className="text-sm text-muted">Reading your photo&apos;s colors…</p>
              ) : palette ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-rose">{paletteLabel}</p>
                  <p className="mt-1 text-sm text-muted">Here&apos;s what we picked up from your photo</p>
                  <div className="mt-2 flex justify-center gap-1.5 sm:justify-start">
                    {palette.swatches.map((hex, i) => (
                      <span
                        key={i}
                        className="h-6 w-6 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : null}
              <button onClick={reset} className="mt-3 text-xs text-muted underline hover:text-rose">
                Try a different photo
              </button>
            </div>
          </div>

          {palette && matches.length > 0 && (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
              className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4"
            >
              {matches.map((p) => (
                <motion.div
                  key={p.id}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <OutfitMatchCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {palette && matches.length === 0 && (
            <p className="mt-10 text-center text-sm text-muted">
              Nothing in stock right now — check back soon or browse the full catalog.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 16V4M12 4l-5 5M12 4l5 5M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
