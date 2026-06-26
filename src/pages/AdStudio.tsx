import { useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Upload,
  Wand2,
  Film,
  Play,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { Field } from "../components/ui";
import {
  AdCategory,
  AD_CATEGORIES,
  AdInput,
  AdScript,
  AdClip,
  AwarenessProfile,
  StyleRecommendation,
} from "../lib/adgen/types";
import {
  analyzeAwareness,
  recommendStyles,
  generateScript,
  awarenessMeta,
} from "../lib/adgen/engine";
import {
  createVideoJob,
  pollVideo,
  hasKlingKey,
  saveKlingKey,
} from "../lib/adgen/kling";
import {
  generateGermanVoiceOver,
  previewGermanVoiceOver,
  VoiceOverTrack,
} from "../lib/adgen/voiceover";

type Step = 1 | 2 | 3 | 4 | 5;

export default function AdStudio() {
  const [step, setStep] = useState<Step>(1);

  // Step 1 — input
  const [image, setImage] = useState<string | undefined>();
  const [brandCopy, setBrandCopy] = useState("");
  const [audience, setAudience] = useState("");
  const [category, setCategory] = useState<AdCategory>("Beauty");
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 2 — analysis
  const [awareness, setAwareness] = useState<AwarenessProfile | null>(null);
  const [recs, setRecs] = useState<StyleRecommendation[]>([]);
  const [chosenStyle, setChosenStyle] = useState<string | null>(null);

  // Step 3 — script
  const [script, setScript] = useState<AdScript | null>(null);

  // Step 4 — parallel clip generation (one clip per script act)
  const [clips, setClips] = useState<AdClip[]>([]);
  const [voiceOver, setVoiceOver] = useState<VoiceOverTrack | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Key
  const [keyInput, setKeyInput] = useState("");
  const [live, setLive] = useState(hasKlingKey());

  const input: AdInput = useMemo(
    () => ({ productImage: image, brandCopy, audience, category }),
    [image, brandCopy, audience, category],
  );

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  }

  function runAnalysis() {
    if (brandCopy.trim().length < 10) {
      setError("Bitte gib eine aussagekräftige Brand Copy ein (min. 10 Zeichen).");
      return;
    }
    setError(null);
    const aw = analyzeAwareness(input);
    setAwareness(aw);
    const r = recommendStyles(input, aw.level);
    setRecs(r);
    setChosenStyle(r[0]?.style.id ?? null);
    setStep(2);
  }

  function buildScript() {
    if (!chosenStyle || !awareness) return;
    setScript(generateScript(input, chosenStyle as any, awareness.level));
    setStep(3);
  }

  /** Update a single clip in place by id. */
  function patchClip(id: string, patch: Partial<AdClip>) {
    setClips((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  /** Generate + poll ONE clip to completion. */
  async function runClip(clip: AdClip, motion: "low" | "medium" | "high", opts: { live: boolean }) {
    try {
      patchClip(clip.id, { status: "generating", progress: 5 });
      let j = await createVideoJob(
        { prompt: clip.prompt, startFrame: image, durationSec: 10, motionLevel: motion },
        opts,
      );
      let guard = 0;
      while (j.status !== "succeeded" && j.status !== "failed" && guard++ < 90) {
        j = await pollVideo(j, opts);
        patchClip(clip.id, { progress: j.progress });
      }
      if (j.status === "failed") throw new Error(j.error || "Fehlgeschlagen.");
      patchClip(clip.id, { status: "done", progress: 100, videoUrl: j.videoUrl });
    } catch (e: any) {
      patchClip(clip.id, { status: "error", error: e.message });
    }
  }

  /** Kick off all 6 clips at once (one per script act) and the VO track. */
  async function generateAllClips() {
    if (!script) return;
    setBusy(true);
    setError(null);
    const opts = { live };
    const motion =
      recs.find((r) => r.style.id === chosenStyle)?.style.motionLevel ?? "medium";

    const initial: AdClip[] = script.scenes.map((s) => ({
      id: s.id,
      label: s.label,
      startSec: s.startSec,
      endSec: s.endSec,
      prompt: `${s.visual}\n\nSzene: ${s.voiceOver}`,
      status: "queued",
      progress: 0,
    }));
    setClips(initial);
    setStep(4);

    try {
      // All clips fire in parallel — the user gets all 6 at once.
      await Promise.all(initial.map((c) => runClip(c, motion, opts)));
      const vo = await generateGermanVoiceOver(script);
      setVoiceOver(vo);
      setStep(5);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep(1);
    setAwareness(null);
    setRecs([]);
    setScript(null);
    setClips([]);
    setVoiceOver(null);
    setError(null);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="flex items-center gap-3 mb-2">
        <Sparkles className="text-accent" />
        <h1 className="text-2xl font-extrabold">Ad Studio — AI Video-Generator</h1>
      </header>
      <p className="text-muted text-sm mb-6">
        Produktbild + Brand Copy → Trend- & Awareness-Analyse → Script →
        Kling-Frames → fertiges Video.
      </p>

      <Stepper step={step} />

      {error && (
        <div className="card p-4 my-4 flex items-center gap-2 text-red-400 border-red-500/40">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* STEP 1 — INPUT */}
      {step === 1 && (
        <div className="card p-6 grid gap-5 mt-4">
          <Field label="Produkt-Image (JPG/PNG)">
            <div
              className="border border-dashed border-line rounded-xl p-6 grid place-items-center cursor-pointer hover:bg-panel2"
              onClick={() => fileRef.current?.click()}
            >
              {image ? (
                <img src={image} alt="Produkt" className="max-h-48 rounded-lg" />
              ) : (
                <div className="text-muted flex flex-col items-center gap-2">
                  <Upload /> Bild hochladen
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
            </div>
          </Field>
          <Field label="Brand Copy (Elevator Pitch & USP)">
            <textarea
              className="input min-h-28"
              value={brandCopy}
              onChange={(e) => setBrandCopy(e.target.value)}
              placeholder="Was ist das Produkt, was macht es einzigartig?"
            />
          </Field>
          <Field label="Zielgruppe (Ideal Customer Profile)">
            <input
              className="input"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="z.B. Frauen 25–40, hautbewusst, Premium-affin"
            />
          </Field>
          <Field label="Produktkategorie">
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as AdCategory)}
            >
              {AD_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <KeyBox
            live={live}
            keyInput={keyInput}
            setKeyInput={setKeyInput}
            onSave={() => {
              saveKlingKey(keyInput);
              setLive(true);
              setKeyInput("");
            }}
            onToggle={() => setLive((v) => !v && hasKlingKey())}
          />
          <button className="btn-primary justify-self-start" onClick={runAnalysis}>
            <Wand2 size={16} /> Awareness analysieren
          </button>
        </div>
      )}

      {/* STEP 2 — ANALYSIS + STYLE */}
      {step === 2 && awareness && (
        <div className="grid gap-4 mt-4">
          <AwarenessCard a={awareness} />
          <div className="card p-6">
            <h3 className="font-bold mb-1">Top Ad-Styles (Performance-Score)</h3>
            <p className="text-xs text-muted mb-4">
              Gewichtet aus Trend-Score, Kategorie-Fit und Awareness-Fit.
            </p>
            <div className="grid gap-3">
              {recs.slice(0, 6).map((r, i) => (
                <button
                  key={r.style.id}
                  onClick={() => setChosenStyle(r.style.id)}
                  className={`text-left card p-4 transition ${
                    chosenStyle === r.style.id ? "border-accent" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {i < 3 && <span className="text-accent">#{i + 1} </span>}
                      {r.style.name}
                    </span>
                    <span className="chip">{r.score}/100</span>
                  </div>
                  <p className="text-xs text-muted mt-1">{r.style.description}</p>
                  <p className="text-[11px] text-muted mt-1">{r.reasons.join(" · ")}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn-ghost" onClick={() => setStep(1)}>Zurück</button>
              <button className="btn-primary" disabled={!chosenStyle} onClick={buildScript}>
                Script generieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 — SCRIPT */}
      {step === 3 && script && (
        <div className="card p-6 mt-4">
          <h3 className="font-bold mb-1">Script ({script.durationSec}s)</h3>
          <p className="text-xs text-muted mb-4">
            6-Akt-Struktur, psychologisch optimiert für Awareness-Stufe „{script.awareness}".
          </p>
          <div className="grid gap-3">
            {script.scenes.map((s) => (
              <div key={s.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-accent">{s.label}</span>
                  <span className="chip">{s.startSec}–{s.endSec}s</span>
                </div>
                <p className="text-sm mt-2"><b>VO:</b> {s.voiceOver}</p>
                <p className="text-xs text-muted mt-1"><b>Visual:</b> {s.visual}</p>
                <p className="text-[11px] text-muted mt-1">
                  🎬 {s.cameraDirection} · 🔀 {s.transition} · 🔊 {s.soundCue}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-5">
            <button className="btn-ghost" onClick={() => setStep(2)}>Zurück</button>
            <button className="btn-primary" disabled={busy} onClick={generateAllClips}>
              <Film size={16} /> Alle 6 Clips generieren
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 / 5 — PARALLEL CLIP GENERATION + RESULTS */}
      {(step === 4 || step === 5) && (
        <div className="card p-6 mt-4 grid gap-5">
          <div className="flex items-center gap-2">
            {step === 5 ? (
              <span className="flex items-center gap-2 text-green-400">
                <CheckCircle2 /> <h3 className="font-bold">Alle Clips fertig — 16:9 · MP4 · 🇩🇪 Deutsch</h3>
              </span>
            ) : (
              <h3 className="font-bold">6 Clips generieren parallel…</h3>
            )}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clips.map((c) => (
              <ClipCard key={c.id} clip={c} />
            ))}
          </div>

          {voiceOver && (
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Deutsche Voice-Over-Tonspur</span>
                <button
                  className="btn-outline !py-1"
                  onClick={() => previewGermanVoiceOver(voiceOver)}
                >
                  <Play size={14} /> Hochdeutsch anhören
                </button>
              </div>
              {voiceOver.audioUrl && (
                <audio src={voiceOver.audioUrl} controls className="w-full mt-3" />
              )}
            </div>
          )}

          {step === 5 && (
            <div className="flex gap-2">
              <button className="btn-outline" onClick={generateAllClips} disabled={busy}>
                <RefreshCw size={16} /> Neu generieren
              </button>
              <button className="btn-ghost" onClick={reset}>Neu starten</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ["Input", "Analyse", "Script", "Render", "Export"];
  return (
    <div className="flex items-center gap-2 text-xs">
      {labels.map((l, i) => {
        const n = (i + 1) as Step;
        const active = step >= n;
        return (
          <div key={l} className="flex items-center gap-2">
            <span
              className={`grid place-items-center w-6 h-6 rounded-full font-bold ${
                active ? "bg-accent text-black" : "bg-panel2 text-muted"
              }`}
            >
              {n}
            </span>
            <span className={active ? "" : "text-muted"}>{l}</span>
            {i < labels.length - 1 && <span className="text-muted">›</span>}
          </div>
        );
      })}
    </div>
  );
}

function AwarenessCard({ a }: { a: AwarenessProfile }) {
  const meta = awarenessMeta(a.level);
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">
          Awareness-Stufe: <span className="text-accent">{a.label}</span>
        </h3>
        <span className="chip">{Math.round(a.confidence * 100)}% Konfidenz</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 mt-3 text-sm">
        <Info title="Pain Focus" value={meta.painFocus} />
        <Info title="Copy-Strategie" value={meta.copyStrategy} />
        <Info title="Tonalität" value={meta.tone} />
      </div>
    </div>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="text-[11px] text-muted uppercase tracking-wide">{title}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function ClipCard({ clip }: { clip: AdClip }) {
  const badge = {
    queued: ["Warteschlange", "text-muted"],
    generating: ["Rendert…", "text-accent"],
    done: ["Fertig", "text-green-400"],
    error: ["Fehler", "text-red-400"],
  } as const;
  const [label, cls] = badge[clip.status];
  const sim = clip.videoUrl?.startsWith("simulated://");
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm text-accent">{clip.label}</span>
        <span className={`chip ${cls}`}>{label}</span>
      </div>
      {clip.status === "done" && clip.videoUrl && !sim ? (
        <video src={clip.videoUrl} controls className="rounded-lg w-full aspect-video object-cover" />
      ) : clip.status === "done" && sim ? (
        <div className="rounded-lg aspect-video bg-panel2 grid place-items-center text-muted text-xs">
          <span className="text-center"><Play size={28} className="mx-auto mb-1" />Simulierte Vorschau</span>
        </div>
      ) : clip.status === "error" ? (
        <div className="rounded-lg aspect-video bg-panel2 grid place-items-center text-red-400 text-[11px] p-2 text-center">
          {clip.error}
        </div>
      ) : (
        <div className="rounded-lg aspect-video bg-panel2 overflow-hidden relative animate-pulse">
          <div
            className="absolute bottom-0 left-0 h-1 bg-accent transition-all"
            style={{ width: `${clip.progress}%` }}
          />
        </div>
      )}
      {clip.status === "done" && clip.videoUrl && !sim && (
        <a className="btn-outline !py-1 justify-center" href={clip.videoUrl} download>
          Clip herunterladen (MP4)
        </a>
      )}
    </div>
  );
}

function KeyBox({
  live,
  keyInput,
  setKeyInput,
  onSave,
}: {
  live: boolean;
  keyInput: string;
  setKeyInput: (v: string) => void;
  onSave: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="card p-4 border-line">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
        <KeyRound size={15} /> Kling API-Key
        <span className={`chip ${live ? "text-green-400" : "text-muted"}`}>
          {live ? "Live-Modus" : "Simulation"}
        </span>
      </div>
      <p className="text-[11px] text-muted mb-2">
        Der Key wird nur lokal gespeichert (nie im Code). Ohne Key läuft die
        Pipeline im Simulationsmodus. Für Produktion über einen Backend-Proxy
        leiten.
      </p>
      <div className="flex gap-2">
        <input
          className="input"
          type="password"
          placeholder="kling-…"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
        />
        <button className="btn-outline" disabled={!keyInput} onClick={onSave}>
          Speichern
        </button>
      </div>
    </div>
  );
}
