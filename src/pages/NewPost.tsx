import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Sparkles } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Field } from "../components/ui";
import { CATEGORIES, Category } from "../lib/types";

export default function NewPost() {
  const { createPost, me } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState({
    title: "", category: "E-Commerce" as Category, price: "", mrr: "", profit: "",
    description: "", techStack: "", reasonForSale: "", age: "",
  });
  const [highlights, setHighlights] = useState<string[]>([]);
  const [hl, setHl] = useState("");
  const [color, setColor] = useState("#6d5efc");
  const set = (k: keyof typeof f) => (e: any) => setF({ ...f, [k]: e.target.value });

  const limit = me?.plan === "pro" ? Infinity : me?.plan === "basic" ? 5 : 1;
  const colors = ["#6d5efc", "#22d3a8", "#ff7a59", "#39a0ed", "#e74c9b", "#f5b400"];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    const id = createPost({
      title: f.title, category: f.category,
      price: +f.price || 0, mrr: +f.mrr || 0, profit: +f.profit || 0,
      description: f.description, techStack: f.techStack, reasonForSale: f.reasonForSale,
      age: +f.age || 0, highlights, image: color,
    });
    nav(`/post/${id}`);
  };

  const addHl = () => { if (hl.trim() && highlights.length < 6) { setHighlights([...highlights, hl.trim()]); setHl(""); } };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="text-brand-soft" /> Neues Inserat erstellen</h1>
      <p className="text-muted mt-1 mb-2">Veröffentliche dein Online-Business pro Kategorie.</p>
      {limit !== Infinity && (
        <div className="card p-3 mb-6 text-sm text-muted">
          Dein <b className="text-white">{me?.plan?.toUpperCase()}</b>-Plan erlaubt bis zu {limit} aktive Inserate.{" "}
          <a href="/pricing" className="text-brand-soft hover:underline">Upgrade →</a>
        </div>
      )}

      <form onSubmit={submit} className="card p-6 space-y-5">
        <Field label="Titel des Inserats">
          <input className="input" value={f.title} onChange={set("title")} placeholder="z.B. Profitabler DTC Skincare Shop" required />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Kategorie">
            <select className="input" value={f.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Alter (Monate)"><input type="number" className="input" value={f.age} onChange={set("age")} placeholder="24" /></Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Verkaufspreis (€)"><input type="number" className="input" value={f.price} onChange={set("price")} placeholder="50000" /></Field>
          <Field label="MRR (€)"><input type="number" className="input" value={f.mrr} onChange={set("mrr")} placeholder="8000" /></Field>
          <Field label="Gewinn / Monat (€)"><input type="number" className="input" value={f.profit} onChange={set("profit")} placeholder="3200" /></Field>
        </div>

        <Field label="Beschreibung">
          <textarea className="input" rows={4} value={f.description} onChange={set("description")} placeholder="Beschreibe dein Business, die Zahlen und was übergeben wird…" />
        </Field>

        <Field label="Highlights" hint={'Bis zu 6 — z.B. 3.2x ROAS, 38% Wiederkäufer'}>
          <div className="flex gap-2">
            <input className="input" value={hl} onChange={(e) => setHl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHl(); } }} placeholder="Highlight eingeben…" />
            <button type="button" onClick={addHl} className="btn-ghost"><Plus size={16} /></button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {highlights.map((h, i) => (
              <span key={i} className="chip">{h}
                <button type="button" onClick={() => setHighlights(highlights.filter((_, j) => j !== i))}><X size={12} /></button>
              </span>
            ))}
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Tech-Stack"><input className="input" value={f.techStack} onChange={set("techStack")} placeholder="Shopify, Klaviyo…" /></Field>
          <Field label="Verkaufsgrund"><input className="input" value={f.reasonForSale} onChange={set("reasonForSale")} placeholder="Fokus auf neues Projekt" /></Field>
        </div>

        <Field label="Cover-Farbe">
          <div className="flex gap-2">
            {colors.map((c) => (
              <button type="button" key={c} onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-lg ${color === c ? "ring-2 ring-white" : ""}`} style={{ background: c }} />
            ))}
          </div>
        </Field>

        <button type="submit" className="btn-primary w-full">Inserat veröffentlichen</button>
      </form>
    </div>
  );
}
