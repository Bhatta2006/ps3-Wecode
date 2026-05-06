# TradeLab — Backend Architecture

## Overview

The TradeLab backend is a **FastAPI + Python** server that powers the hedge fund backtesting engine. It ingests raw CSV datasets, runs 10 quantitative trading strategies with full risk management, and serves results via RESTful API endpoints. The backend handles data processing, strategy execution, metric computation, user authentication, and backtest history persistence.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **FastAPI** | Async-ready web framework with automatic OpenAPI docs |
| **Uvicorn** | ASGI server |
| **Pandas** | DataFrame operations for timeseries data |
| **NumPy** | Numerical computations (VaR, volatility, returns) |
| **SciPy** | Statistical functions |
| **Scikit-learn** | ML utilities for feature engineering |
| **SQLAlchemy** | ORM for database models |
| **SQLite** | Local database (zero-config, portable) |
| **python-jose (JWT)** | Token-based authentication |
| **Passlib + bcrypt** | Password hashing |
| **Plotly / Matplotlib** | Backend chart generation (optional) |

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry point
│   │
│   ├── api/                       # API route handlers
│   │   ├── backtest.py            # Core backtest orchestrator (19.4 KB)
│   │   ├── auth.py                # Signup/Login/Me endpoints
│   │   └── deps.py                # Dependency injection (auth guards)
│   │
│   ├── core/                      # Core business logic
│   │   ├── strategy_base.py       # StrategyBase, PortfolioState, TradeLogger (13.4 KB)
│   │   ├── config.py              # App settings (JWT secret, expiry)
│   │   └── security.py            # JWT creation, password hashing
│   │
│   ├── services/                  # Data services
│   │   ├── __init__.py
│   │   ├── data_loader.py         # CSV ingestion, feature engineering (8.4 KB)
│   │   └── macro_filter.py        # Macroeconomic regime filter (6.0 KB)
│   │
│   ├── strategies/                # 10 strategy implementations
│   │   ├── bollinger_bands/
│   │   │   └── backtester.py      # Bollinger Band Squeeze
│   │   ├── ichimoku/
│   │   │   └── backtester.py      # Ichimoku Cloud
│   │   ├── macd_trend/
│   │   │   └── backtester.py      # MACD Trend Following
│   │   ├── mean_reversion/
│   │   │   └── backtester.py      # Mean Reversion (buy losers)
│   │   ├── opening_range_breakout/
│   │   │   └── backtester.py      # Opening Range Breakout
│   │   ├── pairs_trading/
│   │   │   └── backtester.py      # Pairs/Statistical Arbitrage
│   │   ├── rs_momentum/
│   │   │   └── backtester.py      # Relative Strength Momentum
│   │   ├── rsi_extremes/
│   │   │   └── backtester.py      # RSI Extremes (oversold bounce)
│   │   ├── triple_ema/
│   │   │   └── backtester.py      # Triple EMA Ribbon
│   │   └── volume_momentum/
│   │       └── backtester.py      # Volume-Weighted Momentum
│   │
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── __init__.py            # Model exports
│   │   ├── user.py                # User model (email, hashed_password)
│   │   └── backtest.py            # BacktestHistory model
│   │
│   ├── schemas/                   # Pydantic request/response schemas
│   │   └── user.py                # UserCreate, UserResponse, Token
│   │
│   └── db/                        # Database layer
│       └── database.py            # SQLAlchemy engine, SessionLocal, Base
│
├── tests/
│   └── test_edge_cases.py         # Issue 20: 9-scenario edge case test suite
│
├── alembic/                       # Database migration scripts
├── alembic.ini                    # Alembic configuration
├── requirements.txt               # Python dependencies
├── pyproject.toml                 # Project metadata
└── tradelab.db                    # SQLite database file
```

---

## API Endpoints

### Backtest Engine

| Method | Endpoint | Parameters | Description |
|---|---|---|---|
| `GET` | `/strategies` | — | List all 10 strategies with metadata |
| `GET` | `/run` | `strategy_id`, `universe`, `start`, `end`, `initial_capital`, `macro_filter` | Execute a full backtest pipeline |
| `GET` | `/data/ohlcv` | `symbol`, `start`, `end` | Fetch raw OHLCV data for a symbol |
| `GET` | `/history` | `limit` | Get authenticated user's backtest history |

### Authentication

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | `email`, `password`, `first_name` | Register new user |
| `POST` | `/auth/login` | `email`, `password` | Login, returns JWT |
| `GET` | `/auth/me` | `token` | Get current user profile |

### Root

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check — `{"status": "Backend is running"}` |

---

## Core Modules

### `main.py` — Application Entry Point

```python
app = FastAPI(title="TradeLab Backend")
Base.metadata.create_all(bind=engine)  # Auto-create tables on startup
app.add_middleware(CORSMiddleware, allow_origins=["*"])
app.include_router(backtest_router)
app.include_router(auth_router)
```

- CORS middleware enabled for frontend communication
- Database tables auto-created via SQLAlchemy on first startup
- Two routers: backtest engine + auth

---

### `services/data_loader.py` — Data Ingestion Pipeline (Issues 1, 2, 3, 16)

This module handles the complete data pipeline from raw CSV files to analysis-ready DataFrames.

#### Pipeline Steps

```
equity_dataset.csv ─┐
oil_dataset.csv ────┤
multi_asset_dataset.csv ─┤──→ _load_and_merge()
macro_dataset.csv ──┘    │
                         ▼
                   Schema Validation (Issue 16)
                   ├── Checks required columns exist per dataset
                   └── Raises ValueError with specific missing columns
                         │
                         ▼
                   Column Renaming
                   ├── Price → Equity, Oil_Price
                   ├── Volume → Equity_Volume, Oil_Volume
                   └── Returns → Equity_Returns, Oil_Returns_Daily
                         │
                         ▼
                   Feature Engineering (Issue 3)
                   ├── Equity_Volatility_20d  (rolling 20-day std of returns)
                   ├── Equity_Momentum_20d    (20-day pct_change)
                   ├── Bond_Returns           (daily pct_change of Bonds)
                   └── Oil_Volume_Ratio       (today / 20-day avg volume)
                         │
                         ▼
                   Missing Data Handling (Issue 2)
                   ├── Sort by Date (prevents forward-looking bias)
                   ├── Flag outliers (> 40% single-day moves → NaN)
                   └── Forward-fill then backward-fill
                         │
                         ▼
                   Merged DataFrame (cached in-memory via global _MERGED_DF)
