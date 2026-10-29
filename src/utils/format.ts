const withCommas = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function fmtMoney(n: number, opts: { compact?: boolean; decimals?: number } = {}): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (opts.compact) {
    if (abs >= 1_000_000_000) return `${sign}TZS ${(abs / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `${sign}TZS ${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 10_000) return `${sign}TZS ${(abs / 1_000).toFixed(1)}K`;
  }
  const d = opts.decimals ?? 0;
  const fixed = abs.toFixed(d);
  const [i, f] = fixed.split('.');
  return `${sign}TZS ${withCommas(Number(i))}${f ? '.' + f : ''}`;
}

export const fmtPct = (n: number, d = 1): string => `${n >= 0 ? '+' : ''}${n.toFixed(d)}%`;
export const fmtPlainPct = (n: number, d = 0): string => `${n.toFixed(d)}%`;
export const dayLabel = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;
};
