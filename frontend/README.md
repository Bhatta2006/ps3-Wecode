# TradeLab — Frontend Architecture

## Overview

The TradeLab frontend is a **React 18 + Vite** single-page application that provides an interactive dashboard for backtesting hedge fund strategies, visualizing risk metrics, and comparing performance across 10 quantitative strategies. It communicates with the FastAPI backend via RESTful API calls.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.2 | Component-based UI framework |
| **Vite** (rolldown-vite) | 7.2.5 | Build tool and dev server |
| **React Router DOM** | 6.30 | Client-side routing |
| **Recharts** | 3.8 | Charting library (LineChart, RadarChart, AreaChart) |
| **Framer Motion** | 12.35 | Page transitions and micro-animations |
| **Axios** | 1.13 | HTTP client for API calls |
| **Lucide React** | 0.577 | Icon library |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework |
| **PostCSS + Autoprefixer** | — | CSS post-processing |
| **ESLint** | 9.39 | Code linting |

---

## Project Structure

```
frontend/
├── public/                    # Static assets
├── src/
│   ├── api/                   # API client layer
│   │   ├── backtest.js        # Axios-based API client (all backend calls)
│   │   └── testApi.js         # API testing utilities
│   │
│   ├── assets/                # Static images and media
│   │
│   ├── components/            # Reusable UI components
│   │   ├── BacktestPanel.jsx      # Strategy configuration form (Issue 18)
│   │   ├── EquityCurveChart.jsx   # Recharts line chart with benchmark overlay
│   │   ├── FilterPills.jsx        # Tag-style filter toggles
│   │   ├── Footer.jsx             # Global footer
│   │   ├── MetricCard.jsx         # Single KPI card
│   │   ├── MetricsRow.jsx         # Horizontal metrics bar (Sharpe, VaR, DD)
│   │   ├── Navbar.jsx             # Navigation with auth state
│   │   ├── PortfolioPanel.jsx     # Portfolio state display (Issue 5)
│   │   ├── PositionSizingPanel.jsx # Inverse-vol weights display (Issue 9)
│   │   ├── StrategyCard.jsx       # Strategy selection card on home
│   │   ├── TradeLogTable.jsx      # Paginated explainable trade audit trail (Issue 14)
│   │   ├── home/                  # Home page specific sub-components
│   │   ├── learn/                 # Educational content sub-components
│   │   └── test/                  # Test/debug sub-components
│   │
│   ├── context/               # React Context providers
│   │   └── AuthContext.jsx    # JWT auth state management
│   │
│   ├── data/                  # Static data and configuration
│   │   ├── strategies.js      # Strategy metadata, descriptions, risk profiles
│   │   └── mockResults.js     # Mock API responses for development
│   │
│   ├── layouts/               # Layout wrappers
│   │   └── MainLayout.jsx     # Common page layout
│   │
│   ├── pages/                 # Route-level page components
│   │   ├── Home.jsx           # Strategy catalog landing page
│   │   ├── StrategyDetail.jsx # Full backtest runner with all panels
│   │   ├── Compare.jsx        # Multi-strategy comparison (up to 5)
│   │   ├── Login.jsx          # User authentication
│   │   ├── Signup.jsx         # User registration
│   │   ├── History.jsx        # Saved backtest history (auth-gated)
│   │   ├── Learn.jsx          # Educational content page
│   │   ├── Test.jsx           # Development testing page
│   │   └── test/              # Test page sub-components
│   │
│   ├── strategies/            # Frontend strategy-specific logic
│   │   ├── index.js           # Strategy module index
│   │   ├── macd/              # MACD strategy details
│   │   ├── meanReversion/     # Mean Reversion details
│   │   ├── momentum/          # Momentum strategy details
│   │   ├── rsi/               # RSI strategy details
│   │   └── scalping/          # Scalping strategy details
│   │
│   ├── App.jsx                # Root component with routing
│   ├── App.css                # Global app styles
│   ├── index.css              # Base/reset styles + Tailwind directives
│   └── main.jsx               # Entry point (React DOM render)
│
├── index.html                 # HTML template (Vite entry)
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS plugin configuration
├── eslint.config.js           # ESLint configuration
├── package.json               # Dependencies and scripts
└── package-lock.json          # Dependency lock file
```

---

## Routing

All routes are managed by **React Router v6** in `App.jsx`:

| Route | Component | Description |
|---|---|---|
| `/` | `Home` | Strategy catalog — browse all 10 strategies |
| `/strategy/:id` | `StrategyDetail` | Run backtest, view equity curves, metrics, trade logs |
| `/compare` | `Compare` | Side-by-side comparison of up to 5 strategies |
| `/login` | `Login` | Email/password authentication |
| `/signup` | `Signup` | New user registration |
| `/history` | `History` | View past backtest runs (requires auth) |

