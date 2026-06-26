import { AdScript } from "./types";

/**
 * German voice-over (TTS) generation.
 *
 * Kling renders motion/visuals but NOT a spoken narration track. To deliver a
 * video with "perfekt gesprochenem Deutsch", the script's voice-over lines are
 * synthesised here and muxed onto the rendered video.
 *
 * Two backends are supported:
 *   1. Browser SpeechSynthesis with a German voice — works offline, zero-cost,
 *      good for previews. Used automatically in the demo / simulation mode.
 *   2. A cloud TTS provider (set VITE_TTS_ENDPOINT + key) for broadcast-quality
 *      German narration in production.
 *
 * The output is the full narration script with timing markers plus, when
 * available, an audio URL/Blob for muxing.
 */

export interface VoiceOverTrack {
  language: "de-DE";
  /** Full narration text assembled from the script, in order. */
  ssml: string;
  /** Per-scene cue with absolute timing for muxing onto the video. */
  cues: { startSec: number; text: string }[];
  audioUrl?: string;
}

const TTS_ENDPOINT = (import.meta as any).env?.VITE_TTS_ENDPOINT || "";

/** Builds SSML so the TTS speaks clean, well-paced Hochdeutsch. */
export function buildGermanSSML(script: AdScript): VoiceOverTrack {
  const cues = script.scenes.map((s) => ({ startSec: s.startSec, text: s.voiceOver }));
  const body = script.scenes
    .map(
      (s) =>
        `<mark name="${s.id}"/><s>${escapeSsml(s.voiceOver)}</s><break time="400ms"/>`,
    )
    .join("\n");
  const ssml =
    `<speak xml:lang="de-DE"><prosody rate="medium" pitch="+0%">\n${body}\n</prosody></speak>`;
  return { language: "de-DE", ssml, cues };
}

/**
 * Synthesise the German narration. Returns an audio URL when a cloud TTS is
 * configured; otherwise falls back to the browser's German SpeechSynthesis
 * voice for an immediate preview.
 */
export async function generateGermanVoiceOver(
  script: AdScript,
): Promise<VoiceOverTrack> {
  const track = buildGermanSSML(script);

  if (TTS_ENDPOINT) {
    try {
      const res = await fetch(TTS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssml: track.ssml, voice: "de-DE", format: "mp3" }),
      });
      if (res.ok) {
        const blob = await res.blob();
        return { ...track, audioUrl: URL.createObjectURL(blob) };
      }
    } catch {
      /* fall through to browser TTS */
    }
  }

  return track;
}

/** Speaks the narration aloud using a German browser voice (preview only). */
export function previewGermanVoiceOver(track: VoiceOverTrack): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const plain = track.cues.map((c) => c.text).join(" ");
  const utt = new SpeechSynthesisUtterance(plain);
  utt.lang = "de-DE";
  const deVoice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.startsWith("de"));
  if (deVoice) utt.voice = deVoice;
  utt.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

function escapeSsml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
