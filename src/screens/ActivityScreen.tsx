import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { GlassCard } from '../components/GlassCard';
import { Dim, H1, H2 } from '../components/Typography';
import { useAura } from '../state/AppContext';
import { monthTotals } from '../engine/selectors';
import { FinancialAccount, Transaction } from '../engine/types';
import { dayLabel, fmtMoney } from '../utils/format';
import { BrandMark } from '../components/BrandMark';

type EntryType = 'income' | 'expense';
type FormType = 'transaction' | 'wallet' | 'card' | null;

const dateInputValue = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
};

const dateTypingValue = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const parseDateInput = (value: string): number | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date.getTime();
};

const ActionButton = ({ label, icon, onPress, colors, secondary = false }: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  colors: ReturnType<typeof useAura>['colors'];
  secondary?: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={[styles.actionButton, { backgroundColor: secondary ? colors.surface : colors.accent, borderColor: colors.accent }]}
  >
    <Ionicons name={icon} size={17} color={secondary ? colors.accent : '#FFFFFF'} />
    <Text style={[styles.actionText, { color: secondary ? colors.accent : '#FFFFFF' }]}>{label}</Text>
  </Pressable>
);

export const ActivityScreen = () => {
  const {
    dataset,
    monthIndex,
    setMonthIndex,
    copy,
    colors,
    accounts,
    addAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useAura();
  const [form, setForm] = useState<FormType>(null);
  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dateText, setDateText] = useState(dateInputValue(new Date()));
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState<string | undefined>();
  const [accountName, setAccountName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [formError, setFormError] = useState('');
  const totals = useMemo(() => monthTotals(dataset, monthIndex), [dataset, monthIndex]);
  const catById = useMemo(() => new Map(dataset.categories.map((category) => [category.id, category])), [dataset]);
  const data = useMemo(
    () => dataset.transactions.filter((transaction) => transaction.monthIndex === monthIndex).sort((a, b) => b.date - a.date),
    [dataset, monthIndex],
  );
  const expenseCategories = dataset.categories;
  const closeForm = () => {
    setForm(null);
    setFormError('');
    setEditingTransactionId(null);
  };
  const openTransactionForm = () => {
    setEditingTransactionId(null);
    setEntryType('expense');
    setAmount('');
    setDescription('');
    setDateText(dateInputValue(new Date()));
    setCategoryId(dataset.categories.find((category) => category.bucket !== 'saving')?.id ?? '');
    setAccountId(undefined);
    setFormError('');
    setForm('transaction');
  };
  const openEditTransaction = (transaction: Transaction) => {
    setEditingTransactionId(transaction.id);
    setEntryType(transaction.type);
    setAmount(String(transaction.amount));
    setDescription(transaction.label);
    setDateText(dateInputValue(new Date(transaction.date)));
    setCategoryId(transaction.categoryId);
    setAccountId(transaction.accountId);
    setFormError('');
    setForm('transaction');
  };
  const openAccountForm = (type: 'wallet' | 'card') => {
    setAccountName('');
    setOpeningBalance('');
    setLastFour('');
    setFormError('');
    setForm(type);
  };
  const saveTransaction = () => {
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    if (!description.trim()) {
      setFormError('Add a description so you can recognize this entry later.');
      return;
    }
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setFormError('Enter a whole TZS amount greater than zero.');
      return;
    }
    if (entryType === 'expense' && !categoryId) {
      setFormError('Choose a category for this expense.');
      return;
    }
    const selectedDate = parseDateInput(dateText);
    if (selectedDate === null) {
      setFormError('Enter a real date in DD/MM/YYYY format.');
      return;
    }
    try {
      const transaction = {
        label: description.trim(),
        amount: parsedAmount,
        type: entryType,
        categoryId: entryType === 'income' ? 'income' : categoryId,
        accountId,
        date: selectedDate,
      };
      if (editingTransactionId) updateTransaction(editingTransactionId, transaction);
      else addTransaction(transaction);
      const selectedDateValue = new Date(selectedDate);
      const selectedMonth = selectedDateValue.toLocaleString('en', { month: 'short' });
      const selectedMonthIndex = dataset.months.findIndex(
        (label) => label === `${selectedMonth} ${selectedDateValue.getFullYear()}`,
      );
      if (selectedMonthIndex < 0) throw new Error('Choose a date within the available history.');
      setMonthIndex(selectedMonthIndex);
      closeForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save this entry.');
    }
  };
  const saveAccount = () => {
    const balance = Number(openingBalance.replace(/,/g, '').trim() || '0');
    if (!accountName.trim()) {
      setFormError('Enter a name for this account.');
      return;
    }
    if (!Number.isInteger(balance) || balance < 0) {
      setFormError('Enter a whole TZS opening balance.');
      return;
    }
    if (form === 'card' && !/^\d{4}$/.test(lastFour)) {
      setFormError('Enter the last four digits only.');
      return;
    }
    addAccount({
      name: accountName.trim(),
      type: form === 'card' ? 'card' : 'wallet',
      openingBalance: balance,
      ...(form === 'card' ? { lastFour } : {}),
    });
    closeForm();
  };
  const accountBalance = (account: FinancialAccount) => {
    const activity = dataset.transactions
      .filter((transaction) => transaction.accountId === account.id)
      .reduce((balance, transaction) => balance + (transaction.type === 'income' ? transaction.amount : -transaction.amount), account.openingBalance);
    return activity;
  };
  const confirmDelete = (transaction: Transaction) => {
    Alert.alert('Delete this entry?', 'This removes the entry from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(transaction.id) },
    ]);
  };
  const renderItem = ({ item }: { item: Transaction }) => {
    const category = catById.get(item.categoryId);
    const income = item.type === 'income';
    const account = accounts.find((value) => value.id === item.accountId);
    return (
      <View style={[styles.transactionRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.transactionIcon, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons
            name={(income ? 'arrow-down-outline' : category?.icon ?? 'remove-outline') as React.ComponentProps<typeof Ionicons>['name']}
            size={18}
            color={income ? colors.teal : colors.accent}
          />
        </View>
        <View style={styles.transactionDetail}>
          <Text style={[styles.transactionName, { color: colors.text }]} numberOfLines={1}>{item.label}</Text>
          <Dim numberOfLines={1}>
            {income ? 'Income' : category?.name ?? 'Expense'} · {dayLabel(item.date)}{item.isSample ? ' · Illustrative' : ''}{account ? ` · ${account.name}` : ''}
          </Dim>
        </View>
        <Text style={[styles.transactionAmount, { color: income ? colors.teal : colors.text }]}>
          {income ? '+' : '−'}{fmtMoney(item.amount)}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Delete entry" onPress={() => confirmDelete(item)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={17} color={colors.textDim} />
        </Pressable>
        {!item.isSample && (
          <Pressable accessibilityRole="button" accessibilityLabel="Edit entry" onPress={() => openEditTransaction(item)} style={styles.deleteButton}>
            <Ionicons name="create-outline" size={17} color={colors.textDim} />
          </Pressable>
        )}
      </View>
    );
  };
  const ListHeader = (
    <View>
      <H1>{copy.activityTitle}</H1>
      <Dim style={{ marginBottom: 14 }}>{dataset.months[monthIndex]} · {data.length} entries</Dim>
      {__DEV__ && data.some((transaction) => transaction.isSample) && (
        <View style={[styles.sampleNotice, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
          <Dim style={{ flex: 1 }}>Example entries are marked Illustrative. Remove them in More → Manage records.</Dim>
        </View>
      )}
      <View style={styles.actionRow}>
        <ActionButton label="Add entry" icon="add-outline" onPress={openTransactionForm} colors={colors} />
        <ActionButton label="Add wallet" icon="wallet-outline" onPress={() => openAccountForm('wallet')} colors={colors} secondary />
        <ActionButton label="Add card" icon="card-outline" onPress={() => openAccountForm('card')} colors={colors} secondary />
      </View>
      <GlassCard>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCell}>
            <Dim>Income</Dim>
            <Text style={[styles.summaryAmount, { color: colors.teal }]}>{fmtMoney(totals.income, { compact: true })}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Dim>Spending</Dim>
            <Text style={[styles.summaryAmount, { color: colors.text }]}>{fmtMoney(totals.spend + totals.saved, { compact: true })}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Dim>Available</Dim>
            <Text style={[styles.summaryAmount, { color: colors.accent }]}>{fmtMoney(totals.leftover, { compact: true })}</Text>
          </View>
        </View>
      </GlassCard>
      <View style={styles.sectionHeading}>
        <H2>Wallets and cards</H2>
        <Dim>{accounts.length} accounts</Dim>
      </View>
      {accounts.length === 0 ? (
        <GlassCard>
          <Dim>Add a wallet or card to track its balance alongside your entries.</Dim>
        </GlassCard>
      ) : (
        accounts.map((account) => (
          <View key={account.id} style={[styles.accountRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.accountIcon, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons name={account.type === 'card' ? 'card-outline' : 'wallet-outline'} size={18} color={colors.accent} />
            </View>
            <View style={styles.accountDetail}>
              <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
              <Dim>{account.type === 'card' ? `Card ending in ${account.lastFour}` : 'Wallet'}</Dim>
            </View>
            <Text style={[styles.accountBalance, { color: colors.text }]}>{fmtMoney(accountBalance(account), { compact: true })}</Text>
          </View>
        ))
      )}
      <View style={[styles.sectionHeading, { marginTop: 16 }]}>
        <H2>Recent entries</H2>
        <Dim>{data.length}</Dim>
      </View>
    </View>
  );

  return (
    <>
      <Screen scroll={false}>
        <FlatList
          data={data}
          keyExtractor={(transaction) => transaction.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BrandMark size={46} />
              <Ionicons name="receipt-outline" size={26} color={colors.textDim} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No entries for this month</Text>
              <Dim>Add your first income or expense to start tracking.</Dim>
            </View>
          }
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      </Screen>
      <Modal visible={form !== null} transparent animationType="slide" onRequestClose={closeForm}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {form === 'transaction' ? (editingTransactionId ? 'Edit entry' : 'Add entry') : form === 'wallet' ? 'Add wallet' : 'Add card'}
                </Text>
                <Dim>{form === 'transaction' ? 'Record an amount in whole Tanzanian shillings.' : 'Account details stay on this device.'}</Dim>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close form" onPress={closeForm} style={styles.closeButton}>
                <Ionicons name="close-outline" size={22} color={colors.textDim} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {form === 'transaction' ? (
                <>
                  <View style={styles.choiceRow}>
                    {(['expense', 'income'] as EntryType[]).map((value) => {
                      const selected = entryType === value;
                      return (
                        <Pressable
                          key={value}
                          onPress={() => setEntryType(value)}
                          style={[styles.choice, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? `${colors.accent}18` : colors.surface }]}
                        >
                          <Text style={{ color: selected ? colors.accent : colors.textDim, fontWeight: '700' }}>
                            {value === 'expense' ? 'Expense' : 'Income'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>Amount (TZS)</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="number-pad"
                    placeholder="e.g. 25,000"
                    placeholderTextColor={colors.textDim}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  />
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>Description</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="What was this for?"
                    placeholderTextColor={colors.textDim}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  />
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>Date</Text>
                  <TextInput
                    accessibilityLabel="Entry date in day, month, year format"
                    value={dateText}
                    onChangeText={(value) => setDateText(dateTypingValue(value))}
                    keyboardType="numbers-and-punctuation"
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={colors.textDim}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  />
                  <Dim>Use day/month/year. Dates must be within the available history.</Dim>
                  {entryType === 'expense' && (
                    <>
                      <Text style={[styles.inputLabel, { color: colors.textDim }]}>Category</Text>
                      <View style={styles.optionWrap}>
                        {expenseCategories.map((category) => {
                          const selected = category.id === categoryId;
                          return (
                            <Pressable
                              key={category.id}
                              onPress={() => setCategoryId(category.id)}
                              style={[styles.option, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? `${colors.accent}18` : colors.surface }]}
                            >
                              <Text style={{ color: selected ? colors.accent : colors.textDim, fontSize: 12, fontWeight: '600' }}>{category.name}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  )}
                  {accounts.length > 0 && (
                    <>
                      <Text style={[styles.inputLabel, { color: colors.textDim }]}>Wallet or card (optional)</Text>
                      <View style={styles.optionWrap}>
                        <Pressable
                          onPress={() => setAccountId(undefined)}
                          style={[styles.option, { borderColor: accountId === undefined ? colors.accent : colors.border }]}
                        >
                          <Text style={{ color: accountId === undefined ? colors.accent : colors.textDim, fontSize: 12 }}>None</Text>
                        </Pressable>
                        {accounts.map((account) => (
                          <Pressable
                            key={account.id}
                            onPress={() => setAccountId(account.id)}
                            style={[styles.option, { borderColor: accountId === account.id ? colors.accent : colors.border }]}
                          >
                            <Text style={{ color: accountId === account.id ? colors.accent : colors.textDim, fontSize: 12 }}>{account.name}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>Account name</Text>
                  <TextInput
                    value={accountName}
                    onChangeText={setAccountName}
                    placeholder={form === 'wallet' ? 'e.g. Cash wallet' : 'e.g. Bank card'}
                    placeholderTextColor={colors.textDim}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  />
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>Opening balance (TZS)</Text>
                  <TextInput
                    value={openingBalance}
                    onChangeText={setOpeningBalance}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textDim}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  />
                  {form === 'card' && (
                    <>
                      <Text style={[styles.inputLabel, { color: colors.textDim }]}>Last four digits only</Text>
                      <TextInput
                        value={lastFour}
                        onChangeText={(value) => setLastFour(value.replace(/\D/g, '').slice(0, 4))}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="1234"
                        placeholderTextColor={colors.textDim}
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                      />
                      <Dim>Never enter a full card number, PIN, or security code.</Dim>
                    </>
                  )}
                </>
              )}
              {formError ? <Text style={[styles.error, { color: colors.crimson }]}>{formError}</Text> : null}
              <ActionButton
                label={form === 'transaction' ? (editingTransactionId ? 'Save changes' : 'Save entry') : 'Save account'}
                icon="checkmark-outline"
                onPress={form === 'transaction' ? saveTransaction : saveAccount}
                colors={colors}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sampleNotice: { borderWidth: 1, borderRadius: 12, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  actionButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '700' },
  summaryRow: { flexDirection: 'row' },
  summaryCell: { flex: 1, minWidth: 0 },
  summaryAmount: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  accountRow: { minHeight: 68, borderRadius: 14, borderWidth: 1, marginBottom: 8, padding: 12, flexDirection: 'row', alignItems: 'center' },
  accountIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  accountDetail: { flex: 1 },
  accountName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  accountBalance: { fontSize: 13, fontWeight: '700', marginLeft: 8 },
  transactionRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  transactionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  transactionDetail: { flex: 1, minWidth: 0 },
  transactionName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  transactionAmount: { fontSize: 13, fontWeight: '800', marginLeft: 8 },
  deleteButton: { padding: 8, marginLeft: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 26, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 3 },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  choiceRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  choice: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 10 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 15 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 },
  error: { fontSize: 13, marginTop: 12, marginBottom: 2 },
});
