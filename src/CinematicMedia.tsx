import { useEffect, useRef, useState } from "react";

type Props = {
  /** Primary looping video path (e.g. /hero.mp4). Optional until filmed. */
  videoSrc: string;
  /** Optional second video (e.g. /office-day.mp4) tried after primary fails. */
  fallbackVideoSrc?: string;
  /** Poster / first frame for LCP */
  poster: string;
  /** Stills shown as a cinematic film-strip until real video exists */
  stills: string[];
  className?: string;
};

async function probeMp4(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (!res.ok) return false;
    const type = (res.headers.get("content-type") || "").toLowerCase();
    // SPA fallback must never count as video (HTML 200 for missing .mp4).
    if (type.includes("text/html") || type.includes("application/json")) return false;
    if (type.includes("video/") || type.includes("octet-stream") || type.includes("mp4")) return true;
    // Some CDNs omit type — accept only when Content-Length looks like a real file.
    const len = Number(res.headers.get("content-length") || 0);
    return len > 50_000;
  } catch {
    return false;
  }
}

/**
 * Full-bleed media plane: real MP4 when present, otherwise a Ken Burns
 * film-strip of stills. Drop files in public/ — no code change needed.
 */
export function CinematicMedia({
  videoSrc,
  fallbackVideoSrc,
  poster,
  stills,
  className = "",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [activeStill, setActiveStill] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const primary = await probeMp4(videoSrc);
      if (cancelled) return;
      if (primary) {
        setActiveSrc(videoSrc);
        return;
      }
      if (fallbackVideoSrc) {
        const fallback = await probeMp4(fallbackVideoSrc);
        if (cancelled) return;
        if (fallback) {
          setActiveSrc(fallbackVideoSrc);
          return;
        }
      }
      setActiveSrc(null);
      setHasVideo(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [videoSrc, fallbackVideoSrc]);

  useEffect(() => {
    if (hasVideo || stills.length < 2) return;
    const id = window.setInterval(() => {
      setActiveStill((i) => (i + 1) % stills.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [hasVideo, stills.length]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !activeSrc) return;
    v.src = activeSrc;
    v.load();
    const play = () => {
      void v.play().catch(() => {
        /* autoplay can be blocked; poster/strip still visible */
      });
    };
    v.addEventListener("canplay", play, { once: true });
    return () => v.removeEventListener("canplay", play);
  }, [activeSrc]);

  function markReady(v: HTMLVideoElement) {
    if (v.readyState >= 2 && v.videoWidth > 0) {
      setHasVideo(true);
      v.classList.add("is-ready");
    }
  }

  function onError() {
    const v = videoRef.current;
    if (!v) return;
    v.removeAttribute("src");
    while (v.firstChild) v.removeChild(v.firstChild);
    v.load();
    setActiveSrc(null);
    setHasVideo(false);
  }

  return (
    <div className={`cinema ${className}`} aria-hidden="true">
      <div className="cinema__poster" style={{ backgroundImage: `url("${poster}")` }} />
      {!hasVideo ? (
        <div className="cinema__strip">
          {stills.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`cinema__still${i === activeStill ? " is-active" : ""}`}
              decoding="async"
              fetchPriority={i === 0 ? "high" : "low"}
            />
          ))}
          <div className="cinema__grain" />
        </div>
      ) : null}
      {activeSrc ? (
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          poster={poster}
          width={1920}
          height={1080}
          onLoadedData={(e) => markReady(e.currentTarget)}
          onCanPlay={(e) => markReady(e.currentTarget)}
          onError={onError}
        />
      ) : null}
      <div className="cinema__veil" />
    </div>
  );
}
