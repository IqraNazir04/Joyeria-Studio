"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import {
  extractPalette,
  rankProducts,
  OCCASION_OPTIONS,
  type Occasion,
  type OutfitPalette,
  type StyleProduct,
} from "@/lib/outfit-style";
import OutfitMatchCard from "@/components/OutfitMatchCard";

const PALETTE_LABEL: Record<string, string> = {
  "warm-light": "warm & light",
  "warm-medium": "warm & rich",
  "warm-dark": "warm & deep",
  "cool-light": "cool & light",
  "cool-medium": "cool & rich",
  "cool-dark": "cool & deep",
  "neutral-light": "soft neutrals",
  "neutral-medium": "balanced neutrals",
  "neutral-dark": "deep neutrals",
};

type VisionResult = { occasion: Occasion; colors: string[]; reason: string };

export default function StyleMyOutfitClient({ products }: { products: StyleProduct[] }) {
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [occasionSource, setOccasionSource] = useState<"auto" | "manual" | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<OutfitPalette | null>(null);
  const [vision, setVision] = useState<VisionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  async function analyzeOccasion(file: File) {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/outfit-style", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't read that photo — pick an occasion yourself below.");
        return;
      }
      setVision({ occasion: data.occasion, colors: data.colors ?? [], reason: data.reason ?? "" });
      setOccasion(data.occasion);
      setOccasionSource("auto");
    } catch {
      setError("Network error — please try again or pick an occasion yourself below.");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setPalette(null);
    setVision(null);
    setOccasionSource(null);
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    void analyzeOccasion(file);
  }

  function onImageLoad() {
    // Local, instant color-swatch extraction — a secondary refinement signal
    // shown alongside whatever the occasion analysis above comes back with.
    const img = imgRef.current;
    if (!img) return;
    try {
      setPalette(extractPalette(img));
    } catch {
      // Best-effort — occasion detection is the part that matters and is
      // handled separately, so a failure here isn't shown as an error.
    }
  }

  function pickOccasion(value: Occasion) {
    setOccasion(value);
    setOccasionSource("manual");
  }

  function removePhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPalette(null);
    setVision(null);
    setError(null);
    setOccasionSource(null);
  }

  const matches = occasion ? rankProducts(products, occasion, palette).slice(0, 12) : [];
  const paletteLabel = palette ? PALETTE_LABEL[`${palette.warmth}-${palette.depth}`] : null;

  return (
    <div>
      <div className="mx-auto max-w-xl">
        {!photoUrl ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInput.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-rose/40 bg-rose-soft/30 px-6 py-14 text-center transition-colors hover:border-rose"
          >
            <UploadIcon className="h-10 w-10 text-rose" />
            <p className="font-display text-lg text-foreground">Upload a photo of your outfit</p>
            <p className="max-w-xs text-sm text-muted">
              A clear photo works best. We&apos;ll look at how dressy it is and its colors, and suggest jewelry to
              match.
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
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element -- a locally chosen blob: URL, not a storefront asset next/image can optimize */}
              <img
                ref={imgRef}
                src={photoUrl}
                alt="Your uploaded outfit"
                onLoad={onImageLoad}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-center sm:text-left">
              {analyzing ? (
                <p className="text-sm text-muted">Looking at your photo…</p>
              ) : vision ? (
                <>
                  <p className="text-sm text-foreground">{vision.reason}</p>
                  {palette && palette.swatches.length > 0 && (
                    <>
                      <p className="mt-1 text-xs text-muted">
                        Also matching <span className="font-medium text-rose">{paletteLabel}</span> tones
                      </p>
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
                  )}
                </>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : null}
              <button onClick={removePhoto} className="mt-3 text-xs text-muted underline hover:text-rose">
                Try a different photo
              </button>
            </div>
          </div>
        )}
      </div>

      {photoUrl && occasion && (
        <div className="mx-auto mt-8 max-w-xl text-center">
          <p className="text-sm font-medium text-foreground">
            {occasionSource === "auto" ? "Occasion (detected from your photo)" : "Occasion"}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {OCCASION_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => pickOccasion(o.value)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  occasion === o.value
                    ? "border-rose bg-rose text-white"
                    : "border-border text-foreground/80 hover:border-rose hover:text-rose"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {occasionSource === "auto" && (
            <p className="mt-2 text-xs text-muted">Not quite right? Tap a different occasion above.</p>
          )}
        </div>
      )}

      {!occasion && !analyzing && (
        <p className="mt-10 text-center text-sm text-muted">
          Upload a photo above and we&apos;ll figure out the occasion and match it for you.
        </p>
      )}

      {occasion && matches.length > 0 && (
        <motion.div
          key={occasion}
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

      {occasion && matches.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted">
          Nothing in stock right now — check back soon or browse the full catalog.
        </p>
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