```

#### Public API

| Function | Returns | Description |
|---|---|---|
| `get_merged_dataset()` | `DataFrame` | Full merged dataset (cached after first load) |
| `get_macro_df()` | `DataFrame` | Macro columns only (Inflation, Interest_Rate, USD_Index, Sentiment) |
| `fetch_constituents(universe)` | `list[str]` | Map universe name to asset price column names |
| `fetch_ohlcv(symbol, start, end)` | `DataFrame` | Standardized OHLCV data for a single symbol |
| `fetch_universe_data(symbols, start, end)` | `dict` | `{prices: DataFrame, volumes: DataFrame}` — aligned matrices |

#### Universe Mapping

| Universe | Assets Returned |
|---|---|
| `EQUITY` / `NIFTY` / `DOW` | `["Equity"]` |
| `MULTI` / `MULTI_ASSET` | `["Oil", "Gold", "Bonds"]` |
| `OIL` | `["Oil_Price"]` |

---

### `services/macro_filter.py` — Macroeconomic Regime Filter (Issue 4)

Integrates macroeconomic indicators to conditionally gate trading decisions.

#### 4-Signal Scoring System

| Signal | Risk-On Condition | Rationale |
|---|---|---|
| Sentiment | `> 0.0` | Positive market mood |
| Interest Rate | `< 3.5%` | Accommodative monetary policy |
| Inflation | `< 2.5%` | Controlled inflation |
| USD Index | `< 102.0` | Weak dollar → risk appetite |

#### Regime Multiplier Mapping

| Score (0-4) | Multiplier | Action |
|---|---|---|
| 4 (all Risk-On) | 1.0 | Full capital deployed |
| 3 | 1.0 | Full capital deployed |
| 2 | 0.5 | 50% capital, rest in cash |
| 1 | 0.0 | All cash, no trades |
| 0 (all Risk-Off) | 0.0 | All cash, no trades |

#### Functions

| Function | Purpose |
|---|---|
| `compute_daily_regimes(start, end)` | Compute daily macro score and multiplier |
| `apply_macro_filter(raw_curve, start, end, initial_capital)` | Apply regime-scaled returns to equity curve |
| `get_regime_annotations(start, end)` | Return daily regime data for frontend chart overlay |

**Design Choice**: Regime gating, not prediction. The filter reads today's macro state and decides whether to deploy capital — it never attempts to predict future macro conditions.

---

### `core/strategy_base.py` — Core Strategy Infrastructure (Issues 5, 6, 7, 9, 11, 12, 14, 15)

This is the backbone of the entire strategy engine. It provides three foundational classes plus standalone metric functions.

#### `calculate_metrics(capital_series)` — Issues 6, 7, 12

Computes standardized performance metrics from an equity curve:

| Metric | Issue | Computation |
|---|---|---|
| `total_return` | — | `(final / initial) - 1` |
| `annualized_return` | — | `(1 + total_return)^(365/days) - 1` |
| `annualized_volatility` | 7 | `returns.std() * √252` |
| `sharpe_ratio` | 12 | `annualized_return / annualized_volatility` |
| `max_drawdown` | 7 | `min(capital / cummax - 1)` |
| `var_95_daily` | 6 | `returns.quantile(0.05)` — 5th percentile |
| `var_99_daily` | 6 | `returns.quantile(0.01)` — 1st percentile |
| `var_95_amount` | 6 | `current_value × |var_95_daily|` |
| `var_99_amount` | 6 | `current_value × |var_99_daily|` |

#### `calculate_risk_timeseries(capital_series, window=30)` — Issue 7

Rolling risk monitoring with configurable window:
- Rolling volatility (annualized)
- Rolling drawdown (from cumulative max)
- Rolling VaR at 95% (Issue 6: periodically recalculated)

Returns a list of dicts for frontend chart rendering.

#### `PortfolioState` Class — Issues 5, 9, 15

```python
class PortfolioState:
    initial_capital: float
    cash: float
    positions: dict[str, float]      # symbol → shares held
    allocations: dict[str, float]    # symbol → fraction of portfolio
    max_position_pct: float = 0.25   # Issue 9: no single asset > 25%
    total_value: float
