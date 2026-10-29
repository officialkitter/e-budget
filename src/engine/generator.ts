import { Bucket, Category, Dataset, ModeId, Transaction } from './types';

interface Spec extends Category {
  volatility: number; // +/- noise around the monthly figure
  drift: number; // monthly compounding creep (lifestyle creep / cost growth)
  merchants: string[]; // first merchants carry the heaviest weights (Pareto-like)
  txRange: [number, number];
}

interface ModeSpec {
  income: number;
  incomeGrowth: number;
  incomeNoise: number;
  incomeLabel: string;
  opening: number;
  categories: Spec[];
}

const c = (
  id: string,
  name: string,
  icon: string,
  bucket: Bucket,
  budget: number,
  variable: boolean,
  volatility: number,
  drift: number,
  merchants: string[],
  txRange: [number, number] = [1, 1],
): Spec => ({ id, name, icon, bucket, budget, variable, volatility, drift, merchants, txRange });

const SPECS: Record<ModeId, ModeSpec> = {
  seed: {
    income: 2400,
    incomeGrowth: 0.004,
    incomeNoise: 0.02,
    incomeLabel: 'Monthly income',
    opening: 1100,
    categories: [
      c('snacks', 'Dining Out', 'restaurant-outline', 'want', 320, true, 0.3, 0.02, ['Corner Cafe', 'Local Dining', 'Market Kitchen'], [3, 6]),
      c('games', 'Entertainment', 'film-outline', 'want', 400, true, 0.35, 0.03, ['Stream Service', 'Event Tickets', 'Cinema'], [1, 3]),
      c('toys', 'Personal shopping', 'bag-outline', 'want', 320, true, 0.3, 0.01, ['Town Market', 'Clothing Store'], [1, 2]),
      c('gifts', 'Gifts', 'gift-outline', 'want', 160, true, 0.4, 0, ['Gift Shop'], [1, 1]),
      c('school', 'Education', 'book-outline', 'need', 240, true, 0.3, 0, ['Bookshop', 'Learning Services'], [1, 2]),
      c('bus', 'Transport', 'bus-outline', 'need', 240, false, 0, 0, ['Transit Pass']),
      c('chest', 'Savings', 'wallet-outline', 'saving', 480, false, 0.08, 0, ['Savings Deposit']),
    ],
  },
  growth: {
    income: 4800,
    incomeGrowth: 0.004,
    incomeNoise: 0.015,
    incomeLabel: 'Net Salary',
    opening: 6000,
    categories: [
      c('housing', 'Housing', 'home-outline', 'need', 1350, false, 0, 0, ['Landlord']),
      c('groceries', 'Groceries', 'cart-outline', 'need', 520, true, 0.08, 0.002, ['FreshMart', 'Green Basket', 'CornerStore', 'Farmers Market'], [6, 10]),
      c('transport', 'Transport', 'bus-outline', 'need', 260, true, 0.12, 0.004, ['MetroPass', 'FuelStop', 'RideNow'], [4, 7]),
      c('utilities', 'Utilities', 'bulb-outline', 'need', 210, true, 0.1, 0, ['City Power', 'AquaLine', 'NetFiber'], [3, 3]),
      c('health', 'Health', 'medkit-outline', 'need', 120, true, 0.2, 0, ['Pharmacy+', 'Amani Clinic'], [1, 3]),
      c('dining', 'Dining Out', 'restaurant-outline', 'want', 300, true, 0.15, 0.03, ['Noodle Lab', 'Urban Grill', 'Bean & Brew', 'Street Bites', 'Sushi Bar'], [8, 14]),
      c('entertainment', 'Entertainment', 'film-outline', 'want', 180, true, 0.2, 0.025, ['CineMax', 'GameVault', 'LiveTix'], [3, 6]),
      c('shopping', 'Shopping', 'bag-outline', 'want', 350, true, 0.25, 0.035, ['StyleHub', 'TechBazaar', 'HomeNest', 'PrimeCart'], [4, 8]),
      c('subscriptions', 'Subscriptions', 'tv-outline', 'want', 70, false, 0, 0.01, ['StreamPlus']),
      c('travel', 'Travel', 'airplane-outline', 'want', 200, true, 0.5, 0.02, ['SkyJet', 'StayInn', 'TripGo'], [1, 3]),
      c('hobbies', 'Personal projects', 'color-palette-outline', 'want', 110, true, 0.2, 0.02, ['ArtBox', 'GearUp'], [2, 4]),
      c('savings', 'Savings', 'wallet-outline', 'saving', 960, false, 0.06, 0, ['Savings Deposit']),
    ],
  },
  vanguard: {
    income: 195000,
    incomeGrowth: 0.018,
    incomeNoise: 0.05,
    incomeLabel: 'Revenue',
    opening: 90000,
    categories: [
      c('payroll', 'Payroll', 'people-outline', 'opex', 74000, false, 0.01, 0.008, ['Payroll Run']),
      c('cloud', 'Cloud infrastructure', 'cloud-outline', 'opex', 16000, true, 0.08, 0.025, ['AWS', 'GCP', 'Datadog', 'Cloudflare'], [6, 10]),
      c('marketing', 'Marketing', 'megaphone-outline', 'opex', 20000, true, 0.25, 0.015, ['Google Ads', 'Meta Ads', 'Agency Retainer', 'Events'], [5, 9]),
      c('rent', 'Office rent', 'business-outline', 'opex', 12000, false, 0, 0, ['Landlord Co']),
      c('software', 'Software', 'construct-outline', 'opex', 6000, true, 0.1, 0.02, ['Slack', 'Notion', 'GitHub', 'Figma'], [3, 5]),
      c('rnd', 'Research and development', 'flask-outline', 'opex', 14000, true, 0.3, 0.01, ['DevShop', 'LabWorks'], [2, 4]),
      c('legal', 'Legal and compliance', 'scale-outline', 'opex', 4000, true, 0.4, 0, ['Counsel LLP', 'AuditCo'], [1, 3]),
      c('equipment', 'Equipment', 'desktop-outline', 'capex', 15000, true, 0.6, 0, ['Dell Business', 'Apple Biz', 'Rack Systems'], [1, 3]),
      c('buildout', 'Facility improvements', 'hammer-outline', 'capex', 10000, true, 0.7, 0, ['BuildRight', 'FitOut Pros'], [1, 2]),
      c('reserve', 'Cash reserves', 'wallet-outline', 'saving', 15000, false, 0.05, 0, ['Reserve Transfer']),
    ],
  },
};

