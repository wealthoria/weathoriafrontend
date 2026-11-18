import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const MEMBERS_API_URL =
  "https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api/members/me";

const LAB_COOKIE_NAME = "wl_lab_access";
const LAB_COOKIE_TTL_SECONDS = 7200; // 2 hours
const LAB_COOKIE_SECRET =
  process.env.LAB_COOKIE_SECRET ||
  "wl-lab-2026-hmac-v1-9f3c7a2e8b4d1056a9c3e7f1d2b4a8c6";

let cachedEngineSource = null;

function parseMembershipDateMillis(value) {
  if (!value) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "object") {
    const sec = value.seconds !== undefined ? value.seconds : value._seconds;
    if (typeof sec === "number") return sec * 1000;
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasPaidMemberAccess(memberData) {
  if (!memberData || typeof memberData !== "object") return false;

  const role = String(memberData.role || "").trim().toLowerCase();
  if (role === "admin") return true;

  const status = String(memberData.status || "").trim().toLowerCase();
  if (status !== "active" && status !== "cancelled" && status !== "canceled") {
    return false;
  }

  const sub = memberData.subscription || {};
  if (sub.accessActive === false) return false;

  const startMs = parseMembershipDateMillis(
    sub.startDate || sub.subscriptionStartDate || sub.createdAt
  );
  const lastPayMs =
    parseMembershipDateMillis(
      sub.lastPaymentDate || sub.paidAt || sub.lastPaymentAt
    ) || startMs;
  const maxCoveredMs = lastPayMs > 0 ? lastPayMs + 31 * 86400000 : 0;

  const rawPaidMillis = parseMembershipDateMillis(
    sub.paidUntil || sub.accessUntil || sub.nextBillingDate
  );

  const isRenewalFailed =
    Boolean(sub.isRenewalFailed) ||
    sub.status === "pending" ||
    sub.razorpayStatus === "pending";

  const paidMillis =
    isRenewalFailed || (maxCoveredMs > 0 && rawPaidMillis > maxCoveredMs)
      ? maxCoveredMs || rawPaidMillis
      : rawPaidMillis;

  const hasPaymentProof =
    Number(sub.paidCount || 0) > 0 ||
    Boolean(
      sub.razorpayPaymentId ||
        sub.paymentId ||
        sub.paidUntil ||
        sub.accessUntil
    );

  if (!hasPaymentProof && sub.accessActive !== true) {
    return false;
  }

  if (paidMillis > 0 && paidMillis <= Date.now()) {
    return false;
  }

  if (isRenewalFailed) {
    return paidMillis > Date.now();
  }

  if (status === "cancelled" || status === "canceled") {
    return (
      (sub.accessActive === true || paidMillis > Date.now()) && hasPaymentProof
    );
  }

  return true;
}

function signLabCookie(uid) {
  const safeUid = String(uid || "member").replace(/[^a-zA-Z0-9_-]/g, "");
  const exp = Math.floor(Date.now() / 1000) + LAB_COOKIE_TTL_SECONDS;
  const payload = `${safeUid}.${exp}`;
  const sig = crypto
    .createHmac("sha256", LAB_COOKIE_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

function getEngineSource() {
  if (cachedEngineSource) return cachedEngineSource;
  const enginePath = path.join(process.cwd(), "private", "lab-engine.js");
  cachedEngineSource = fs.readFileSync(enginePath, "utf8");
  return cachedEngineSource;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res
      .status(405)
      .json({ success: false, reason: "method_not_allowed" });
  }

  const authHeader = String(req.headers.authorization || "").trim();
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ success: false, reason: "login_required" });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ success: false, reason: "login_required" });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    let meRes;
    try {
      meRes = await fetch(MEMBERS_API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (meRes.status === 401 || meRes.status === 403) {
      return res.status(401).json({ success: false, reason: "login_required" });
    }

    if (!meRes.ok) {
      return res.status(502).json({ success: false, reason: "server_error" });
    }

    const data = await meRes.json().catch(() => null);
    if (!data || !data.success || !data.member) {
      return res.status(403).json({ success: false, reason: "inactive" });
    }

    if (!hasPaidMemberAccess(data.member)) {
      return res.status(403).json({ success: false, reason: "inactive" });
    }

    const engineSource = getEngineSource();
    const cookieValue = signLabCookie(data.member.uid || data.member.id);
    const isHttps =
      req.headers["x-forwarded-proto"] === "https" ||
      process.env.VERCEL === "1";

    const cookieParts = [
      `${LAB_COOKIE_NAME}=${cookieValue}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${LAB_COOKIE_TTL_SECONDS}`,
    ];
    if (isHttps) cookieParts.push("Secure");

    res.setHeader("Set-Cookie", cookieParts.join("; "));
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "private, no-store, no-cache, must-revalidate, max-age=0"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");

    return res.status(200).send(engineSource);
  } catch (error) {
    console.error("Lab bundle verification error:", error);
    return res.status(502).json({ success: false, reason: "server_error" });
  }
}

