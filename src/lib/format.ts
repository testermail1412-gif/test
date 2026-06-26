export const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const ago = (t: number) => {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "gerade eben";
  const m = Math.floor(s / 60);
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.floor(h / 24);
  if (d < 30) return `vor ${d} Tg`;
  return new Date(t).toLocaleDateString("de-DE");
};

export const clock = (t: number) =>
  new Date(t).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

export const trustLabel = (s: number) =>
  s >= 90 ? "Exzellent" : s >= 75 ? "Hoch" : s >= 60 ? "Solide" : s >= 40 ? "Neu" : "Niedrig";

export const trustColor = (s: number) =>
  s >= 90 ? "#22d3a8" : s >= 75 ? "#6d5efc" : s >= 60 ? "#39a0ed" : s >= 40 ? "#f5b400" : "#ff5a52";
