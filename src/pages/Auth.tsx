import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, ShieldCheck } from "lucide-react";
import { useStore } from "../context/StoreContext";

export default function Auth({ mode }: { mode: "login" | "signup" }) {
  const { login, signup } = useStore();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const res = mode === "login" ? login(email, pw) : signup(name, email, pw);
    if (!res.ok) return setErr(res.error || "Fehler");
    nav("/dashboard");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="text-center mb-6">
        <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand shadow-glow mx-auto mb-3"><Zap size={22} /></span>
        <h1 className="text-2xl font-bold">{mode === "login" ? "Willkommen zurück" : "Konto erstellen"}</h1>
        <p className="text-muted text-sm mt-1">
          {mode === "login" ? "Melde dich an, um weiterzumachen." : "In 30 Sekunden startklar — keine E-Mail-Bestätigung nötig."}
        </p>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Max Mustermann" required />
          </div>
        )}
        <div>
          <label className="label">E-Mail</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="du@beispiel.de" required />
        </div>
        <div>
          <label className="label">Passwort</label>
          <input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" required />
        </div>
        {err && <div className="text-sm text-hot bg-hot/10 border border-hot/30 rounded-lg px-3 py-2">{err}</div>}
        <button className="btn-primary w-full">{mode === "login" ? "Anmelden" : "Konto kostenlos erstellen"}</button>

        {mode === "signup" && (
          <p className="text-[11px] text-muted flex items-start gap-1.5">
            <ShieldCheck size={13} className="text-accent mt-0.5 shrink-0" />
            Du kannst sofort loslegen. Das <b className="text-white mx-1">Verify-Badge</b> erhältst du erst nach optionaler Verifizierung.
          </p>
        )}
      </form>

      <div className="text-center text-sm text-muted mt-4">
        {mode === "login" ? (
          <>Noch kein Konto? <Link to="/signup" className="text-brand-soft hover:underline">Registrieren</Link></>
        ) : (
          <>Schon ein Konto? <Link to="/login" className="text-brand-soft hover:underline">Anmelden</Link></>
        )}
      </div>
      {mode === "login" && (
        <div className="card p-3 mt-5 text-xs text-muted text-center">
          Demo-Login: <b className="text-white">maxbrandt@postproshop.io</b> / <b className="text-white">demo1234</b>
        </div>
      )}
    </div>
  );
}
