import { Bucket, Category, Dataset, ModeId, PlanState } from './types';
import { Favor, ParetoResult, clamp, linearSlope, pareto, variancePct, varianceFavor } from './math';

export const SPEND_BUCKETS: Bucket[] = ['need', 'want', 'opex', 'capex'];

export const monthIncome = (ds: Dataset, m: number): number =>
  ds.transactions.filter((t) => t.monthIndex === m && t.type === 'income').reduce((s, t) => s + t.amount, 0);

export function actualByCategory(ds: Dataset, m: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of ds.transactions) {
    if (t.monthIndex === m && t.type === 'expense') out[t.categoryId] = (out[t.categoryId] ?? 0) + t.amount;
  }
  return out;
}

export interface CategoryRow {
  category: Category;
  actual: number;
  budget: number;
  variance: number; // %
  favor: Favor;
  used: number; // actual / budget
}

export function categoryRows(ds: Dataset, m: number): CategoryRow[] {
  const actual = actualByCategory(ds, m);
  return ds.categories.map((category) => {
    const a = actual[category.id] ?? 0;
    const variance = variancePct(a, category.budget);
    return {
      category,
      actual: a,
      budget: category.budget,
      variance,
      favor: varianceFavor(variance, category.bucket === 'saving'),
      used: category.budget > 0 ? a / category.budget : 0,
    };
  });
}

export function bucketTotals(ds: Dataset, m: number): Record<Bucket, number> {
  const actual = actualByCategory(ds, m);
  const out: Record<Bucket, number> = { need: 0, want: 0, saving: 0, opex: 0, capex: 0 };
  for (const cat of ds.categories) out[cat.bucket] += actual[cat.id] ?? 0;
  return out;
}

export function monthTotals(ds: Dataset, m: number) {
  const income = monthIncome(ds, m);
  const b = bucketTotals(ds, m);
  const spend = b.need + b.want + b.opex + b.capex;
  const budgetSpend = ds.categories.filter((c) => c.bucket !== 'saving').reduce((s, c) => s + c.budget, 0);
  return { income, spend, saved: b.saving, leftover: income - spend - b.saving, budgetSpend, buckets: b };
}

export function savingsBalance(ds: Dataset, m: number): number {
  const savingIds = new Set(ds.categories.filter((c) => c.bucket === 'saving').map((c) => c.id));
  return (
    ds.openingBalance +
    ds.transactions.filter((t) => t.monthIndex <= m && t.type === 'expense' && savingIds.has(t.categoryId)).reduce((s, t) => s + t.amount, 0)
  );
}

export function savedInMonth(ds: Dataset, m: number): number {
  return bucketTotals(ds, m).saving;
}

export function avgSaving(ds: Dataset, m: number, window = 3): number {
  const savingIds = new Set(ds.categories.filter((category) => category.bucket === 'saving').map((category) => category.id));
  const savingMonths = ds.transactions
    .filter((transaction) => transaction.type === 'expense' && savingIds.has(transaction.categoryId) && transaction.monthIndex <= m)
    .map((transaction) => transaction.monthIndex);
  if (savingMonths.length === 0) return 0;
  const from = Math.max(Math.min(...savingMonths), m - window + 1);
  let sum = 0;
  for (let i = from; i <= m; i++) sum += savedInMonth(ds, i);
  return sum / (m - from + 1);
}

const isDiscretionary = (c: Category) => c.bucket === 'want' || (c.variable && (c.bucket === 'opex' || c.bucket === 'capex'));

/** Pareto across merchants/drivers for discretionary outflows from month 0 to m. */
export function paretoDrivers(ds: Dataset, m: number): ParetoResult {
  const ids = new Set(ds.categories.filter(isDiscretionary).map((c) => c.id));
  const map = new Map<string, number>();
  for (const t of ds.transactions) {
    if (t.monthIndex <= m && t.type === 'expense' && ids.has(t.categoryId)) map.set(t.label, (map.get(t.label) ?? 0) + t.amount);
  }
  return pareto([...map.entries()].map(([label, value]) => ({ label, value })));
}

export function wantsSeries(ds: Dataset, upTo: number): number[] {
  const wantIds = new Set(ds.categories.filter((category) => category.bucket === 'want').map((category) => category.id));
  const months = ds.transactions
    .filter((transaction) => transaction.type === 'expense' && wantIds.has(transaction.categoryId) && transaction.monthIndex <= upTo)
    .map((transaction) => transaction.monthIndex);
  const from = months.length > 0 ? Math.min(...months) : 0;
  return Array.from({ length: upTo - from + 1 }, (_, i) => bucketTotals(ds, from + i).want);
}

export interface Creep {
  firstAvg: number;
  lastAvg: number;
  pct: number; // growth of discretionary spend, first 3 vs last 3 months
  slopePerMonth: number;
  annualErosion: number; // 0..0.15, used to erode future savings
}

export function lifestyleCreep(ds: Dataset, m: number): Creep {
  const s = wantsSeries(ds, m);
  const k = Math.min(3, Math.max(1, Math.floor(s.length / 2)));
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const firstAvg = avg(s.slice(0, k));
  const lastAvg = avg(s.slice(-k));
  const slopePerMonth = linearSlope(s);
  const pct = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;
  const annualErosion = clamp((slopePerMonth * 12) / (avg(s) * 12 || 1), 0, 0.15);
  return { firstAvg, lastAvg, pct, slopePerMonth, annualErosion };
}

export function avgMonthlyBucket(ds: Dataset, m: number, bucket: Bucket): number {
  const ids = new Set(ds.categories.filter((category) => category.bucket === bucket).map((category) => category.id));
  const months = ds.transactions
    .filter((transaction) => transaction.type === 'expense' && ids.has(transaction.categoryId) && transaction.monthIndex <= m)
    .map((transaction) => transaction.monthIndex);
  if (months.length === 0) return ds.categories.filter((category) => category.bucket === bucket).reduce((sum, category) => sum + category.budget, 0);
  const from = Math.min(...months);
  let sum = 0;
  for (let i = from; i <= m; i++) sum += bucketTotals(ds, i)[bucket];
  return sum / (m - from + 1);
}

/** The "freedom" goal that the Future Freedom Sphere fills toward. */
export function freedomTarget(ds: Dataset, m: number): number {
  if (ds.mode === 'seed') return 2_500_000;
  if (ds.mode === 'growth') return avgMonthlyBucket(ds, m, 'need') * 12 * 25; // 25x essential annual spend (4% rule)
  return avgMonthlyBucket(ds, m, 'opex') * 24; // 24 months OpEx runway
}

export function defaultPlan(ds: Dataset, m: number): PlanState {
  const rate: Record<ModeId, number> = { seed: 0.05, growth: 0.07, vanguard: 0.045 };
  return { monthly: Math.round(avgSaving(ds, m, 3)), rate: rate[ds.mode] };
}

export function sliderConfig(ds: Dataset) {
  const step = ds.plannedIncome >= 100000 ? 500 : ds.plannedIncome >= 1000 ? 10 : 1;
  return { min: 0, max: Math.round((ds.plannedIncome * 0.5) / step) * step, step };
}

export const committedCategories = (ds: Dataset): Category[] => ds.categories.filter((c) => !c.variable && c.bucket !== 'saving');
