import { useState } from "react";
import { Calculator, Sparkles, TrendingUp, FileText, Percent, Wand2, Receipt, FileSignature, Printer, Plus, Trash2 } from "lucide-react";
import { Field } from "../components/ui";
import { valuate } from "../lib/valuation";
import { CATEGORIES, Category } from "../lib/types";
import { eur } from "../lib/format";

export default function Tools() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 stagger">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 font-display"><Wand2 className="text-brand-soft" /> Unternehmer-Tools</h1>
        <p className="text-muted mt-1">Kostenlose Werkzeuge für jede Branche — direkt im Browser, ohne Anmeldung.</p>
      </div>
      <ValuationTool />
      <div className="grid md:grid-cols-2 gap-6">
        <MarginTool />
        <RoiTool />
      </div>
      <InvoiceTool />
      <ContractTool />
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

function InvoiceTool() {
  const [from, setFrom] = useState("Meine Firma GmbH");
  const [to, setTo] = useState("Kunde AG");
  const [nr, setNr] = useState("2026-001");
  const [vat, setVat] = useState("19");
  const [items, setItems] = useState([{ desc: "Beratungsleistung", qty: 1, price: 1200 }]);
  const net = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = net * (+vat / 100);
  const set = (i: number, k: string, v: any) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 font-bold text-lg mb-1"><Receipt className="text-brand-soft" size={20} /> Rechnungs-Generator</div>
      <p className="text-sm text-muted mb-5">Erstelle in Sekunden eine saubere Rechnung — drucken oder als PDF speichern.</p>
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <Field label="Von"><input className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="An"><input className="input" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <Field label="Rechnungs-Nr."><input className="input" value={nr} onChange={(e) => setNr(e.target.value)} /></Field>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px_100px_32px] gap-2 items-center">
            <input className="input" value={it.desc} onChange={(e) => set(i, "desc", e.target.value)} placeholder="Position" />
            <input className="input" type="number" value={it.qty} onChange={(e) => set(i, "qty", +e.target.value)} />
            <input className="input" type="number" value={it.price} onChange={(e) => set(i, "price", +e.target.value)} />
            <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-muted hover:text-hot"><Trash2 size={16} /></button>
          </div>
        ))}
        <button onClick={() => setItems([...items, { desc: "", qty: 1, price: 0 }])} className="btn-ghost text-xs"><Plus size={14} /> Position</button>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <Field label="MwSt %"><input className="input !w-24" value={vat} onChange={(e) => setVat(e.target.value)} /></Field>
        <div className="ml-auto text-right text-sm">
          <div className="text-muted">Netto: <b className="text-white">{eur(net)}</b></div>
          <div className="text-muted">MwSt: <b className="text-white">{eur(tax)}</b></div>
          <div className="text-lg font-bold text-accent">Gesamt: {eur(net + tax)}</div>
        </div>
      </div>
      <button onClick={() => printInvoice({ from, to, nr, items, net, tax, vat })} className="btn-primary w-full mt-4"><Printer size={16} /> Rechnung drucken / als PDF</button>
    </div>
  );
}

function printInvoice(d: any) {
  const rows = d.items.map((i: any) => `<tr><td>${i.desc}</td><td style="text-align:right">${i.qty}</td><td style="text-align:right">${i.price.toLocaleString("de-DE")} €</td><td style="text-align:right">${(i.qty * i.price).toLocaleString("de-DE")} €</td></tr>`).join("");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<html><head><title>Rechnung ${d.nr}</title><style>body{font-family:Inter,Arial,sans-serif;padding:48px;color:#111}h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:10px;border-bottom:1px solid #eee;text-align:left}.tot{text-align:right;margin-top:16px;font-size:18px}</style></head><body><div style="display:flex;justify-content:space-between"><div><h1>Rechnung</h1><p>Nr. ${d.nr}</p></div><div style="text-align:right"><b>${d.from}</b><br>an: ${d.to}<br>${new Date().toLocaleDateString("de-DE")}</div></div><table><tr><th>Position</th><th style="text-align:right">Menge</th><th style="text-align:right">Preis</th><th style="text-align:right">Summe</th></tr>${rows}</table><div class="tot">Netto: ${d.net.toLocaleString("de-DE")} €<br>MwSt (${d.vat}%): ${d.tax.toLocaleString("de-DE")} €<br><b>Gesamt: ${(d.net + d.tax).toLocaleString("de-DE")} €</b></div><p style="margin-top:40px;color:#888;font-size:12px">Erstellt mit WND Connect</p></body></html>`);
  w.document.close(); w.print();
}

function ContractTool() {
  const templates: Record<string, string> = {
    "NDA (Geheimhaltung)": "VERTRAULICHKEITSVEREINBARUNG (NDA)\n\nZwischen [Partei A] und [Partei B] wird Folgendes vereinbart:\n\n1. Beide Parteien verpflichten sich, alle im Rahmen der Geschäftsanbahnung ausgetauschten Informationen streng vertraulich zu behandeln.\n2. Die Informationen dürfen ausschließlich zum Zweck der Prüfung einer möglichen Zusammenarbeit verwendet werden.\n3. Die Vertraulichkeit gilt für 3 Jahre ab Unterzeichnung.\n\nOrt, Datum: ____________   Unterschrift: ____________",
    "Freelancer-Vertrag": "DIENSTLEISTUNGSVERTRAG\n\nAuftraggeber: [Name]\nAuftragnehmer: [Name]\n\n1. Leistung: [Beschreibung]\n2. Vergütung: [Betrag] € zzgl. MwSt.\n3. Zahlungsziel: 14 Tage nach Rechnung.\n4. Nutzungsrechte gehen nach vollständiger Zahlung über.\n\nOrt, Datum: ____________   Unterschriften: ____________",
    "Kaufvertrag (Unternehmen)": "UNTERNEHMENSKAUFVERTRAG (Eckdaten)\n\nVerkäufer: [Name]\nKäufer: [Name]\nKaufgegenstand: [Unternehmen/Assets]\nKaufpreis: [Betrag] €\n\n1. Übergabe erfolgt nach vollständiger Kaufpreiszahlung.\n2. Verkäufer sichert die Richtigkeit der übergebenen Kennzahlen zu.\n3. Gewährleistung & Wettbewerbsverbot gemäß Anlage.\n\nOrt, Datum: ____________   Unterschriften: ____________",
  };
  const [sel, setSel] = useState(Object.keys(templates)[0]);
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 font-bold text-lg mb-1"><FileSignature className="text-brand-soft" size={20} /> Vertrags-Vorlagen</div>
      <p className="text-sm text-muted mb-4">Sofort einsatzbereite Vorlagen — anpassen, kopieren, unterschreiben. (Keine Rechtsberatung.)</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.keys(templates).map((t) => (
          <button key={t} onClick={() => setSel(t)} className={`chip ${sel === t ? "border-brand text-brand-soft" : ""}`}>{t}</button>
        ))}
      </div>
      <pre className="bg-panel2 rounded-xl p-4 text-xs whitespace-pre-wrap text-muted max-h-60 overflow-auto scroll-thin">{templates[sel]}</pre>
      <button onClick={() => navigator.clipboard?.writeText(templates[sel])} className="btn-outline w-full mt-3"><FileText size={15} /> In Zwischenablage kopieren</button>
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