const TZS_SCALE = 1000;

export function generateDataset(mode: ModeId): Dataset {
  const spec = SPECS[mode];
  const now = new Date();
  const months: string[] = [];
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const historyMonths = 24;
  for (let m = 0; m < historyMonths; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (historyMonths - 1 - m), 1);
    months.push(`${names[d.getMonth()]} ${d.getFullYear()}`);
  }

  return {
    mode,
    categories: spec.categories.map(({ id, name, icon, bucket, budget, variable }) => ({ id, name, icon, bucket, budget: budget * TZS_SCALE, variable })),
    transactions: [],
    months,
    openingBalance: 0,
    incomeLabel: spec.incomeLabel,
    plannedIncome: spec.income * TZS_SCALE,
  };
}

export function generateAllDatasets(): Record<ModeId, Dataset> {
  return { seed: generateDataset('seed'), growth: generateDataset('growth'), vanguard: generateDataset('vanguard') };
}

export function generateIllustrativeHistory(dataset: Dataset, now = new Date()): Transaction[] {
  const transactions: Transaction[] = [];
  const currentYear = now.getFullYear();
  const firstYear = currentYear - 1;
  for (let monthIndex = 0; monthIndex < dataset.months.length; monthIndex++) {
    const [monthName, yearValue] = dataset.months[monthIndex].split(' ');
    const year = Number(yearValue);
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName);
    if (year < firstYear || year > currentYear || (year === currentYear && month > now.getMonth())) continue;
    const monthOffset = (year - firstYear) * 12 + month;
    const date = new Date(year, month, 10).getTime();
    const incomeFactor = 0.94 + (monthOffset % 5) * 0.025;
    transactions.push({
      id: `sample-${dataset.mode}-${year}-${month}-income`,
      date,
      monthIndex,
      categoryId: 'income',
      amount: Math.round(dataset.plannedIncome * incomeFactor),
      type: 'income',
      label: 'Illustrative · monthly income',
      isSample: true,
    });
    dataset.categories.forEach((category, categoryIndex) => {
      const factor = 0.72 + ((monthOffset * 7 + categoryIndex * 3) % 35) / 100;
      transactions.push({
        id: `sample-${dataset.mode}-${year}-${month}-${category.id}`,
        date: new Date(year, month, 11 + (categoryIndex % 17)).getTime(),
        monthIndex,
        categoryId: category.id,
        amount: Math.max(1, Math.round(category.budget * factor)),
        type: 'expense',
        label: `Illustrative · ${category.name.toLowerCase()}`,
        isSample: true,
      });
    });
  }
  return transactions;
}
