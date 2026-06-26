import { DB, Post, User } from "./types";

const colors = ["#6d5efc", "#22d3a8", "#ff7a59", "#f5b400", "#39a0ed", "#e74c9b"];

function user(p: Partial<User> & { id: string; name: string; handle: string }): User {
  return {
    email: `${p.handle}@postproshop.io`,
    password: "demo1234",
    avatarColor: colors[Math.floor(Math.random() * colors.length)],
    bio: "",
    location: "Deutschland",
    website: "",
    verified: false,
    verificationStatus: "none",
    plan: "free",
    trustScore: 60,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 120,
    settings: { showOnline: true, emailNotifs: true, desktopNotifs: true, twoFactor: false },
    stats: { deals: 0, rating: 0, responseMin: 60 },
    ...p,
  } as User;
}

const u1 = user({ id: "u_max", name: "Maximilian Brandt", handle: "maxbrandt", bio: "Verkaufe & skaliere E-Commerce-Brands seit 2016.", verified: true, verificationStatus: "verified", plan: "pro", trustScore: 94, location: "München", website: "maxbrandt.de", stats: { deals: 23, rating: 4.9, responseMin: 12 } });
const u2 = user({ id: "u_lena", name: "Lena Hoffmann", handle: "lenah", bio: "SaaS-Founder. 2 Exits.", verified: true, verificationStatus: "verified", plan: "pro", trustScore: 88, location: "Berlin", stats: { deals: 11, rating: 4.8, responseMin: 25 } });
const u3 = user({ id: "u_jon", name: "Jonas Weber", handle: "jweber", bio: "Content & Affiliate.", verified: false, verificationStatus: "none", plan: "basic", trustScore: 71, location: "Hamburg", stats: { deals: 4, rating: 4.5, responseMin: 90 } });

function post(p: Partial<Post> & { id: string; ownerId: string; title: string }): Post {
  return {
    category: "E-Commerce",
    price: 50000,
    mrr: 8000,
    profit: 3200,
    description: "Etabliertes Online-Business mit stabilem Umsatz und sauberer Buchhaltung. Vollständige Übergabe inkl. Lieferanten & SOPs.",
    highlights: ["Stabiler MRR", "Saubere Zahlen", "Übergabe inkl. SOPs"],
    hot: false,
    createdAt: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 20),
    views: Math.floor(Math.random() * 1400) + 80,
    image: ["#6d5efc", "#22d3a8", "#ff7a59", "#39a0ed"][Math.floor(Math.random() * 4)],
    age: 24,
    techStack: "Shopify, Klaviyo, Meta Ads",
    reasonForSale: "Fokus auf neues Projekt.",
    ...p,
  } as Post;
}

const posts: Post[] = [
  post({ id: "p1", ownerId: "u_max", title: "Profitable DTC Skincare Brand", category: "E-Commerce", price: 145000, mrr: 22000, profit: 7800, hot: true, highlights: ["3.2x ROAS", "38% Wiederkäufer", "Eigene Marke"], techStack: "Shopify, Klaviyo, TikTok Ads" }),
  post({ id: "p2", ownerId: "u_lena", title: "B2B Invoicing SaaS — 140 MRR-Kunden", category: "SaaS", price: 320000, mrr: 31000, profit: 19000, hot: true, highlights: ["NRR 112%", "Churn 1.4%", "MRR seit 3J stabil"], techStack: "Next.js, Postgres, Stripe" }),
  post({ id: "p3", ownerId: "u_jon", title: "Finanz-Blog mit 180k Visits/Monat", category: "Content / Blog", price: 68000, mrr: 6200, profit: 5100, highlights: ["SEO Top-10", "Affiliate + Ads", "Evergreen"], techStack: "WordPress, Ahrefs" }),
  post({ id: "p4", ownerId: "u_lena", title: "Newsletter — 42k Abonnenten, Tech-Nische", category: "Newsletter", price: 54000, mrr: 4800, profit: 4200, highlights: ["Open Rate 47%", "Sponsoren-Pipeline"], techStack: "Beehiiv" }),
  post({ id: "p5", ownerId: "u_max", title: "Print-on-Demand Store, vollautomatisiert", category: "E-Commerce", price: 39000, mrr: 5400, profit: 2600, highlights: ["100% Dropship", "Automatisiert"], techStack: "Shopify, Printful" }),
  post({ id: "p6", ownerId: "u_jon", title: "iOS Habit-Tracker App, 12k MAU", category: "App / Mobile", price: 88000, mrr: 7300, profit: 5900, hot: true, highlights: ["4.8★ Rating", "Abo-Modell"], techStack: "Swift, RevenueCat" }),
];

export function seedDB(): DB {
  return {
    users: [u1, u2, u3],
    posts,
    saved: [],
    conversations: [],
    notifications: [],
    offers: [],
    reviews: [
      { id: "r1", targetId: "u_max", authorId: "u_lena", rating: 5, text: "Reibungslose Übergabe, alle Zahlen exakt wie beschrieben. Top!", at: Date.now() - 1000 * 60 * 60 * 24 * 9 },
      { id: "r2", targetId: "u_max", authorId: "u_jon", rating: 5, text: "Sehr professionell und schnell. Gerne wieder.", at: Date.now() - 1000 * 60 * 60 * 24 * 30 },
      { id: "r3", targetId: "u_lena", authorId: "u_max", rating: 5, text: "Saubere Doku im Deal-Room, klare Kommunikation.", at: Date.now() - 1000 * 60 * 60 * 24 * 14 },
    ],
    currentUserId: null,
  };
}
