import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { useStore } from "../context/StoreContext";
import PostCard from "../components/PostCard";
import { CATEGORIES, Category } from "../lib/types";

export default function Explore() {
  const { db, userById } = useStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "price" | "trust" | "mrr">("new");
  const [minTrust, setMinTrust] = useState(0);
  const cat = (params.get("cat") as Category | "Alle") || "Alle";

  const list = useMemo(() => {
    let l = db.posts.filter((p) => {
      if (cat !== "Alle" && p.category !== cat) return false;
      if (q && !(`${p.title} ${p.description} ${p.category}`.toLowerCase().includes(q.toLowerCase()))) return false;
      const owner = userById(p.ownerId);
      if (owner && owner.trustScore < minTrust) return false;
      return true;
    });
    l = [...l].sort((a, b) => {
      if (sort === "price") return b.price - a.price;
      if (sort === "mrr") return b.mrr - a.mrr;
      if (sort === "trust") return (userById(b.ownerId)?.trustScore || 0) - (userById(a.ownerId)?.trustScore || 0);
      return b.createdAt - a.createdAt;
    });
    return l;
  }, [db.posts, cat, q, sort, minTrust, userById]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Inserate durchsuchen</h1>
      <p className="text-muted mb-5">{list.length} Online-Businesses zum Verkauf</p>

      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suche nach Titel, Nische, Tech…" className="input !pl-9" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="input md:w-48">
            <option value="new">Neueste zuerst</option>
            <option value="price">Höchster Preis</option>
            <option value="mrr">Höchster MRR</option>
            <option value="trust">Höchster Trust-Score</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button onClick={() => setParams({})} className={`chip ${cat === "Alle" ? "border-brand text-brand-soft" : ""}`}>Alle</button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setParams({ cat: c })} className={`chip ${cat === c ? "border-brand text-brand-soft" : ""}`}>{c}</button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted">
            <SlidersHorizontal size={14} /> Min. Trust: <span className="font-bold text-white">{minTrust}</span>
            <input type="range" min={0} max={95} value={minTrust} onChange={(e) => setMinTrust(+e.target.value)} className="accent-brand" />
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center text-muted">Keine Inserate gefunden. Passe deine Filter an.</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {list.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
}
