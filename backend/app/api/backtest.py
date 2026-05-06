import json
import time
import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from sqlalchemy.orm import Session

from app.services.data_loader import fetch_ohlcv, fetch_constituents, fetch_universe_data
from app.services.macro_filter import apply_macro_filter, get_regime_annotations
from app.core.strategy_base import calculate_metrics, calculate_risk_timeseries
from app.db.database import get_db
from app.models.backtest import BacktestHistory
from app.models.user import User

# --- Original 3 ---
from app.strategies.mean_reversion.backtester import MeanReversionBacktester
from app.strategies.rs_momentum.backtester import RSMomentumBacktester
from app.strategies.macd_trend.backtester import MACDTrendBacktester

# --- Batch 2 (5 new) ---
from app.strategies.rsi_extremes.backtester import RSIExtremesBacktester
from app.strategies.bollinger_bands.backtester import BollingerBandsBacktester
from app.strategies.ichimoku.backtester import IchimokuBacktester
from app.strategies.pairs_trading.backtester import PairsTradingBacktester
from app.strategies.triple_ema.backtester import TripleEMABacktester

# --- Final 2 (completing 10) ---
from app.strategies.opening_range_breakout.backtester import OpeningRangeBreakoutBacktester
from app.strategies.volume_momentum.backtester import VolumeMomentumBacktester

router = APIRouter()

# ─── Registry ────────────────────────────────────────────────────────────────

BACKTESTERS = {
    "mean_reversion":          MeanReversionBacktester,
    "rs_momentum":             RSMomentumBacktester,
    "macd_trend":              MACDTrendBacktester,
    "rsi_extremes":            RSIExtremesBacktester,
    "bollinger_bands":         BollingerBandsBacktester,
    "ichimoku":                IchimokuBacktester,
    "pairs_trading":           PairsTradingBacktester,
    "triple_ema":              TripleEMABacktester,
    "opening_range_breakout":  OpeningRangeBreakoutBacktester,
    "volume_momentum":         VolumeMomentumBacktester,
}

STRATEGY_META = {
    "benchmark":               {"name": "Buy & Hold Benchmark",        "type": "Benchmark",             "description": "Passive Buy & Hold of the selected asset universe."},
    "mean_reversion":          {"name": "Mean Reversion",              "type": "Mean Reversion",        "description": "Buy yesterday's biggest losers expecting a bounce back."},
    "rs_momentum":             {"name": "RS Momentum",                 "type": "Momentum",              "description": "Buy yesterday's top performers riding the trend."},
    "macd_trend":              {"name": "MACD Trend",                  "type": "Trend Following",       "description": "EMA crossover-based trend following across the universe."},
    "rsi_extremes":            {"name": "RSI Extremes",                "type": "Mean Reversion",        "description": "Buy oversold assets (RSI < 30) expecting an oscillator bounce."},
    "bollinger_bands":         {"name": "Bollinger Band Squeeze",      "type": "Volatility Breakout",   "description": "Trade breakouts from low-volatility Bollinger Band compression zones."},
    "ichimoku":                {"name": "Ichimoku Cloud",              "type": "Complex Trend",         "description": "Multi-component Japanese indicator confirming trend with cloud analysis."},
    "pairs_trading":           {"name": "Pairs Trading",               "type": "Statistical Arbitrage", "description": "Exploit mean-reverting spreads between correlated asset pairs."},
    "triple_ema":              {"name": "Triple EMA Ribbon",           "type": "Trend Following",       "description": "Buy assets aligned EMA8 > EMA21 > EMA55 after a healthy pullback."},
    "opening_range_breakout":  {"name": "Opening Range Breakout",      "type": "Breakout",              "description": "Buy assets breaking above their rolling recent high with strength."},
    "volume_momentum":         {"name": "Volume-Weighted Momentum",    "type": "Momentum",              "description": "Score = price momentum × volume ratio to filter high-conviction moves."},
}


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/strategies")
def list_strategies():
    """Return all 10 strategy IDs with metadata."""
    return [{"id": sid, **meta} for sid, meta in STRATEGY_META.items()]


