import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { DB, User, Post, Conversation, Notification, Message, Plan, Category } from "../lib/types";
import { seedDB } from "../lib/seed";

const KEY = "pps_db_v1";
const uid = () => Math.random().toString(36).slice(2, 10);

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const db = seedDB();
  localStorage.setItem(KEY, JSON.stringify(db));
  return db;
}

interface Toast { id: string; title: string; body: string; kind: "info" | "success" | "message" }

interface Ctx {
  db: DB;
  me: User | null;
  toasts: Toast[];
  dismissToast: (id: string) => void;
  pushToast: (t: Omit<Toast, "id">) => void;
  // auth
  signup: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateMe: (patch: Partial<User>) => void;
  requestVerification: () => void;
  approveVerification: () => void; // demo: instant approve
  subscribe: (plan: Plan) => void;
  // posts
  createPost: (p: Partial<Post>) => string;
  toggleHot: (postId: string) => void;
  isSaved: (postId: string) => boolean;
  userById: (id: string) => User | undefined;
  postById: (id: string) => Post | undefined;
  savedPostsForMe: () => Post[];
  // messaging
  canMessage: (otherId: string) => boolean;
  startConversation: (otherId: string, postId?: string) => string;
  sendMessage: (convId: string, text: string, kind?: Message["kind"], callMeta?: Message["callMeta"]) => void;
  conversationsForMe: () => Conversation[];
  markRead: (convId: string) => void;
  unreadCount: () => number;
  // deal room
  signNDA: (convId: string) => void;
  uploadDoc: (convId: string, name: string, size: string) => void;
  advanceStage: (convId: string, stage: NonNullable<Conversation["dealRoom"]>["stage"]) => void;
  // notifications
  myNotifications: () => Notification[];
  markAllNotifsRead: () => void;
  unreadNotifs: () => number;
}

