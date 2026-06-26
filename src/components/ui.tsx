import { CheckCircle2, Flame } from "lucide-react";
import { trustColor, trustLabel } from "../lib/format";

export function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className="rounded-full grid place-items-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, #0a0b0f)`, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

export function VerifyBadge({ size = 16 }: { size?: number }) {
  return <CheckCircle2 size={size} className="text-accent shrink-0" aria-label="Verifiziert" />;
}

export function TrustBadge({ score, mini }: { score: number; mini?: boolean }) {
  const c = trustColor(score);
  if (mini)
    return (
      <span className="chip" style={{ color: c, borderColor: c + "55", background: c + "14" }}>
        <span className="font-bold">{score}</span> Trust
      </span>
    );
  return (
    <div className="flex items-center gap-2">
      <div className="relative grid place-items-center" style={{ width: 46, height: 46 }}>
        <svg width="46" height="46" className="-rotate-90">
          <circle cx="23" cy="23" r="19" stroke="#262a36" strokeWidth="5" fill="none" />
          <circle cx="23" cy="23" r="19" stroke={c} strokeWidth="5" fill="none" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 119} 119`} />
        </svg>
        <span className="absolute text-xs font-bold">{score}</span>
      </div>
      <div className="leading-tight">
        <div className="text-xs text-muted">Trust-Score</div>
        <div className="text-sm font-semibold" style={{ color: c }}>{trustLabel(score)}</div>
      </div>
    </div>
  );
}

export function HotTag() {
  return (
    <span className="chip tag-hot">
      <Flame size={13} /> HOT
    </span>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  );
}

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-6 animate-pop max-h-[90vh] overflow-auto scroll-thin" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
