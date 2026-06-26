// Core domain types for the AI Ad-Video Generator ("Ad Studio").

export type AdCategory =
  | "Beauty"
  | "Tech"
  | "Food"
  | "Health"
  | "Fashion"
  | "Home"
  | "Fitness"
  | "Finance"
  | "Sonstiges";

export const AD_CATEGORIES: AdCategory[] = [
  "Beauty",
  "Tech",
  "Food",
  "Health",
  "Fashion",
  "Home",
  "Fitness",
  "Finance",
  "Sonstiges",
];

export type AdStyleId =
  | "cartoon"
  | "food-dissection"
  | "podcast-expert"
  | "doctor-testimonial"
  | "ugc"
  | "lifestyle"
  | "before-after"
  | "behind-scenes"
  | "comedy"
  | "data-driven";

export interface AdStyle {
  id: AdStyleId;
  name: string;
  description: string;
  /** Base performance score 0–100, updatable via the trend database. */
  trendScore: number;
  /** Categories this style historically over-performs in. */
  bestCategories: AdCategory[];
  /** Awareness stages this style is best suited for. */
  bestAwareness: AwarenessLevel[];
  motionLevel: "low" | "medium" | "high";
}

export type AwarenessLevel =
  | "unaware"
  | "problem-aware"
  | "solution-aware"
  | "product-aware"
  | "most-aware";

export interface AwarenessProfile {
  level: AwarenessLevel;
  label: string;
  confidence: number; // 0–1
  painFocus: string;
  copyStrategy: string;
  tone: string;
  /** Per-level signal scores that produced the result (for transparency). */
  signals: Record<AwarenessLevel, number>;
}

export interface AdInput {
  productImage?: string; // data URL
  brandCopy: string;
  audience: string;
  category: AdCategory;
}

export interface StyleRecommendation {
  style: AdStyle;
  score: number; // 0–100 weighted
  reasons: string[];
}

export interface ScriptScene {
  id: string;
  label: string; // e.g. "HOOK"
  startSec: number;
  endSec: number;
  visual: string; // scene description (Kling keyframe prompt material)
  voiceOver: string;
  transition: string;
  soundCue: string;
  cameraDirection: string;
}

export interface AdScript {
  styleId: AdStyleId;
  awareness: AwarenessLevel;
  durationSec: number;
  scenes: ScriptScene[];
}

export interface KlingFrame {
  role: "hook" | "cta";
  prompt: string;
  imageUrl?: string;
  status: "pending" | "generating" | "done" | "error";
  error?: string;
}

export interface KlingVideoJob {
  id: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  progress: number; // 0–100
  videoUrl?: string;
  error?: string;
}
