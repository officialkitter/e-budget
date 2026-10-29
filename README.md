# eBudget

Professional personal and business budgeting app built with Expo, React Native, and TypeScript. It supports local income and expense tracking, editable category budgets, wallets, cards, and financial summaries in Tanzanian shillings (TZS).

Account setup lets you add a name, optional title, email address, and password for the current app session. Passwords are checked for a minimum length and confirmation but are not stored or used to authenticate; provider sign-in and account recovery are not available yet. Profile details, finance entries, and accounts are kept in memory and cleared when you end the session; online sync and backup are not available. Google and Apple sign-up/sign-in choices are shown as coming soon. The account screen includes a summary of these practices for users to review and accept. Card details are limited to the last four digits.

Data saved by older prototype versions may still exist in device storage, but this version does not load it into preview sessions. Remove it from **More → Settings → Remove older saved finance data** if it is no longer needed.

The app includes a splash mark, paginated onboarding, guest access, and account setup with an acceptance checkbox for the in-app privacy and terms summary. Development guest sessions may show illustrative records for the previous year and current year. Release builds start empty. Records can be reviewed and cleared by year, month, or category from **More → Manage records**. Name and optional custom title are shown in the app during the current session. Appearance preference and onboarding completion are stored locally. Users can edit category budgets for their current session and receive an in-app monthly budget check-in; device notifications are not scheduled.

## Run
Install Node.js 24 LTS first; it includes `npm` and `npx`. After installing Node or changing Node versions, close and reopen your terminal, then check `node --version`, `npm --version`, and `npx --version`.

If you use NVM for Windows, select an installed Node version in each new terminal before running the commands below:
```bat
nvm use 24.16.0
```

Run these commands from the project folder:
```bash
npm ci
npx expo install --fix      # aligns native package versions to your Expo SDK
npx expo start              # run in Expo Go
npx expo run:android        # build and run the native Android app
```
Type-check: `npm run typecheck`

If Expo reports `Cannot find module` for a file inside `node_modules`, run `npm ci` from the project folder to restore the exact locked dependencies, then retry. You do not need to delete the generated `android` or `ios` folders.

Android builds require a supported JDK and Android SDK. The project is configured for the current Expo SDK; check the Expo Android setup guide if your local Android SDK is not installed.

## App appearance
The app starts in a light theme with a soft neutral background and offers light/dark controls in **More → Settings**. Essentials, Personal, and Business use green, calm blue-gray, and brown accents, with varied category colors.

## Modes (switch on the Overview screen)
| Mode | Audience | Highlights |
|---|---|---|
| Essentials | personal finances | Monthly budget, savings goal, needs and wants, and monthly progress |
| Personal | personal finances | 50/30/20, emergency-fund progress, spending trends, and savings projections |
| Business | commercial finances | Operating costs, capital investments, commitments, and an illustrative forecast |

## Architecture
- `src/engine/generator.ts` – 24-month reporting timeline, mode-specific budgets, and development-only illustrative records
- `src/engine/math.ts` – A = P(1+r/n)^(nt) (+ annuity), variance %, Pareto, driver forecast
- `src/engine/selectors.ts` – dataset-level queries (budget rows, 50/30/20, creep, targets)
- `src/state/AppContext.tsx` – in-memory preview session state and non-sensitive appearance preferences
- `src/components` – LiquidGauge, WealthChart, FreedomSphere (Skia); editable HapticSlider; theme-aware wallet mark; GlassCard
- `src/screens` – Overview, Future, Insights (including a two-year history chart), Activity and account entry

Future planning values can be entered directly or adjusted with the sliders. Users can set a savings contribution, illustrative return assumption, a personal target, and a horizon from one month to ten years, then compare the plan with their recent savings pace and see a contextual next-step suggestion. Activity entries support manual dates in `DD/MM/YYYY` format and can be edited or deleted; records outside the available reporting timeline are rejected.
