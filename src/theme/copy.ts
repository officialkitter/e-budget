import { ModeId } from '../engine/types';

export interface Copy {
  greeting: string;
  subtitle: string;
  income: string;
  needs: string;
  wants: string;
  savings: string;
  leftover: string;
  gaugeTitle: string;
  gaugeHint: string;
  futureTitle: string;
  futureSub: string;
  savingSlider: string;
  returnSlider: string;
  sphereLabel: string;
  goalLabel: string;
  chartTitle: string;
  insightsTitle: string;
  insightsSub: string;
  varianceTitle: string;
  paretoTitle: string;
  paretoHint: string;
  activityTitle: string;
  tabs: { home: string; future: string; insights: string; activity: string };
}

export const copyByMode: Record<ModeId, Copy> = {
  seed: {
    greeting: 'Plan your monthly finances',
    subtitle: 'A clear view of income, spending and savings.',
    income: 'Monthly income',
    needs: 'Needs',
    wants: 'Wants',
    savings: 'Savings',
    leftover: 'Available balance',
    gaugeTitle: 'Budget by category',
    gaugeHint: 'See how much of each monthly budget remains.',
    futureTitle: 'Savings projection',
    futureSub: 'Adjust your monthly savings and estimated annual return.',
    savingSlider: 'Monthly savings',
    returnSlider: 'Estimated annual return',
    sphereLabel: 'of your savings target',
    goalLabel: 'Savings target',
    chartTitle: 'Savings projection over 10 years',
    insightsTitle: 'Budget insights',
    insightsSub: 'Review spending patterns and compare your plan with actuals.',
    varianceTitle: 'Budget comparison',
    paretoTitle: 'Largest spending areas',
    paretoHint: 'See which categories account for most discretionary spending.',
    activityTitle: 'Transactions',
    tabs: { home: 'Overview', future: 'Planning', insights: 'Insights', activity: 'Activity' },
  },
  growth: {
    greeting: 'Welcome back',
    subtitle: 'A practical view of your monthly finances.',
    income: 'Net Income',
    needs: 'Needs',
    wants: 'Wants',
    savings: 'Savings',
    leftover: 'Unallocated',
    gaugeTitle: 'Category Budgets',
    gaugeHint: 'Liquid level = budget remaining this month.',
    futureTitle: 'Financial planning',
    futureSub: 'Explore how savings contributions can grow over time.',
    savingSlider: 'Monthly savings',
    returnSlider: 'Illustrative annual return',
    sphereLabel: 'of your financial independence target',
    goalLabel: 'Target based on essential expenses',
    chartTitle: 'Projected and current savings · 10 years',
    insightsTitle: 'Insights',
    insightsSub: 'Variance against budget and your biggest outflow drivers.',
    varianceTitle: 'Budget variance',
    paretoTitle: 'Pareto: where discretionary money goes',
    paretoHint: 'The vital few merchants behind most of your discretionary spending.',
    activityTitle: 'Transactions',
    tabs: { home: 'Home', future: 'Future', insights: 'Insights', activity: 'Activity' },
  },
  vanguard: {
    greeting: 'Command Center',
    subtitle: 'Clear financial reporting for your business.',
    income: 'Revenue',
    needs: 'OpEx',
    wants: 'Discretionary',
    savings: 'Cash reserves',
    leftover: 'Operating surplus',
    gaugeTitle: 'Budget Liquidity by Line Item',
    gaugeHint: 'Fill = unspent budget. Turbulence = utilisation risk.',
    futureTitle: 'Business planning',
    futureSub: 'Explore how regular reserves may grow over time.',
    savingSlider: 'Monthly reserve transfer',
    returnSlider: 'Illustrative annual return',
    sphereLabel: 'of your operating reserve target',
    goalLabel: 'Target: 24 months of operating costs',
    chartTitle: 'Reserve: plan vs. actual pace · 10 years',
    insightsTitle: 'Variance & Forecast',
    insightsSub: 'Variance analysis, Pareto cost drivers and driver-based forecast.',
    varianceTitle: 'Budget vs. actual variance',
    paretoTitle: 'Pareto: variable cost drivers',
    paretoHint: 'Vendors producing ~80% of discretionary outflow (YTD).',
    activityTitle: 'Ledger',
    tabs: { home: 'Overview', future: 'Planning', insights: 'Reports', activity: 'Ledger' },
  },
};
