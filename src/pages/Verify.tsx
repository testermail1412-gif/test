import { useState } from "react";
import { ShieldCheck, Upload, Building2, CreditCard, IdCard, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Field } from "../components/ui";

export default function Verify() {
  const { me, requestVerification, approveVerification } = useStore();
  const [step, setStep] = useState<"form" | "review">(me?.verificationStatus === "pending" ? "review" : "form");
  const [docs, setDocs] = useState<string[]>([]);
  const [legalName, setLegalName] = useState(me?.name || "");
  const [company, setCompany] = useState("");

  if (!me) return null;

  if (me.verified) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <CheckCircle2 size={56} className="text-accent mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Du bist verifiziert ✓</h1>
        <p className="text-muted mt-2">Dein Verify-Badge ist aktiv und dein Trust-Score wurde erhöht. Käufer sehen, dass du geprüft bist.</p>
      </div>
    );
  }

  const submit = () => { requestVerification(); setStep("review"); };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-1"><ShieldCheck className="text-brand-soft" /><h1 className="text-2xl font-bold">Verifizierung</h1></div>
      <p className="text-muted mb-6">Lass deine Identität & Angaben prüfen, um das <b className="text-white">Verify-Badge</b> und mehr Vertrauen zu erhalten.</p>

      {step === "form" ? (
        <div className="card p-6 space-y-5">
          <Field label="Rechtlicher Name"><input className="input" value={legalName} onChange={(e) => setLegalName(e.target.value)} /></Field>
          <Field label="Firma / Selbstständig (optional)"><input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Muster GmbH" /></Field>

          <div>
            <label className="label">Dokumente hochladen</label>
            <div className="space-y-2">
              {[
                { icon: <IdCard size={16} />, label: "Ausweis / Reisepass" },
                { icon: <Building2 size={16} />, label: "Gewerbe- / Handelsregister (optional)" },
                { icon: <CreditCard size={16} />, label: "Umsatznachweis (Stripe/Bank Screenshot)" },
              ].map((d) => {
                const added = docs.includes(d.label);
                return (
                  <button key={d.label} type="button" onClick={() => setDocs((p) => added ? p.filter((x) => x !== d.label) : [...p, d.label])}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-sm text-left ${added ? "border-accent bg-accent/10" : "border-line bg-panel2 hover:border-brand"}`}>
                    {added ? <CheckCircle2 size={16} className="text-accent" /> : <Upload size={16} className="text-muted" />}
                    {d.icon} {d.label}
                    {added && <span className="ml-auto text-xs text-accent">hochgeladen</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={submit} disabled={docs.length === 0} className="btn-primary w-full">
            Zur Prüfung einreichen
          </button>
          <p className="text-[11px] text-muted text-center">Deine Daten werden vertraulich behandelt und nur zur Prüfung verwendet.</p>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Clock size={48} className="text-brand-soft mx-auto mb-4" />
          <h2 className="text-xl font-bold">In Prüfung</h2>
          <p className="text-muted mt-2 mb-6">Deine Angaben werden geprüft. Du wirst benachrichtigt, sobald dein Verify-Badge aktiv ist.</p>
          <button onClick={approveVerification} className="btn-primary w-full">
            <Loader2 size={15} className="animate-spin" /> Prüfung simulieren (Demo: sofort freischalten)
          </button>
        </div>
      )}
    </div>
  );
}
