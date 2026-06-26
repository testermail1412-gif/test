# Post Pro Shop — Marktplatz für Online-Business

Ein Nachbau & Ausbau von [post-pro-shop.lovable.app](https://post-pro-shop.lovable.app/):
ein sicherer Marktplatz, um profitable Online-Businesses (E-Commerce, SaaS, Content,
Apps …) zu kaufen und zu verkaufen — mit Trust-Score, verifizierten Anbietern,
NDA-Deal-Rooms und Echtzeit-Chat.

## Stack
React 18 · TypeScript · Vite · Tailwind CSS · React Router · lucide-react.
Mock-Backend über `localStorage` (siehe `src/context/StoreContext.tsx`) — komplett im
Browser lauffähig, ohne Server.

## Starten
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production-Build
```

Demo-Login: `maxbrandt@postproshop.io` / `demo1234`

## Features
- **Inserat-Formular** (`/new`) — Posts pro Kategorie erstellen & veröffentlichen, mit
  Highlights, KPIs (Preis/MRR/Gewinn), Tech-Stack und Cover-Farbe. Limit je nach Plan.
- **Stripe-Checkout** (`/pricing`) — Free/Basic/Pro-Abos mit Stripe-Checkout-Flow.
  Anbindungspunkt für echte Stripe-Keys ist in `Pricing.tsx` dokumentiert.
- **Profil & Verifizierung** (`/verify`) — Angaben & Dokumente einreichen → Verify-Badge
  + Trust-Boost. Konto-Erstellung **ohne** E-Mail-Verifizierung (dann zunächst kein Badge).
- **Shop-Detailseite** (`/post/:id`) — vollständige KPIs, „Exposé anfordern"-CTA und
  „Nachricht senden".
- **Deal-Room** mit NDA-Flow, Dokument-Upload (nach beidseitiger NDA-Signatur) und
  Phasen-Tracker bis zum Abschluss-CTA.
- **Trust-Score** — sichtbar in Profil, Feed, Suche und Chat; filterbar in der Suche.
- **Eingeschränktes Messaging** — Nachrichten nur an Nutzer möglich, die ein Inserat
  erstellt haben.
- **Hot-Merken** — Posts als „Hot" speichern → landet in der Hot-Liste im Dashboard,
  der Inhaber wird benachrichtigt.
- **Benachrichtigungen** — ungelesene Chats werden oben markiert; Live-Popup bei neuer
  Nachricht, während man auf der Seite ist.
- **Anrufe im Chat** — simpler 1-Klick-Sprachanruf-Flow direkt im Chat.
- **Profil-Einstellungen** (`/settings`) — Profil, Avatar, Privatsphäre &
  Benachrichtigungen anpassen.

### Plan-/Monetarisierung-Features (Richtung „200k/Monat")
Abo-Stufen, Hot-/Top-Platzierung, Prioritäts-Verifizierung, Trust-Boosts und
Deal-Room als Premium-Funnel — als Grundlage für Take-Rate auf abgeschlossene Deals.

> Hinweis: Daten liegen lokal im Browser (Demo). Für Produktion: echtes Backend
> (Auth, DB, Stripe serverseitig, WebRTC-Signaling für Anrufe, Storage für Uploads).
