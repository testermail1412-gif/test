import { X, MessageSquare, CheckCircle2, Info } from "lucide-react";
import { useStore } from "../context/StoreContext";

export default function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2.5 w-[330px]">
      {toasts.map((t) => (
        <div key={t.id} className="card p-3.5 animate-pop flex gap-3 shadow-glow">
          <div className="mt-0.5">
            {t.kind === "message" ? <MessageSquare size={18} className="text-brand-soft" /> :
             t.kind === "success" ? <CheckCircle2 size={18} className="text-accent" /> :
             <Info size={18} className="text-brand-soft" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{t.title}</div>
            <div className="text-xs text-muted truncate">{t.body}</div>
          </div>
          <button onClick={() => dismissToast(t.id)} className="text-muted hover:text-white"><X size={15} /></button>
        </div>
      ))}
    </div>
  );
}
