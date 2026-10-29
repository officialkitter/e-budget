import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { generateAllDatasets, generateIllustrativeHistory } from '../engine/generator';
import { defaultPlan } from '../engine/selectors';
import { Dataset, FinancialAccount, ModeId, PlanState, Transaction } from '../engine/types';
import { Copy, copyByMode } from '../theme/copy';
import { AppPalette, ColorScheme, ModeTheme, modeThemes, palettes } from '../theme/theme';

export type AppStage = 'loading' | 'onboarding' | 'authentication' | 'app';
export type SessionType = 'guest' | 'profile-preview' | null;

interface AuraContextValue {
  stage: AppStage;
  sessionType: SessionType;
  finishOnboarding: () => void;
  startGuestSession: () => void;
  startProfilePreview: (profile: Profile) => void;
  endSession: () => void;
  clearLegacyFinanceData: () => Promise<void>;
  mode: ModeId;
  setMode: (m: ModeId) => void;
  theme: ModeTheme;
  colorScheme: ColorScheme;
  colors: AppPalette;
  toggleColorScheme: () => void;
  copy: Copy;
  dataset: Dataset;
  monthIndex: number;
  setMonthIndex: (i: number) => void;
  plan: PlanState;
  setPlan: (p: Partial<PlanState>) => void;
  resetPlan: () => void;
  updateCategoryBudget: (categoryId: string, budget: number) => void;
  accounts: FinancialAccount[];
  addAccount: (account: Omit<FinancialAccount, 'id'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'monthIndex'> & { date?: number }) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id' | 'date' | 'monthIndex'> & { date: number }) => void;
  deleteTransaction: (id: string) => void;
  deleteAccount: (id: string) => void;
  deleteMonth: (monthIndex: number) => void;
  deleteYear: (year: number) => void;
  deleteCategoryForMonth: (monthIndex: number, categoryId: string) => void;
  profile: Profile;
  notificationPreferences: NotificationPreferences;
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void;
}

const AuraContext = createContext<AuraContextValue | null>(null);
const PREFERENCES_KEY = 'ebudget.preferences.v1';
const LEGACY_FINANCES_KEY = 'ebudget.local-finances.v1';

export interface Profile {
  displayName: string;
  salutation: string;
  email?: string;
}

export interface NotificationPreferences {
  budgetReminders: boolean;
}

interface StoredData {
  colorScheme?: ColorScheme;
}

