const LAB_COOKIE_NAME = "wl_lab_access";
const LAB_COOKIE_SECRET =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.LAB_COOKIE_SECRET) ||
  "wl-lab-2026-hmac-v1-9f3c7a2e8b4d1056a9c3e7f1d2b4a8c6";

function getCookie(cookieHeader, name) {
  if (!cookieHeader) return "";
  const parts = cookieHeader.split(";");
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part.startsWith(name + "=")) {
      return part.slice(name.length + 1).trim();
    }
  }
  return "";
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyLabCookie(cookieValue) {
  if (!cookieValue) return false;
  const segments = cookieValue.split(".");
  if (segments.length !== 3) return false;

  const [uid, expStr, providedSig] = segments;
  const exp = Number(expStr);
  if (!uid || !Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(LAB_COOKIE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${uid}.${expStr}`)
  );

  const expectedSig = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return constantTimeEqual(providedSig, expectedSig);
}

export default async function middleware(request) {
  const url = new URL(request.url);
  let decodedPath = url.pathname;
  try {
    decodedPath = decodeURIComponent(url.pathname);
  } catch {
    decodedPath = url.pathname;
  }

  // Gate all Wealthoria Calculator Guide PDFs on the server/edge
  if (
    decodedPath.toLowerCase().includes("wealthoria calculator guides") &&
    decodedPath.toLowerCase().endsWith(".pdf")
  ) {
    const cookieVal = getCookie(
      request.headers.get("cookie") || "",
      LAB_COOKIE_NAME
    );
    const valid = await verifyLabCookie(cookieVal);

    if (!valid) {
      const accept = request.headers.get("accept") || "";
      if (accept.includes("text/html")) {
        return Response.redirect(new URL("/membership.html", request.url), 302);
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: "Members only. Please log in to access Wealthoria Calculator Guides.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "private, no-store",
            "X-Robots-Tag": "noindex, nofollow",
          },
        }
      );
    }
  }
}

export const config = {
  matcher: ["/(.*\\.pdf)"],
};