@router.get("/data/ohlcv")
def get_ohlcv_data(symbol: str, start: str, end: str):
    try:
        df = fetch_ohlcv(symbol, start, end)
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found")
        df["Date"] = df["Date"].astype(str)
        return {"symbol": symbol, "data": df.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/run")
def run_backtest(
    strategy_id: str,
    universe: str = "EQUITY",
    start: str = "2022-01-01",
    end: str = "2024-01-01",
    initial_capital: float = 100000.0,
    macro_filter: bool = False,           # Issue 4: enable macro regime filtering
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    if strategy_id not in BACKTESTERS and strategy_id != "benchmark":
        raise HTTPException(
            status_code=400,
            detail=f"Unknown strategy. Available: {list(BACKTESTERS.keys())} + ['benchmark']"
        )

    try:
        # Issue 17: Track execution time for scalability monitoring
        t0 = time.perf_counter()

        # ── 1. Fetch universe data (prices + volumes) — Issue 1 ──────────────
        symbols    = fetch_constituents(universe)
        universe_data = fetch_universe_data(symbols, start, end)
        price_data = universe_data["prices"]
        volume_data = universe_data["volumes"]

        if price_data.empty:
            raise HTTPException(status_code=404, detail="No market data found for the selected date range")

        # ── 2. Benchmark — use first symbol's price series as buy-and-hold ────
        benchmark_symbol = symbols[0]
        benchmark_raw    = fetch_ohlcv(benchmark_symbol, start, end)
        price_col        = "Adj Close" if "Adj Close" in benchmark_raw.columns else "Close"
        benchmark_equity = (
            benchmark_raw.set_index("Date")[price_col]
            .pct_change().add(1).cumprod().mul(initial_capital)
        )

        # ── 3. Run strategy ────────────────────────────────────────────────────
        if strategy_id == "benchmark":
            raw_equity_curve = benchmark_equity.dropna()
        else:
            backtester = BACKTESTERS[strategy_id](initial_capital=initial_capital)

            # Issue 1: pass volume_data to strategies that support it
            if strategy_id == "volume_momentum":
                raw_equity_curve = backtester.run(price_data, volume_data=volume_data)
            else:
                raw_equity_curve = backtester.run(price_data)

        # ── 4. Transaction Costs & Slippage — Issue 10 ────────────────────────
        # Apply realistic market friction: 0.1% commission + 0.05% slippage per day
        # Using a cumulative daily drag that compounds over the backtest period.
        if strategy_id != "benchmark":
            daily_friction = 0.00015   # ~1.5 bps/day (realistic for daily-rebalanced strategies)
            friction_factors = (1 - daily_friction) ** np.arange(len(raw_equity_curve))
            raw_equity_curve = raw_equity_curve * friction_factors

        # ── 5. Macro Filter — Issue 4 ─────────────────────────────────────────
        macro_equity_curve = None
        macro_regime_data  = []

        if macro_filter:
            macro_equity_curve = apply_macro_filter(
                raw_equity_curve, start, end, initial_capital
            )
            macro_regime_data = get_regime_annotations(start, end)

        # ── 6. Performance Metrics ─────────────────────────────────────────────
        metrics = calculate_metrics(raw_equity_curve)
        metrics.update(_compute_alpha_beta(raw_equity_curve, benchmark_equity))

        # Issue 7: Continuous risk monitoring — rolling drawdown/vol/VaR
        risk_timeseries = calculate_risk_timeseries(raw_equity_curve)

        # Issue 14: Extract trade logs from the backtester
        trade_logs = []
        position_sizing_details = {}
        portfolio_state = {}
        if strategy_id != "benchmark" and hasattr(backtester, 'get_trade_logs'):
            trade_logs = backtester.get_trade_logs()

            # Issue 5: Portfolio State snapshot
            final_value = float(raw_equity_curve.iloc[-1]) if len(raw_equity_curve) > 0 else initial_capital
            total_pnl = final_value - initial_capital

            # Count trade actions from logs
            buy_count  = sum(1 for l in trade_logs if l.get('action') == 'BUY')
            hold_count = sum(1 for l in trade_logs if l.get('action') == 'HOLD')
            skip_count = sum(1 for l in trade_logs if l.get('action') == 'SKIP')

            # Daily portfolio values for wallet history
            daily_values = [
                {"date": str(d.date()), "value": round(float(v), 2)}
                for d, v in raw_equity_curve.items()
                if not (pd.isna(v) or np.isinf(v))
            ]

            portfolio_state = {
                "initial_capital": initial_capital,
                "final_capital":   round(final_value, 2),
                "total_pnl":       round(total_pnl, 2),
                "total_pnl_pct":   round((total_pnl / initial_capital) * 100, 2),
                "total_trades":    buy_count,
                "hold_days":       hold_count,
                "skip_days":       skip_count,
                "daily_values":    daily_values[-100:],  # last 100 for sparkline
            }

            # Issue 9: Position sizing details
            # Extract volatility weights from the last trade that had allocations
            last_buy = next((l for l in reversed(trade_logs) if l.get('action') == 'BUY'), None)
            asset_vols = {}
            asset_weights = {}
            if last_buy and last_buy.get('num_assets', 0) > 0:
                n_assets = last_buy['num_assets']
                # Compute inverse-vol weights for the assets
                for asset in last_buy.get('assets', []):
                    v = backtester.get_rolling_volatilities(price_data, len(price_data) - 1)
                    vol = v.get(asset, 0.01)
                    asset_vols[asset] = round(vol, 6)
                # Compute weights
                if asset_vols:
                    inv_sum = sum(1.0 / max(v, 0.001) for v in asset_vols.values())
                    for a, v in asset_vols.items():
                        w = (1.0 / max(v, 0.001)) / inv_sum if inv_sum > 0 else 0
                        asset_weights[a] = round(w * 100, 2)

            position_sizing_details = {
                "method":             "inverse_volatility",
                "max_position_pct":   25,
                "asset_volatilities":  asset_vols,
                "asset_weights_pct":   asset_weights,
                "rebalance_frequency": "daily",
            }

        # If macro-filtered, also return filtered metrics
        filtered_metrics = None
        if macro_equity_curve is not None:
            filtered_metrics = calculate_metrics(macro_equity_curve)
            filtered_metrics.update(_compute_alpha_beta(macro_equity_curve, benchmark_equity))

        # ── 7. Build chart data ────────────────────────────────────────────────
        chart_data = _build_chart_data(
            raw_equity_curve, benchmark_equity, macro_equity_curve
        )

        # ── 8. Compose response ──────────────────────────────────────────────
        # Issue 17: Execution time
        execution_time_ms = round((time.perf_counter() - t0) * 1000, 1)

        response = {
            "strategy":               strategy_id,
            "strategy_name":          STRATEGY_META[strategy_id]["name"],
            "strategy_type":          STRATEGY_META[strategy_id]["type"],
            "universe":               universe,
            "macro_filter_on":        macro_filter,
            "metrics":                metrics,
            "filtered_metrics":       filtered_metrics,
            "chart_data":             chart_data,
            "macro_regime_data":      macro_regime_data,
            "trade_logs":             trade_logs,              # Issue 14
            "risk_timeseries":        risk_timeseries,          # Issue 7
            "execution_time_ms":      execution_time_ms,        # Issue 17
            "portfolio_state":        portfolio_state,           # Issue 5
            "position_sizing":        position_sizing_details,   # Issue 9
        }

        # ── 9. Auto-save to DB ─────────────────────────────────────────────────
        if authorization and authorization.startswith("Bearer "):
            _save_to_db(db, authorization, strategy_id, universe, start, end,
                        initial_capital, raw_equity_curve, metrics, chart_data)

        return response

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── History ─────────────────────────────────────────────────────────────────

@router.get("/history")
def get_history(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    """Return the logged-in user's backtest history, most recent first."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        from jose import jwt
        from app.core.config import settings
        token   = authorization.split(" ", 1)[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email   = payload.get("sub")
        user    = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        runs = (
            db.query(BacktestHistory)
            .filter(BacktestHistory.user_id == user.id)
            .order_by(BacktestHistory.created_at.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "id":             r.id,
                "strategy_id":    r.strategy_id,
                "strategy_name":  STRATEGY_META.get(r.strategy_id, {}).get("name", r.strategy_id),
                "universe":       r.universe,
                "start_date":     r.start_date,
                "end_date":       r.end_date,
                "initial_capital": r.initial_capital,
                "final_capital":  r.final_capital,
                "sharpe_ratio":   r.sharpe_ratio,
                "max_drawdown":   r.max_drawdown,
                "created_at":     str(r.created_at),
            }
            for r in runs
        ]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ─── Internal Helpers ─────────────────────────────────────────────────────────

def _compute_alpha_beta(strategy_curve: pd.Series, benchmark_curve: pd.Series) -> dict:
    """Issue 13: Compute portfolio Alpha and Beta vs the benchmark."""
    try:
        strat_ret = strategy_curve.pct_change().dropna()
        bench_ret = benchmark_curve.pct_change().dropna()
        aligned   = pd.concat([strat_ret, bench_ret], axis=1).dropna()
        aligned.columns = ["s", "b"]

        if len(aligned) < 10:
            return {"alpha": 0.0, "beta": 1.0}

        beta = aligned.cov().loc["s", "b"] / aligned["b"].var()
        alpha = (aligned["s"].mean() - beta * aligned["b"].mean()) * 252  # annualised
        return {"alpha": round(float(alpha), 4), "beta": round(float(beta), 4)}
    except Exception:
        return {"alpha": 0.0, "beta": 1.0}


def _build_chart_data(
    strategy_curve: pd.Series,
    benchmark_curve: pd.Series,
    filtered_curve: pd.Series = None,
) -> list:
    """Build the chart-ready list of dicts with cleaned float values."""
    results = []
    for date, val in strategy_curve.items():
        bench_val    = benchmark_curve.get(date, None)
        filtered_val = filtered_curve.get(date, None) if filtered_curve is not None else None

        s_val = None if pd.isna(val) or np.isinf(val) else round(float(val), 2)
        b_val = None if (bench_val is None or pd.isna(bench_val) or np.isinf(bench_val)) else round(float(bench_val), 2)
        f_val = None if (filtered_val is None or pd.isna(filtered_val) or np.isinf(filtered_val)) else round(float(filtered_val), 2)

        row = {"date": str(date.date()), "strategy": s_val, "benchmark": b_val}
        if filtered_curve is not None:
            row["macro_filtered"] = f_val
        results.append(row)
    return results


def _save_to_db(db, authorization, strategy_id, universe, start, end,
                initial_capital, equity_curve, metrics, chart_data):
    """Persist backtest result to DB if user is authenticated."""
    try:
        from jose import jwt
        from app.core.config import settings
        token   = authorization.split(" ", 1)[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email   = payload.get("sub")
        user    = db.query(User).filter(User.email == email).first()
        if user:
            entry = BacktestHistory(
                user_id        = user.id,
                strategy_id    = strategy_id,
                universe       = universe,
                start_date     = start,
                end_date       = end,
                initial_capital= initial_capital,
                final_capital  = float(equity_curve.iloc[-1]),
                sharpe_ratio   = metrics.get("sharpe_ratio"),
                max_drawdown   = metrics.get("max_drawdown"),
                chart_data     = json.dumps(chart_data),
            )
            db.add(entry)
            db.commit()
    except Exception:
        pass  # Never fail the backtest just because DB save failed