export const AuraProvider = ({ children }: { children: React.ReactNode }) => {
  const datasets = useMemo(() => generateAllDatasets(), []);
  const latest = datasets.growth.months.length - 1;
  const [mode, setModeState] = useState<ModeId>('growth');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
  const [sessionTransactions, setSessionTransactions] = useState<Record<ModeId, Transaction[]>>({ seed: [], growth: [], vanguard: [] });
  const [sessionAccounts, setSessionAccounts] = useState<Record<ModeId, FinancialAccount[]>>({ seed: [], growth: [], vanguard: [] });
  const [categoryBudgets, setCategoryBudgets] = useState<Record<ModeId, Record<string, number>>>({ seed: {}, growth: {}, vanguard: {} });
  const [profile, setProfile] = useState<Profile>({ displayName: '', salutation: '' });
  const [stage, setStage] = useState<AppStage>('loading');
  const [sessionType, setSessionType] = useState<SessionType>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    budgetReminders: true,
  });
  const [storageLoaded, setStorageLoaded] = useState(false);
  const colorSchemeChangedBeforeLoad = useRef(false);
  const [monthIndex, setMonthIndex] = useState(latest);
  const [plans, setPlans] = useState<Record<ModeId, PlanState>>(() => ({
    seed: defaultPlan(datasets.seed, latest),
    growth: defaultPlan(datasets.growth, latest),
    vanguard: defaultPlan(datasets.vanguard, latest),
  }));

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [savedPreferences, legacyData, onboardingComplete] = await Promise.all([
          AsyncStorage.getItem(PREFERENCES_KEY),
          AsyncStorage.getItem(LEGACY_FINANCES_KEY),
          AsyncStorage.getItem('ebudget.onboarding.v1'),
        ]);
        if (active) {
          const legacy = legacyData ? (JSON.parse(legacyData) as StoredData) : {};
          const parsed = savedPreferences ? (JSON.parse(savedPreferences) as StoredData) : legacy;
          if (!colorSchemeChangedBeforeLoad.current && (parsed.colorScheme === 'light' || parsed.colorScheme === 'dark')) {
            setColorScheme(parsed.colorScheme);
          }
          if (active) setStage(onboardingComplete === 'complete' ? 'authentication' : 'onboarding');
        }
      } catch (error) {
        console.error('Unable to load eBudget preferences.', error);
        if (active) setStage('onboarding');
      } finally {
        if (active) {
          setStorageLoaded(true);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    const save = async () => {
      try {
        await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify({ colorScheme }));
      } catch (error) {
        console.error('Unable to save eBudget appearance preference.', error);
      }
    };
    void save();
  }, [storageLoaded, colorScheme]);

  const finishOnboarding = useCallback(() => {
    const complete = async () => {
      try {
        await AsyncStorage.setItem('ebudget.onboarding.v1', 'complete');
      } catch (error) {
        console.error('Unable to save onboarding preference.', error);
      }
      setStage('authentication');
    };
    void complete();
  }, []);
  const startGuestSession = useCallback(() => {
    setProfile({ displayName: '', salutation: '' });
    setCategoryBudgets({ seed: {}, growth: {}, vanguard: {} });
    setSessionAccounts({ seed: [], growth: [], vanguard: [] });
    const samples = { seed: [], growth: [], vanguard: [] } as Record<ModeId, Transaction[]>;
    if (__DEV__) {
      for (const id of Object.keys(datasets) as ModeId[]) samples[id] = generateIllustrativeHistory(datasets[id]);
    }
    setSessionTransactions(samples);
    setSessionType('guest');
    setMonthIndex(latest);
    setStage('app');
  }, [datasets, latest]);
  const startProfilePreview = useCallback((nextProfile: Profile) => {
    setProfile(nextProfile);
    setCategoryBudgets({ seed: {}, growth: {}, vanguard: {} });
    setSessionAccounts({ seed: [], growth: [], vanguard: [] });
    setSessionTransactions({ seed: [], growth: [], vanguard: [] });
    setSessionType('profile-preview');
    setMonthIndex(latest);
    setStage('app');
  }, [latest]);
  const endSession = useCallback(() => {
    setProfile({ displayName: '', salutation: '' });
    setCategoryBudgets({ seed: {}, growth: {}, vanguard: {} });
    setSessionAccounts({ seed: [], growth: [], vanguard: [] });
    setSessionTransactions({ seed: [], growth: [], vanguard: [] });
    setSessionType(null);
    setStage('authentication');
  }, []);
  const clearLegacyFinanceData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(LEGACY_FINANCES_KEY);
    } catch (error) {
      console.error('Unable to remove older local finance records.', error);
      throw error;
    }
  }, []);

  const setMode = useCallback((m: ModeId) => setModeState(m), []);
  const toggleColorScheme = useCallback(
    () => {
      colorSchemeChangedBeforeLoad.current = true;
      setColorScheme((current) => (current === 'light' ? 'dark' : 'light'));
    },
    [],
  );
  const setPlan = useCallback((p: Partial<PlanState>) => setPlans((prev) => ({ ...prev, [mode]: { ...prev[mode], ...p } })), [mode]);
  const resetPlan = useCallback(() => setPlans((prev) => ({ ...prev, [mode]: defaultPlan(datasets[mode], monthIndex) })), [mode, monthIndex, datasets]);
  const updateCategoryBudget = useCallback(
    (categoryId: string, budget: number) => {
      if (!Number.isInteger(budget) || budget < 0) throw new Error('Enter a whole TZS budget of zero or more.');
      setCategoryBudgets((previous) => ({
        ...previous,
        [mode]: { ...previous[mode], [categoryId]: budget },
      }));
    },
    [mode],
  );
  const addAccount = useCallback(
    (account: Omit<FinancialAccount, 'id'>) =>
      setSessionAccounts((previous) => ({
        ...previous,
        [mode]: [{ ...account, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }, ...previous[mode]],
      })),
    [mode],
  );
  const addTransaction = useCallback(
    (transaction: Omit<Transaction, 'id' | 'date' | 'monthIndex'> & { date?: number }) => {
      const date = transaction.date ?? Date.now();
      const selectedDate = new Date(date);
      const month = selectedDate.toLocaleString('en', { month: 'short' });
      const monthIndexForDate = datasets[mode].months.findIndex((label) => label === `${month} ${selectedDate.getFullYear()}`);
      if (monthIndexForDate < 0) throw new Error('Choose a date within the available history.');
      setSessionTransactions((previous) => ({
        ...previous,
        [mode]: [
          {
            ...transaction,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            date,
            monthIndex: monthIndexForDate,
          },
          ...previous[mode],
        ],
      }));
    },
    [datasets, mode],
  );
  const updateTransaction = useCallback(
    (id: string, transaction: Omit<Transaction, 'id' | 'date' | 'monthIndex'> & { date: number }) => {
      const selectedDate = new Date(transaction.date);
      const month = selectedDate.toLocaleString('en', { month: 'short' });
      const monthIndexForDate = datasets[mode].months.findIndex((label) => label === `${month} ${selectedDate.getFullYear()}`);
      if (monthIndexForDate < 0) throw new Error('Choose a date within the available history.');
      setSessionTransactions((previous) => ({
        ...previous,
        [mode]: previous[mode].map((item) =>
          item.id === id ? { ...item, ...transaction, monthIndex: monthIndexForDate } : item,
        ),
      }));
    },
    [datasets, mode],
  );
  const deleteTransaction = useCallback(
    (id: string) =>
      setSessionTransactions((previous) => ({
        ...previous,
        [mode]: previous[mode].filter((transaction) => transaction.id !== id),
      })),
    [mode],
  );
  const deleteAccount = useCallback(
    (id: string) => {
      setSessionAccounts((previous) => ({ ...previous, [mode]: previous[mode].filter((account) => account.id !== id) }));
      setSessionTransactions((previous) => ({
        ...previous,
        [mode]: previous[mode].map((transaction) =>
          transaction.accountId === id ? { ...transaction, accountId: undefined } : transaction,
        ),
      }));
    },
    [mode],
  );
  const deleteMonth = useCallback(
    (targetMonth: number) =>
      setSessionTransactions((previous) => ({
        ...previous,
        [mode]: previous[mode].filter((transaction) => transaction.monthIndex !== targetMonth),
      })),
    [mode],
  );
  const deleteYear = useCallback(
    (year: number) =>
      setSessionTransactions((previous) => ({
        ...previous,
        [mode]: previous[mode].filter((transaction) => {
          const label = datasets[mode].months[transaction.monthIndex] ?? '';
          return Number(label.split(' ')[1]) !== year;
        }),
      })),
    [datasets, mode],
  );
  const deleteCategoryForMonth = useCallback(
    (targetMonth: number, categoryId: string) =>
      setSessionTransactions((previous) => ({
        ...previous,
        [mode]: previous[mode].filter(
          (transaction) => transaction.monthIndex !== targetMonth || transaction.categoryId !== categoryId,
        ),
      })),
    [mode],
  );
  const updateNotificationPreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setNotificationPreferences((current) => ({ ...current, ...updates }));
  }, []);
  const dataset = useMemo(
    () => ({
      ...datasets[mode],
      categories: datasets[mode].categories.map((category) => ({
        ...category,
        budget: categoryBudgets[mode][category.id] ?? category.budget,
      })),
      transactions: [...datasets[mode].transactions, ...sessionTransactions[mode]],
    }),
    [datasets, mode, sessionTransactions, categoryBudgets],
  );

  const value = useMemo<AuraContextValue>(
    () => {
      const palette = palettes[colorScheme];
      const modeAccent = mode === 'seed' ? palette.essentials : mode === 'growth' ? palette.personal : palette.business;
      return {
        stage,
        sessionType,
        finishOnboarding,
        startGuestSession,
        startProfilePreview,
        endSession,
        clearLegacyFinanceData,
        mode,
        setMode,
        theme: { ...modeThemes[mode], accent: modeAccent, accent2: modeAccent },
        colorScheme,
        colors: { ...palette, accent: modeAccent },
        toggleColorScheme,
        copy: copyByMode[mode],
        dataset,
        monthIndex,
        setMonthIndex,
        plan: plans[mode],
        setPlan,
        resetPlan,
        updateCategoryBudget,
        accounts: sessionAccounts[mode],
        addAccount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteAccount,
        deleteMonth,
        deleteYear,
        deleteCategoryForMonth,
        profile,
        notificationPreferences,
        updateNotificationPreferences,
      };
    },
    [
      mode,
      stage,
      sessionType,
      finishOnboarding,
      startGuestSession,
      startProfilePreview,
      endSession,
      clearLegacyFinanceData,
      setMode,
      colorScheme,
      toggleColorScheme,
      datasets,
      dataset,
      monthIndex,
      plans,
      setPlan,
      resetPlan,
      updateCategoryBudget,
      sessionAccounts,
      addAccount,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      deleteAccount,
      deleteMonth,
      deleteYear,
      deleteCategoryForMonth,
      profile,
      notificationPreferences,
      updateNotificationPreferences,
    ],
  );

  return <AuraContext.Provider value={value}>{children}</AuraContext.Provider>;
};

export function useAura(): AuraContextValue {
  const ctx = useContext(AuraContext);
  if (!ctx) throw new Error('useAura must be used inside <AuraProvider>');
  return ctx;
}
