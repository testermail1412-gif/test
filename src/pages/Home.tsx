import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Gauge, ArrowRight, Flame, Search, FileSignature, BadgeCheck } from "lucide-react";
import { useStore } from "../context/StoreContext";
import PostCard from "../components/PostCard";
import { CATEGORIES } from "../lib/types";

export default function Home() {
  const { db } = useStore();
  const hot = db.posts.filter((p) => p.hot).slice(0, 3);
  const fresh = db.posts.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="chip mx-auto w-fit mb-5"><span className="w-2 h-2 rounded-full bg-accent ring-live" /> 1.240+ geprüfte Inserate live</div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
          Kaufe & verkaufe<br /><span className="bg-gradient-to-r from-brand-soft to-accent bg-clip-text text-transparent">profitable Online-Businesses</span>
        </h1>
        <p className="text-muted max-w-2xl mx-auto mt-5 text-lg">
          Der sichere Marktplatz mit Trust-Score, verifizierten Anbietern, NDA-Deal-Rooms und
          direktem Chat. Vom E-Commerce-Shop bis zum SaaS — sauber abgewickelt.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-7">
          <Link to="/explore" className="btn-primary"><Search size={17} /> Inserate ansehen</Link>
          <Link to="/new" className="btn-outline">Business inserieren <ArrowRight size={16} /></Link>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 justify-center mt-9 text-sm text-muted">
          <Trust icon={<ShieldCheck size={16} className="text-accent" />} t="Verifizierte Verkäufer" />
          <Trust icon={<Gauge size={16} className="text-brand-soft" />} t="Transparenter Trust-Score" />
          <Trust icon={<Lock size={16} className="text-brand-soft" />} t="NDA-geschützte Deal-Rooms" />
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((c) => (
            <Link key={c} to={`/explore?cat=${encodeURIComponent(c)}`} className="chip hover:border-brand">{c}</Link>
          ))}
        </div>
      </section>

      {/* Hot */}
      <section className="max-w-7xl mx-auto px-4 mt-14">
        <div className="flex items-center gap-2 mb-5">
          <Flame className="text-hot" /> <h2 className="text-xl font-bold">Hot gerade</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 stagger">
          {hot.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">So läuft ein sicherer Deal</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Step n="1" icon={<Search />} t="Finden" d="Durchsuche geprüfte Inserate nach Kategorie & Trust-Score." />
          <Step n="2" icon={<FileSignature />} t="NDA signieren" d="Im Deal-Room NDA unterschreiben & Unterlagen erhalten." />
          <Step n="3" icon={<Lock />} t="Prüfen" d="Dokumente, Zahlen & KPIs sicher im Deal-Room einsehen." />
          <Step n="4" icon={<BadgeCheck />} t="Abschließen" d="Deal sauber über die Plattform abwickeln." />
        </div>
      </section>

      {/* Fresh */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Neue Inserate</h2>
          <Link to="/explore" className="text-sm text-brand-soft hover:underline">Alle ansehen →</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-5 stagger">
          {fresh.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      </section>

      {/* Tools */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/tools" className="card p-6 lift">
            <div className="text-2xl mb-2">🧮</div>
            <div className="font-bold">KI-Unternehmensbewertung</div>
            <p className="text-sm text-muted mt-1">Schätze den Marktwert deines Business in Sekunden.</p>
          </Link>
          <Link to="/tools" className="card p-6 lift">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-bold">Margen- & ROI-Rechner</div>
            <p className="text-sm text-muted mt-1">Kalkuliere Gewinnmarge und Amortisation auf einen Blick.</p>
          </Link>
          <Link to="/pricing" className="card p-6 lift">
            <div className="text-2xl mb-2">🚀</div>
            <div className="font-bold">Pro-Reichweite</div>
            <p className="text-sm text-muted mt-1">Top-Platzierung, Analytics und Prioritäts-Verifizierung.</p>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <div className="card p-10 text-center bg-gradient-to-br from-brand/15 to-transparent">
          <h2 className="text-2xl md:text-3xl font-bold">Bereit, dein Business zu verkaufen?</h2>
          <p className="text-muted mt-2">Erstelle in 2 Minuten ein Inserat und erreiche tausende geprüfte Käufer.</p>
          <Link to="/new" className="btn-primary mt-5">Jetzt kostenlos inserieren</Link>
        </div>
      </section>
    </div>
  );
}

const Trust = ({ icon, t }: { icon: React.ReactNode; t: string }) => (
  <span className="flex items-center gap-2">{icon} {t}</span>
);
const Step = ({ n, icon, t, d }: any) => (
  <div className="card p-5">
    <div className="flex items-center gap-2 text-brand-soft mb-2">{icon}<span className="text-xs font-bold text-muted">SCHRITT {n}</span></div>
    <div className="font-bold">{t}</div>
    <p className="text-sm text-muted mt-1">{d}</p>
  </div>
);
