"use client";

import dynamic from "next/dynamic";

// `ssr: false` only works from within a Client Component boundary — this
// file exists purely to give BridalShowcase3D (WebGL + a 3.5MB model) one,
// so the server-rendered page (our-story/page.tsx) never has to know about it.
export default dynamic(() => import("@/components/motion/BridalShowcase3D"), {
  ssr: false,
});
