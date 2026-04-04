"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type HeroLogoMaskVideoProps = {
  /** Outer wrapper: positioning, mask, size */
  className?: string;
  /** Extra classes on the <video> (e.g. filter, opacity) */
  videoClassName?: string;
};

export function HeroLogoMaskVideo({
  className,
  videoClassName,
}: HeroLogoMaskVideoProps) {
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setReady(true);
    }
  }, []);

  return (
    <div className={cn("pointer-events-none relative", className)} aria-hidden>
      <div
        className={cn(
          "absolute inset-0 bg-lime-400 transition-opacity duration-500 ease-out",
          ready && "opacity-0"
        )}
        aria-hidden
      />
      <video
        ref={videoRef}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out",
          ready ? "opacity-100" : "opacity-0",
          videoClassName
        )}
        src="/bg-video.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
      />
    </div>
  );
}
