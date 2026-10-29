import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { GlassCard } from '../components/GlassCard';
import { FreedomSphere } from '../components/FreedomSphere';
import { HapticSlider } from '../components/HapticSlider';
import { WealthChart } from '../components/WealthChart';
import { Stat } from '../components/Bits';
import { Dim, H1, H2 } from '../components/Typography';
import { useAura } from '../state/AppContext';
import { avgSaving, freedomTarget, lifestyleCreep, monthTotals, savingsBalance, sliderConfig } from '../engine/selectors';
import { projectByMonths, projectPaceByMonths } from '../engine/math';
import { fmtMoney } from '../utils/format';

const HORIZONS = [
  { label: '1 month', months: 1 },
  { label: '1 year', months: 12 },
  { label: '3 years', months: 36 },
  { label: '5 years', months: 60 },
  { label: '10 years', months: 120 },
] as const;

export const FutureScreen = () => {
  const { mode, copy, theme, colors, dataset, monthIndex, plan, setPlan, resetPlan } = useAura();
  const cfg = sliderConfig(dataset);
  const [horizonMonths, setHorizonMonths] = useState<number>(120);
  const [monthlyText, setMonthlyText] = useState(String(plan.monthly));
  const [rateText, setRateText] = useState((plan.rate * 100).toFixed(1));
  const [goalText, setGoalText] = useState(String(freedomTarget(dataset, monthIndex)));
  useEffect(() => setMonthlyText(String(plan.monthly)), [plan.monthly]);
  useEffect(() => setRateText((plan.rate * 100).toFixed(1)), [plan.rate]);
  const target = freedomTarget(dataset, monthIndex);
  useEffect(() => setGoalText(String(target)), [target]);
  const commitMonthly = () => {
    const parsed = Number(monthlyText.replace(/,/g, '').trim());
    const bounded = Math.min(cfg.max, Math.max(cfg.min, Number.isFinite(parsed) ? parsed : plan.monthly));
    const stepped = cfg.min + Math.round((bounded - cfg.min) / cfg.step) * cfg.step;
    const next = Math.min(cfg.max, Number(stepped.toFixed(0)));
    setPlan({ monthly: next });
    setMonthlyText(String(next));
  };
  const commitRate = () => {
    const parsed = Number(rateText.trim());
    const bounded = Math.min(15, Math.max(0, Number.isFinite(parsed) ? parsed : plan.rate * 100));
    const next = Math.round(bounded * 2) / 2;
    setPlan({ rate: next / 100 });
    setRateText(next.toFixed(1));
  };
  const commitGoal = () => {
    const parsed = Number(goalText.replace(/,/g, '').trim());
    if (!Number.isFinite(parsed) || parsed < 0) {
      setGoalText(String(target));
      return;
    }
    const next = Math.round(parsed);
    setGoalText(String(next));
  };
  const principal = savingsBalance(dataset, monthIndex);
  const selectedGoal = Math.max(0, Number(goalText.replace(/,/g, '')) || 0);
  const totals = monthTotals(dataset, monthIndex);
  const observed = avgSaving(dataset, monthIndex, 3);

  const { projected, actualPace, labels, recommendedMonthly } = useMemo(() => {
    const creep = lifestyleCreep(dataset, monthIndex).annualErosion;
    const fullPlan = projectByMonths(principal, plan.monthly, plan.rate, horizonMonths);
    const fullPace = projectPaceByMonths(principal, observed, plan.rate, horizonMonths, creep);
    const interval = horizonMonths <= 12 ? 1 : 12;
    const indices = Array.from({ length: Math.ceil(horizonMonths / interval) + 1 }, (_, index) =>
      Math.min(index * interval, horizonMonths),
    );
    if (indices[indices.length - 1] !== horizonMonths) indices.push(horizonMonths);
    const periodRate = plan.rate / 12;
    const growthFactor = (1 + periodRate) ** horizonMonths;
    const contributionFactor = periodRate === 0
      ? horizonMonths
      : (growthFactor - 1) / periodRate;
    const required = selectedGoal <= principal
      ? 0
      : Math.max(0, (selectedGoal - principal * growthFactor) / contributionFactor);
    return {
      projected: indices.map((index) => fullPlan[index]),
      actualPace: indices.map((index) => fullPace[index]),
      labels: indices.map((index) => {
        if (index === 0) return 'Today';
        if (horizonMonths === 1) return '1 month';
        const years = index / 12;
        return years < 1 ? `${index} mo` : `${years} yr${years === 1 ? '' : 's'}`;
      }),
      recommendedMonthly: Number.isFinite(required) ? Math.ceil(required) : 0,
    };
  }, [dataset, horizonMonths, monthIndex, observed, plan.monthly, plan.rate, principal, selectedGoal]);

  const final = projected[projected.length - 1];
  const paceFinal = actualPace[actualPace.length - 1];
  const ratio = selectedGoal > 0 ? final / selectedGoal : 0;
  const series = [
    { key: 'proj', label: 'Your plan', color: theme.accent, values: projected, area: true },
    { key: 'act', label: 'Actual pace', color: colors.teal, values: actualPace },
  ];
  const gap = final - paceFinal;
  const guidance = totals.leftover < 0
    ? `Spending is above income by ${fmtMoney(Math.abs(totals.leftover), { compact: true })} this month. Review flexible categories first and choose one limit you can adjust.`
    : plan.monthly > Math.max(0, totals.leftover)
      ? `Your planned saving is higher than this month's remaining ${fmtMoney(Math.max(0, totals.leftover), { compact: true })}. Try a contribution that fits your cash flow, then review it next month.`
      : observed <= 0
        ? 'No recent savings entries are recorded. Start with a manageable monthly amount and record it in Activity to compare your actual pace.'
        : recommendedMonthly > plan.monthly
          ? `To reach your goal in ${HORIZONS.find((item) => item.months === horizonMonths)?.label}, the estimate is about ${fmtMoney(recommendedMonthly, { compact: true })}/month. Compare that with essentials and choose an amount that feels sustainable.`
          : `Your current plan is on track to meet this goal within ${HORIZONS.find((item) => item.months === horizonMonths)?.label}. Review your budget monthly and adjust if your priorities change.`;

  return (
    <Screen>
      <H1>{copy.futureTitle}</H1>
      <Dim style={{ marginBottom: 12 }}>{copy.futureSub}</Dim>

      <GlassCard glow={theme.accent}>
        <H2 style={styles.centeredHeading}>Choose your timeframe</H2>
        <View style={styles.horizonRow}>
          {HORIZONS.map((horizon) => {
            const selected = horizon.months === horizonMonths;
            return (
              <Pressable
                key={horizon.months}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setHorizonMonths(horizon.months)}
                style={[styles.horizonChip, { borderColor: selected ? theme.accent : colors.border, backgroundColor: selected ? `${theme.accent}18` : colors.surface }]}
              >
                <Text style={{ color: selected ? theme.accent : colors.textDim, fontSize: 11, fontWeight: '700' }}>{horizon.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <FreedomSphere ratio={ratio} accent={theme.accent} accent2={theme.accent2} label={copy.sphereLabel} />
        <Text style={[styles.final, { color: colors.text }]}>{fmtMoney(final, { compact: true })}</Text>
        <Dim style={{ textAlign: 'center' }}>
          estimated at {HORIZONS.find((item) => item.months === horizonMonths)?.label}
        </Dim>
        <View style={[styles.goalRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.goalLabel, { color: colors.textDim }]}>My target (TZS)</Text>
          <TextInput
            accessibilityLabel="My financial goal target in Tanzanian shillings"
            value={goalText}
            onChangeText={setGoalText}
            onBlur={commitGoal}
            keyboardType="number-pad"
            selectTextOnFocus
            style={[styles.goalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
          />
        </View>
      </GlassCard>

      <GlassCard delay={100}>
        <H2 style={{ marginBottom: 12 }}>Build a plan you can keep</H2>
        <HapticSlider
          label={`${copy.savingSlider} · TZS`}
          value={Math.min(plan.monthly, cfg.max)}
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          onChange={(v) => setPlan({ monthly: v })}
          format={(v) => fmtMoney(v, { compact: true, decimals: 0 })}
          color={theme.accent}
          editableValue={{ value: monthlyText, onChangeText: setMonthlyText, onBlur: commitMonthly }}
        />
        <HapticSlider
          label={`${copy.returnSlider} · %`}
          value={plan.rate}
          min={0}
          max={0.15}
          step={0.005}
          onChange={(v) => setPlan({ rate: v })}
          format={(v) => `${(v * 100).toFixed(1)}%`}
          color={theme.accent2}
          editableValue={{ value: rateText, onChangeText: setRateText, onBlur: commitRate, keyboardType: 'decimal-pad' }}
        />
        <Dim>Try a few amounts. Return assumptions are estimates, not guarantees.</Dim>
        <Pressable onPress={resetPlan} style={styles.reset}>
          <View style={styles.resetContent}>
            <Ionicons name="refresh-outline" size={15} color={colors.textDim} />
            <Text style={{ color: colors.textDim, fontWeight: '700', fontSize: 12 }}>Reset to my current pace</Text>
          </View>
        </Pressable>
      </GlassCard>

      <GlassCard delay={160}>
        <H2 style={{ marginBottom: 10 }}>{copy.chartTitle}</H2>
        <WealthChart series={series} xLabels={labels} format={(n) => fmtMoney(n, { compact: true })} animateKey={`${mode}-${horizonMonths}`} />
      </GlassCard>

      <GlassCard delay={220} glow={totals.leftover >= 0 ? colors.teal : colors.crimson}>
        <View style={styles.comparisonHeading}>
          <Ionicons name="git-compare-outline" size={19} color={theme.accent} />
          <H2>Plan versus current pace</H2>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Your plan" value={fmtMoney(final, { compact: true })} color={theme.accent} />
          <Stat label="Current pace" value={fmtMoney(paceFinal, { compact: true })} color={colors.teal} />
        </View>
        <Dim style={{ marginTop: 10 }}>
          Difference at {HORIZONS.find((item) => item.months === horizonMonths)?.label}: {fmtMoney(gap, { compact: true })}. Current pace uses your recent recorded savings.
        </Dim>
        <View style={[styles.coachBox, { backgroundColor: colors.surfaceMuted }]}>
          <View style={styles.coachTitleRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.accent} />
            <Text style={[styles.coachTitle, { color: colors.text }]}>A helpful next step</Text>
          </View>
          <Dim>{guidance}</Dim>
        </View>
        <Dim style={{ marginTop: 10 }}>Planning estimates only. This guidance is educational and is not personal financial or investment advice.</Dim>
      </GlassCard>
    </Screen>
  );
};

const styles = StyleSheet.create({
  centeredHeading: { textAlign: 'center', marginBottom: 10 },
  horizonRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 14 },
  horizonChip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 8 },
  goalRow: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 14, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalLabel: { fontSize: 12, fontWeight: '700' },
  goalInput: { minWidth: 128, maxWidth: '60%', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, textAlign: 'right', fontSize: 13, fontWeight: '700' },
  final: { fontSize: 30, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  reset: { alignSelf: 'flex-start', paddingVertical: 6 },
  resetContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  comparisonHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  coachBox: { borderRadius: 14, padding: 12, marginTop: 14 },
  coachTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  coachTitle: { fontSize: 13, fontWeight: '800' },
});