```

**Key Methods**:

| Method | Issue | Purpose |
|---|---|---|
| `update_value(prices)` | 5 | Recalculate total value from positions + cash |
| `can_trade(required_amount)` | 15 | Check sufficient capital before trading |
| `allocate_with_limits(assets, prices, volatilities)` | 9 | Inverse-vol weighted sizing with position caps |
| `execute_trades(shares, prices)` | 5 | Execute buys, update cash/positions (with scale-down safeguard) |
| `liquidate_all(prices)` | 5 | Sell all positions, return total cash |

**Position Sizing Algorithm (Issue 9)**:
1. Compute inverse volatility: `1 / max(vol, 0.001)` per asset
2. Normalize to weights summing to 1.0
3. Cap each weight at `max_position_pct` (25%)
4. Re-normalize after capping
5. Compute shares: `cash × weight / price`

**Capital Safeguards (Issue 15)**:
- `can_trade()` checks `cash >= required_amount`
- `allocate_with_limits()` returns empty dict if `cash < 1.0`
- `execute_trades()` scales down proportionally if cost exceeds cash

#### `TradeLogger` Class — Issue 14

Records explainable audit trail for every trade decision:

```python
log_trade(date, action, assets, reason, capital_before, capital_after, indicator_values)
log_skip(date, reason, capital)   # Issue 15: logs skipped trades
get_logs(max_entries=200)         # Returns most recent entries
```

Each log entry captures:
- `date`, `action` (BUY/SELL/HOLD/SKIP), `assets`, `num_assets`
- `reason` — human-readable explanation of the trading signal
- `capital_before`, `capital_after`, `pnl`
- `indicator_values` — dict of specific indicator values that triggered the decision

#### `StrategyBase` Class — Issues 2, 5, 9, 11, 14, 15

Base class all 10 strategies inherit from:

```python
class StrategyBase:
    initial_capital: float
    rebalance_every: int           # Issue 11: 1=daily, 21=monthly
    portfolio: PortfolioState      # Issue 5
    logger: TradeLogger            # Issue 14
