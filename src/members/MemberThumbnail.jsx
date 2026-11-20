import React, { useState, useEffect, useRef } from "react";
import { getMemberToken } from "./memberContent.js";

const API_BASE_URL =
  "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

const PROXY_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "asia-south1-wealthoria-6fc11.cloudfunctions.net",
  "www.wealthoria.in",
  "wealthoria.in",
  "i.ytimg.com",
  "img.youtube.com",
]);

// Cache signed thumbnail URLs for 30 minutes across tab switches
const SIGNED_URL_TTL_MS = 30 * 60 * 1000;
const signedUrlCache = new Map();
const inFlightSignedRequests = new Map();

function canUseThumbProxy(url) {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("/api/thumb")) return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      PROXY_HOSTS.has(parsed.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

function buildThumbUrl(url, width) {
  return `/api/thumb?url=${encodeURIComponent(url)}&w=${width}`;
}

async function fetchSignedThumbnailUrl(contentId) {
  const cached = signedUrlCache.get(contentId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  if (inFlightSignedRequests.has(contentId)) {
    return inFlightSignedRequests.get(contentId);
  }

  const token = getMemberToken();
  if (!token) return "";

  const promise = fetch(
    `${API_BASE_URL}/api/members/content-thumbnail-url/${encodeURIComponent(contentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  )
    .then(async (res) => {
      if (!res.ok) return "";
      const data = await res.json().catch(() => null);
      if (data?.success && data?.url) {
        signedUrlCache.set(contentId, {
          url: data.url,
          expiresAt: Date.now() + SIGNED_URL_TTL_MS,
        });
        return data.url;
      }
      return "";
    })
    .catch(() => "")
    .finally(() => {
      inFlightSignedRequests.delete(contentId);
    });

  inFlightSignedRequests.set(contentId, promise);
  return promise;
}

export default function MemberThumbnail({
  src = "",
  contentId = "",
  fallbackUrl = "",
  alt = "",
  width = 320,
  height = 180,
  eager = false,
  sizes = "(max-width: 650px) 100vw, (max-width: 1150px) 33vw, 320px",
  style = null,
  onContextMenu = undefined,
}) {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(Boolean(eager));
  const [resolvedUrl, setResolvedUrl] = useState(() => {
    if (src) return src;
    if (contentId) {
      const cached = signedUrlCache.get(contentId);
      if (cached && cached.expiresAt > Date.now()) return cached.url;
    }
    return "";
  });
  const [useDirect, setUseDirect] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Keep synced if direct src prop changes
  useEffect(() => {
    if (src) {
      setResolvedUrl(src);
      setUseDirect(false);
      setFailed(false);
    }
  }, [src]);

  // Observe when card approaches viewport (350px ahead)
  useEffect(() => {
    if (inView) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "350px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  // Lazily fetch fresh signed thumbnail URL ONLY when card is near viewport
  useEffect(() => {
    if (!inView || !contentId || src) return;

    const cached = signedUrlCache.get(contentId);
    if (cached && cached.expiresAt > Date.now()) {
      setResolvedUrl(cached.url);
      return;
    }

    let cancelled = false;
    fetchSignedThumbnailUrl(contentId).then((freshUrl) => {
      if (cancelled) return;
      if (freshUrl) {
        setResolvedUrl(freshUrl);
      } else if (fallbackUrl) {
        setResolvedUrl(fallbackUrl);
      } else {
        setFailed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [inView, contentId, src, fallbackUrl]);

  const activeSource = resolvedUrl || (!contentId ? fallbackUrl : "");
  const shouldProxy = !useDirect && canUseThumbProxy(activeSource);

  const imgSrc = shouldProxy ? buildThumbUrl(activeSource, 640) : activeSource;
  const imgSrcSet = shouldProxy
    ? `${buildThumbUrl(activeSource, 320)} 320w, ${buildThumbUrl(activeSource, 640)} 640w`
    : undefined;

  if (failed) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={loaded ? "wl-thumb-wrap wl-thumb-loaded" : "wl-thumb-wrap wl-thumb-loading"}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {activeSource && inView && (
        <img
          src={imgSrc}
          srcSet={imgSrcSet}
          sizes={imgSrcSet ? sizes : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : undefined}
          onContextMenu={onContextMenu}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (shouldProxy) {
              setUseDirect(true);
            } else if (fallbackUrl && activeSource !== fallbackUrl) {
              setResolvedUrl(fallbackUrl);
              setUseDirect(true);
            } else {
              setFailed(true);
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.22s ease-out",
            ...(style || {}),
          }}
        />
      )}
    </div>
  );
}

