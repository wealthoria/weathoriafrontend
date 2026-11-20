import sharp from "sharp";

const ALLOWED_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "asia-south1-wealthoria-6fc11.cloudfunctions.net",
  "www.wealthoria.in",
  "wealthoria.in",
  "i.ytimg.com",
  "img.youtube.com",
]);

const MAX_BYTES = 80 * 1024; // 80 KB strict target

function parseAllowedUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    if (!ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function parseWidth(rawWidth) {
  const n = Number(rawWidth);
  if (n === 320 || n === 480 || n === 640) return n;
  return 640;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const reqUrl = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`
  );
  const rawSrc = reqUrl.searchParams.get("url") || "";
  const width = parseWidth(reqUrl.searchParams.get("w"));

  const safeUrl = parseAllowedUrl(rawSrc);
  if (!safeUrl) {
    return res.status(403).json({ error: "Invalid or disallowed image host" });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    let upstream;
    try {
      upstream = await fetch(safeUrl, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!upstream.ok) {
      return res.status(upstream.status === 404 ? 404 : 502).json({
        error: "Unable to fetch source thumbnail",
      });
    }

    const contentType = String(
      upstream.headers.get("content-type") || ""
    ).toLowerCase();
    if (contentType && !contentType.startsWith("image/")) {
      return res.status(415).json({ error: "Upstream resource is not an image" });
    }

    const inputBuffer = Buffer.from(await upstream.arrayBuffer());
    const basePipeline = sharp(inputBuffer, { failOn: "none" })
      .rotate()
      .resize({
        width,
        withoutEnlargement: true,
        fit: "inside",
      });

    const qualities = [78, 66, 54, 44, 34];
    let outputBuffer = null;

    for (const quality of qualities) {
      outputBuffer = await basePipeline
        .clone()
        .webp({ quality, effort: 4 })
        .toBuffer();

      if (outputBuffer.length <= MAX_BYTES) {
        break;
      }
    }

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Content-Length", String(outputBuffer.length));
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.status(200).send(outputBuffer);
  } catch (error) {
    console.error("Thumbnail resize error:", error);
    return res.status(502).json({ error: "Thumbnail processing failed" });
  }
}

