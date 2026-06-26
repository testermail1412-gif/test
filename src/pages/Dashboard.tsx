import { Link } from "react-router-dom";
import { Flame, Eye, FileText, TrendingUp, Plus, ShieldCheck } from "lucide-react";
import { useStore } from "../context/StoreContext";
import PostCard from "../components/PostCard";
import { TrustBadge } from "../components/ui";
import { eur } from "../lib/format";

export default function Dashboard() {
  const { me, db, savedPostsForMe } = useStore();
  if (!me) return null;
  const myPosts = db.posts.filter((p) => p.ownerId === me.id);
  const saved = savedPostsForMe();
  const totalViews = myPosts.reduce((n, p) => n + p.views, 0);
  const savedByOthers = db.saved.filter((s) => myPosts.some((p) => p.id === s.postId)).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hallo, {me.name.split(" ")[0]} 👋</h1>
          <p className="text-muted text-sm">Hier ist dein Überblick.</p>
        </div>
        <Link to="/new" className="btn-primary"><Plus size={16} /> Neues Inserat</Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4"><TrustBadge score={me.trustScore} /></div>
        <KPI icon={<FileText className="text-brand-soft" />} label="Aktive Inserate" value={String(myPosts.length)} />
        <KPI icon={<Eye className="text-brand-soft" />} label="Aufrufe gesamt" value={String(totalViews)} />
        <KPI icon={<Flame className="text-hot" />} label="Als Hot gemerkt" value={String(savedByOthers)} />
      </div>

      {!me.verified && (
        <Link to="/verify" className="card p-4 mb-8 flex items-center gap-3 bg-gradient-to-r from-brand/15 to-transparent hover:border-brand">
          <ShieldCheck className="text-brand-soft" />
          <div className="flex-1"><div className="font-semibold text-sm">Verifiziere dein Profil</div>
            <div className="text-xs text-muted">+20 Trust-Score und das Verify-Badge für mehr Käufer-Vertrauen.</div></div>
          <span className="btn-outline text-xs">Los geht's →</span>
        </Link>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-bold mb-3 flex items-center gap-2"><TrendingUp size={18} /> Meine Inserate</h2>
          {myPosts.length === 0 ? (
            <div className="card p-8 text-center text-muted">Noch keine Inserate. <Link to="/new" className="text-brand-soft">Jetzt erstellen →</Link></div>
          ) : (
            <div className="space-y-4">{myPosts.map((p) => <PostCard key={p.id} post={p} />)}</div>
          )}
        </div>
        <div>
          <h2 className="font-bold mb-3 flex items-center gap-2"><Flame size={18} className="text-hot" /> Meine Hot-Liste</h2>
          {saved.length === 0 ? (
            <div className="card p-8 text-center text-muted">Du hast noch keine Inserate als Hot gemerkt.</div>
          ) : (
            <div className="space-y-4">{saved.map((p) => <PostCard key={p.id} post={p} />)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

const KPI = ({ icon, label, value }: any) => (
  <div className="card p-4">
    <div className="flex items-center gap-2 text-xs text-muted">{icon} {label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </div>
);