const StoreContext = createContext<Ctx | null>(null);
export const useStore = () => {
  const c = useContext(StoreContext);
  if (!c) throw new Error("StoreProvider missing");
  return c;
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dbRef = useRef(db);
  dbRef.current = db;

  const persist = useCallback((next: DB) => {
    dbRef.current = next;
    setDb(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const me = db.currentUserId ? db.users.find((u) => u.id === db.currentUserId) ?? null : null;

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = uid();
    setToasts((p) => [...p, { ...t, id }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 5200);
  }, []);
  const dismissToast = (id: string) => setToasts((p) => p.filter((x) => x.id !== id));

  const notify = (userId: string, type: Notification["type"], text: string, link?: string) => {
    const n: Notification = { id: uid(), userId, type, text, at: Date.now(), read: false, link };
    return n;
  };

  // ---------- auth ----------
  const signup: Ctx["signup"] = (name, email, password) => {
    const d = dbRef.current;
    if (d.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
      return { ok: false, error: "E-Mail bereits registriert." };
    if (password.length < 6) return { ok: false, error: "Passwort min. 6 Zeichen." };
    const handle = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14) || "user" + uid().slice(0, 4);
    const colors = ["#6d5efc", "#22d3a8", "#ff7a59", "#39a0ed", "#e74c9b", "#f5b400"];
    const u: User = {
      id: "u_" + uid(), name, handle, email, password,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      bio: "", location: "", website: "", verified: false, verificationStatus: "none",
      plan: "free", trustScore: 50, createdAt: Date.now(),
      settings: { showOnline: true, emailNotifs: true, desktopNotifs: true, twoFactor: false },
      stats: { deals: 0, rating: 0, responseMin: 60 },
    };
    persist({ ...d, users: [...d.users, u], currentUserId: u.id });
    return { ok: true };
  };

  const login: Ctx["login"] = (email, password) => {
    const d = dbRef.current;
    const u = d.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!u || u.password !== password) return { ok: false, error: "Falsche E-Mail oder Passwort." };
    persist({ ...d, currentUserId: u.id });
    return { ok: true };
  };

  const logout = () => persist({ ...dbRef.current, currentUserId: null });

  const updateMe = (patch: Partial<User>) => {
    const d = dbRef.current;
    if (!d.currentUserId) return;
    persist({ ...d, users: d.users.map((u) => (u.id === d.currentUserId ? { ...u, ...patch } : u)) });
  };

  const requestVerification = () => updateMe({ verificationStatus: "pending" });
  const approveVerification = () => {
    const d = dbRef.current;
    if (!d.currentUserId) return;
    const ns = notify(d.currentUserId, "verify", "🎉 Dein Profil wurde verifiziert. Du hast jetzt das Verify-Badge!");
    persist({
      ...d,
      users: d.users.map((u) =>
        u.id === d.currentUserId ? { ...u, verified: true, verificationStatus: "verified", trustScore: Math.min(100, u.trustScore + 20) } : u
      ),
      notifications: [ns, ...d.notifications],
    });
    pushToast({ title: "Verifiziert ✓", body: "Dein Verify-Badge ist aktiv.", kind: "success" });
  };

  const subscribe = (plan: Plan) => {
    const d = dbRef.current;
    if (!d.currentUserId) return;
    const bump = plan === "pro" ? 15 : plan === "basic" ? 8 : 0;
    persist({
      ...d,
      users: d.users.map((u) =>
        u.id === d.currentUserId ? { ...u, plan, trustScore: Math.min(100, u.trustScore + bump) } : u
      ),
    });
    pushToast({ title: "Zahlung erfolgreich", body: `${plan.toUpperCase()}-Abo ist aktiv 🚀`, kind: "success" });
  };

  // ---------- posts ----------
  const createPost: Ctx["createPost"] = (p) => {
    const d = dbRef.current;
    const id = "p_" + uid();
    const post: Post = {
      id, ownerId: d.currentUserId!,
      title: p.title || "Unbenanntes Inserat",
      category: (p.category as Category) || "Sonstiges",
      price: p.price || 0, mrr: p.mrr || 0, profit: p.profit || 0,
      description: p.description || "", highlights: p.highlights || [],
      hot: false, createdAt: Date.now(), views: 0,
      image: p.image || "#6d5efc", age: p.age || 0,
      techStack: p.techStack || "", reasonForSale: p.reasonForSale || "",
    };
    persist({ ...d, posts: [post, ...d.posts] });
    pushToast({ title: "Inserat veröffentlicht", body: post.title, kind: "success" });
    return id;
  };

  const toggleHot: Ctx["toggleHot"] = (postId) => {
    const d = dbRef.current;
    if (!d.currentUserId) return;
    const post = d.posts.find((p) => p.id === postId);
    if (!post) return;
    const already = d.saved.some((s) => s.userId === d.currentUserId && s.postId === postId);
    let saved = d.saved;
    let notifs = d.notifications;
    if (already) {
      saved = saved.filter((s) => !(s.userId === d.currentUserId && s.postId === postId));
    } else {
      saved = [{ userId: d.currentUserId, postId, at: Date.now() }, ...saved];
      if (post.ownerId !== d.currentUserId) {
        const meName = d.users.find((u) => u.id === d.currentUserId)?.name || "Jemand";
        notifs = [notify(post.ownerId, "save", `🔥 ${meName} hat dein Inserat „${post.title}" als Hot gespeichert.`, "/dashboard"), ...notifs];
      }
    }
    persist({
      ...d, saved, notifications: notifs,
      posts: d.posts.map((p) => (p.id === postId ? { ...p, hot: !already ? true : p.hot } : p)),
    });
    pushToast({ title: already ? "Entfernt" : "🔥 Als Hot gespeichert", body: post.title, kind: "info" });
  };

  const isSaved = (postId: string) =>
    !!db.currentUserId && db.saved.some((s) => s.userId === db.currentUserId && s.postId === postId);
  const userById = (id: string) => db.users.find((u) => u.id === id);
  const postById = (id: string) => db.posts.find((p) => p.id === id);
  const savedPostsForMe = () =>
    db.saved.filter((s) => s.userId === db.currentUserId).map((s) => db.posts.find((p) => p.id === s.postId)).filter(Boolean) as Post[];

  // ---------- messaging ----------
  // Rule: you may only message users who have created at least one post.
  const canMessage = (otherId: string) => {
    if (!db.currentUserId || otherId === db.currentUserId) return false;
    return db.posts.some((p) => p.ownerId === otherId);
  };

  const startConversation: Ctx["startConversation"] = (otherId, postId) => {
    const d = dbRef.current;
    const existing = d.conversations.find(
      (c) => c.participants.includes(d.currentUserId!) && c.participants.includes(otherId)
    );
    if (existing) return existing.id;
    const c: Conversation = {
      id: "c_" + uid(),
      participants: [d.currentUserId!, otherId],
      postId,
      messages: [],
      updatedAt: Date.now(),
    };
    persist({ ...d, conversations: [c, ...d.conversations] });
    return c.id;
  };

  const sendMessage: Ctx["sendMessage"] = (convId, text, kind = "text", callMeta) => {
    const d = dbRef.current;
    const conv = d.conversations.find((c) => c.id === convId);
    if (!conv) return;
    const msg: Message = { id: uid(), from: d.currentUserId!, text, at: Date.now(), read: false, kind, callMeta };
    const other = conv.participants.find((p) => p !== d.currentUserId)!;
    const meName = d.users.find((u) => u.id === d.currentUserId)?.name || "Jemand";
    const notifs = [notify(other, "message", `💬 Neue Nachricht von ${meName}`, "/messages"), ...d.notifications];
    persist({
      ...d,
      notifications: notifs,
      conversations: d.conversations.map((c) =>
        c.id === convId ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() } : c
      ),
    });
  };

  const conversationsForMe = () =>
    db.conversations.filter((c) => c.participants.includes(db.currentUserId || "")).sort((a, b) => b.updatedAt - a.updatedAt);

  const markRead = (convId: string) => {
    const d = dbRef.current;
    persist({
      ...d,
      conversations: d.conversations.map((c) =>
        c.id === convId
          ? { ...c, messages: c.messages.map((m) => (m.from !== d.currentUserId ? { ...m, read: true } : m)) }
          : c
      ),
    });
  };

  const unreadCount = () =>
    conversationsForMe().reduce(
      (n, c) => n + c.messages.filter((m) => m.from !== db.currentUserId && !m.read).length,
      0
    );

  // ---------- deal room ----------
  const ensureDeal = (c: Conversation): Conversation =>
    c.dealRoom ? c : { ...c, dealRoom: { ndaSignedBy: [], documents: [], stage: "nda" } };

  const signNDA = (convId: string) => {
    const d = dbRef.current;
    persist({
      ...d,
      conversations: d.conversations.map((c) => {
        if (c.id !== convId) return c;
        const dc = ensureDeal(c);
        const signed = Array.from(new Set([...dc.dealRoom!.ndaSignedBy, d.currentUserId!]));
        const stage = signed.length >= 2 ? "documents" : "nda";
        return { ...dc, dealRoom: { ...dc.dealRoom!, ndaSignedBy: signed, stage } };
      }),
    });
    pushToast({ title: "NDA signiert ✓", body: "Du hast die Vertraulichkeitsvereinbarung unterzeichnet.", kind: "success" });
  };

  const uploadDoc = (convId: string, name: string, size: string) => {
    const d = dbRef.current;
    persist({
      ...d,
      conversations: d.conversations.map((c) => {
        if (c.id !== convId) return c;
        const dc = ensureDeal(c);
        return {
          ...dc,
          dealRoom: {
            ...dc.dealRoom!,
            documents: [{ id: uid(), name, size, by: d.currentUserId!, at: Date.now() }, ...dc.dealRoom!.documents],
          },
        };
      }),
    });
    pushToast({ title: "Dokument hochgeladen", body: name, kind: "info" });
  };

  const advanceStage: Ctx["advanceStage"] = (convId, stage) => {
    const d = dbRef.current;
    persist({
      ...d,
      conversations: d.conversations.map((c) =>
        c.id === convId && c.dealRoom ? { ...c, dealRoom: { ...c.dealRoom, stage } } : c
      ),
    });
  };

  // ---------- notifications ----------
  const myNotifications = () =>
    db.notifications.filter((n) => n.userId === db.currentUserId).sort((a, b) => b.at - a.at);
  const markAllNotifsRead = () => {
    const d = dbRef.current;
    persist({ ...d, notifications: d.notifications.map((n) => (n.userId === d.currentUserId ? { ...n, read: true } : n)) });
  };
  const unreadNotifs = () => myNotifications().filter((n) => !n.read).length;

  // ---------- live desktop-style popup for new incoming messages ----------
  const lastSeenRef = useRef<number>(Date.now());
  useEffect(() => {
    if (!me) return;
    let max = lastSeenRef.current;
    db.conversations.forEach((c) => {
      if (!c.participants.includes(me.id)) return;
      c.messages.forEach((m) => {
        if (m.from !== me.id && m.at > lastSeenRef.current) {
          const sender = db.users.find((u) => u.id === m.from);
          if (m.kind !== "system") {
            pushToast({ title: `${sender?.name || "Nachricht"} 💬`, body: m.kind === "call" ? "📞 Anruf" : m.text, kind: "message" });
          }
          if (m.at > max) max = m.at;
        }
      });
    });
    lastSeenRef.current = max;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.conversations, me?.id]);

  const value: Ctx = {
    db, me, toasts, dismissToast, pushToast,
    signup, login, logout, updateMe, requestVerification, approveVerification, subscribe,
    createPost, toggleHot, isSaved, userById, postById, savedPostsForMe,
    canMessage, startConversation, sendMessage, conversationsForMe, markRead, unreadCount,
    signNDA, uploadDoc, advanceStage,
    myNotifications, markAllNotifsRead, unreadNotifs,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
