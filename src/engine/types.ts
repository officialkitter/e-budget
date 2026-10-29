export type ModeId = 'seed' | 'growth' | 'vanguard';
export type Bucket = 'need' | 'want' | 'saving' | 'opex' | 'capex';

export interface Category {
  id: string;
  name: string;
  icon: string;
  bucket: Bucket;
  budget: number; // monthly budget
  variable: boolean;
}

export interface Transaction {
  id: string;
  date: number; // epoch ms
  monthIndex: number; // 0..months.length - 1 (last index = most recent month)
  categoryId: string;
  amount: number;
  type: 'income' | 'expense';
  label: string; // merchant / driver
  accountId?: string;
  isSample?: boolean;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'wallet' | 'card';
  openingBalance: number;
  lastFour?: string;
}

export interface Dataset {
  mode: ModeId;
  categories: Category[];
  transactions: Transaction[];
  months: string[]; // chronological month labels, including year
  openingBalance: number; // savings balance before month 0
  incomeLabel: string;
  plannedIncome: number;
}

export interface PlanState {
  monthly: number; // monthly contribution
  rate: number; // nominal annual rate (0.07 = 7%)
}
