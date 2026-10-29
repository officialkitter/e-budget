import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { GlassCard } from '../components/GlassCard';
import { ModeSwitcher } from '../components/ModeSwitcher';
import { GaugeTile } from '../components/GaugeTile';
import { HapticSlider } from '../components/HapticSlider';
import { SeedPanel, GrowthPanel, VanguardPanel } from '../components/ModePanels';
import { Dim, H1, H2 } from '../components/Typography';
import { useAura } from '../state/AppContext';
import { categoryRows, monthTotals } from '../engine/selectors';
import { fmtMoney } from '../utils/format';

export const HomeScreen = () => {
  const { mode, copy, theme, colors, dataset, monthIndex, setMonthIndex, updateCategoryBudget, notificationPreferences } = useAura();
  const [budgetEditorOpen, setBudgetEditorOpen] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({});
  const [budgetError, setBudgetError] = useState('');
  const totals = useMemo(() => monthTotals(dataset, monthIndex), [dataset, monthIndex]);
  const rows = useMemo(() => categoryRows(dataset, monthIndex), [dataset, monthIndex]);
  const positive = totals.leftover >= 0;
  const overBudget = rows.find((row) => row.category.bucket !== 'saving' && row.actual > row.budget);
  const openBudgetEditor = () => {
    setBudgetDraft(Object.fromEntries(dataset.categories.map((category) => [category.id, String(category.budget)])));
    setBudgetError('');
    setBudgetEditorOpen(true);
  };
  const saveBudgets = () => {
    const updated = dataset.categories.map((category) => ({
      category,
      budget: Number((budgetDraft[category.id] ?? '').replace(/,/g, '').trim()),
    }));
    if (updated.some(({ budget }) => !Number.isInteger(budget) || budget < 0)) {
      setBudgetError('Enter whole TZS amounts of zero or more for every category.');
      return;
    }
    try {
      updated.forEach(({ category, budget }) => updateCategoryBudget(category.id, budget));
      setBudgetEditorOpen(false);
      setBudgetError('');
    } catch (error) {
      setBudgetError(error instanceof Error ? error.message : 'Unable to save your budget.');
    }
  };

  return (
    <Screen>
      <H1>{copy.tabs.home}</H1>
      <Dim>{copy.subtitle}</Dim>
      {dataset.transactions.length === 0 && (
        <Dim style={{ marginTop: 6 }}>Add income and spending in Activity to build your monthly overview.</Dim>
      )}
      <ModeSwitcher />

      {notificationPreferences.budgetReminders && (
        <View style={[styles.checkInCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.checkInIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="calendar-outline" size={18} color={overBudget || !positive ? colors.amber : colors.teal} />
          </View>
          <View style={styles.checkInCopy}>
            <Text style={[styles.checkInTitle, { color: colors.text }]}>Your budget check-in</Text>
            <Text style={[styles.checkInDetail, { color: colors.textDim }]}>
              {overBudget
                ? `${overBudget.category.name} is ${fmtMoney(overBudget.actual - overBudget.budget, { compact: true })} over its monthly limit. Review the plan and adjust what works for you.`
                : !positive
                  ? `Your recorded spending is above income by ${fmtMoney(Math.abs(totals.leftover), { compact: true })}. Check recent entries and revisit flexible spending first.`
                  : totals.income > 0
                    ? 'Your recorded spending is within your current category limits. Review your savings goal and keep logging activity.'
                    : 'Add income and spending entries to get a useful monthly budget check-in.'}
            </Text>
          </View>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={openBudgetEditor}
        style={[styles.budgetButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.budgetIcon, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="create-outline" size={18} color={theme.accent} />
        </View>
        <View style={styles.budgetButtonCopy}>
          <Text style={[styles.budgetButtonTitle, { color: colors.text }]}>Make this budget yours</Text>
          <Text style={[styles.budgetButtonSub, { color: colors.textDim }]}>Set monthly limits for each category</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color={colors.textDim} />
      </Pressable>

      <GlassCard glow={positive ? theme.accent : colors.crimson}>
        <Dim>
          {copy.leftover} · {dataset.months[monthIndex]}
        </Dim>
        <Text style={[styles.hero, { color: positive ? theme.accent : colors.crimson }]}>{fmtMoney(totals.leftover, { compact: true })}</Text>
        <View style={styles.row}>
          <View style={styles.cell}>
            <Dim>{copy.income}</Dim>
            <Text style={[styles.cellVal, { color: colors.text }]}>{fmtMoney(totals.income, { compact: true })}</Text>
          </View>
          <View style={styles.cell}>
            <Dim>Spent</Dim>
            <Text style={[styles.cellVal, { color: colors.text }]}>{fmtMoney(totals.spend, { compact: true })}</Text>
          </View>
          <View style={styles.cell}>
            <Dim>{copy.savings}</Dim>
            <Text style={[styles.cellVal, { color: colors.teal }]}>{fmtMoney(totals.saved, { compact: true })}</Text>
          </View>
        </View>
        <View style={{ height: 14 }} />
        <HapticSlider
          label="Choose a month"
          value={monthIndex}
          min={0}
          max={dataset.months.length - 1}
          step={1}
          onChange={setMonthIndex}
          format={(v) => dataset.months[v] ?? ''}
          color={theme.accent2}
        />
      </GlassCard>

      <H2 style={{ marginBottom: 4 }}>{copy.gaugeTitle}</H2>
      <Dim style={{ marginBottom: 12 }}>{copy.gaugeHint}</Dim>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gauges} contentContainerStyle={{ paddingRight: 20 }}>
        {rows.map((r, index) => (
          <GaugeTile key={r.category.id} row={r} categoryIndex={index} />
        ))}
      </ScrollView>

      {mode === 'seed' && <SeedPanel />}
      {mode === 'growth' && <GrowthPanel />}
      {mode === 'vanguard' && <VanguardPanel />}
      <Modal visible={budgetEditorOpen} transparent animationType="slide" onRequestClose={() => setBudgetEditorOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Your monthly budget</Text>
                <Dim>Adjust category limits to fit your priorities.</Dim>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close budget editor" onPress={() => setBudgetEditorOpen(false)} style={styles.closeButton}>
                <Ionicons name="close-outline" size={22} color={colors.textDim} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {dataset.categories.map((category) => (
                <View key={category.id} style={[styles.budgetRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.budgetCategory}>
                    <Ionicons name={category.icon as React.ComponentProps<typeof Ionicons>['name']} size={18} color={theme.accent} />
                    <Text style={[styles.budgetCategoryName, { color: colors.text }]} numberOfLines={1}>{category.name}</Text>
                  </View>
                  <TextInput
                    accessibilityLabel={`${category.name} monthly budget in Tanzanian shillings`}
                    value={budgetDraft[category.id] ?? ''}
                    onChangeText={(value) => setBudgetDraft((previous) => ({ ...previous, [category.id]: value.replace(/[^\d,]/g, '') }))}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    style={[styles.budgetInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  />
                </View>
              ))}
              <Text style={[styles.budgetTotal, { color: colors.text }]}>
                Total category budgets: {fmtMoney(dataset.categories.reduce((sum, category) => {
                  const raw = budgetDraft[category.id];
                  const amount = raw === undefined ? category.budget : Number(raw.replace(/,/g, ''));
                  return sum + (Number.isFinite(amount) ? amount : 0);
                }, 0), { compact: true })}
              </Text>
              {budgetError ? <Text style={[styles.budgetError, { color: colors.crimson }]}>{budgetError}</Text> : null}
              <Pressable accessibilityRole="button" onPress={saveBudgets} style={[styles.saveBudgetButton, { backgroundColor: theme.accent }]}>
                <Text style={styles.saveBudgetLabel}>Save my budget</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: { fontSize: 44, fontWeight: '900', marginVertical: 6, letterSpacing: -1 },
  row: { flexDirection: 'row', marginTop: 4 },
  cell: { flex: 1 },
  cellVal: { fontSize: 17, fontWeight: '800', marginTop: 2 },
  gauges: { marginHorizontal: -20, paddingLeft: 20, marginBottom: 20 },
  budgetButton: { minHeight: 66, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, marginTop: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
  budgetIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  budgetButtonCopy: { flex: 1 },
  budgetButtonTitle: { fontSize: 13, fontWeight: '800' },
  budgetButtonSub: { fontSize: 11, marginTop: 3 },
  checkInCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 14, marginBottom: 2, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkInIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkInCopy: { flex: 1 },
  checkInTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  checkInDetail: { fontSize: 11, lineHeight: 16 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' },
  modalCard: { maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 26 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 3 },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  budgetRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  budgetCategory: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetCategoryName: { flex: 1, fontSize: 13, fontWeight: '600' },
  budgetInput: { width: 120, minHeight: 40, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, textAlign: 'right', fontSize: 13, fontWeight: '700' },
  budgetTotal: { fontSize: 14, fontWeight: '800', textAlign: 'right', marginTop: 14, marginBottom: 8 },
  budgetError: { fontSize: 12, marginBottom: 10 },
  saveBudgetButton: { minHeight: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBudgetLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
