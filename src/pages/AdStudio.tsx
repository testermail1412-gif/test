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
  AwarenessProfile,
  KlingFrame,
  KlingVideoJob,
  StyleRecommendation,
} from "../lib/adgen/types";
import {
  analyzeAwareness,
  recommendStyles,
  generateScript,
  framedPrompt,
  awarenessMeta,
} from "../lib/adgen/engine";
import {
  generateFrame,
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

  // Step 4 — frames + video
  const [frames, setFrames] = useState<KlingFrame[]>([]);
  const [job, setJob] = useState<KlingVideoJob | null>(null);
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

  async function generateVideo() {
    if (!script) return;
    setBusy(true);
    setError(null);
    const opts = { live };
    try {
      // 1. Keyframes
      let hook: KlingFrame = {
        role: "hook",
        prompt: framedPrompt(script, "hook", input),
        status: "generating",
      };
      let cta: KlingFrame = {
        role: "cta",
        prompt: framedPrompt(script, "cta", input),
        status: "generating",
      };
      setFrames([hook, cta]);
      setStep(4);

      hook = await generateFrame(hook, image, opts);
      setFrames([hook, cta]);
      cta = await generateFrame(cta, image, opts);
      setFrames([hook, cta]);

      if (hook.status === "error" || cta.status === "error") {
        throw new Error(hook.error || cta.error || "Frame-Generierung fehlgeschlagen.");
      }

      // 2. Video
      const motion =
        recs.find((r) => r.style.id === chosenStyle)?.style.motionLevel ?? "medium";
      let j = await createVideoJob(
        {
          prompt: script.scenes.map((s) => s.voiceOver).join(" "),
          startFrame: hook.imageUrl,
          endFrame: cta.imageUrl,
          durationSec: script.durationSec,
          motionLevel: motion,
        },
        opts,
      );
      setJob(j);

      // 3. Poll
      let guard = 0;
      while (j.status !== "succeeded" && j.status !== "failed" && guard++ < 60) {
        j = await pollVideo(j, opts);
        setJob({ ...j });
      }
      if (j.status === "failed") throw new Error(j.error || "Video fehlgeschlagen.");

      // 4. Deutsche Voice-Over-Tonspur (perfektes Hochdeutsch) synthetisieren.
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
    setFrames([]);
    setJob(null);
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
            <button className="btn-primary" disabled={busy} onClick={generateVideo}>
              <Film size={16} /> Frames & Video generieren
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — GENERATION PROGRESS */}
      {step === 4 && (
        <div className="card p-6 mt-4 grid gap-5">
          <h3 className="font-bold">Generierung läuft…</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {frames.map((f) => (
              <div key={f.role} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold capitalize">{f.role}-Frame</span>
                  <FrameBadge status={f.status} />
                </div>
                {f.imageUrl ? (
                  <img src={f.imageUrl} className="rounded-lg max-h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 rounded-lg bg-panel2 animate-pulse" />
                )}
              </div>
            ))}
          </div>
          {job && (
            <div>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>Video-Rendering</span>
                <span>{job.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-panel2 overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 5 — PREVIEW / EXPORT */}
      {step === 5 && job?.videoUrl && (
        <div className="card p-6 mt-4 grid gap-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 /> <h3 className="font-bold">Video fertig — 1080p · 16:9 · MP4 · 🇩🇪 Deutsch</h3>
          </div>
          {job.videoUrl.startsWith("simulated://") ? (
            <div className="aspect-video rounded-xl bg-panel2 grid place-items-center text-muted">
              <div className="text-center">
                <Play size={40} className="mx-auto mb-2" />
                Simulierte Vorschau (kein Live-Key aktiv)
              </div>
            </div>
          ) : (
            <video src={job.videoUrl} controls className="rounded-xl w-full" />
          )}
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
          <div className="flex gap-2">
            <a
              className="btn-primary"
              href={job.videoUrl.startsWith("simulated://") ? undefined : job.videoUrl}
              download
            >
              Exportieren (MP4)
            </a>
            <button className="btn-outline" onClick={generateVideo} disabled={busy}>
              <RefreshCw size={16} /> Variation
            </button>
            <button className="btn-ghost" onClick={reset}>Neu starten</button>
          </div>
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

function FrameBadge({ status }: { status: KlingFrame["status"] }) {
  const map = {
    pending: ["Wartet", "text-muted"],
    generating: ["Generiert…", "text-accent"],
    done: ["Fertig", "text-green-400"],
    error: ["Fehler", "text-red-400"],
  } as const;
  const [label, cls] = map[status];
  return <span className={`chip ${cls}`}>{label}</span>;
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
