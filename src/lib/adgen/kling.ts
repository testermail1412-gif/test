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

async function klingFetch(
  path: string,
  body?: unknown,
  method: "GET" | "POST" = "POST",
): Promise<any> {
  const key = getKlingKey();
  if (!key) throw new Error("Kein Kling API-Key konfiguriert.");
  consumeQuota();
  const res = await fetch(`${KLING_ENDPOINT}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  // Kling wraps everything in {code, message, data}. code 0 == success.
  if (!res.ok || (json.code !== undefined && json.code !== 0)) {
    throw new Error(`Kling API ${res.status}: ${json.message || JSON.stringify(json)}`);
  }
  return json.data ?? json;
}

/** Poll a Kling task until it succeeds or fails. */
async function awaitTask(
  basePath: string,
  taskId: string,
  pick: (result: any) => string | undefined,
  opts: KlingClientOpts,
  onProgress?: (pct: number) => void,
): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await delay(3000, opts.signal);
    const data = await klingFetch(`${basePath}/${taskId}`, undefined, "GET");
    const status = data.task_status; // submitted | processing | succeed | failed
    onProgress?.(Math.min(95, 10 + i * 5));
    if (status === "succeed") {
      const url = pick(data.task_result);
      if (!url) throw new Error("Kling-Task erfolgreich, aber keine URL geliefert.");
      return url;
    }
    if (status === "failed") {
      throw new Error(data.task_status_msg || "Kling-Task fehlgeschlagen.");
    }
  }
  throw new Error("Kling-Task Timeout.");
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
    // Kling rejects a "resolution" field (code 1201); size is controlled via
    // aspect_ratio. The product image is the reference; base64 must be sent
    // WITHOUT the "data:image/...;base64," prefix.
    const submit = await klingFetch("/v1/images/generations", {
      model_name: "kling-v1-5",
      prompt: frame.prompt,
      image: stripDataUrlPrefix(productImage),
      image_reference: "subject",
      aspect_ratio: "16:9",
      n: 1,
    });
    const url = await awaitTask(
      "/v1/images/generations",
      submit.task_id,
      (r) => r?.images?.[0]?.url,
      opts,
    );
    return { ...frame, status: "done", imageUrl: url };
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
  // Kling caps a single image-to-video clip at 5 or 10 seconds — there is no
  // 90s single-shot render. We request the longest clip (10s).
  // NOTE: image_tail (end frame) is only supported in specific model/mode/
  // duration combos, so it is only sent when explicitly provided.
  const body: Record<string, unknown> = {
    model_name: "kling-v1-5",
    mode: params.motionLevel === "low" ? "std" : "pro",
    duration: "10",
    image: stripDataUrlPrefix(params.startFrame),
    // German captions enforced via prompt + negative_prompt (Kling has no
    // dedicated language field).
    prompt: `${params.prompt}\n\nWICHTIG: Alle eingeblendeten Texte/Untertitel in fehlerfreiem Hochdeutsch.`,
    negative_prompt:
      "englische Texte, Rechtschreibfehler, verzerrte Schrift, fremdsprachige Untertitel",
    cfg_scale: params.motionLevel === "high" ? 0.8 : 0.5,
  };
  if (params.endFrame) body.image_tail = stripDataUrlPrefix(params.endFrame);
  const data = await klingFetch("/v1/videos/image2video", body);
  return { id: data.task_id, status: "processing", progress: 5 };
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
  try {
    await delay(4000, opts.signal);
    const data = await klingFetch(
      `/v1/videos/image2video/${job.id}`,
      undefined,
      "GET",
    );
    const status = data.task_status;
    if (status === "succeed") {
      return {
        ...job,
        status: "succeeded",
        progress: 100,
        videoUrl: data.task_result?.videos?.[0]?.url,
      };
    }
    if (status === "failed") {
      return { ...job, status: "failed", error: data.task_status_msg || "Fehlgeschlagen." };
    }
    return { ...job, status: "processing", progress: Math.min(95, job.progress + 8) };
  } catch (e: any) {
    return { ...job, status: "failed", error: e.message };
  }
}

/** Kling expects raw base64 — strip any "data:image/...;base64," prefix. */
function stripDataUrlPrefix(s?: string): string | undefined {
  if (!s) return s;
  const i = s.indexOf("base64,");
  return i >= 0 ? s.slice(i + 7) : s;
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
