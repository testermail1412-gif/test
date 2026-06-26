import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Send, Phone, PhoneOff, Mic, MicOff, FileSignature, Upload, FileText, Lock,
  ShieldCheck, CheckCircle2, ChevronRight, Briefcase, X, Paperclip
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Avatar, VerifyBadge, TrustBadge, Modal } from "../components/ui";
import { clock, ago } from "../lib/format";
import { Conversation } from "../lib/types";

export default function Messages() {
  const { convId } = useParams();
  const nav = useNavigate();
  const { me, conversationsForMe, userById, markRead } = useStore();
  const convs = conversationsForMe();
  const active = convId ? convs.find((c) => c.id === convId) : convs[0];

  useEffect(() => { if (active) markRead(active.id); }, [active?.id, active?.messages.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="card grid md:grid-cols-[300px_1fr] overflow-hidden h-[78vh]">
        {/* List */}
        <aside className="border-r border-line overflow-y-auto scroll-thin">
          <div className="p-4 font-bold border-b border-line">Nachrichten</div>
          {convs.length === 0 && (
            <div className="p-6 text-sm text-muted text-center">
              Noch keine Chats. Du kannst Verkäufer über ihre Inserate kontaktieren.
            </div>
          )}
          {convs.map((c) => {
            const other = userById(c.participants.find((p) => p !== me!.id)!)!;
            const last = c.messages[c.messages.length - 1];
            const unread = c.messages.filter((m) => m.from !== me!.id && !m.read).length;
            return (
              <Link key={c.id} to={`/messages/${c.id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-panel2 ${active?.id === c.id ? "bg-panel2" : ""}`}>
                <Avatar name={other.name} color={other.avatarColor} size={42} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <span className="truncate">{other.name}</span>{other.verified && <VerifyBadge size={12} />}
                  </div>
                  <div className="text-xs text-muted truncate">{last ? (last.kind === "call" ? "📞 Anruf" : last.text) : "Neuer Chat"}</div>
                </div>
                {unread > 0 && <span className="bg-hot text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] grid place-items-center px-1">{unread}</span>}
              </Link>
            );
          })}
        </aside>

        {/* Chat */}
        {active ? <ChatPane key={active.id} conv={active} /> : (
          <div className="grid place-items-center text-muted">Wähle einen Chat aus.</div>
        )}
      </div>
    </div>
  );
}

function ChatPane({ conv }: { conv: Conversation }) {
  const { me, userById, sendMessage, postById } = useStore();
  const other = userById(conv.participants.find((p) => p !== me!.id)!)!;
  const post = conv.postId ? postById(conv.postId) : undefined;
  const [text, setText] = useState("");
  const [showDeal, setShowDeal] = useState(false);
  const [call, setCall] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conv.messages.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(conv.id, text.trim());
    setText("");
  };

  return (
    <section className="flex flex-col min-w-0 relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
        <Link to={`/u/${other.id}`}><Avatar name={other.name} color={other.avatarColor} size={40} /></Link>
        <div className="flex-1 min-w-0">
          <div className="font-semibold flex items-center gap-1.5">{other.name} {other.verified && <VerifyBadge size={14} />}
            <span className="ml-1"><TrustBadge score={other.trustScore} mini /></span>
          </div>
          {other.settings.showOnline && <div className="text-xs text-accent flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Online</div>}
        </div>
        <button onClick={() => setCall(true)} className="btn-ghost !px-2.5" title="Anrufen"><Phone size={17} /></button>
        <button onClick={() => setShowDeal((s) => !s)} className="btn-outline text-xs"><Lock size={14} /> Deal-Room</button>
      </div>

      {post && (
        <Link to={`/post/${post.id}`} className="flex items-center gap-2 px-4 py-2 bg-panel2 border-b border-line text-xs hover:bg-line">
          <Briefcase size={14} className="text-brand-soft" /> Zu: <b className="text-white">{post.title}</b> <ChevronRight size={14} className="ml-auto" />
        </Link>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-2.5">
        {conv.messages.length === 0 && <div className="text-center text-muted text-sm mt-8">Sag Hallo 👋</div>}
        {conv.messages.map((m) => {
          const mine = m.from === me!.id;
          if (m.kind === "call")
            return (
              <div key={m.id} className="flex justify-center">
                <span className="chip text-xs"><Phone size={12} /> Anruf · {m.callMeta?.duration}s</span>
              </div>
            );
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${mine ? "bg-brand text-white rounded-br-sm" : "bg-panel2 rounded-bl-sm"}`}>
                <div className="whitespace-pre-wrap break-words">{m.text}</div>
                <div className={`text-[10px] mt-0.5 ${mine ? "text-white/70" : "text-muted"}`}>{clock(m.at)}{mine && (m.read ? " · gelesen" : " · gesendet")}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form onSubmit={submit} className="flex items-center gap-2 p-3 border-t border-line">
        <button type="button" className="btn-ghost !px-2.5" title="Datei (im Deal-Room)" onClick={() => setShowDeal(true)}><Paperclip size={17} /></button>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Nachricht schreiben…" />
        <button className="btn-primary !px-3.5"><Send size={17} /></button>
      </form>

      {showDeal && <DealRoom conv={conv} onClose={() => setShowDeal(false)} />}
      {call && <CallOverlay other={other} onEnd={(dur) => { sendMessage(conv.id, "", "call", { duration: dur, missed: false }); setCall(false); }} />}
    </section>
  );
}

function DealRoom({ conv, onClose }: { conv: Conversation; onClose: () => void }) {
  const { me, signNDA, uploadDoc, advanceStage, userById } = useStore();
  const room = conv.dealRoom;
  const signed = !!room?.ndaSignedBy.includes(me!.id);
  const bothSigned = (room?.ndaSignedBy.length || 0) >= 2;
  const stages = ["nda", "documents", "negotiation", "closing"] as const;
  const stageIdx = stages.indexOf(room?.stage || "nda");

  const fakeUpload = () => {
    const names = ["P&L_2024.pdf", "Traffic_Analytics.xlsx", "Lieferanten_Liste.pdf", "Stripe_Auszug.pdf"];
    const n = names[Math.floor(Math.random() * names.length)];
    uploadDoc(conv.id, n, `${(Math.random() * 3 + 0.4).toFixed(1)} MB`);
  };

  return (
    <div className="absolute inset-0 bg-bg/95 backdrop-blur-sm flex flex-col animate-pop z-20">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
        <Lock size={17} className="text-brand-soft" /><span className="font-bold">Deal-Room</span>
        <span className="chip text-xs ml-1"><ShieldCheck size={12} className="text-accent" /> NDA-geschützt</span>
        <button onClick={onClose} className="ml-auto text-muted hover:text-white"><X size={18} /></button>
      </div>

      <div className="overflow-y-auto scroll-thin p-5 space-y-5">
        {/* Stages */}
        <div className="flex items-center justify-between text-xs">
          {["NDA", "Dokumente", "Verhandlung", "Abschluss"].map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full grid place-items-center font-bold ${i <= stageIdx ? "bg-brand text-white" : "bg-panel2 text-muted"}`}>
                {i < stageIdx ? <CheckCircle2 size={15} /> : i + 1}
              </div>
              <span className={i <= stageIdx ? "text-white" : "text-muted"}>{s}</span>
            </div>
          ))}
        </div>

        {/* NDA */}
        <div className="card p-5">
          <div className="flex items-center gap-2 font-bold mb-2"><FileSignature size={17} className="text-brand-soft" /> Vertraulichkeitsvereinbarung (NDA)</div>
          <p className="text-sm text-muted mb-3">
            Bevor sensible Unterlagen geteilt werden, bestätigen beide Parteien die Vertraulichkeit aller
            ausgetauschten Geschäftsinformationen. Mit dem Signieren stimmst du den NDA-Bedingungen zu.
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {conv.participants.map((pid) => {
              const u = userById(pid)!;
              const has = room?.ndaSignedBy.includes(pid);
              return <span key={pid} className={`chip text-xs ${has ? "text-accent border-accent/40 bg-accent/10" : ""}`}>
                {has ? <CheckCircle2 size={12} /> : <FileSignature size={12} />} {u.name}: {has ? "signiert" : "ausstehend"}
              </span>;
            })}
          </div>
          {signed ? (
            <div className="text-sm text-accent flex items-center gap-2"><CheckCircle2 size={16} /> Du hast das NDA signiert.</div>
          ) : (
            <button onClick={() => signNDA(conv.id)} className="btn-primary w-full"><FileSignature size={16} /> NDA jetzt signieren</button>
          )}
        </div>

        {/* Documents */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold"><FileText size={17} className="text-brand-soft" /> Dokumente</div>
            <button disabled={!bothSigned} onClick={fakeUpload} className={`btn-outline text-xs ${!bothSigned ? "opacity-40" : ""}`}>
              <Upload size={14} /> Hochladen
            </button>
          </div>
          {!bothSigned ? (
            <div className="text-sm text-muted flex items-center gap-2"><Lock size={15} /> Dokumente werden freigeschaltet, sobald beide Parteien das NDA signiert haben.</div>
          ) : room!.documents.length === 0 ? (
            <div className="text-sm text-muted">Noch keine Dokumente. Lade P&L, Analytics oder Verträge hoch.</div>
          ) : (
            <div className="space-y-2">
              {room!.documents.map((d) => (
                <div key={d.id} className="flex items-center gap-3 bg-panel2 rounded-xl px-3 py-2.5">
                  <FileText size={18} className="text-brand-soft" />
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{d.name}</div>
                    <div className="text-[11px] text-muted">{d.size} · {userById(d.by)?.name.split(" ")[0]} · {ago(d.at)}</div></div>
                  <button className="text-xs text-brand-soft hover:underline">Ansehen</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Closing CTA */}
        {bothSigned && (
          <button onClick={() => advanceStage(conv.id, stageIdx < 3 ? stages[stageIdx + 1] : "closing")}
            className="btn-primary w-full">
            {stageIdx < 3 ? "Nächste Phase →" : "Deal abschließen 🤝"}
          </button>
        )}
      </div>
    </div>
  );
}

function CallOverlay({ other, onEnd }: { other: any; onEnd: (dur: number) => void }) {
  const [sec, setSec] = useState(0);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<"ringing" | "active">("ringing");

  useEffect(() => {
    const t = setTimeout(() => setState("active"), 1800);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (state !== "active") return;
    const i = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [state]);

  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  return (
    <div className="absolute inset-0 z-30 bg-bg/97 backdrop-blur flex flex-col items-center justify-center gap-6 animate-pop">
      <div className={state === "ringing" ? "ring-live rounded-full" : ""}>
        <Avatar name={other.name} color={other.avatarColor} size={104} />
      </div>
      <div className="text-center">
        <div className="text-xl font-bold flex items-center gap-1.5 justify-center">{other.name} {other.verified && <VerifyBadge size={18} />}</div>
        <div className="text-muted mt-1">{state === "ringing" ? "Wird angerufen…" : `Im Gespräch · ${mm}:${ss}`}</div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setMuted((m) => !m)} className={`w-14 h-14 rounded-full grid place-items-center ${muted ? "bg-line" : "bg-panel2"}`}>
          {muted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <button onClick={() => onEnd(sec)} className="w-16 h-16 rounded-full grid place-items-center bg-hot text-white"><PhoneOff size={26} /></button>
      </div>
      <p className="text-[11px] text-muted">Sprachanruf direkt im Chat — verschlüsselt & ohne Telefonnummer.</p>
    </div>
  );
}
