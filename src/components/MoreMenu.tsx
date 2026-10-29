import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FinancialAccount } from '../engine/types';
import { NotificationPreferences, useAura } from '../state/AppContext';
import { fmtMoney } from '../utils/format';
import { Dim } from './Typography';

type MenuPage = 'menu' | 'settings' | 'accounts' | 'notifications' | 'records';
type AccountForm = 'wallet' | 'card' | null;
type SettingsRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  detail: string;
  onPress: () => void;
  colors: ReturnType<typeof useAura>['colors'];
};

const MenuRow = ({ icon, title, detail, onPress, colors }: SettingsRowProps) => (
  <Pressable onPress={onPress} style={[styles.menuRow, { borderBottomColor: colors.border }]}>
    <View style={[styles.menuIcon, { backgroundColor: colors.surfaceMuted }]}>
      <Ionicons name={icon} size={19} color={colors.accent} />
    </View>
    <View style={styles.menuText}>
      <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.menuDetail, { color: colors.textDim }]}>{detail}</Text>
    </View>
    <Ionicons name="chevron-forward-outline" size={18} color={colors.textDim} />
  </Pressable>
);

const Action = ({ title, onPress, colors, secondary = false }: {
  title: string;
  onPress: () => void;
  colors: ReturnType<typeof useAura>['colors'];
  secondary?: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={[styles.action, { backgroundColor: secondary ? colors.surface : colors.accent, borderColor: colors.accent }]}
  >
    <Text style={{ color: secondary ? colors.accent : '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{title}</Text>
  </Pressable>
);

export const MoreMenu = () => {
  const {
    colors,
    theme,
    colorScheme,
    toggleColorScheme,
    dataset,
    accounts,
    addAccount,
    deleteAccount,
    profile,
    endSession,
    clearLegacyFinanceData,
    notificationPreferences,
    updateNotificationPreferences,
    deleteMonth,
    deleteYear,
    deleteCategoryForMonth,
  } = useAura();
  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState<MenuPage>('menu');
  const [accountForm, setAccountForm] = useState<AccountForm>(null);
  const [accountName, setAccountName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const years = useMemo(
    () => [...new Set(dataset.months.map((month) => Number(month.split(' ')[1])))].sort((a, b) => b - a),
    [dataset.months],
  );
  const close = () => {
    setVisible(false);
    setPage('menu');
    setSelectedMonth(null);
    setAccountForm(null);
    setFormError('');
  };
  const startAccountForm = (type: 'wallet' | 'card') => {
    setAccountForm(type);
    setAccountName('');
    setOpeningBalance('');
    setLastFour('');
    setFormError('');
  };
  const confirmDelete = (title: string, message: string, action: () => void) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: action },
    ]);
  };
  const saveAccount = () => {
    const balance = Number(openingBalance.replace(/,/g, '').trim() || '0');
    if (!accountName.trim()) {
      setFormError('Enter an account name.');
      return;
    }
    if (!Number.isInteger(balance) || balance < 0) {
      setFormError('Enter a whole TZS opening balance.');
      return;
    }
    if (accountForm === 'card' && !/^\d{4}$/.test(lastFour)) {
      setFormError('Enter the last four digits only.');
      return;
    }
    addAccount({
      name: accountName.trim(),
      type: accountForm === 'card' ? 'card' : 'wallet',
      openingBalance: balance,
      ...(accountForm === 'card' ? { lastFour } : {}),
    });
    setAccountForm(null);
    setAccountName('');
    setOpeningBalance('');
    setLastFour('');
    setFormError('');
  };
  const getAccountBalance = (account: FinancialAccount) => dataset.transactions
    .filter((transaction) => transaction.accountId === account.id)
    .reduce(
      (balance, transaction) => balance + (transaction.type === 'income' ? transaction.amount : -transaction.amount),
      account.openingBalance,
    );
  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }];
  const titleText: Record<MenuPage, string> = {
    menu: 'More',
    settings: 'Settings',
    accounts: 'Accounts',
    notifications: 'Notifications',
    records: 'Manage records',
  };

  const renderProfileSettings = () => (
    <>
      <Text style={[styles.sectionLabel, { color: colors.textDim }]}>PROFILE</Text>
      <View style={[styles.infoRow, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          {profile.salutation ? `${profile.salutation} ` : ''}{profile.displayName || 'Guest'}
        </Text>
        {profile.email ? <Text style={[styles.menuDetail, { color: colors.textDim }]}>{profile.email}</Text> : null}
        <Text style={[styles.menuDetail, { color: colors.textDim }]}>
          Your profile, entries, and accounts are cleared when you end this app session.
        </Text>
      </View>
      <Text style={[styles.sectionLabel, { color: colors.textDim }]}>APPEARANCE</Text>
      <View style={[styles.preferenceRow, { borderColor: colors.border }]}>
        <View style={[styles.menuIcon, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name={colorScheme === 'light' ? 'sunny-outline' : 'moon-outline'} size={19} color={colors.accent} />
        </View>
        <View style={styles.menuText}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>{colorScheme === 'light' ? 'Light appearance' : 'Dark appearance'}</Text>
          <Text style={[styles.menuDetail, { color: colors.textDim }]}>Switch between light and dark themes.</Text>
        </View>
        <Switch value={colorScheme === 'dark'} onValueChange={toggleColorScheme} trackColor={{ false: colors.border, true: colors.accent }} />
      </View>
      <View style={[styles.infoRow, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>Currency</Text>
        <Text style={[styles.menuDetail, { color: colors.textDim }]}>Tanzanian shilling (TZS)</Text>
      </View>
      <View style={[styles.infoRow, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>Privacy</Text>
        <Text style={[styles.menuDetail, { color: colors.textDim }]}>Your profile, entries, and accounts stay in this app session and are cleared when you end it.</Text>
      </View>
      <Pressable
        onPress={() => confirmDelete(
          'Remove records from the older app version?',
          'This permanently deletes finance data saved by an earlier version of eBudget from this device. Your current entries will not be affected.',
          () => {
            void clearLegacyFinanceData()
              .then(() => Alert.alert('Older local records removed', 'Previous-version finance data was deleted from this device.'))
              .catch(() => Alert.alert('Could not remove records', 'The previous-version data could not be deleted. Please try again.')); 
          },
        )}
        style={[styles.legacyDelete, { borderColor: colors.crimson }]}
      >
        <Ionicons name="trash-outline" size={17} color={colors.crimson} />
        <Text style={{ color: colors.crimson, fontSize: 12, fontWeight: '700' }}>Remove older saved finance data</Text>
      </Pressable>
    </>
  );

  const renderAccounts = () => (
    <>
      <Dim style={{ marginBottom: 12 }}>Keep track of cash wallets and cards. Never store a full card number, PIN, or security code.</Dim>
      <View style={styles.actions}>
        <Action title="Add wallet" onPress={() => startAccountForm('wallet')} colors={colors} />
        <Action title="Add card" onPress={() => startAccountForm('card')} colors={colors} secondary />
      </View>
      {accountForm ? (
        <View style={[styles.formCard, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>New {accountForm}</Text>
          <TextInput value={accountName} onChangeText={setAccountName} placeholder="Account name" placeholderTextColor={colors.textDim} style={inputStyle} />
          <TextInput value={openingBalance} onChangeText={setOpeningBalance} keyboardType="number-pad" placeholder="Opening balance (TZS)" placeholderTextColor={colors.textDim} style={inputStyle} />
          {accountForm === 'card' && (
            <TextInput
              value={lastFour}
              onChangeText={(value) => setLastFour(value.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="Last four digits"
              placeholderTextColor={colors.textDim}
              style={inputStyle}
            />
          )}
          {formError ? <Text style={{ color: colors.crimson, marginTop: 7 }}>{formError}</Text> : null}
          <View style={styles.actions}>
            <Action title="Save account" onPress={saveAccount} colors={colors} />
            <Action title="Cancel" onPress={() => setAccountForm(null)} colors={colors} secondary />
          </View>
        </View>
      ) : null}
      {accounts.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="wallet-outline" size={25} color={colors.textDim} />
          <Text style={[styles.infoTitle, { color: colors.text, marginTop: 8 }]}>No accounts added</Text>
          <Dim>Add a wallet or card to see account balances here.</Dim>
        </View>
      ) : accounts.map((account) => (
        <View key={account.id} style={[styles.accountRow, { borderColor: colors.border }]}>
          <View style={[styles.menuIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name={account.type === 'card' ? 'card-outline' : 'wallet-outline'} size={18} color={colors.accent} />
          </View>
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>{account.name}</Text>
            <Text style={[styles.menuDetail, { color: colors.textDim }]}>
              {account.type === 'card' ? `Card ending in ${account.lastFour}` : 'Wallet'} · {fmtMoney(getAccountBalance(account), { compact: true })}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${account.name}`}
            onPress={() => confirmDelete('Delete this account?', 'Entries linked to it will remain but no longer show an account name.', () => deleteAccount(account.id))}
            style={styles.iconButton}
          >
            <Ionicons name="trash-outline" size={18} color={colors.crimson} />
          </Pressable>
        </View>
      ))}
    </>
  );

  const renderNotifications = () => {
    const preferences: { key: keyof NotificationPreferences; title: string; detail: string }[] = [
      { key: 'budgetReminders', title: 'Monthly budget check-in', detail: 'Show a monthly spending reminder on your overview.' },
    ];
    return (
      <>
        <View style={[styles.notice, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
          <Text style={[styles.menuDetail, { color: colors.textDim, flex: 1 }]}>
            The budget check-in appears in the app. It does not send a device notification.
          </Text>
        </View>
        {preferences.map(({ key, title, detail }) => (
          <View key={key} style={[styles.preferenceRow, { borderColor: colors.border }]}>
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.menuDetail, { color: colors.textDim }]}>{detail}</Text>
            </View>
            <Switch
              value={notificationPreferences[key]}
              onValueChange={(value) => updateNotificationPreferences({ [key]: value })}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>
        ))}
      </>
    );
  };

  const renderRecords = () => (
    <>
      <Dim style={{ marginBottom: 14 }}>Review records by year and month. Removing records cannot be undone.</Dim>
      {years.map((year) => {
        const monthIndices = dataset.months
          .map((label, index) => ({ label, index }))
          .filter(({ label }) => Number(label.split(' ')[1]) === year);
        const yearTransactions = dataset.transactions.filter((transaction) => monthIndices.some(({ index }) => index === transaction.monthIndex));
        return (
          <View key={year} style={[styles.yearBox, { borderColor: colors.border }]}>
            <View style={styles.yearHeading}>
              <View style={styles.menuText}>
                <Text style={[styles.yearTitle, { color: colors.text }]}>{year}</Text>
                <Text style={[styles.menuDetail, { color: colors.textDim }]}>{yearTransactions.length} entries</Text>
              </View>
              <Pressable
                onPress={() => confirmDelete(`Delete ${year} records?`, `This removes ${yearTransactions.length} entries for ${theme.name}.`, () => {
                  deleteYear(year);
                  setSelectedMonth(null);
                })}
                style={styles.smallDelete}
              >
                <Ionicons name="trash-outline" size={17} color={colors.crimson} />
                <Text style={{ color: colors.crimson, fontSize: 12, fontWeight: '700' }}>Clear year</Text>
              </Pressable>
            </View>
            {monthIndices.map(({ label, index }) => {
              const monthTransactions = dataset.transactions.filter((transaction) => transaction.monthIndex === index);
              const active = selectedMonth === index;
              const categoryTotals = new Map<string, number>();
              for (const transaction of monthTransactions) {
                categoryTotals.set(transaction.categoryId, (categoryTotals.get(transaction.categoryId) ?? 0) + 1);
              }
              return (
                <View key={label}>
                  <View style={[styles.monthRow, { borderTopColor: colors.border }]}>
                    <Pressable onPress={() => setSelectedMonth(active ? null : index)} style={styles.monthOpen}>
                      <Text style={[styles.menuTitle, { color: colors.text }]}>{label}</Text>
                      <Text style={[styles.menuDetail, { color: colors.textDim }]}>{monthTransactions.length} entries</Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`Delete ${label} entries`}
                      onPress={() => confirmDelete(`Delete ${label}?`, `This removes all ${monthTransactions.length} entries for this month.`, () => deleteMonth(index))}
                      style={styles.iconButton}
                    >
                      <Ionicons name="trash-outline" size={17} color={colors.crimson} />
                    </Pressable>
                  </View>
                  {active && (
                    <View style={[styles.categoryList, { backgroundColor: colors.surfaceMuted }]}>
                      {categoryTotals.size === 0 ? (
                        <Dim>No records for this month.</Dim>
                      ) : [...categoryTotals.entries()].map(([categoryId, count]) => {
                        const name = categoryId === 'income' ? 'Income' : dataset.categories.find((category) => category.id === categoryId)?.name ?? 'Other';
                        return (
                          <View key={categoryId} style={styles.categoryRow}>
                            <View style={styles.menuText}>
                              <Text style={[styles.menuTitle, { color: colors.text }]}>{name}</Text>
                              <Text style={[styles.menuDetail, { color: colors.textDim }]}>{count} {count === 1 ? 'entry' : 'entries'}</Text>
                            </View>
                            <Pressable
                              onPress={() => confirmDelete(`Delete ${name} records?`, `This removes ${name.toLowerCase()} entries for ${label}.`, () => deleteCategoryForMonth(index, categoryId))}
                              style={styles.iconButton}
                            >
                              <Ionicons name="trash-outline" size={17} color={colors.crimson} />
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
    </>
  );

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More options"
        onPress={() => setVisible(true)}
        style={[styles.moreButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Ionicons name="ellipsis-horizontal" size={23} color={colors.text} />
      </Pressable>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sheetHeader}>
              {page !== 'menu' ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Back to more options" onPress={() => { setPage('menu'); setSelectedMonth(null); }} style={styles.iconButton}>
                  <Ionicons name="arrow-back-outline" size={21} color={colors.text} />
                </Pressable>
              ) : <View style={styles.iconButton} />}
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{titleText[page]}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={close} style={styles.iconButton}>
                <Ionicons name="close-outline" size={23} color={colors.textDim} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {page === 'menu' && (
                <>
                  <Dim style={{ marginBottom: 12 }}>Manage your profile, finances, and preferences.</Dim>
                  <MenuRow icon="settings-outline" title="Settings" detail="Profile, appearance, currency and privacy" onPress={() => setPage('settings')} colors={colors} />
                  <MenuRow icon="wallet-outline" title="Accounts" detail={`${accounts.length} wallets and cards`} onPress={() => setPage('accounts')} colors={colors} />
                  <MenuRow icon="notifications-outline" title="Notifications" detail="Choose reminder preferences" onPress={() => setPage('notifications')} colors={colors} />
                  <MenuRow icon="calendar-outline" title="Manage records" detail="Review or remove records by year, month, or category" onPress={() => setPage('records')} colors={colors} />
                  <View style={[styles.sessionNotice, { backgroundColor: colors.surfaceMuted }]}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                    <Text style={[styles.menuDetail, { color: colors.textDim, flex: 1 }]}>
                      Your profile, entries, and accounts are cleared when you end this app session.
                    </Text>
                  </View>
                  <Action title="End session" onPress={() => { close(); endSession(); }} colors={colors} secondary />
                </>
              )}
              {page === 'settings' && renderProfileSettings()}
              {page === 'accounts' && renderAccounts()}
              {page === 'notifications' && renderNotifications()}
              {page === 'records' && renderRecords()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  moreButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' },
  sheet: { height: '92%', borderTopLeftRadius: 25, borderTopRightRadius: 25, borderWidth: 1, overflow: 'hidden' },
  sheetHeader: { minHeight: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#9099A255' },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sheetContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 48 },
  iconButton: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  menuRow: { minHeight: 75, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuText: { flex: 1, minWidth: 0 },
  menuTitle: { fontSize: 14, fontWeight: '700' },
  menuDetail: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, marginTop: 20, marginBottom: 9 },
  label: { fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 14, marginBottom: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  option: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 8 },
  preferenceRow: { minHeight: 70, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  infoRow: { borderRadius: 13, padding: 13, marginTop: 11 },
  infoTitle: { fontSize: 14, fontWeight: '700' },
  legacyDelete: { minHeight: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, marginTop: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7 },
  notice: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 9, marginBottom: 10 },
  sessionNotice: { flexDirection: 'row', alignItems: 'center', padding: 11, borderRadius: 12, gap: 8, marginTop: 16, marginBottom: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  action: { borderWidth: 1, borderRadius: 11, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 },
  formCard: { padding: 12, borderRadius: 14, marginBottom: 12 },
  emptyBox: { borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 6 },
  accountRow: { minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
  yearBox: { borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingTop: 12, marginBottom: 12 },
  yearHeading: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10 },
  yearTitle: { fontSize: 17, fontWeight: '800' },
  smallDelete: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 5 },
  monthRow: { minHeight: 52, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
  monthOpen: { flex: 1, paddingVertical: 8 },
  categoryList: { borderRadius: 11, paddingHorizontal: 10, marginBottom: 10 },
  categoryRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#9099A233' },
});
