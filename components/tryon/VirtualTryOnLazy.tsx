"use client";

import dynamic from "next/dynamic";

// Same reasoning as BridalShowcase3DLazy: `ssr: false` only works from a
// Client Component boundary, and the /try-on page itself is a Server
// Component, so this file exists purely to give VirtualTryOn one.
export default dynamic(() => import("@/components/tryon/VirtualTryOn"), {
  ssr: false,
});
