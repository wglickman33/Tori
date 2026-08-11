export type TagMergeSuggestion = {
  a: string;
  b: string;
  /** Higher = stronger match. */
  score: number;
  reason: "plural" | "similar" | "case";
};

function normalize(tag: string): string {
  return tag.trim().toLowerCase();
}

/** Levenshtein edit distance. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const prev = new Array<number>(cols);
  const curr = new Array<number>(cols);
  for (let j = 0; j < cols; j += 1) prev[j] = j;
  for (let i = 1; i < rows; i += 1) {
    curr[0] = i;
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    for (let j = 0; j < cols; j += 1) prev[j] = curr[j]!;
  }
  return prev[b.length]!;
}

function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - editDistance(a, b) / maxLen;
}

/** True if one looks like a simple plural of the other. */
export function isPluralPair(a: string, b: string): boolean {
  const x = normalize(a);
  const y = normalize(b);
  if (x === y) return false;
  const [shorter, longer] = x.length <= y.length ? [x, y] : [y, x];
  if (longer === `${shorter}s`) return true;
  if (longer === `${shorter}es`) return true;
  if (shorter.endsWith("y") && longer === `${shorter.slice(0, -1)}ies`) return true;
  return false;
}

function pairScore(a: string, b: string): { score: number; reason: TagMergeSuggestion["reason"] } | null {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb || na === nb) {
    // Same after normalize but different display (casing) - suggest merge.
    if (a !== b && na && na === nb) {
      return { score: 1, reason: "case" };
    }
    return null;
  }

  if (isPluralPair(a, b)) {
    return { score: 0.98, reason: "plural" };
  }

  const ratio = similarityRatio(na, nb);
  const dist = editDistance(na, nb);
  const maxLen = Math.max(na.length, nb.length);

  // Tight rules so unrelated tags (Water / Dock) never pair.
  if (maxLen <= 3) {
    if (dist === 0) return { score: 1, reason: "case" };
    return null;
  }
  if (maxLen <= 5) {
    if (dist <= 1 && ratio >= 0.8) return { score: ratio, reason: "similar" };
    return null;
  }
  if (dist <= 2 && ratio >= 0.85) {
    return { score: ratio, reason: "similar" };
  }
  return null;
}

/**
 * Suggest near-duplicate tag pairs. Each tag appears in at most one pair
 * (greedy best score first).
 */
export function suggestTagMerges(tags: string[]): TagMergeSuggestion[] {
  const unique = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
  if (unique.length < 2) return [];

  type Cand = TagMergeSuggestion;
  const candidates: Cand[] = [];
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      const a = unique[i]!;
      const b = unique[j]!;
      const hit = pairScore(a, b);
      if (!hit) continue;
      candidates.push({ a, b, score: hit.score, reason: hit.reason });
    }
  }

  candidates.sort((x, y) => y.score - x.score || x.a.localeCompare(y.a));

  const used = new Set<string>();
  const out: TagMergeSuggestion[] = [];
  for (const c of candidates) {
    const ka = normalize(c.a);
    const kb = normalize(c.b);
    if (used.has(ka) || used.has(kb)) continue;
    used.add(ka);
    used.add(kb);
    // Stable display order: alphabetical by label
    const [first, second] = c.a.localeCompare(c.b) <= 0 ? [c.a, c.b] : [c.b, c.a];
    out.push({ ...c, a: first, b: second });
  }
  return out;
}
