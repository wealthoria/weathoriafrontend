/**
 * Guards published member excerpts from accidentally shipping internal
 * editor notes (e.g. "One-liner for WhatsApp:", "TODO", "Note:").
 */
export const INTERNAL_EXCERPT_RULES = [
  { label: "One-liner", pattern: /one[-\s]*liner/i },
  { label: "WhatsApp:", pattern: /whatsapp\s*:/i },
  { label: "TODO", pattern: /\btodo\b/i },
  { label: "Note:", pattern: /\bnote\s*:/i }
];

export function findInternalExcerptMarkers(text) {
  const value = String(text || "");
  if (!value.trim()) return [];

  const found = [];
  for (const rule of INTERNAL_EXCERPT_RULES) {
    if (rule.pattern.test(value)) {
      found.push(rule.label);
    }
  }
  return found;
}

export function isPublishedStatus(status) {
  return String(status || "").trim().toLowerCase() === "published";
}

export function validatePublishExcerpt(status, description) {
  const markers = findInternalExcerptMarkers(description);
  if (markers.length === 0 || !isPublishedStatus(status)) {
    return { ok: true, markers, message: "" };
  }

  return {
    ok: false,
    markers,
    message:
      `Publishing blocked: excerpt contains internal marker(s) (${markers.join(", ")}). ` +
      `Remove them or move social text to "Social caption", or save as Draft / Under Review.`
  };
}

