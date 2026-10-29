import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { Screen } from '../components/Screen';
import { GlassCard } from '../components/GlassCard';
import { HapticSlider } from '../components/HapticSlider';
import { WealthChart } from '../components/WealthChart';
import { Stat } from '../components/Bits';
import { Dim, H1, H2 } from '../components/Typography';
import { useAura } from '../state/AppContext';
import { categoryRows, monthTotals, paretoDrivers } from '../engine/selectors';
import { Drivers, breakEvenUnits, clamp, driverForecast } from '../engine/math';
import { fmtMoney, fmtPct } from '../utils/format';
import { categoryColor } from '../theme/theme';

const RANGE = 60; // variance bar saturates at +/-60%

const VarianceList = () => {
  const { dataset, monthIndex, copy, colors } = useAura();
  const rows = useMemo(() => categoryRows(dataset, monthIndex), [dataset, monthIndex]);
  const hasExpenses = dataset.transactions.some((transaction) => transaction.monthIndex === monthIndex && transaction.type === 'expense');
  return (
    <GlassCard delay={60}>
      <H2>{copy.varianceTitle}</H2>
      <Dim style={{ marginBottom: 10 }}>Variance % = (Actual − Budgeted) / Budgeted × 100</Dim>
      {!hasExpenses ? (
        <Dim>Record an expense this month to compare your spending with your budget.</Dim>
      ) : rows.map((r, i) => {
        const color = r.favor === 'favorable' ? colors.teal : colors.crimson;
        const pct = clamp(Math.abs(r.variance) / RANGE, 0, 1) * 50;
        return (
          <Animated.View key={r.category.id} entering={FadeInLeft.delay(i * 40).springify()} style={styles.vrow}>
            <View style={styles.vnameWrap}>
              <Ionicons name={r.category.icon as React.ComponentProps<typeof Ionicons>['name']} size={14} color={categoryColor(r.category.id, colors === undefined ? 'light' : 'light')} />
              <Text style={[styles.vname, { color: colors.text }]} numberOfLines={1}>
                {r.category.name}
              </Text>
            </View>
            <View style={styles.vtrack}>
              <View style={[styles.vcenter, { backgroundColor: colors.border }]} />
              <View
                style={[
                  styles.vbar,
                  { backgroundColor: color, shadowColor: color, width: `${pct}%`, ...(r.variance >= 0 ? { left: '50%' } : { right: '50%' }) },
                ]}
              />
            </View>
            <Text style={[styles.vpct, { color }]}>{fmtPct(r.variance, 0)}</Text>
          </Animated.View>
        );
      })}
    </GlassCard>
  );
};

const HistoryCard = () => {
  const { dataset, theme, colors } = useAura();
  const history = useMemo(() => dataset.months.map((_, month) => monthTotals(dataset, month)), [dataset]);
  const hasTransactions = dataset.transactions.length > 0;
  const series = [
    { key: 'income', label: 'Income', color: theme.accent2, values: history.map((month) => month.income) },
    { key: 'spend', label: 'Spending', color: colors.crimson, values: history.map((month) => month.spend) },
    { key: 'saved', label: 'Savings', color: colors.teal, values: history.map((month) => month.saved), area: true },
  ];

  return (
    <GlassCard>
      <H2>Two-year money overview</H2>
      <Dim style={{ marginBottom: 10 }}>Income, spending and savings recorded over the last 24 months.</Dim>
      {hasTransactions ? (
        <WealthChart
          series={series}
          xLabels={dataset.months}
          format={(amount) => fmtMoney(amount, { compact: true })}
          animateKey={dataset.mode}
          height={210}
        />
      ) : (
        <Dim>Add income or spending entries to build your 24-month overview.</Dim>
      )}
    </GlassCard>
  );
};