```

**Methods**:

| Method | Issue | Purpose |
|---|---|---|
| `prepare_data(data)` | 2 | Forward-fill, mask >50% daily moves as glitches |
| `should_rebalance(day_index)` | 11 | Check if `day_index % rebalance_every == 0` |
| `get_rolling_volatilities(data, i, window=20)` | 9 | Per-asset rolling volatility for position sizing |
| `get_trade_logs()` | 14 | Return the trade audit trail |

---

### `api/backtest.py` — Backtest Orchestrator (All Issues)

The central API endpoint that orchestrates the full pipeline:

#### Pipeline Execution Order

```
GET /run?strategy_id=macd_trend&universe=EQUITY&start=2022-01-01&end=2024-01-01

Step 1 │ Track execution time (Issue 17)
       ▼
Step 2 │ Fetch universe data — prices + volumes (Issue 1)
       │ └── fetch_universe_data(symbols, start, end)
       ▼
Step 3 │ Build benchmark — buy-and-hold of first symbol
       ▼
Step 4 │ Run strategy backtester (Issues 5, 8, 9, 11, 14, 15)
       │ └── backtester.run(price_data, volume_data)
       ▼
Step 5 │ Apply transaction costs (Issue 10)
       │ └── daily_friction = 0.00015 (1.5 bps/day compounding)
       ▼
Step 6 │ Macro filter (Issue 4, optional)
       │ └── apply_macro_filter(raw_curve, start, end, initial_capital)
       ▼
Step 7 │ Compute metrics (Issues 6, 7, 12, 13)
       │ ├── calculate_metrics(equity_curve)
       │ ├── _compute_alpha_beta(strategy_curve, benchmark_curve)
       │ └── calculate_risk_timeseries(equity_curve)
       ▼
Step 8 │ Extract trade logs + portfolio state + position sizing (Issues 5, 9, 14)
       ▼
Step 9 │ Build chart data (Issue 18)
       │ └── _build_chart_data(strategy, benchmark, filtered)
       ▼
Step 10│ Auto-save to DB if authenticated
       ▼
