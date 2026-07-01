export interface Segment {
  text: string;
  term?: string;
}

// Marks the first case-insensitive occurrence of each term. Longer terms match
// first so "load factor" wins over "load". Non-overlapping.
export function annotateTerms(text: string, terms: string[]): Segment[] {
  const wanted = [...terms].filter((t) => t.trim()).sort((a, b) => b.length - a.length);
  if (wanted.length === 0) return [{ text }];

  type Hit = { start: number; end: number; term: string };
  const hits: Hit[] = [];
  const lower = text.toLowerCase();
  for (const term of wanted) {
    const idx = lower.indexOf(term.toLowerCase());
    if (idx === -1) continue;
    const end = idx + term.length;
    if (hits.some((h) => idx < h.end && end > h.start)) continue; // skip overlaps
    hits.push({ start: idx, end, term });
  }
  if (hits.length === 0) return [{ text }];

  hits.sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const h of hits) {
    if (h.start > cursor) segments.push({ text: text.slice(cursor, h.start) });
    segments.push({ text: text.slice(h.start, h.end), term: h.term });
    cursor = h.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
