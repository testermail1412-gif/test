import { KlingFrame, KlingVideoJob } from "./types";

/**
 * Kling Video API integration.
 *
 * ── API KEY HANDLING ──────────────────────────────────────────────
 * The key is NEVER hardcoded. Resolution order:
 *   1. A key the user entered in the UI (stored locally, lightly obfuscated).
 *   2. The build-time env var `VITE_KLING_API_KEY`.
 * In production the request should be proxied through a backend so the key
 * never reaches the browser at all — `KLING_ENDPOINT` points at that proxy.
 */

const KEY_STORAGE = "adgen.kling.key.v1";
// Live calls go to the real Kling API by default. Set VITE_KLING_ENDPOINT to a
// server-side proxy (recommended for production so the key never hits the
// browser, and to avoid CORS). The trailing path segments below match Kling's
// REST surface.
// Default to the Vite dev proxy (/api/kling → https://api.klingai.com) so the
// browser never calls Kling directly and CORS can't break it. Override with
// VITE_KLING_ENDPOINT to point at a production backend proxy.
const KLING_ENDPOINT =
  (import.meta as any).env?.VITE_KLING_ENDPOINT || "/api/kling";

// Light obfuscation only — this is not real encryption. The correct place to
// keep the key secret is a server-side proxy; we avoid plaintext-at-rest here.
function scramble(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}
function unscramble(s: string): string {
  try {
    return decodeURIComponent(escape(atob(s)));
  } catch {
    return "";
  }
}

export function saveKlingKey(key: string): void {
  try {
    localStorage.setItem(KEY_STORAGE, scramble(key.trim()));
  } catch {
    /* ignore */
  }
}

export function getKlingKey(): string {
  const stored = (() => {
    try {
      const raw = localStorage.getItem(KEY_STORAGE);
      return raw ? unscramble(raw) : "";
    } catch {
      return "";
    }
  })();
  return stored || (import.meta as any).env?.VITE_KLING_API_KEY || "";
}

export function hasKlingKey(): boolean {
  return getKlingKey().length > 0;
}

export interface RateLimitState {
  remaining: number;
  resetAt: number;
}

// Simple client-side token-bucket guard to respect API quotas.
const bucket: RateLimitState = { remaining: 30, resetAt: Date.now() + 60_000 };

function consumeQuota(): void {
  if (Date.now() > bucket.resetAt) {
    bucket.remaining = 30;
    bucket.resetAt = Date.now() + 60_000;
  }
  if (bucket.remaining <= 0) {
    const wait = Math.ceil((bucket.resetAt - Date.now()) / 1000);
    throw new Error(`Rate-Limit erreicht. Bitte ${wait}s warten.`);
  }
  bucket.remaining -= 1;
}

interface KlingClientOpts {
  /** When false, runs a deterministic local simulation (no network/key). */
  live?: boolean;
  signal?: AbortSignal;
}

async function klingFetch(path: string, body: unknown): Promise<any> {
  const key = getKlingKey();
  if (!key) throw new Error("Kein Kling API-Key konfiguriert.");
  consumeQuota();
  const res = await fetch(`${KLING_ENDPOINT}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Kling API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Generate a keyframe (hook or CTA) from the product image + prompt.
 * Falls back to a simulated frame when not running live, so the whole
 * pipeline is demoable without a key.
 */
export async function generateFrame(
  frame: KlingFrame,
  productImage: string | undefined,
  opts: KlingClientOpts = {},
): Promise<KlingFrame> {
  if (!opts.live) {
    await delay(900, opts.signal);
    return { ...frame, status: "done", imageUrl: productImage };
  }
  try {
    const data = await klingFetch("/v1/images/generations", {
      prompt: frame.prompt,
      image: productImage,
      aspect_ratio: "16:9",
      resolution: "1080p",
    });
    return { ...frame, status: "done", imageUrl: data.image_url };
  } catch (e: any) {
    return { ...frame, status: "error", error: e.message };
  }
}

/**
 * Kick off a full video generation job. Returns a job that callers poll via
 * `pollVideo`. In simulation mode it returns a completed job after a delay.
 */
export async function createVideoJob(
  params: {
    prompt: string;
    startFrame?: string;
    endFrame?: string;
    durationSec: number;
    motionLevel: "low" | "medium" | "high";
  },
  opts: KlingClientOpts = {},
): Promise<KlingVideoJob> {
  if (!opts.live) {
    return { id: `sim-${Date.now()}`, status: "queued", progress: 0 };
  }
  const data = await klingFetch("/v1/videos/generations", {
    // All on-screen text and captions must render in flawless German.
    prompt: `${params.prompt}\n\nWICHTIG: Sämtliche eingeblendeten Texte, Untertitel und Captions in fehlerfreiem Hochdeutsch.`,
    negative_prompt:
      "englische Texte, Rechtschreibfehler, verzerrte Schrift, fremdsprachige Untertitel",
    image: params.startFrame,
    image_tail: params.endFrame,
    duration: params.durationSec,
    cfg_scale: params.motionLevel === "high" ? 0.8 : 0.5,
    aspect_ratio: "16:9",
    mode: "professional",
    language: "de",
  });
  return { id: data.id, status: "processing", progress: 5 };
}

export async function pollVideo(
  job: KlingVideoJob,
  opts: KlingClientOpts = {},
): Promise<KlingVideoJob> {
  if (!opts.live) {
    await delay(700, opts.signal);
    const progress = Math.min(100, job.progress + 20);
    return progress >= 100
      ? { ...job, status: "succeeded", progress: 100, videoUrl: "simulated://preview.mp4" }
      : { ...job, status: "processing", progress };
  }
  const data = await klingFetch(`/v1/videos/${job.id}`, {});
  return {
    ...job,
    status: data.status,
    progress: data.progress ?? job.progress,
    videoUrl: data.video_url,
    error: data.error,
  };
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("abgebrochen"));
    });
  });
}