Return │ Full JSON response
```

#### Strategy Registry

All 10 strategies are registered in a centralized `BACKTESTERS` dict:

| Strategy ID | Type | Signal Logic |
|---|---|---|
| `mean_reversion` | Mean Reversion | Buy yesterday's biggest losers |
| `rs_momentum` | Momentum | Buy yesterday's top performers |
| `macd_trend` | Trend Following | EMA crossover signals |
| `rsi_extremes` | Mean Reversion | Buy at RSI < 30 |
| `bollinger_bands` | Volatility Breakout | Band squeeze breakouts |
| `ichimoku` | Complex Trend | Cloud analysis confirmation |
| `pairs_trading` | Statistical Arbitrage | Mean-reverting spreads |
| `triple_ema` | Trend Following | EMA8 > EMA21 > EMA55 alignment |
| `opening_range_breakout` | Breakout | Rolling high breakout with strength |
| `volume_momentum` | Momentum | Price momentum × volume ratio |

#### API Response Schema

```json
{
  "strategy":            "macd_trend",
  "strategy_name":       "MACD Trend",
  "strategy_type":       "Trend Following",
  "universe":            "EQUITY",
  "macro_filter_on":     false,
  "metrics": {
    "total_return":           -0.27,
    "annualized_return":      -0.15,
    "annualized_volatility":  0.058,
    "sharpe_ratio":           -2.64,
    "max_drawdown":           -0.30,
    "var_95_daily":           -0.018,
    "var_99_daily":           -0.025,
    "var_95_amount":          1639.83,
    "var_99_amount":          2277.59,
    "alpha":                  -0.057,
    "beta":                   0.518
  },
  "filtered_metrics":    null,
  "chart_data":          [...],
  "macro_regime_data":   [...],
  "trade_logs":          [...],
  "risk_timeseries":     [...],
  "portfolio_state": {
    "initial_capital":   100000,
    "final_capital":     72892.15,
    "total_pnl":         -27107.85,
    "total_pnl_pct":     -27.11,
    "total_trades":      145,
    "hold_days":         203,
    "skip_days":         12,
    "daily_values":      [...]
  },
  "position_sizing": {
    "method":                "inverse_volatility",
    "max_position_pct":      25,
    "asset_volatilities":    {"Equity": 0.018432},
    "asset_weights_pct":     {"Equity": 100.0},
    "rebalance_frequency":   "daily"
  },
  "execution_time_ms":   479.7
}
```

---

### Database Layer

#### `db/database.py`

```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tradelab.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
```

- Default: SQLite (zero-config, portable)
- Supports PostgreSQL via `DATABASE_URL` env variable
- `check_same_thread=False` for SQLite concurrent access
- Session dependency injection via `get_db()`

#### Models

**User** (`models/user.py`):
| Column | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key, auto-generated |
| `email` | String | Unique, indexed |
| `hashed_password` | String | bcrypt-hashed |
| `first_name` | String | Optional |
| `created_at` | DateTime | Auto-set |

**BacktestHistory** (`models/backtest.py`):
| Column | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `user_id` | String (FK → users) | Owner reference |
| `strategy_id` | String | Strategy identifier |
| `universe` | String | Asset universe |
| `start_date` | String | Backtest start |
| `end_date` | String | Backtest end |
| `initial_capital` | Float | Starting capital |
| `final_capital` | Float | Ending capital |
| `sharpe_ratio` | Float | Result metric |
| `max_drawdown` | Float | Result metric |
| `chart_data` | String (JSON) | Serialized chart data |
| `created_at` | DateTime | Auto-set |

---

### Authentication (`core/security.py` + `api/auth.py`)

| Feature | Implementation |
|---|---|
| Password hashing | `passlib.CryptContext(schemes=["bcrypt"])` |
| Token generation | `python-jose` JWT with HS256 |
| Token expiry | 7 days (`ACCESS_TOKEN_EXPIRE_MINUTES = 10080`) |
| Secret key | Configurable via `SECRET_KEY` env variable |

---

## Issue Coverage Map

| Issue | Module(s) | What It Does |
|---|---|---|
| **1** | `data_loader.py` | Multi-CSV ingestion with concurrent merge, price + volume |
| **2** | `data_loader.py`, `StrategyBase.prepare_data()` | Missing data imputation (ffill/bfill), outlier flagging (>40%) |
| **3** | `data_loader.py` | Rolling 20-day volatility, momentum, volume ratio features |
| **4** | `macro_filter.py` | 4-signal regime scoring, position multiplier gating |
| **5** | `PortfolioState` class | Cash/position/allocation tracking with dynamic updates |
| **6** | `calculate_metrics()`, `calculate_risk_timeseries()` | VaR at 95%/99% (parametric, rolling) |
| **7** | `calculate_metrics()`, `calculate_risk_timeseries()` | Max drawdown, rolling volatility, continuous monitoring |
| **8** | 10 strategy `backtester.py` files | MACD, RSI, Bollinger, Ichimoku, EMA, etc. signal engines |
| **9** | `PortfolioState.allocate_with_limits()` | Inverse-volatility weighting, 25% position cap |
| **10** | `backtest.py` pipeline | Daily 1.5 bps friction factor, compounding over time |
| **11** | `StrategyBase.should_rebalance()` | Configurable rebalancing interval (daily/monthly) |
| **12** | `calculate_metrics()` | Sharpe = annualized_return / annualized_volatility |
| **13** | `_compute_alpha_beta()` | Covariance-based Alpha/Beta vs buy-and-hold benchmark |
| **14** | `TradeLogger` class | Full audit trail: action, reason, indicator values, PnL |
| **15** | `PortfolioState.can_trade()`, `log_skip()` | Capital guards, proportional scale-down, skip logging |
| **16** | `_validate_schema()` | Required column validation per dataset with error messages |
| **17** | `backtest.py` pipeline | `time.perf_counter()` timing, reported in response |
| **18** | `backtest.py` response + `_build_chart_data()` | Aggregated chart data, metrics, regime annotations |
| **19** | This document + `ARCHITECTURE.md` | End-to-end architecture documentation |
| **20** | `tests/test_edge_cases.py` | 9 scenarios: volatility spikes, low liquidity, drawdowns, etc. |

---

## Testing (Issue 20)

### Edge Case Test Suite (`tests/test_edge_cases.py`)

9 test scenarios covering realistic market edge cases:

| Test | Scenario | What It Validates |
|---|---|---|
| 1 | Extreme Volatility | +200% spikes, -80% crashes → outlier clamping (Issue 2) |
| 2 | Low Liquidity | 30% NaN data → forward-fill continues (Issue 2) |
| 3 | Extended Drawdown | 200-day bear market → capital stays ≥ 0 (Issue 15) |
| 4 | Edge Dates | 5-day dataset, single asset → no crashes |
| 5 | Insufficient Capital | ₹1 starting capital → graceful handling (Issue 15) |
| 6 | Portfolio State | `PortfolioState` allocation, limits, zero-capital guard (Issue 5) |
| 7 | Trade Logger | Full audit trail with all required fields (Issue 14) |
| 8 | Risk Timeseries | Rolling drawdown/volatility/VaR computation (Issue 7) |
| 9 | VaR Calculation | 95% and 99% VaR correctness (Issue 6) |

**Run tests**:
```bash
cd backend
python -m tests.test_edge_cases
```

---

## Design Decisions

1. **CSV-First Architecture**: All data from local CSVs — no external API dependencies. Data cached in memory on first load for sub-second subsequent access.

2. **Inverse-Volatility Sizing (Issue 9)**: Each asset's weight is proportional to `1/volatility`. Volatile assets receive less capital — a fundamental risk parity concept.

3. **Regime Gating, Not Prediction (Issue 4)**: The macro filter reads today's observable state to gate capital deployment. It never predicts future conditions, avoiding overfitting to historical macro patterns.

4. **Compounding Transaction Costs (Issue 10)**: A daily friction factor `(1 - 0.00015)^days` compounds over time rather than per-trade. This is realistic for daily-rebalanced strategies where counting individual trades is impractical.

5. **Position Limits at 25% (Issue 9)**: No single asset can exceed 25% of portfolio value, preventing concentration risk. After capping, weights are re-normalized.

6. **Trade Logging for Explainability (Issue 14)**: Every trade captures the specific indicator values that triggered the decision — not just what happened, but why.

7. **Fail-Safe DB Writes**: Backtest history persistence is wrapped in `try/except` — the backtest response is never blocked by a database error.

---

## Running the Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Start the server (port 8001)
uvicorn app.main:app --reload --port 8001

# The API docs are available at:
# http://localhost:8001/docs      (Swagger UI)
# http://localhost:8001/redoc     (ReDoc)
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./tradelab.db` | Database connection string |
| `SECRET_KEY` | (hardcoded default) | JWT signing secret |
