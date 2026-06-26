import { Link } from "react-router-dom";
import { Flame, Eye, TrendingUp } from "lucide-react";
import { Post } from "../lib/types";
import { useStore } from "../context/StoreContext";
import { Avatar, VerifyBadge, TrustBadge, HotTag } from "./ui";
import { eur, ago } from "../lib/format";

export default function PostCard({ post }: { post: Post }) {
  const { userById, isSaved, toggleHot, me } = useStore();
  const owner = userById(post.ownerId);
  const saved = isSaved(post.id);

  return (
    <div className="card overflow-hidden hover:border-brand/60 transition group">
      <Link to={`/post/${post.id}`}>
        <div className="h-28 relative" style={{ background: `linear-gradient(135deg, ${post.image}, #0a0b0f 80%)` }}>
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="chip bg-bg/70">{post.category}</span>
            {post.hot && <HotTag />}
          </div>
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/post/${post.id}`} className="font-bold leading-snug hover:text-brand-soft">{post.title}</Link>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <Stat label="Preis" value={eur(post.price)} hl />
          <Stat label="MRR" value={eur(post.mrr)} />
          <Stat label="Gewinn" value={eur(post.profit)} />
        </div>
        <div className="flex items-center gap-2 mt-4">
          {owner && (
            <Link to={`/u/${owner.id}`} className="flex items-center gap-2 min-w-0">
              <Avatar name={owner.name} color={owner.avatarColor} size={26} />
              <span className="text-xs font-medium truncate flex items-center gap-1">
                {owner.name} {owner.verified && <VerifyBadge size={12} />}
              </span>
            </Link>
          )}
          {owner && <span className="ml-auto"><TrustBadge score={owner.trustScore} mini /></span>}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-line text-xs text-muted">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Eye size={13} /> {post.views}</span>
            <span className="flex items-center gap-1"><TrendingUp size={13} /> {ago(post.createdAt)}</span>
          </span>
          {me && (
            <button onClick={() => toggleHot(post.id)}
              className={`flex items-center gap-1 font-semibold ${saved ? "text-hot" : "text-muted hover:text-hot"}`}>
              <Flame size={14} className={saved ? "fill-hot" : ""} /> {saved ? "Gemerkt" : "Hot"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hl }: { label: string; value: string; hl?: boolean }) {
  return (
    <div className="bg-panel2 rounded-lg py-1.5">
      <div className="text-[10px] text-muted uppercase tracking-wide">{label}</div>
      <div className={`text-xs font-bold ${hl ? "text-accent" : ""}`}>{value}</div>
    </div>
  );
}
