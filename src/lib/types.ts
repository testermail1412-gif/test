export type Category =
  | "E-Commerce"
  | "SaaS"
  | "Content / Blog"
  | "Agentur"
  | "App / Mobile"
  | "Newsletter"
  | "Marktplatz"
  | "Gastronomie"
  | "Handwerk / Bau"
  | "Immobilien"
  | "Gesundheit"
  | "Beauty / Wellness"
  | "Finanzen"
  | "Bildung"
  | "Logistik"
  | "Produktion"
  | "Einzelhandel"
  | "Beratung"
  | "Sonstiges";

export const CATEGORIES: Category[] = [
  "E-Commerce",
  "SaaS",
  "Content / Blog",
  "Agentur",
  "App / Mobile",
  "Newsletter",
  "Marktplatz",
  "Gastronomie",
  "Handwerk / Bau",
  "Immobilien",
  "Gesundheit",
  "Beauty / Wellness",
  "Finanzen",
  "Bildung",
  "Logistik",
  "Produktion",
  "Einzelhandel",
  "Beratung",
  "Sonstiges",
];

export type Plan = "free" | "basic" | "pro";

export interface User {
  id: string;
  name: string;
  handle: string;
  email: string;
  password: string;
  avatarColor: string;
  bio: string;
  location: string;
  website: string;
  verified: boolean;
  verificationStatus: "none" | "pending" | "verified" | "rejected";
  plan: Plan;
  trustScore: number; // 0-100
  createdAt: number;
  // settings
  settings: {
    showOnline: boolean;
    emailNotifs: boolean;
    desktopNotifs: boolean;
    twoFactor: boolean;
  };
  stats: { deals: number; rating: number; responseMin: number };
}

export interface Post {
  id: string;
  ownerId: string;
  title: string;
  category: Category;
  price: number; // EUR
  mrr: number; // monthly revenue
  profit: number; // monthly profit
  description: string;
  highlights: string[];
  hot: boolean;
  createdAt: number;
  views: number;
  image: string; // gradient seed
  // shop detail
  age: number; // months
  techStack: string;
  reasonForSale: string;
}

export interface SavedPost { userId: string; postId: string; at: number }

export interface Message {
  id: string;
  from: string;
  text: string;
  at: number;
  read: boolean;
  kind?: "text" | "call" | "system";
  callMeta?: { duration: number; missed: boolean };
}

export interface Conversation {
  id: string;
  participants: [string, string];
  postId?: string;
  messages: Message[];
  updatedAt: number;
  dealRoom?: DealRoom;
}

export interface DealRoom {
  ndaSignedBy: string[]; // user ids who signed
  documents: { id: string; name: string; size: string; by: string; at: number }[];
  stage: "nda" | "documents" | "negotiation" | "closing";
}

export interface Notification {
  id: string;
  userId: string;
  type: "save" | "message" | "verify" | "deal" | "system";
  text: string;
  at: number;
  read: boolean;
  link?: string;
}

export interface Offer {
  id: string;
  postId: string;
  buyerId: string;
  amount: number;
  message: string;
  status: "pending" | "accepted" | "declined";
  at: number;
}

export interface Review {
  id: string;
  targetId: string; // reviewed user
  authorId: string;
  rating: number; // 1-5
  text: string;
  at: number;
}

export interface DB {
  users: User[];
  posts: Post[];
  saved: SavedPost[];
  conversations: Conversation[];
  notifications: Notification[];
  offers: Offer[];
  reviews: Review[];
  currentUserId: string | null;
}