The entire app is wrapped in `<AuthProvider>` to provide JWT authentication context to all pages.

---

## Component Architecture

### Core Data Flow

```
User Input (BacktestPanel)
    │
    ▼
API Client (api/backtest.js)  ──→  GET /run?strategy_id=...&universe=...
    │
    ▼
Backend Response (JSON)
    │
    ├──→ MetricsRow          (Sharpe, VaR, Alpha, Beta, Drawdown)
    ├──→ EquityCurveChart    (Recharts LineChart — strategy vs benchmark)
    ├──→ PortfolioPanel      (Issue 5: cash, positions, PnL)
    ├──→ PositionSizingPanel (Issue 9: inverse-vol weights, limits)
    ├──→ TradeLogTable       (Issue 14: paginated trade audit trail)
    └──→ InterpretationPanel (AI-style natural language summary)
```

### Key Components

#### `BacktestPanel.jsx` (Issue 18: Dashboard)
- **Purpose**: Strategy configuration form
- **Inputs**: Universe selector (Equity/Multi-Asset/Oil), date range picker, initial capital input, macro filter toggle
- **Output**: Triggers `onRun` callback with all parameters
- **Validation**: Enforces date range within dataset bounds (2020-01-01 to 2047-05-18)

#### `EquityCurveChart.jsx` (Issue 18: Visualization)
- **Purpose**: Interactive equity curve visualization
- **Library**: Recharts `LineChart` with `ResponsiveContainer`
- **Lines Rendered**:
  - Strategy equity curve (colored per strategy)
  - Buy & Hold benchmark (gray dashed)
  - Macro-filtered curve (purple dashed, when enabled)
- **Features**: Custom tooltip with ₹ formatting, responsive sizing, legend

#### `MetricsRow.jsx` (Issues 6, 7, 12, 13)
- **Purpose**: Horizontal display of all risk-adjusted metrics
- **Metrics Displayed**:
  - Total Return (%) — colored green/red
  - Sharpe Ratio — with threshold coloring (>1 green, >0 amber, <0 red)
  - Max Drawdown (%) — always red-tinted
  - VaR 95% (₹ amount) — amber
  - VaR 99% (₹ amount) — red
  - Alpha (%) — green/red
  - Beta — colored by market sensitivity
- **Design**: Glassmorphic card with subtle border and strategy accent color

#### `PortfolioPanel.jsx` (Issue 5: Portfolio State)
- **Purpose**: Display current portfolio state snapshot
- **Data Shown**:
  - Initial vs Final capital with PnL (₹ and %)
  - Total trades executed, hold days, skip days
  - Daily portfolio value sparkline (last 100 data points)
- **Visual**: Animated stat cards with Framer Motion

#### `PositionSizingPanel.jsx` (Issue 9: Risk-Aware Sizing)
- **Purpose**: Transparency into how capital is allocated across assets
- **Data Shown**:
  - Sizing method (inverse volatility)
  - Max position limit (25%)
  - Per-asset volatilities
  - Per-asset weight percentages with visual bars
  - Rebalance frequency
- **Visual**: Progress bars colored by allocation weight

#### `TradeLogTable.jsx` (Issue 14: Explainable Strategies)
- **Purpose**: Paginated audit trail of every trade decision
- **Columns**: Date, Action (BUY/SELL/HOLD/SKIP), Assets, Reason, Capital Before/After, PnL
- **Features**:
  - Pagination (configurable page size)
  - Color-coded action badges (green=BUY, red=SELL, gray=HOLD, amber=SKIP)
  - Expandable indicator values for each trade
  - Capital change visualization

#### `Compare.jsx` (Issues 12, 13, 6, 7 — Comparison)
- **Purpose**: Side-by-side multi-strategy comparison
- **Features**:
  - Select up to 5 strategies simultaneously
  - Parallel backtest execution via `Promise.all`
  - Merged equity curve chart (all strategies + benchmark)
  - Full metrics comparison table (Return, Sharpe, VaR, Alpha, Beta)
  - Execution time comparison per strategy
  - Macro-filtered overlay support

#### `Navbar.jsx`
- **Purpose**: Global navigation with authentication state
- **Features**: Responsive design, active route highlighting, user avatar/logout when authenticated

#### `StrategyCard.jsx`
- **Purpose**: Strategy preview card on home page
- **Features**: Strategy name, type badge, description, risk profile indicators, strategy-specific accent colors

---

## Authentication System

### Flow

