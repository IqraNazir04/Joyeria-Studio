"use client";

import { useEffect, useRef, useState } from "react";
import type { FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { getFaceLandmarker } from "@/lib/tryon-face-landmarker";
import type { TryOnItem } from "@/lib/tryon";

type Status = "starting" | "unsupported" | "denied" | "camera-error" | "ready";

const LEFT_FACE = 234;
const RIGHT_FACE = 454;
const FOREHEAD = 10;
const GLABELLA = 9; // between the eyebrows
const CHIN = 152;
const EYE_L = 33;
const EYE_R = 263;

function px(lm: NormalizedLandmark, w: number, h: number) {
  return { x: lm.x * w, y: lm.y * h };
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Draws `img` rotated by `angle`, sized to `width`x`height`, anchored at
 * (x, y) either by its center or by its top-center edge — a tikka or
 * necklace hangs *from* its anchor point, an earring is centered on one. */
function drawAnchoredImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  opts: { x: number; y: number; width: number; height: number; angle: number; anchor: "center" | "top-center"; flip?: boolean }
) {
  const { x, y, width, height, angle, anchor, flip } = opts;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (flip) ctx.scale(-1, 1);
  const top = anchor === "top-center" ? 0 : -height / 2;
  ctx.drawImage(img, -width / 2, top, width, height);
  ctx.restore();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export default function VirtualTryOn({
  items,
  startIndex = 0,
  onClose,
}: {
  items: TryOnItem[];
  startIndex?: number;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const currentIndexRef = useRef(startIndex);
  const touchStartX = useRef<number | null>(null);

  const [status, setStatus] = useState<Status>("starting");
  const [faceFound, setFaceFound] = useState(false);
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    currentIndexRef.current = index;
  }, [index]);

  // Preload every overlay image up front — swiping should never show a blank
  // frame while an image is still fetching.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const item of items) {
        if (imageCacheRef.current.has(item.overlayUrl)) continue;
        try {
          const img = await loadImage(item.overlayUrl);
          if (!cancelled) imageCacheRef.current.set(item.overlayUrl, img);
        } catch {
          // Missing/broken overlay image for this one item — it just won't
          // draw; the rest of the try-on experience still works.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => setStatus("unsupported"));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [stream, landmarker] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
            audio: false,
          }),
          getFaceLandmarker(),
        ]);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        landmarkerRef.current = landmarker;

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
          setStatus("denied");
        } else {
          setStatus("camera-error");
        }
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // A ref rather than a memoized callback: the loop reschedules itself every
  // frame, and calling a stale closure of itself (captured `items`/state from
  // whenever the rAF chain started) would silently stop picking up updates.
  // Reassigning `.current` on every render and always scheduling through it
  // keeps each frame running the latest version without restarting the loop.
  const renderLoopRef = useRef<() => void>(() => {});

  useEffect(() => {
    renderLoopRef.current = () => {
      const scheduleNext = () => {
        rafRef.current = requestAnimationFrame(() => renderLoopRef.current());
      };

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !canvas || !landmarker || video.readyState < 2) {
        scheduleNext();
        return;
      }

      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w === 0 || h === 0) {
        scheduleNext();
        return;
      }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, w, h);

      const result = landmarker.detectForVideo(video, performance.now());
      const landmarks = result.faceLandmarks[0];

      if (landmarks) {
        setFaceFound((prev) => (prev ? prev : true));
        const item = items[currentIndexRef.current];
        const img = item ? imageCacheRef.current.get(item.overlayUrl) : undefined;
        if (item && img) {
          const left = px(landmarks[LEFT_FACE], w, h);
          const right = px(landmarks[RIGHT_FACE], w, h);
          const forehead = px(landmarks[FOREHEAD], w, h);
          const glabella = px(landmarks[GLABELLA], w, h);
          const chin = px(landmarks[CHIN], w, h);
          const eyeL = px(landmarks[EYE_L], w, h);
          const eyeR = px(landmarks[EYE_R], w, h);

          const faceWidth = dist(left, right);
          const faceHeight = dist(forehead, chin);
          const angle = Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x);
          const aspect = img.naturalHeight / img.naturalWidth || 1;

          if (item.placement === "earrings") {
            const width = faceWidth * 0.22;
            const height = width * aspect;
            const drop = faceWidth * 0.1;
            drawAnchoredImage(ctx, img, {
              x: left.x - Math.cos(angle) * drop * 0.2,
              y: left.y + drop,
              width,
              height,
              angle,
              anchor: "top-center",
            });
            drawAnchoredImage(ctx, img, {
              x: right.x + Math.cos(angle) * drop * 0.2,
              y: right.y + drop,
              width,
              height,
              angle,
              anchor: "top-center",
              flip: true,
            });
          } else if (item.placement === "tikka") {
            const width = faceWidth * 0.16;
            const height = width * aspect;
            const anchorX = glabella.x;
            const anchorY = forehead.y + (glabella.y - forehead.y) * 0.5;
            drawAnchoredImage(ctx, img, { x: anchorX, y: anchorY, width, height, angle, anchor: "top-center" });
          } else {
            const width = faceWidth * 1.6;
            const height = width * aspect;
            const anchorY = chin.y + faceHeight * 0.55;
            drawAnchoredImage(ctx, img, { x: chin.x, y: anchorY, width, height, angle, anchor: "top-center" });
          }
        }
      } else {
        setFaceFound((prev) => (prev ? false : prev));
      }

      scheduleNext();
    };
  }, [items]);

  useEffect(() => {
    if (status !== "ready") return;
    rafRef.current = requestAnimationFrame(() => renderLoopRef.current());
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status]);

  function go(delta: number) {
    setIndex((i) => (i + delta + items.length) % items.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > 40) go(delta > 0 ? -1 : 1);
  }

  const current = items[index];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-black">
      <div
        className="relative flex-1 overflow-hidden"
        onTouchStart={items.length > 1 ? onTouchStart : undefined}
        onTouchEnd={items.length > 1 ? onTouchEnd : undefined}
      >
        {/* Mirrored so it feels like a mirror, not a rear camera — all the
            landmark math above runs on the raw, unmirrored coordinates. */}
        <video ref={videoRef} playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />

        {status === "starting" && (
          <StatusOverlay>Starting camera…</StatusOverlay>
        )}
        {status === "denied" && (
          <StatusOverlay>
            Camera access was denied. Allow camera access in your browser&apos;s site settings and reload to try on{" "}
            {current?.name ?? "this piece"}.
          </StatusOverlay>
        )}
        {status === "unsupported" && (
          <StatusOverlay>Virtual try-on needs a browser with camera support — please try a different browser.</StatusOverlay>
        )}
        {status === "camera-error" && (
          <StatusOverlay>Couldn&apos;t start the camera. Make sure no other app is using it, then reload.</StatusOverlay>
        )}
        {status === "ready" && !faceFound && (
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              Center your face in the frame
            </span>
          </div>
        )}

        <button
          onClick={onClose}
          aria-label="Close try-on"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          ✕
        </button>

        {items.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous piece"
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              ‹
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next piece"
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              ›
            </button>
          </>
        )}
      </div>

      {current && (
        <div className="flex items-center justify-between gap-3 bg-black/80 px-4 py-3 text-white">
          <span className="text-sm font-medium">{current.name}</span>
          {items.length > 1 && (
            <div className="flex gap-1">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  aria-label={`Show ${it.name}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/35"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black px-8 text-center text-sm text-white/85">
      {children}
    </div>
  );
}
