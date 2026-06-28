import { KlingVideoJob } from "./types";

/**
 * Google Veo 3 video generation via the Gemini API.
 *
 * Veo 3 renders ~8s clips WITH native audio, including spoken dialogue — so
 * German voice-over is produced directly inside the clip (no separate TTS).
 *
 * ── API KEY HANDLING ──────────────────────────────────────────────
 * Never hardcoded. Resolved from a user-entered key (stored locally, lightly
 * obfuscated) or VITE_GEMINI_API_KEY. Calls go through the Vite dev proxy
 * (/api/gemini → https://generativelanguage.googleapis.com) to avoid CORS;
 * override with VITE_GEMINI_ENDPOINT to use a production backend proxy.
 */

const KEY_STORAGE = "adgen.veo.key.v1";
const GEMINI_ENDPOINT =
  (import.meta as any).env?.VITE_GEMINI_ENDPOINT || "/api/gemini";

// Veo model. Swap to "veo-3.0-fast-generate-preview" for faster/cheaper runs.
const VEO_MODEL =
  (import.meta as any).env?.VITE_VEO_MODEL || "veo-3.0-generate-preview";

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

export function saveVeoKey(key: string): void {
  try {
    localStorage.setItem(KEY_STORAGE, scramble(key.trim()));
  } catch {
    /* ignore */
  }
}

export function getVeoKey(): string {
  const stored = (() => {
    try {
      const raw = localStorage.getItem(KEY_STORAGE);
      return raw ? unscramble(raw) : "";
    } catch {
      return "";
    }
  })();
  return stored || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
}

export function hasVeoKey(): boolean {
  return getVeoKey().length > 0;
}

// Client-side token bucket to respect quotas.
const bucket = { remaining: 30, resetAt: Date.now() + 60_000 };
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

interface ClientOpts {
  live?: boolean;
  signal?: AbortSignal;
}

async function geminiFetch(
  path: string,
  body?: unknown,
  method: "GET" | "POST" = "POST",
): Promise<any> {
  const key = getVeoKey();
  if (!key) throw new Error("Kein Gemini/Veo API-Key konfiguriert.");
  consumeQuota();
  const res = await fetch(`${GEMINI_ENDPOINT}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || JSON.stringify(json);
    throw new Error(`Gemini API ${res.status}: ${msg}`);
  }
  return json;
}

function stripDataUrlPrefix(s?: string): { data: string; mime: string } | undefined {
  if (!s) return undefined;
  const m = s.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
  if (m) return { mime: m[1], data: m[2] };
  return { mime: "image/png", data: s };
}

/**
 * Start a Veo 3 video job. Returns a job whose `id` is the long-running
 * operation name, polled via `pollVideo`. Simulation mode returns a fake job.
 */
export async function createVideoJob(
  params: {
    prompt: string;
    startFrame?: string;
    endFrame?: string;
    durationSec: number;
    motionLevel: "low" | "medium" | "high";
  },
  opts: ClientOpts = {},
): Promise<KlingVideoJob> {
  if (!opts.live) {
    return { id: `sim-${Date.now()}`, status: "queued", progress: 0 };
  }

  const instance: Record<string, unknown> = {
    // Force German spoken voice-over + German on-screen text inside the clip.
    prompt:
      `${params.prompt}\n\n` +
      `Gesprochenes Voice-over auf perfektem Hochdeutsch. ` +
      `Alle eingeblendeten Texte und Untertitel auf Deutsch, fehlerfrei.`,
  };
  const img = stripDataUrlPrefix(params.startFrame);
  if (img) {
    instance.image = { bytesBase64Encoded: img.data, mimeType: img.mime };
  }

  const op = await geminiFetch(`/v1beta/models/${VEO_MODEL}:predictLongRunning`, {
    instances: [instance],
    parameters: {
      aspectRatio: "16:9",
      negativePrompt:
        "englische Sprache, englische Texte, Rechtschreibfehler, verzerrte Schrift",
    },
  });

  if (!op.name) throw new Error("Veo: keine Operation-ID erhalten.");
  return { id: op.name, status: "processing", progress: 5 };
}

export async function pollVideo(
  job: KlingVideoJob,
  opts: ClientOpts = {},
): Promise<KlingVideoJob> {
  if (!opts.live) {
    await delay(700, opts.signal);
    const progress = Math.min(100, job.progress + 20);
    return progress >= 100
      ? { ...job, status: "succeeded", progress: 100, videoUrl: "simulated://preview.mp4" }
      : { ...job, status: "processing", progress };
  }

  try {
    await delay(8000, opts.signal); // Veo renders take a while.
    const data = await geminiFetch(`/v1beta/${job.id}`, undefined, "GET");
    if (!data.done) {
      return { ...job, status: "processing", progress: Math.min(95, job.progress + 8) };
    }
    if (data.error) {
      return { ...job, status: "failed", error: data.error.message || "Veo-Fehler." };
    }
    // Response shape varies slightly across API versions — handle both.
    const resp = data.response || {};
    const uri =
      resp?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      resp?.generatedVideos?.[0]?.video?.uri ||
      resp?.generated_videos?.[0]?.video?.uri;
    if (!uri) {
      return { ...job, status: "failed", error: "Veo fertig, aber keine Video-URI." };
    }
    const playable = await downloadVideoBlob(uri);
    return { ...job, status: "succeeded", progress: 100, videoUrl: playable };
  } catch (e: any) {
    return { ...job, status: "failed", error: e.message };
  }
}

/**
 * The Veo file URI requires the API key to download. Fetch it through the
 * proxy with the key header and hand back a blob URL the <video> tag can play.
 */
async function downloadVideoBlob(uri: string): Promise<string> {
  const key = getVeoKey();
  // Rewrite the absolute googleapis host onto our proxy path.
  const path = uri.replace(/^https:\/\/generativelanguage\.googleapis\.com/, "");
  const url = path.startsWith("/") ? `${GEMINI_ENDPOINT}${path}` : uri;
  const res = await fetch(url, { headers: { "x-goog-api-key": key } });
  if (!res.ok) throw new Error(`Video-Download fehlgeschlagen (${res.status}).`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
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
