import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Flame, MessageSquare, FileText, Lock, Eye, Calendar, Cpu, CheckCircle2, ShieldCheck } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Avatar, VerifyBadge, TrustBadge, HotTag, Modal, Field } from "../components/ui";
import { eur, ago } from "../lib/format";

export default function PostDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { postById, userById, me, isSaved, toggleHot, startConversation, sendMessage, canMessage, makeOffer } = useStore();
  const post = id ? postById(id) : undefined;
  const [exposeOpen, setExposeOpen] = useState(false);
  const [exposeMsg, setExposeMsg] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMsg, setOfferMsg] = useState("");

  if (!post) return <div className="max-w-3xl mx-auto p-12 text-center text-muted">Inserat nicht gefunden.</div>;
  const owner = userById(post.ownerId)!;
  const saved = isSaved(post.id);
  const mine = me?.id === post.ownerId;

  const contact = (prefill?: string) => {
    if (!me) return nav("/login");
    if (!canMessage(owner.id)) return;
    const cid = startConversation(owner.id, post.id);
    if (prefill) sendMessage(cid, prefill);
    nav(`/messages/${cid}`);
  };

  const requestExpose = () => {
    contact(`📄 Exposé-Anfrage zu „${post.title}". ${exposeMsg}`.trim());
    setExposeOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="h-44 rounded-xl2 relative mb-6 overflow-hidden" style={{ background: `linear-gradient(135deg, ${post.image}, #0a0b0f 85%)` }}>
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="chip bg-bg/70">{post.category}</span>
          {post.hot && <HotTag />}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted mt-2">
              <span className="flex items-center gap-1"><Eye size={14} /> {post.views} Aufrufe</span>
              <span className="flex items-center gap-1"><Calendar size={14} /> {ago(post.createdAt)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Metric label="Verkaufspreis" value={eur(post.price)} hl />
            <Metric label="MRR" value={eur(post.mrr)} />
            <Metric label="Gewinn / Monat" value={eur(post.profit)} />
            <Metric label="Multiple" value={`${(post.price / (post.profit * 12 || 1)).toFixed(1)}x`} />
            <Metric label="Alter" value={`${post.age} Mon.`} />
            <Metric label="Marge" value={`${Math.round((post.profit / (post.mrr || 1)) * 100)}%`} />
          </div>

          <Section title="Beschreibung"><p className="text-sm leading-relaxed text-muted whitespace-pre-wrap">{post.description}</p></Section>

          {post.highlights.length > 0 && (
            <Section title="Highlights">
              <ul className="grid sm:grid-cols-2 gap-2">
                {post.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 size={15} className="text-accent shrink-0" /> {h}</li>
                ))}
              </ul>
            </Section>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <InfoRow icon={<Cpu size={15} />} label="Tech-Stack" value={post.techStack || "—"} />
            <InfoRow icon={<FileText size={15} />} label="Verkaufsgrund" value={post.reasonForSale || "—"} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-20">
            <Link to={`/u/${owner.id}`} className="flex items-center gap-3">
              <Avatar name={owner.name} color={owner.avatarColor} size={46} />
              <div className="min-w-0">
                <div className="font-semibold flex items-center gap-1.5">{owner.name} {owner.verified && <VerifyBadge size={15} />}</div>
                <div className="text-xs text-muted">@{owner.handle} · {owner.stats.deals} Deals</div>
              </div>
            </Link>
            <div className="mt-4 p-3 bg-panel2 rounded-xl"><TrustBadge score={owner.trustScore} /></div>

            {mine ? (
              <div className="mt-4 text-sm text-muted text-center">Das ist dein Inserat.</div>
            ) : (
              <div className="mt-4 space-y-2.5">
                <button onClick={() => setExposeOpen(true)} className="btn-primary w-full"><FileText size={16} /> Exposé anfordern</button>
                <button onClick={() => me ? setOfferOpen(true) : nav("/login")} className="btn-outline w-full">💰 Angebot machen</button>
                <button onClick={() => contact()} className="btn-outline w-full"><MessageSquare size={16} /> Nachricht senden</button>
                <button onClick={() => me ? toggleHot(post.id) : nav("/login")}
                  className={`btn-ghost w-full ${saved ? "text-hot" : ""}`}>
                  <Flame size={16} className={saved ? "fill-hot" : ""} /> {saved ? "Aus Hot-Liste entfernen" : "Als Hot merken"}
                </button>
                <p className="text-[11px] text-muted text-center flex items-center justify-center gap-1 pt-1">
                  <ShieldCheck size={12} className="text-accent" /> NDA-geschützter Deal-Room nach Kontakt
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={exposeOpen} onClose={() => setExposeOpen(false)} title="Exposé anfordern">
        <p className="text-sm text-muted mb-4">
          Fordere das vollständige Exposé mit Finanzkennzahlen an. Der Verkäufer erhält deine Anfrage und gibt
          nach NDA-Signatur Zugriff auf den Deal-Room.
        </p>
        <Field label="Kurze Nachricht (optional)">
          <textarea value={exposeMsg} onChange={(e) => setExposeMsg(e.target.value)} rows={3} className="input"
            placeholder="Stelle dich kurz vor und sag, warum du Interesse hast…" />
        </Field>
        <button onClick={requestExpose} className="btn-primary w-full mt-4">Exposé-Anfrage senden</button>
      </Modal>

      <Modal open={offerOpen} onClose={() => setOfferOpen(false)} title="Angebot abgeben">
        <p className="text-sm text-muted mb-4">
          Listenpreis: <b className="text-white">{eur(post.price)}</b>. Gib dein verbindliches Kaufangebot ab — der
          Verkäufer kann annehmen oder ablehnen.
        </p>
        <Field label="Dein Angebot (€)">
          <input className="input" type="number" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} placeholder={String(post.price)} />
        </Field>
        <div className="mt-3">
          <Field label="Nachricht (optional)">
            <textarea className="input" rows={2} value={offerMsg} onChange={(e) => setOfferMsg(e.target.value)} placeholder="Begründe dein Angebot…" />
          </Field>
        </div>
        <button onClick={() => { if (+offerAmount > 0) { makeOffer(post.id, +offerAmount, offerMsg); setOfferOpen(false); setOfferAmount(""); setOfferMsg(""); } }}
          className="btn-primary w-full mt-4">Angebot senden</button>
      </Modal>
    </div>
  );
}

const Metric = ({ label, value, hl }: { label: string; value: string; hl?: boolean }) => (
  <div className="card p-3.5">
    <div className="text-[11px] text-muted uppercase tracking-wide">{label}</div>
    <div className={`text-lg font-bold ${hl ? "text-accent" : ""}`}>{value}</div>
  </div>
);
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div><h3 className="font-bold mb-2">{title}</h3>{children}</div>
);
const InfoRow = ({ icon, label, value }: any) => (
  <div className="card p-3.5">
    <div className="text-xs text-muted flex items-center gap-1.5 mb-1">{icon} {label}</div>
    <div className="text-sm font-medium">{value}</div>
  </div>
);
