import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Lock, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Modal } from "../components/ui";
import { Plan } from "../lib/types";

const PLANS = [
  { id: "free" as Plan, name: "Free", price: 0, tag: "Zum Reinschnuppern",
    perks: ["1 aktives Inserat", "Basis-Suche", "Chat mit Verkäufern", "Trust-Score sichtbar"] },
  { id: "basic" as Plan, name: "Basic", price: 29, tag: "Für aktive Verkäufer",
    perks: ["5 aktive Inserate", "Hervorgehobene Inserate", "Deal-Room & NDA", "Trust-Boost +8", "E-Mail-Support"] },
  { id: "pro" as Plan, name: "Pro", price: 99, tag: "Maximale Reichweite", popular: true,
    perks: ["Unbegrenzte Inserate", "Hot-Platzierung & Top-Feed", "Prioritäts-Verifizierung", "Trust-Boost +15", "Analytics-Dashboard", "Telefon-Support"] },
];

// --- Stripe Checkout integration point ---
// In production: call your backend POST /create-checkout-session with the priceId,
// then redirect via stripe.redirectToCheckout({ sessionId }). Keys live server-side.
// const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PK);

export default function Pricing() {
  const { me, subscribe, pushToast } = useStore();
  const nav = useNavigate();
  const [checkout, setCheckout] = useState<Plan | null>(null);

  const choose = (plan: Plan) => {
    if (!me) return nav("/login");
    if (plan === "free") { subscribe("free"); return; }
    setCheckout(plan);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">Wähle deinen Plan</h1>
        <p className="text-muted mt-2">Mehr Reichweite, mehr Deals. Jederzeit kündbar.</p>
        {me && <div className="chip mx-auto w-fit mt-3">Aktuell: <b className="ml-1 text-white">{me.plan.toUpperCase()}</b></div>}
      </div>

      <div className="grid md:grid-cols-3 gap-5 items-start">
        {PLANS.map((p) => (
          <div key={p.id} className={`card p-6 relative ${p.popular ? "border-brand shadow-glow" : ""}`}>
            {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip bg-brand text-white border-brand">Beliebt</span>}
            <div className="text-sm text-muted">{p.tag}</div>
            <div className="text-xl font-bold">{p.name}</div>
            <div className="mt-3 mb-5">
              <span className="text-4xl font-extrabold">{p.price}€</span>
              <span className="text-muted text-sm">/Monat</span>
            </div>
            <button onClick={() => choose(p.id)} disabled={me?.plan === p.id}
              className={`w-full ${p.popular ? "btn-primary" : "btn-outline"} ${me?.plan === p.id ? "opacity-50" : ""}`}>
              {me?.plan === p.id ? "Aktiver Plan" : p.price === 0 ? "Auswählen" : "Jetzt abonnieren"}
            </button>
            <ul className="mt-5 space-y-2.5">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="text-accent mt-0.5 shrink-0" /> {perk}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <CheckoutModal plan={checkout} onClose={() => setCheckout(null)}
        onPaid={(plan) => { subscribe(plan); setCheckout(null); }} />
    </div>
  );
}

function CheckoutModal({ plan, onClose, onPaid }: { plan: Plan | null; onClose: () => void; onPaid: (p: Plan) => void }) {
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState("");
  const meta = PLANS.find((p) => p.id === plan);
  if (!plan || !meta) return null;

  const pay = () => {
    setLoading(true);
    // Simulated Stripe Checkout redirect/confirmation.
    setTimeout(() => { setLoading(false); onPaid(plan); }, 1400);
  };

  const fmt = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  return (
    <Modal open={!!plan} onClose={onClose}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 font-bold text-lg"><CreditCard size={18} className="text-brand-soft" /> Sichere Zahlung</div>
        <span className="chip text-xs"><Lock size={12} /> Stripe</span>
      </div>
      <p className="text-sm text-muted mb-5">{meta.name}-Abo · <b className="text-white">{meta.price}€/Monat</b></p>

      <div className="space-y-3">
        <div>
          <label className="label">Karteninformationen</label>
          <input className="input" placeholder="4242 4242 4242 4242" value={card} onChange={(e) => setCard(fmt(e.target.value))} inputMode="numeric" />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input className="input" placeholder="MM / JJ" />
            <input className="input" placeholder="CVC" />
          </div>
        </div>
        <input className="input" placeholder="Name auf der Karte" />
      </div>

      <button onClick={pay} disabled={loading} className="btn-primary w-full mt-5">
        {loading ? <><Loader2 size={16} className="animate-spin" /> Zahlung wird verarbeitet…</> : <>{meta.price}€ jetzt bezahlen</>}
      </button>
      <p className="text-[11px] text-muted text-center mt-3 flex items-center justify-center gap-1">
        <ShieldCheck size={12} className="text-accent" /> Testmodus — keine echte Belastung. Stripe-Keys serverseitig anbinden.
      </p>
    </Modal>
  );
}
