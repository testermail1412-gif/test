import { AdStyle, AdStyleId } from "./types";

/**
 * Trend database of top-performing ad formats with performance scores.
 *
 * This is intentionally a plain JSON-shaped structure so it can be refreshed
 * (e.g. every 2 weeks) by replacing `TREND_DB` or hydrating from a remote
 * endpoint. `applyTrendOverrides()` lets a fetched payload patch the scores
 * without touching the structural metadata.
 */
export interface TrendPayload {
  updatedAt: string; // ISO date
  scores: Partial<Record<AdStyleId, number>>;
}

export const TREND_DB: AdStyle[] = [
  {
    id: "cartoon",
    name: "Cartoon Ad",
    description: "Animiert, stilisiert, hohes Viral-Potenzial.",
    trendScore: 78,
    bestCategories: ["Tech", "Food", "Sonstiges"],
    bestAwareness: ["unaware", "problem-aware"],
    motionLevel: "high",
  },
  {
    id: "food-dissection",
    name: "Fruit / Food Dissection",
    description: "Hyperrealistische Close-ups mit ASMR-Potenzial.",
    trendScore: 84,
    bestCategories: ["Food", "Beauty", "Health"],
    bestAwareness: ["unaware", "solution-aware"],
    motionLevel: "medium",
  },
  {
    id: "podcast-expert",
    name: "Podcast / Expert Ad",
    description: "Authority-Positionierung im Talking-Head-Stil.",
    trendScore: 72,
    bestCategories: ["Tech", "Finance", "Health"],
    bestAwareness: ["solution-aware", "product-aware"],
    motionLevel: "low",
  },
  {
    id: "doctor-testimonial",
    name: "Doctor / Expert Testimonial",
    description: "Trust-Building mit edukativem Winkel.",
    trendScore: 80,
    bestCategories: ["Health", "Beauty", "Fitness"],
    bestAwareness: ["problem-aware", "solution-aware"],
    motionLevel: "low",
  },
  {
    id: "ugc",
    name: "UGC-Style Video",
    description: "Authentisch, unscripted, relatable.",
    trendScore: 91,
    bestCategories: ["Beauty", "Fashion", "Food", "Fitness"],
    bestAwareness: ["problem-aware", "product-aware"],
    motionLevel: "medium",
  },
  {
    id: "lifestyle",
    name: "Lifestyle Integration",
    description: "Subtiles Product-Placement, aspirational.",
    trendScore: 76,
    bestCategories: ["Fashion", "Home", "Beauty"],
    bestAwareness: ["solution-aware", "most-aware"],
    motionLevel: "medium",
  },
  {
    id: "before-after",
    name: "Before / After Transformation",
    description: "Problem → Lösung Narrativ.",
    trendScore: 87,
    bestCategories: ["Beauty", "Health", "Fitness", "Home"],
    bestAwareness: ["problem-aware", "solution-aware"],
    motionLevel: "medium",
  },
  {
    id: "behind-scenes",
    name: "Behind-the-Scenes",
    description: "Transparenz und Brand-Building.",
    trendScore: 68,
    bestCategories: ["Food", "Fashion", "Sonstiges"],
    bestAwareness: ["most-aware", "product-aware"],
    motionLevel: "medium",
  },
  {
    id: "comedy",
    name: "Comedy / Entertainment",
    description: "Engagement-first und hoch teilbar.",
    trendScore: 82,
    bestCategories: ["Tech", "Food", "Sonstiges", "Fashion"],
    bestAwareness: ["unaware", "problem-aware"],
    motionLevel: "high",
  },
  {
    id: "data-driven",
    name: "Data / Stat-Driven",
    description: "Beweis-basiert und glaubwürdigkeitsfokussiert.",
    trendScore: 70,
    bestCategories: ["Tech", "Finance", "Health"],
    bestAwareness: ["solution-aware", "product-aware"],
    motionLevel: "low",
  },
];

const STORAGE_KEY = "adgen.trends.v1";

/** Returns the active trend table, applying any locally-stored overrides. */
export function getTrendDB(): AdStyle[] {
  const overrides = loadTrendOverrides();
  if (!overrides) return TREND_DB;
  return TREND_DB.map((s) => ({
    ...s,
    trendScore: overrides.scores[s.id] ?? s.trendScore,
  }));
}

export function applyTrendOverrides(payload: TrendPayload): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function loadTrendOverrides(): TrendPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrendPayload) : null;
  } catch {
    return null;
  }
}

export function styleById(id: AdStyleId): AdStyle {
  return getTrendDB().find((s) => s.id === id)!;
}
