import { Category } from "./types";

// Heuristic SDE/MRR-multiple valuation by category — for guidance, not advice.
const CAT_MULTIPLE: Record<string, number> = {
  "SaaS": 4.2, "Newsletter": 3.4, "Marktplatz": 3.8, "App / Mobile": 3.2,
  "E-Commerce": 2.6, "Content / Blog": 2.8, "Agentur": 1.9, "Sonstiges": 2.4,
};

export function valuate(opts: { category: Category | string; mrr: number; profit: number; ageMonths: number; growthPct: number }) {
  const base = CAT_MULTIPLE[opts.category] ?? 2.5;
  const annualProfit = opts.profit * 12;
  // age factor: older = more stable (cap at +25%)
  const ageF = 1 + Math.min(opts.ageMonths / 60, 0.25);
  // growth factor: -20% to +60%
  const growthF = 1 + Math.max(-0.2, Math.min(opts.growthPct / 100, 0.6));
  const multiple = base * ageF * growthF;
  const mid = Math.max(0, annualProfit * multiple);
  const low = mid * 0.82;
  const high = mid * 1.2;
  return {
    low: Math.round(low / 100) * 100,
    mid: Math.round(mid / 100) * 100,
    high: Math.round(high / 100) * 100,
    multiple: Math.round(multiple * 10) / 10,
  };
}
