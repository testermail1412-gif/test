import { useState } from "react";
import { Calculator, Sparkles, TrendingUp, FileText, Percent, Wand2 } from "lucide-react";
import { Field } from "../components/ui";
import { valuate } from "../lib/valuation";
import { CATEGORIES, Category } from "../lib/types";
import { eur } from "../lib/format";

export default function Tools() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Wand2 className="text-brand-soft" /> Unternehmer-Tools</h1>
        <p className="text-muted mt-1">Kostenlose Werkzeuge, die jeder Gründer braucht — direkt im Browser.</p>
      </div>
      <ValuationTool />
      <div className="grid md:grid-cols-2 gap-6">
        <MarginTool />
        <RoiTool />
      </div>
    </div>
  );
}

function ValuationTool() {
  const [category, setCategory] = useState<Category>("SaaS");
  const [mrr, setMrr] = useState("12000");
  const [profit, setProfit] = useState("7000");
  const [age, setAge] = useState("24");
  const [growth, setGrowth] = useState("15");
  const r = valuate({ category, mrr: +mrr || 0, profit: +profit || 0, ageMonths: +age || 0, growthPct: +growth || 0 });

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 font-bold text-lg mb-1"><Calculator className="text-brand-soft" size={20} /> KI-Unternehmensbewertung</div>
      <p className="text-sm text-muted mb-5">Schätze den Marktwert deines Online-Business in Sekunden.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Kategorie"><select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="MRR (€)"><input className="input" value={mrr} onChange={(e) => setMrr(e.target.value)} inputMode="numeric" /></Field>
        <Field label="Gewinn / Monat (€)"><input className="input" value={profit} onChange={(e) => setProfit(e.target.value)} inputMode="numeric" /></Field>
        <Field label="Alter (Monate)"><input className="input" value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" /></Field>
        <Field label="Wachstum / Jahr (%)"><input className="input" value={growth} onChange={(e) => setGrowth(e.target.value)} inputMode="numeric" /></Field>
      </div>
      <div className="mt-5 p-5 rounded-xl2 bg-gradient-to-br from-brand/15 to-transparent border border-line">
        <div className="text-xs text-muted flex items-center gap-1.5"><Sparkles size={13} className="text-accent" /> Geschätzte Bewertung ({r.multiple}× Jahresgewinn)</div>
        <div className="text-3xl font-extrabold mt-1 text-accent">{eur(r.mid)}</div>
        <div className="text-sm text-muted mt-1">Spanne: {eur(r.low)} – {eur(r.high)}</div>
        <div className="mt-3 h-2 rounded-full bg-panel2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand to-accent" style={{ width: "70%" }} />
        </div>
        <p className="text-[11px] text-muted mt-3">Richtwert auf Basis branchenüblicher Multiples — keine Finanzberatung.</p>
      </div>
    </div>
  );
}

function MarginTool() {
  const [rev, setRev] = useState("10000");
  const [cost, setCost] = useState("6200");
  const margin = +rev > 0 ? ((+rev - +cost) / +rev) * 100 : 0;
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 font-bold mb-4"><Percent className="text-brand-soft" size={18} /> Margen-Rechner</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Umsatz (€)"><input className="input" value={rev} onChange={(e) => setRev(e.target.value)} inputMode="numeric" /></Field>
        <Field label="Kosten (€)"><input className="input" value={cost} onChange={(e) => setCost(e.target.value)} inputMode="numeric" /></Field>
      </div>
      <div className="mt-4 text-center">
        <div className="text-xs text-muted">Gewinnmarge</div>
        <div className="text-2xl font-bold text-accent">{margin.toFixed(1)}%</div>
        <div className="text-sm text-muted">Gewinn: {eur(+rev - +cost)}</div>
      </div>
    </div>
  );
}

function RoiTool() {
  const [invest, setInvest] = useState("50000");
  const [monthly, setMonthly] = useState("3200");
  const months = +monthly > 0 ? +invest / +monthly : 0;
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 font-bold mb-4"><TrendingUp className="text-brand-soft" size={18} /> Amortisations-Rechner</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kaufpreis (€)"><input className="input" value={invest} onChange={(e) => setInvest(e.target.value)} inputMode="numeric" /></Field>
        <Field label="Gewinn / Monat (€)"><input className="input" value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="numeric" /></Field>
      </div>
      <div className="mt-4 text-center">
        <div className="text-xs text-muted">Break-even nach</div>
        <div className="text-2xl font-bold text-accent">{months ? months.toFixed(1) : "—"} Monaten</div>
        <div className="text-sm text-muted">≈ {months ? (months / 12).toFixed(1) : "—"} Jahre</div>
      </div>
    </div>
  );
}
