import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, MessageSquare, Plus, Search, LogOut, Settings, User as UserIcon, ShieldCheck, Zap } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Avatar, VerifyBadge } from "./ui";
import { ago } from "../lib/format";

export default function Navbar() {
  const { me, logout, unreadCount, unreadNotifs, myNotifications, markAllNotifsRead } = useStore();
  const nav = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const unread = me ? unreadCount() : 0;
  const nUnread = me ? unreadNotifs() : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand shadow-glow"><Zap size={17} /></span>
          Post<span className="text-brand-soft">Pro</span>Shop
        </Link>

        <Link to="/explore" className="hidden md:flex items-center gap-2 text-sm text-muted hover:text-white ml-2">
          <Search size={16} /> Inserate
        </Link>
        <Link to="/pricing" className="hidden md:block text-sm text-muted hover:text-white">Preise</Link>

        <div className="ml-auto flex items-center gap-2">
          {me ? (
            <>
              <Link to="/new" className="btn-primary hidden sm:inline-flex"><Plus size={16} /> Inserieren</Link>

              <Link to="/messages" className="relative btn-ghost !px-2.5" title="Nachrichten">
                <MessageSquare size={18} />
                {unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-hot text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] grid place-items-center px-1 ring-2 ring-bg">
                    {unread}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button onClick={() => { setShowNotifs((s) => !s); if (!showNotifs) markAllNotifsRead(); }} className="relative btn-ghost !px-2.5">
                  <Bell size={18} />
                  {nUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-brand text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] grid place-items-center px-1 ring-2 ring-bg">
                      {nUnread}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)} />
                    <div className="absolute right-0 mt-2 w-80 card p-2 z-20 animate-pop max-h-96 overflow-auto scroll-thin">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted">Benachrichtigungen</div>
                      {myNotifications().length === 0 && <div className="p-4 text-sm text-muted text-center">Noch nichts hier.</div>}
                      {myNotifications().slice(0, 12).map((n) => (
                        <Link to={n.link || "#"} key={n.id} onClick={() => setShowNotifs(false)}
                          className="block px-2.5 py-2 rounded-lg hover:bg-panel2">
                          <div className="text-sm">{n.text}</div>
                          <div className="text-[11px] text-muted">{ago(n.at)}</div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button onClick={() => setShowMenu((s) => !s)} className="flex items-center gap-1.5">
                  <Avatar name={me.name} color={me.avatarColor} size={34} />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 card p-1.5 z-20 animate-pop">
                      <div className="px-3 py-2 flex items-center gap-1.5 border-b border-line mb-1">
                        <span className="font-semibold text-sm truncate">{me.name}</span>
                        {me.verified && <VerifyBadge size={14} />}
                      </div>
                      <MenuItem icon={<UserIcon size={15} />} label="Mein Profil" to={`/u/${me.id}`} onClick={() => setShowMenu(false)} />
                      <MenuItem icon={<Zap size={15} />} label="Dashboard" to="/dashboard" onClick={() => setShowMenu(false)} />
                      <MenuItem icon={<ShieldCheck size={15} />} label="Verifizierung" to="/verify" onClick={() => setShowMenu(false)} />
                      <MenuItem icon={<Settings size={15} />} label="Einstellungen" to="/settings" onClick={() => setShowMenu(false)} />
                      <button onClick={() => { logout(); setShowMenu(false); nav("/"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-panel2 text-sm text-hot">
                        <LogOut size={15} /> Abmelden
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Anmelden</Link>
              <Link to="/signup" className="btn-primary">Kostenlos starten</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon, label, to, onClick }: { icon: React.ReactNode; label: string; to: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-panel2 text-sm">
      {icon} {label}
    </Link>
  );
}
