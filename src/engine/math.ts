/** Pure financial formulas. No React, no dataset knowledge. */

// A = P(1 + r/n)^(nt)
export const compoundFV = (principal: number, r: number, n: number, t: number): number =>
  principal * Math.pow(1 + r / n, n * t);

// Future value of a periodic contribution (ordinary annuity), n periods per year.
export const annuityFV = (pmt: number, r: number, n: number, t: number): number =>
  r === 0 ? pmt * n * t : pmt * ((Math.pow(1 + r / n, n * t) - 1) / (r / n));

export interface ProjectionInput {
  principal: number;
  monthly: number;
  rate: number;
  years: number;
}

/** Compound projection: A = P(1+r/n)^(nt) + PMT * [((1+r/n)^(nt) - 1) / (r/n)], n = 12 */
export function projectCompound({ principal, monthly, rate, years }: ProjectionInput): number[] {
  return Array.from({ length: years + 1 }, (_, y) => compoundFV(principal, rate, 12, y) + annuityFV(monthly, rate, 12, y));
}

/** Linear projection: savings only, zero growth. */
export function projectLinear({ principal, monthly, years }: Omit<ProjectionInput, 'rate'>): number[] {
  return Array.from({ length: years + 1 }, (_, y) => principal + monthly * 12 * y);
}

/** "Actual pace": month-by-month simulation where contributions erode each year by `creep` (lifestyle creep). */
export function projectWithCreep({ principal, monthly, rate, years }: ProjectionInput, creep: number): number[] {
  const out = [principal];
  let balance = principal;
  let contribution = monthly;
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) balance = balance * (1 + rate / 12) + contribution;
    contribution *= 1 - creep;
    out.push(balance);
  }
  return out;
}

export function projectByMonths(principal: number, monthly: number, rate: number, months: number): number[] {
  const out = [principal];
  let balance = principal;
  for (let month = 1; month <= months; month++) {
    balance = balance * (1 + rate / 12) + monthly;
    out.push(balance);
  }
  return out;
}

export function projectPaceByMonths(principal: number, monthly: number, rate: number, months: number, annualErosion: number): number[] {
  const out = [principal];
  let balance = principal;
  for (let month = 1; month <= months; month++) {
    const annualFactor = Math.max(0, 1 - annualErosion) ** Math.floor((month - 1) / 12);
    balance = balance * (1 + rate / 12) + monthly * annualFactor;
    out.push(balance);
  }
  return out;
}

/** Variance % = ((Actual - Budgeted) / Budgeted) * 100 */
export const variancePct = (actual: number, budgeted: number): number =>
  budgeted === 0 ? 0 : ((actual - budgeted) / budgeted) * 100;

export type Favor = 'favorable' | 'unfavorable';
/** Expenses: under budget is favorable. Savings/income: over target is favorable. */
export const varianceFavor = (variance: number, higherIsBetter: boolean): Favor =>
  (higherIsBetter ? variance >= 0 : variance <= 0) ? 'favorable' : 'unfavorable';

export interface ParetoRow {
  label: string;
  value: number;
  share: number; // 0..1
  cumulative: number; // 0..1
}
export interface ParetoResult {
  rows: ParetoRow[];
  total: number;
  topN: number; // ceil(20% of drivers)
  topShare: number; // share of total produced by the top 20% of drivers
  vitalCount: number; // smallest set of drivers reaching 80%
}

/** Pareto: isolate the top 20% of drivers and the smallest set that causes 80% of outflow. */
export function pareto(items: { label: string; value: number }[]): ParetoResult {
  const sorted = [...items].filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, i) => s + i.value, 0) || 1;
  let cum = 0;
  let vitalCount = 0;
  const rows = sorted.map((i, idx) => {
    cum += i.value;
    if (vitalCount === 0 && cum / total >= 0.8) vitalCount = idx + 1;
    return { label: i.label, value: i.value, share: i.value / total, cumulative: cum / total };
  });
  const topN = Math.max(1, Math.ceil(sorted.length * 0.2));
  const topShare = rows.slice(0, topN).reduce((s, r) => s + r.share, 0);
  return { rows, total, topN, topShare, vitalCount: vitalCount || rows.length };
}

/** Least-squares slope (units per step). */
export function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xm = (n - 1) / 2;
  const ym = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  values.forEach((v, i) => {
    num += (i - xm) * (v - ym);
    den += (i - xm) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

// ---- Driver-based forecasting (Vanguard) ----
export interface Drivers {
  units: number;
  price: number;
  variableCostPerUnit: number;
  fixedCosts: number;
  monthlyGrowth: number; // e.g. 0.018
  churn: number; // e.g. 0.006
}
export interface ForecastPoint {
  month: number;
  units: number;
  revenue: number;
  totalCost: number;
  profit: number;
}

/** Revenue = Units_t * Price; Cost = Fixed + Units_t * VarCost; Units_t = Units_0 * (1 + g - churn)^t */
export function driverForecast(d: Drivers, months = 12): ForecastPoint[] {
  return Array.from({ length: months }, (_, t) => {
    const units = d.units * Math.pow(1 + d.monthlyGrowth - d.churn, t);
    const revenue = units * d.price;
    const totalCost = d.fixedCosts + units * d.variableCostPerUnit;
    return { month: t + 1, units, revenue, totalCost, profit: revenue - totalCost };
  });
}

export const breakEvenUnits = (d: Drivers): number =>
  d.price - d.variableCostPerUnit <= 0 ? Infinity : d.fixedCosts / (d.price - d.variableCostPerUnit);
