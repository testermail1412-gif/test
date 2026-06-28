import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapPin, Globe, Calendar, MessageSquare, Star, Briefcase, Clock, ShieldCheck } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Avatar, VerifyBadge, TrustBadge } from "../components/ui";
import PostCard from "../components/PostCard";
import { ago } from "../lib/format";

export default function Profile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { userById, db, me, canMessage, startConversation, reviewsFor, addReview } = useStore();
  const user = id ? userById(id) : undefined;
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  if (!user) return <div className="max-w-3xl mx-auto p-12 text-center text-muted">Profil nicht gefunden.</div>;

  const posts = db.posts.filter((p) => p.ownerId === user.id);
  const isMe = me?.id === user.id;
  const reviews = reviewsFor(user.id);

  const message = () => {
    if (!me) return nav("/login");
    if (!canMessage(user.id)) return;
    nav(`/messages/${startConversation(user.id)}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="card overflow-hidden">
        <div className="h-28" style={{ background: `linear-gradient(120deg, ${user.avatarColor}, #0a0b0f)` }} />
        <div className="p-6 -mt-12">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="ring-4 ring-panel rounded-full"><Avatar name={user.name} color={user.avatarColor} size={88} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                {user.verified ? <VerifyBadge size={20} /> : <span className="chip text-xs text-muted">nicht verifiziert</span>}
                <span className="chip text-xs">{user.plan.toUpperCase()}</span>
              </div>
              <div className="text-muted text-sm">@{user.handle}</div>
            </div>
            <div className="flex gap-2">
              {isMe ? (
                <Link to="/settings" className="btn-outline">Profil bearbeiten</Link>
              ) : canMessage(user.id) ? (
                <button onClick={message} className="btn-primary"><MessageSquare size={16} /> Nachricht senden</button>
              ) : (
                <span className="chip text-xs text-muted">Kontakt nur über Inserate möglich</span>
              )}
            </div>
          </div>

          {user.bio && <p className="text-sm text-muted mt-4 max-w-2xl">{user.bio}</p>}

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted">
            {user.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {user.location}</span>}
            {user.website && <span className="flex items-center gap-1.5"><Globe size={14} /> {user.website}</span>}
            <span className="flex items-center gap-1.5"><Calendar size={14} /> dabei seit {ago(user.createdAt)}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-panel2 rounded-xl p-3"><TrustBadge score={user.trustScore} /></div>
            <Stat icon={<Briefcase size={15} />} label="Deals" value={String(user.stats.deals)} />
            <Stat icon={<Star size={15} />} label="Bewertung" value={user.stats.rating ? `${user.stats.rating}★` : "—"} />
            <Stat icon={<Clock size={15} />} label="Antwortzeit" value={`~${user.stats.responseMin} Min`} />
          </div>
        </div>
      </div>

      {isMe && (
        <Link to="/verify" className="card p-4 mt-5 flex items-center gap-3 hover:border-brand">
          <ShieldCheck className="text-brand-soft" />
          <div className="flex-1">
            <div className="font-semibold text-sm">{user.verified ? "Verifiziert" : "Jetzt verifizieren"}</div>
            <div className="text-xs text-muted">{user.verified ? "Dein Verify-Badge ist aktiv." : "Hol dir das Verify-Badge und mehr Vertrauen."}</div>
          </div>
          {!user.verified && <span className="btn-outline text-xs">Verifizieren →</span>}
        </Link>
      )}

      {/* Reviews */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Star size={18} className="text-yellow-400" /> Bewertungen ({reviews.length})</h2>
        {!isMe && me && (
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star size={20} className={n <= rating ? "fill-yellow-400 text-yellow-400" : "text-line"} />
                </button>
              ))}
            </div>
            <textarea className="input" rows={2} value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder={`Bewerte deine Erfahrung mit ${user.name.split(" ")[0]}…`} />
            <button onClick={() => { if (reviewText.trim()) { addReview(user.id, rating, reviewText.trim()); setReviewText(""); } }}
              className="btn-primary mt-3 text-sm">Bewertung abgeben</button>
          </div>
        )}
        {reviews.length === 0 ? (
          <div className="card p-6 text-center text-muted text-sm">Noch keine Bewertungen.</div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rv) => {
              const author = userById(rv.authorId);
              return (
                <div key={rv.id} className="card p-4 flex gap-3">
                  {author && <Avatar name={author.name} color={author.avatarColor} size={36} />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{author?.name}</span>
                      <span className="flex">{Array.from({ length: rv.rating }).map((_, i) => <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />)}</span>
                      <span className="text-[11px] text-muted ml-auto">{ago(rv.at)}</span>
                    </div>
                    <p className="text-sm text-muted mt-1">{rv.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <h2 className="text-lg font-bold mt-8 mb-4">Inserate von {user.name.split(" ")[0]} ({posts.length})</h2>
      {posts.length === 0 ? (
        <div className="card p-10 text-center text-muted">Noch keine Inserate.</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
      )}
    </div>
  );
}

const Stat = ({ icon, label, value }: any) => (
  <div className="bg-panel2 rounded-xl p-3">
    <div className="text-xs text-muted flex items-center gap-1.5">{icon} {label}</div>
    <div className="text-lg font-bold mt-0.5">{value}</div>
  </div>
);
