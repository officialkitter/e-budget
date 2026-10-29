import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAura } from '../state/AppContext';
import { bucketTotals, committedCategories, lifestyleCreep, monthTotals, savingsBalance, avgMonthlyBucket, actualByCategory } from '../engine/selectors';
import { fmtMoney, fmtPct } from '../utils/format';
import { GlassCard } from './GlassCard';
import { ProgressBar, Stat } from './Bits';
import { H2, Dim } from './Typography';

/* ------------------------------ SEED ------------------------------ */
export const SeedPanel = () => {
  const { dataset, monthIndex, theme, colors } = useAura();
  const t = useMemo(() => monthTotals(dataset, monthIndex), [dataset, monthIndex]);
  const chest = savingsBalance(dataset, monthIndex);
  const goal = 2_500_000;

  // streak: consecutive months (ending now) where spending stayed within budget
  let streak = 0;
  for (let m = monthIndex; m >= 0; m--) {
    if (!dataset.transactions.some((transaction) => transaction.monthIndex === m)) break;
    const mt = monthTotals(dataset, m);
    if (mt.spend <= mt.budgetSpend) streak++;
    else break;
  }
  const needsBudget = dataset.categories.filter((c) => c.bucket === 'need').reduce((s, c) => s + c.budget, 0);
  const total = Math.max(1, t.buckets.need + t.buckets.want);

  return (
    <>
      <GlassCard delay={120} glow={theme.accent}>
        <H2>Savings goal</H2>
        <Text style={[styles.big, { color: theme.accent }]}>{fmtMoney(chest)}</Text>
        <ProgressBar value={chest / goal} color={theme.accent} height={14} />
        <Dim style={{ marginTop: 8 }}>{Math.round((chest / goal) * 100)}% of your {fmtMoney(goal, { decimals: 0 })} savings target</Dim>
      </GlassCard>

      <GlassCard delay={180}>
        <H2>Needs and wants</H2>
        <View style={{ marginTop: 12 }}>
          <View style={styles.rowBetween}>
            <Text style={[styles.rowLabel, { color: colors.textDim }]}>Needs</Text>
            <Text style={[styles.rowVal, { color: colors.text }]}>{fmtMoney(t.buckets.need)}</Text>
          </View>
          <ProgressBar value={t.buckets.need / total} color={colors.teal} />
          <View style={[styles.rowBetween, { marginTop: 14 }]}>
            <Text style={[styles.rowLabel, { color: colors.textDim }]}>Wants</Text>
            <Text style={[styles.rowVal, { color: colors.text }]}>{fmtMoney(t.buckets.want)}</Text>
          </View>
          <ProgressBar value={t.buckets.want / total} color={colors.amber} />
        </View>
        <Dim style={{ marginTop: 10 }}>Needs budget: {fmtMoney(needsBudget, { decimals: 0 })} · Keep wants under {fmtMoney(t.income * 0.3, { decimals: 0 })}</Dim>
      </GlassCard>

      <GlassCard delay={240}>
        <H2>Monthly progress</H2>
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Stat label="Months within budget" value={`${streak}`} color={colors.teal} hint="In a row" />
          <Stat label="Saved this month" value={fmtMoney(t.saved)} color={theme.accent} />
        </View>
      </GlassCard>
    </>
  );
};

/* ------------------------------ GROWTH ------------------------------ */
export const GrowthPanel = () => {
  const { dataset, monthIndex, theme, colors } = useAura();
  const t = useMemo(() => monthTotals(dataset, monthIndex), [dataset, monthIndex]);
  const creep = useMemo(() => lifestyleCreep(dataset, monthIndex), [dataset, monthIndex]);
  const wantCategoryIds = new Set(dataset.categories.filter((category) => category.bucket === 'want').map((category) => category.id));
  const monthsWithWants = new Set(
    dataset.transactions
      .filter((transaction) => transaction.type === 'expense' && wantCategoryIds.has(transaction.categoryId) && transaction.monthIndex <= monthIndex)
      .map((transaction) => transaction.monthIndex),
  ).size;
  const balance = savingsBalance(dataset, monthIndex);
  const avgNeeds = avgMonthlyBucket(dataset, monthIndex, 'need');
  const efMonths = avgNeeds > 0 ? balance / avgNeeds : 0;
  const inc = Math.max(1, t.income);
  const shares = [
    { label: 'Needs', actual: t.buckets.need / inc, target: 0.5, color: colors.blue },
    { label: 'Wants', actual: t.buckets.want / inc, target: 0.3, color: colors.amber },
    { label: 'Savings', actual: t.buckets.saving / inc, target: 0.2, color: colors.teal },
  ];

  return (
    <>
      <GlassCard delay={120}>
        <H2>50 / 30 / 20 Framework</H2>
        <View style={{ marginTop: 12 }}>
          {shares.map((s) => (
            <View key={s.label} style={{ marginBottom: 14 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.rowLabel, { color: colors.textDim }]}>{s.label}</Text>
                <Text style={[styles.rowVal, { color: colors.text }]}>
                  {(s.actual * 100).toFixed(1)}% <Text style={{ color: colors.textDim }}>/ {s.target * 100}%</Text>
                </Text>
              </View>
              <ProgressBar value={s.actual} color={s.color} marker={s.target} />
            </View>
          ))}
        </View>
      </GlassCard>

      <GlassCard delay={180}>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Net income" value={fmtMoney(t.income)} />
          <Stat label="Net after spend" value={fmtMoney(t.income - t.spend)} color={t.income - t.spend >= 0 ? colors.teal : colors.crimson} />
        </View>
        <View style={{ height: 16 }} />
        <Text style={[styles.rowLabel, { color: colors.textDim }]}>Emergency fund</Text>
        <Text style={[styles.big, { color: efMonths >= 6 ? colors.teal : colors.amber }]}>{efMonths.toFixed(1)} months</Text>
        <ProgressBar value={efMonths / 6} color={efMonths >= 6 ? colors.teal : colors.amber} marker={1} />
        <Dim style={{ marginTop: 8 }}>{fmtMoney(balance, { decimals: 0 })} saved · target 6 months of essentials</Dim>
      </GlassCard>

      <GlassCard delay={240} glow={creep.pct > 10 ? colors.crimson : undefined}>
        <H2>Spending trend</H2>
        {monthsWithWants < 2 ? (
          <Dim>Record spending in at least two months to see a reliable trend.</Dim>
        ) : (
          <>
            <Text style={[styles.big, { color: creep.pct > 10 ? colors.crimson : colors.teal }]}>{fmtPct(creep.pct)}</Text>
            <Dim>
              Wants went from {fmtMoney(creep.firstAvg, { decimals: 0 })}/mo (first quarter) to {fmtMoney(creep.lastAvg, { decimals: 0 })}/mo (latest quarter). Trend: {creep.slopePerMonth >= 0 ? '+' : ''}
              {fmtMoney(creep.slopePerMonth, { decimals: 0 })} per month.
            </Dim>
          </>
        )}
      </GlassCard>
    </>
  );
};