```
                        ┌─────────────┐
                        │  Signup.jsx  │
                        │  POST /auth/ │
                        │  signup      │
                        └──────┬──────┘
                               │ user created
                               ▼
┌──────────┐  login    ┌─────────────┐  JWT token    ┌──────────────┐
│ Login.jsx│──────────→│  POST /auth/│─────────────→│ AuthContext   │
│          │           │  login      │              │ .login()     │
└──────────┘           └─────────────┘              │ localStorage │
                                                     └──────┬───────┘
                                                            │
                                            ┌───────────────┼───────────────┐
                                            │               │               │
                                            ▼               ▼               ▼
                                     Auto-save to DB   Auth-gated      Bearer header
                                     on backtest run   History page    on API calls
```

### AuthContext (`context/AuthContext.jsx`)
- **State**: `user` (email from JWT payload), `token` (raw JWT string)
- **Persistence**: Token stored in `localStorage` as `tl_token`
- **Token Decoding**: Extracts email from JWT payload via `atob(token.split('.')[1])`
- **Methods**:
  - `login(accessToken)` — stores token, decodes user
  - `logout()` — clears token and user state
- **Auto-restore**: On mount, checks `localStorage` for existing token and restores session

---

## API Client (`api/backtest.js`)

All backend communication is centralized in a single Axios-based API client:

| Method | Endpoint | Purpose |
|---|---|---|
| `listStrategies()` | `GET /strategies` | Fetch all 10 strategy metadata |
| `runBacktest({...})` | `GET /run` | Execute backtest with parameters |
| `getOHLC(symbol, start, end)` | `GET /data/ohlcv` | Raw OHLCV data for a symbol |
| `signup({email, password, firstName})` | `POST /auth/signup` | Register new user |
| `login({email, password})` | `POST /auth/login` | Authenticate and get JWT |
| `getHistory()` | `GET /history` | Fetch user's backtest history |

**Base URL**: `http://localhost:8001`

**Auth**: Bearer token automatically attached via `authHeaders()` helper when user is logged in. This enables auto-save of backtest results to the database.

---

## Strategy Metadata (`data/strategies.js`)

Each of the 10 strategies has rich frontend metadata:

| Field | Type | Description |
|---|---|---|
| `id` | string | Backend strategy identifier (e.g., `macd_trend`) |
| `name` | string | Display name |
| `type` | string | Category (Momentum, Mean Reversion, etc.) |
| `tagline` | string | One-line pitch |
| `description` | string | Detailed explanation |
| `color` | string | Accent color (hex) for charts and UI |
| `gradient` | string | Tailwind gradient class for hero sections |
| `howItWorks` | array | Step-by-step explanation with titles |
| `edge` | string | Market inefficiency the strategy exploits |
| `risk` | object | Risk/Reward/Complexity/Frequency scores (1-5) for radar chart |

---

## Styling Architecture

### Approach
- **Tailwind CSS 3.4** for utility-first styling
- **Inline styles** for dynamic values (strategy colors, gradients)
- **Custom CSS** in `index.css` and `App.css` for base typography and global styles

### Design Language
- **Color Palette**: Dark mode first — `#08080f` (background), `#111118` (card surface), white text
- **Cards**: Rounded corners (`rounded-2xl`), subtle borders (`border-white/8`), dark surface backgrounds
- **Animations**: Framer Motion for page transitions, loading spinners, result reveals
- **Typography**: System font stack via Tailwind defaults
- **Data Formatting**: Indian locale (₹) for currency, percentage with 2 decimal precision

### Responsive Design
- Mobile-first with Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- Grid layouts shift from 1 column (mobile) to multi-column (desktop)
- Charts use `ResponsiveContainer` for fluid width

---

## Issue Coverage (Frontend)

| Issue | Frontend Implementation |
|---|---|
| **Issue 5** | `PortfolioPanel.jsx` — displays cash, positions, PnL, trade counts |
| **Issue 6** | `MetricsRow.jsx` — VaR 95% and 99% displayed with ₹ amounts |
| **Issue 7** | `MetricsRow.jsx` — Max Drawdown percentage, risk timeseries data |
| **Issue 9** | `PositionSizingPanel.jsx` — inverse-vol weights, position limits |
| **Issue 12** | `MetricsRow.jsx` — Sharpe Ratio with threshold coloring |
| **Issue 13** | `MetricsRow.jsx` + `Compare.jsx` — Alpha and Beta display |
| **Issue 14** | `TradeLogTable.jsx` — paginated trade audit trail with reasons |
| **Issue 17** | Execution time displayed in ms after each backtest |
| **Issue 18** | Full dashboard: `BacktestPanel`, `EquityCurveChart`, `MetricsRow`, `Compare` |

---

## Build & Development

```bash
# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

### Environment Requirements
- Node.js 18+
- Backend must be running at `http://localhost:8001`
