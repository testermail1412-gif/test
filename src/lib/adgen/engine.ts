import {
  AdInput,
  AdScript,
  AwarenessLevel,
  AwarenessProfile,
  ScriptScene,
  StyleRecommendation,
} from "./types";
import { getTrendDB } from "./trends";

/* ------------------------------------------------------------------ *
 *  AWARENESS DETECTION
 *  Heuristic, keyword-signal based classifier across Eugene Schwartz's
 *  five awareness stages. Designed to be swapped for / augmented by an
 *  LLM call (see analyzeAwarenessLLMPrompt) without changing callers.
 * ------------------------------------------------------------------ */

const AWARENESS_META: Record<
  AwarenessLevel,
  { label: string; painFocus: string; copyStrategy: string; tone: string }
> = {
  unaware: {
    label: "Unaware",
    painFocus: "Problembewusstsein schaffen",
    copyStrategy: "Problem → Emotion → Lösung",
    tone: "Edukativ, überraschend, eye-catching",
  },
  "problem-aware": {
    label: "Problem-Aware",
    painFocus: "Bisherige Lösungen sind schlecht",
    copyStrategy: "\"Warum alte Lösungen versagen\" → \"Neue Lösung\"",
    tone: "Validierend, faktisch, lösungsorientiert",
  },
  "solution-aware": {
    label: "Solution-Aware",
    painFocus: "Warum DEIN Produkt besser ist",
    copyStrategy: "Differentiator → Proof → CTA",
    tone: "Vergleichend, beweis-basiert, prestige",
  },
  "product-aware": {
    label: "Product-Aware",
    painFocus: "Objections überwinden",
    copyStrategy: "Testimonials → Risk-Reversal → Urgency",
    tone: "Persönlich, testimonial-basiert, FOMO",
  },
  "most-aware": {
    label: "Most-Aware",
    painFocus: "Expansion, Up-Sell, Community",
    copyStrategy: "Success-Stories → Exclusive Offers",
    tone: "Insider, premium, exklusiv",
  },
};

const SIGNALS: Record<AwarenessLevel, RegExp[]> = {
  unaware: [/wusstest du/i, /did you know/i, /\?$/m, /problem/i, /versteckt/i, /hidden/i],
  "problem-aware": [
    /frustr/i,
    /nervt/i,
    /schon (mal )?versucht/i,
    /tired of/i,
    /endlich/i,
    /lösung/i,
    /struggle/i,
  ],
  "solution-aware": [
    /im vergleich/i,
    /besser als/i,
    /unlike/i,
    /anders als/i,
    /alternative/i,
    /vs\.?/i,
    /warum wir/i,
  ],
  "product-aware": [
    /garantie/i,
    /geld[- ]?zurück/i,
    /risk[- ]?free/i,
    /bewertung/i,
    /review/i,
    /testimonial/i,
    /kund(en|in)/i,
    /5 sterne/i,
  ],
  "most-aware": [
    /exklusiv/i,
    /vip/i,
    /community/i,
    /loyal/i,
    /wieder da/i,
    /upgrade/i,
    /nur für/i,
    /members/i,
  ],
};

const ORDER: AwarenessLevel[] = [
  "unaware",
  "problem-aware",
  "solution-aware",
  "product-aware",
  "most-aware",
];

export function analyzeAwareness(input: AdInput): AwarenessProfile {
  const text = `${input.brandCopy}\n${input.audience}`;
  const signals = {} as Record<AwarenessLevel, number>;
  let total = 0;
  for (const level of ORDER) {
    const hits = SIGNALS[level].reduce(
      (n, re) => n + (re.test(text) ? 1 : 0),
      0,
    );
    signals[level] = hits;
    total += hits;
  }

  // Default to solution-aware when there are no strong signals — the most
  // common cold-traffic starting point for a product that has a name + USP.
  let best: AwarenessLevel = "solution-aware";
  let bestHits = -1;
  for (const level of ORDER) {
    if (signals[level] > bestHits) {
      bestHits = signals[level];
      best = level;
    }
  }

  const confidence = total === 0 ? 0.3 : Math.min(0.95, bestHits / total + 0.25);
  const meta = AWARENESS_META[best];
  return {
    level: best,
    label: meta.label,
    confidence,
    painFocus: meta.painFocus,
    copyStrategy: meta.copyStrategy,
    tone: meta.tone,
    signals,
  };
}

export function awarenessMeta(level: AwarenessLevel) {
  return AWARENESS_META[level];
}

/**
 * Prompt that can be handed to the Claude API for a higher-fidelity
 * classification. The heuristic above is the offline fallback.
 */
export function analyzeAwarenessLLMPrompt(input: AdInput): string {
  return [
    "You are a direct-response marketing strategist.",
    "Classify the awareness stage (unaware, problem-aware, solution-aware, product-aware, most-aware)",
    "of the target audience for the following offer. Respond as JSON: {level, confidence, rationale}.",
    "",
    `Brand copy: ${input.brandCopy}`,
    `Audience: ${input.audience}`,
    `Category: ${input.category}`,
  ].join("\n");
}

/* ------------------------------------------------------------------ *
 *  STYLE RECOMMENDATION
 * ------------------------------------------------------------------ */