/* ------------------------------ VANGUARD ------------------------------ */
export const VanguardPanel = () => {
  const { dataset, monthIndex, theme, colors } = useAura();
  const t = useMemo(() => monthTotals(dataset, monthIndex), [dataset, monthIndex]);
  const hasEntries = dataset.transactions.some((transaction) => transaction.monthIndex === monthIndex);
  const b = bucketTotals(dataset, monthIndex);
  const actual = actualByCategory(dataset, monthIndex);
  const committedCats = committedCategories(dataset);
  const committed = committedCats.reduce((s, c) => s + (actual[c.id] ?? 0), 0);
  const variableSpend = t.spend - committed;
  const vr = t.budgetSpend > 0 ? t.spend / t.budgetSpend : 0;
  const vrColor = vr <= 1 ? colors.teal : colors.crimson;
  const margin = t.income > 0 ? (t.income - t.spend) / t.income : 0;
  const capexShare = t.spend > 0 ? b.capex / t.spend : 0;

  return (
    <>
      <GlassCard delay={120} glow={vrColor}>
        {hasEntries ? (
          <View style={{ flexDirection: 'row' }}>
            <Stat label="Variance ratio (A/B)" value={vr.toFixed(3)} color={vrColor} hint={vr <= 1 ? 'Favorable' : 'Unfavorable'} />
            <Stat label="Operating margin" value={`${(margin * 100).toFixed(1)}%`} color={margin >= 0.1 ? colors.teal : colors.amber} />
          </View>
        ) : (
          <Dim>Record this month’s income and costs to see operating performance.</Dim>
        )}
      </GlassCard>

      <GlassCard delay={180}>
        <H2>OpEx / CapEx separation</H2>
        <View style={{ marginTop: 12 }}>
          <View style={styles.rowBetween}>
            <Text style={[styles.rowLabel, { color: colors.textDim }]}>Operating costs</Text>
            <Text style={[styles.rowVal, { color: colors.text }]}>{fmtMoney(b.opex, { compact: true })}</Text>
          </View>
          <ProgressBar value={1 - capexShare} color={theme.accent} />
          <View style={[styles.rowBetween, { marginTop: 14 }]}>
            <Text style={[styles.rowLabel, { color: colors.textDim }]}>Capital investments</Text>
            <Text style={[styles.rowVal, { color: colors.text }]}>{fmtMoney(b.capex, { compact: true })}</Text>
          </View>
          <ProgressBar value={capexShare} color={theme.accent2} />
        </View>
      </GlassCard>

      <GlassCard delay={240}>
        <H2>Commitment tracking</H2>
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Stat label="Committed (fixed)" value={fmtMoney(committed, { compact: true })} hint={`${t.income > 0 ? ((committed / t.income) * 100).toFixed(0) : 0}% of revenue`} />
          <Stat label="Flexible (variable)" value={fmtMoney(variableSpend, { compact: true })} hint="Controllable levers" />
        </View>
        <View style={{ height: 12 }} />
        <ProgressBar value={t.spend > 0 ? committed / t.spend : 0} color={colors.amber} />
        <Dim style={{ marginTop: 8 }}>Share of total outflow locked in by recurring commitments.</Dim>
      </GlassCard>
    </>
  );
};

const styles = StyleSheet.create({
  big: { fontSize: 32, fontWeight: '900', marginVertical: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { fontSize: 13, fontWeight: '700' },
  rowVal: { fontSize: 14, fontWeight: '800' },
});
