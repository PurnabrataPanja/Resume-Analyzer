export function normalizeWhitespace(value: string) {
  return value
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(value: string) {
  const words = normalizeWhitespace(value).match(
    /[A-Za-z0-9+#.]+(?:[-'][A-Za-z0-9+#.]+)*/g,
  );
  return words?.length ?? 0;
}

export function pageEstimateFromWords(wordCount: number) {
  return Math.max(1, Math.ceil(wordCount / 450));
}

export function createTextHash(value: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < value.length; index += 1) {
    const char = value.charCodeAt(index);
    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(36)}${(h1 >>> 0).toString(36)}`;
}

export function containsTerm(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, "i").test(
    text,
  );
}

export function clampScore(value: number, max: number) {
  return Math.max(0, Math.min(max, Math.round(value)));
}