export function recommendStyles(
  input: AdInput,
  awareness: AwarenessLevel,
): StyleRecommendation[] {
  const recs = getTrendDB().map<StyleRecommendation>((style) => {
    const reasons: string[] = [];
    // Weighted scoring: trend (50%), category fit (30%), awareness fit (20%).
    let score = style.trendScore * 0.5;
    reasons.push(`Trend-Score ${style.trendScore}/100`);

    const catFit = style.bestCategories.includes(input.category);
    if (catFit) {
      score += 30;
      reasons.push(`Stark in der Kategorie ${input.category}`);
    }

    const awFit = style.bestAwareness.includes(awareness);
    if (awFit) {
      score += 20;
      reasons.push(`Passend zur Awareness-Stufe ${awareness}`);
    }

    return { style, score: Math.round(Math.min(100, score)), reasons };
  });

  return recs.sort((a, b) => b.score - a.score);
}

/* ------------------------------------------------------------------ *
 *  SCRIPT GENERATION (60–90s full video)
 * ------------------------------------------------------------------ */

interface SceneSpec {
  label: string;
  start: number;
  end: number;
}

// Default 6-act structure spanning 90 seconds.
const STRUCTURE: SceneSpec[] = [
  { label: "HOOK", start: 0, end: 5 },
  { label: "PROBLEM STATEMENT", start: 5, end: 15 },
  { label: "EMOTIONAL CONNECTION", start: 15, end: 30 },
  { label: "SOLUTION & DIFFERENTIATION", start: 30, end: 50 },
  { label: "PROOF & SOCIAL PROOF", start: 50, end: 75 },
  { label: "CTA & URGENCY", start: 75, end: 90 },
];

function firstSentence(s: string, fallback: string): string {
  const m = s.trim().split(/[.!?\n]/).map((x) => x.trim()).filter(Boolean);
  return m[0] || fallback;
}

export function generateScript(
  input: AdInput,
  styleId: AdScript["styleId"],
  awareness: AwarenessLevel,
): AdScript {
  const style = getTrendDB().find((s) => s.id === styleId)!;
  const meta = AWARENESS_META[awareness];
  const usp = firstSentence(input.brandCopy, "unser Produkt");
  const aud = input.audience.trim() || "deine Zielgruppe";

  const copyByLabel: Record<
    string,
    { vo: string; visual: string }
  > = {
    HOOK: {
      vo: `Stop. ${firstSentence(input.brandCopy, "Das ändert alles.")}`,
      visual: `Pattern-Interrupt: ${input.category}-Produkt im Stil "${style.name}", scroll-stoppender erster Frame, Produkt im Fokus.`,
    },
    "PROBLEM STATEMENT": {
      vo: `${meta.painFocus} — genau das spürt ${aud} jeden Tag.`,
      visual: `Relatable Szene, die den Pain-Point von ${aud} zeigt. Tonalität: ${meta.tone}.`,
    },
    "EMOTIONAL CONNECTION": {
      vo: `Wir verstehen das. Stell dir vor, es wäre einfach gelöst.`,
      visual: `Emotionale Story-Beat im "${style.name}"-Look, Nahaufnahmen, warme Beleuchtung.`,
    },
    "SOLUTION & DIFFERENTIATION": {
      vo: `Deshalb gibt es ${usp}. ${meta.copyStrategy}.`,
      visual: `Produkt-Hero-Shot, Feature-Demonstration, klarer Differentiator gegenüber Alternativen.`,
    },
    "PROOF & SOCIAL PROOF": {
      vo: `Tausende ${aud} vertrauen bereits darauf — und die Ergebnisse sprechen für sich.`,
      visual: `Testimonials, Before/After, Daten-Overlays und 5-Sterne-Bewertungen.`,
    },
    "CTA & URGENCY": {
      vo: `Sichere dir ${usp} jetzt — nur für kurze Zeit. Klick auf den Link.`,
      visual: `End-Card mit Produkt, Logo, Rabatt-Badge und klarem Call-to-Action-Button.`,
    },
  };

  const scenes: ScriptScene[] = STRUCTURE.map((spec, i) => {
    const c = copyByLabel[spec.label];
    return {
      id: `scene-${i + 1}`,
      label: spec.label,
      startSec: spec.start,
      endSec: spec.end,
      visual: c.visual,
      voiceOver: c.vo,
      transition: i === 0 ? "Hard cut in" : i === STRUCTURE.length - 1 ? "Freeze on end-card" : "Smooth crossfade",
      soundCue:
        spec.label === "HOOK"
          ? "Impact-Whoosh + Trend-Audio"
          : spec.label === "CTA & URGENCY"
            ? "Uplifting build-up, Beat-Drop auf CTA"
            : "Untermalende Beat-Spur, niedrige Lautstärke",
      cameraDirection:
        style.motionLevel === "high"
          ? "Dynamische Moves, schnelle Schnitte, Push-ins"
          : style.motionLevel === "medium"
            ? "Sanfte Dolly-/Pan-Bewegungen"
            : "Statisch, Talking-Head, minimale Bewegung",
    };
  });

  return { styleId, awareness, durationSec: 90, scenes };
}

/** Build the Kling keyframe prompt for the hook or CTA frame. */
export function framedPrompt(
  script: AdScript,
  role: "hook" | "cta",
  input: AdInput,
): string {
  const scene =
    role === "hook" ? script.scenes[0] : script.scenes[script.scenes.length - 1];
  return [
    `${scene.visual}`,
    `Kategorie: ${input.category}. Stil: ${script.styleId}.`,
    `1080p, 16:9, cinematic lighting, high detail, social-media-ready.`,
  ].join(" ");
}