const ParetoCard = () => {
  const { dataset, monthIndex, copy, theme, colors } = useAura();
  const p = useMemo(() => paretoDrivers(dataset, monthIndex), [dataset, monthIndex]);
  const top = p.rows.slice(0, 8);
  const max = top[0]?.value ?? 1;
  return (
    <GlassCard delay={120}>
      <H2>{copy.paretoTitle}</H2>
      <Dim style={{ marginBottom: 12 }}>{copy.paretoHint}</Dim>
      {p.rows.length === 0 ? (
        <Dim>Record discretionary expenses to see what contributes most to your spending.</Dim>
      ) : (
        <>
          <View style={{ flexDirection: 'row', marginBottom: 14 }}>
            <Stat label={`Top 20% (${p.topN} of ${p.rows.length})`} value={`${(p.topShare * 100).toFixed(0)}%`} color={theme.accent} hint="of discretionary outflow" />
            <Stat label="Drivers for 80%" value={`${p.vitalCount} of ${p.rows.length}`} color={colors.amber} hint={`${((p.vitalCount / Math.max(1, p.rows.length)) * 100).toFixed(0)}% of drivers`} />
          </View>
          {top.map((r, i) => (
        <View key={r.label} style={{ marginBottom: 10 }}>
          <View style={styles.prow}>
            <Text style={[styles.pname, { color: colors.textDim }, i < p.topN && { color: colors.text, fontWeight: '800' }]}>{r.label}</Text>
            <Text style={[styles.pval, { color: colors.textDim }]}>
              {fmtMoney(r.value, { compact: true })} · cum {(r.cumulative * 100).toFixed(0)}%
            </Text>
          </View>
          <View style={[styles.ptrack, { backgroundColor: colors.track }]}>
            <View style={[styles.pfill, { width: `${(r.value / max) * 100}%`, backgroundColor: i < p.topN ? theme.accent : colors.border }]} />
          </View>
        </View>
          ))}
        </>
      )}
    </GlassCard>
  );
};

const ForecastCard = () => {
  const { theme, colors } = useAura();
  const [growth, setGrowth] = useState(0.018);
  const [churn, setChurn] = useState(0.006);
  const [price, setPrice] = useState(50000);
  const drivers: Drivers = { units: 3900, price, variableCostPerUnit: 15000, fixedCosts: 105000000, monthlyGrowth: growth, churn };
  const fc = useMemo(() => driverForecast(drivers, 12), [growth, churn, price]);
  const be = breakEvenUnits(drivers);
  const last = fc[fc.length - 1];
  const series = [
    { key: 'rev', label: 'Revenue', color: theme.accent2, values: fc.map((f) => f.revenue) },
    { key: 'cost', label: 'Total cost', color: colors.crimson, values: fc.map((f) => f.totalCost) },
    { key: 'profit', label: 'Operating profit', color: colors.teal, values: fc.map((f) => f.profit), area: true },
  ];
  return (
    <GlassCard delay={180}>
      <H2>Driver-based forecast</H2>
      <Dim style={{ marginBottom: 12 }}>Revenue = Units × Price · Cost = Fixed + Units × VarCost · Units(t) = U₀(1 + g − churn)^t</Dim>
      <HapticSlider label="Monthly unit growth" value={growth} min={0} max={0.06} step={0.001} onChange={setGrowth} format={(v) => `${(v * 100).toFixed(1)}%`} color={theme.accent} />
      <HapticSlider label="Monthly churn" value={churn} min={0} max={0.04} step={0.001} onChange={setChurn} format={(v) => `${(v * 100).toFixed(1)}%`} color={colors.amber} />
      <HapticSlider label="Unit price" value={price} min={30000} max={80000} step={1000} onChange={setPrice} format={(v) => fmtMoney(v, { compact: true })} color={theme.accent2} />
      <View style={{ flexDirection: 'row', marginVertical: 8 }}>
        <Stat label="Month-12 profit" value={fmtMoney(last.profit, { compact: true })} color={last.profit >= 0 ? colors.teal : colors.crimson} />
        <Stat label="Break-even units" value={Number.isFinite(be) ? Math.round(be).toLocaleString('en-US') : '∞'} />
      </View>
      <WealthChart series={series} xLabels={fc.map((f) => `Month ${f.month}`)} format={(n) => fmtMoney(n, { compact: true })} animateKey="forecast" height={200} />
    </GlassCard>
  );
};

export const InsightsScreen = () => {
  const { mode, copy } = useAura();
  return (
    <Screen>
      <H1>{copy.insightsTitle}</H1>
      <Dim style={{ marginBottom: 14 }}>{copy.insightsSub}</Dim>
      <HistoryCard />
      <VarianceList />
      <ParetoCard />
      {mode === 'vanguard' && <ForecastCard />}
    </Screen>
  );
};

const styles = StyleSheet.create({
  vrow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  vnameWrap: { width: 130, flexDirection: 'row', alignItems: 'center', gap: 5 },
  vname: { flex: 1, fontSize: 12, fontWeight: '600' },
  vtrack: { flex: 1, height: 10, justifyContent: 'center', marginHorizontal: 8 },
  vcenter: { position: 'absolute', left: '50%', width: 1, height: 14, top: -2 },
  vbar: { position: 'absolute', height: 8, borderRadius: 4, shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  vpct: { width: 46, textAlign: 'right', fontSize: 12, fontWeight: '800' },
  prow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  pname: { fontSize: 12 },
  pval: { fontSize: 11 },
  ptrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  pfill: { height: 8, borderRadius: 4 },
});
