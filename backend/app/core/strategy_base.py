"""
strategy_base.py — Core Strategy Infrastructure

Covers:
  Issue 5:  PortfolioState — cash, positions, allocations, position limits
  Issue 6:  Value at Risk (VaR) — parametric and historical
  Issue 7:  Max Drawdown + rolling volatility (continuous monitoring)
  Issue 9:  Inverse-volatility position sizing
  Issue 11: Periodic rebalancing support
  Issue 12: Sharpe Ratio
  Issue 14: Trade logging (explainable audit trail)
  Issue 15: Insufficient capital safeguards
"""

import pandas as pd
import numpy as np
from typing import Optional


# ─── Performance Metrics (Issues 6, 7, 12) ──────────────────────────────────

def calculate_metrics(capital_series: pd.Series) -> dict:
    """
    Standardized performance metric calculation for all strategies.
    Issue 12: Sharpe Ratio
    Issue 7: Max Drawdown and Volatility
    Issue 6: Value at Risk (VaR)
    """
    if capital_series.empty or len(capital_series) < 2:
        return {}

    returns = capital_series.pct_change().dropna()

    # ── Annualized Return ────────────────────────────────────────────────────
    total_return = float((capital_series.iloc[-1] / capital_series.iloc[0]) - 1)
    days = (capital_series.index[-1] - capital_series.index[0]).days
    annualized_return = float((1 + total_return) ** (365 / max(days, 1)) - 1)

    # ── Issue 7: Volatility ──────────────────────────────────────────────────
    annualized_vol = float(returns.std() * np.sqrt(252))

    # ── Issue 12: Sharpe Ratio ───────────────────────────────────────────────
    sharpe_ratio = float(annualized_return / annualized_vol) if annualized_vol != 0 else 0.0

    # ── Issue 7: Max Drawdown ────────────────────────────────────────────────
    rolling_max = capital_series.cummax()
    drawdown = (capital_series / rolling_max) - 1
    max_drawdown = float(drawdown.min())

    # ── Issue 6: Value at Risk (VaR) ─────────────────────────────────────────
    # Parametric VaR at 95% and 99% confidence intervals
    var_95 = float(returns.quantile(0.05))       # 5th percentile of returns
    var_99 = float(returns.quantile(0.01))       # 1st percentile of returns
    current_value = float(capital_series.iloc[-1])
    var_95_amount = round(current_value * abs(var_95), 2)
    var_99_amount = round(current_value * abs(var_99), 2)

    return {
        "total_return":           round(total_return, 4),
        "annualized_return":      round(annualized_return, 4),
        "annualized_volatility":  round(annualized_vol, 4),
        "sharpe_ratio":           round(sharpe_ratio, 4),
        "max_drawdown":           round(max_drawdown, 4),
        # Issue 6: VaR metrics
        "var_95_daily":           round(var_95, 4),
        "var_99_daily":           round(var_99, 4),
        "var_95_amount":          var_95_amount,
        "var_99_amount":          var_99_amount,
    }


def calculate_risk_timeseries(capital_series: pd.Series, window: int = 30) -> list:
    """
    Issue 7: Continuous monitoring — rolling drawdown and volatility over time.
    Returns a list of dicts for the frontend risk chart.
    """
    if capital_series.empty or len(capital_series) < window:
        return []

    returns = capital_series.pct_change()

    # Rolling volatility (annualised)
    rolling_vol = returns.rolling(window).std() * np.sqrt(252)

    # Rolling drawdown
    rolling_max = capital_series.cummax()
    drawdown = (capital_series / rolling_max) - 1

    # Rolling VaR (Issue 6: recalculated periodically)
    rolling_var = returns.rolling(window).quantile(0.05)

    records = []
    for i in range(window, len(capital_series)):
        date = capital_series.index[i]
        records.append({
            "date":               str(date.date()),
            "drawdown":           round(float(drawdown.iloc[i]), 4),
            "rolling_volatility": round(float(rolling_vol.iloc[i]), 4) if not np.isnan(rolling_vol.iloc[i]) else 0.0,
            "rolling_var_95":     round(float(rolling_var.iloc[i]), 4) if not np.isnan(rolling_var.iloc[i]) else 0.0,
        })
    return records


# ─── Issue 5: Portfolio State Management ─────────────────────────────────────

class PortfolioState:
    """
    Tracks the current status of the simulated portfolio.

    Issue 5:  cash, positions, allocations, dynamic updates
    Issue 9:  position limits (max_position_pct)
    Issue 15: insufficient capital safeguards
    """

    def __init__(self, initial_capital: float, max_position_pct: float = 0.25):
        self.initial_capital  = initial_capital
        self.cash             = initial_capital
        self.positions        = {}    # symbol → shares held
        self.allocations      = {}    # symbol → fraction of portfolio
        self.max_position_pct = max_position_pct  # Issue 9: no single asset > 25%
        self.total_value      = initial_capital

    def update_value(self, prices: dict):
        """Recalculate total portfolio value from current positions + cash."""
        position_value = sum(
            self.positions.get(sym, 0) * prices.get(sym, 0)
            for sym in self.positions
        )
        self.total_value = self.cash + position_value

        # Update allocations
        if self.total_value > 0:
            self.allocations = {
                sym: (self.positions[sym] * prices.get(sym, 0)) / self.total_value
                for sym in self.positions if self.positions[sym] > 0
            }
            self.allocations["cash"] = self.cash / self.total_value

    def can_trade(self, required_amount: float) -> bool:
        """Issue 15: Check if sufficient capital exists for a trade."""
        return self.cash >= required_amount and self.cash > 0

    def allocate_with_limits(
        self,
        selected_assets: list,
        prices: dict,
        volatilities: Optional[dict] = None,
    ) -> dict:
        """
        Issue 9: Risk-aware position sizing with inverse-volatility weighting
        and position limits.

        Returns: dict of {symbol: shares_to_buy}
        """
        if not selected_assets or self.cash <= 0:
            return {}

        # ── Issue 15: capital guard ─────────────────────────────────────────
        if self.cash < 1.0:
            return {}

        # ── Issue 9: inverse-volatility weighting ───────────────────────────
        if volatilities and any(volatilities.get(s, 0) > 0 for s in selected_assets):
            inv_vol = {}
            for s in selected_assets:
                vol = volatilities.get(s, 0.01)
                inv_vol[s] = 1.0 / max(vol, 0.001)  # prevent div-by-zero
            total_inv_vol = sum(inv_vol.values())
            weights = {s: inv_vol[s] / total_inv_vol for s in selected_assets}
        else:
            # Equal-weight fallback
            weights = {s: 1.0 / len(selected_assets) for s in selected_assets}

        # ── Issue 9: enforce position limits ────────────────────────────────
        for s in weights:
            weights[s] = min(weights[s], self.max_position_pct)

        # Re-normalise after capping
        total_w = sum(weights.values())
        if total_w > 0:
            weights = {s: w / total_w for s, w in weights.items()}

        # ── Compute shares ──────────────────────────────────────────────────
        shares = {}
        for s in selected_assets:
            price = prices.get(s, 0)
            if price > 0:
                alloc = self.cash * weights.get(s, 0)
                shares[s] = alloc / price
        return shares

    def execute_trades(self, shares: dict, prices: dict):
        """Execute buy orders and update cash/positions."""
        cost = 0
        for sym, qty in shares.items():
            price = prices.get(sym, 0)
            cost += qty * price
            self.positions[sym] = self.positions.get(sym, 0) + qty

        # Issue 15: ensure we don't go negative
        if cost > self.cash:
            # Scale down proportionally
            scale = self.cash / cost if cost > 0 else 0
            for sym in shares:
                shares[sym] *= scale
            cost = self.cash

        self.cash -= cost

    def liquidate_all(self, prices: dict) -> float:
        """Sell all positions, return total proceeds + remaining cash."""
        proceeds = 0
        for sym, qty in self.positions.items():
            proceeds += qty * prices.get(sym, 0)
        self.cash += proceeds
        self.positions = {}
        self.allocations = {}
        return self.cash


# ─── Issue 14: Trade Logging ────────────────────────────────────────────────

class TradeLogger:
    """
    Records the rationale behind every generated signal and executed trade.
    Captures indicator values, risk metrics, and constraints.
    """

    def __init__(self):
        self.logs = []

    def log_trade(
        self,
        date,
        action: str,       # "BUY", "SELL", "HOLD", "SKIP"
        assets: list,
        reason: str,
        capital_before: float,
        capital_after: float,
        indicator_values: Optional[dict] = None,
    ):
        self.logs.append({
            "date":             str(date.date()) if hasattr(date, 'date') else str(date),
            "action":           action,
            "assets":           assets[:5],    # cap at 5 for readability
            "num_assets":       len(assets),
            "reason":           reason,
            "capital_before":   round(capital_before, 2),
            "capital_after":    round(capital_after, 2),
            "pnl":              round(capital_after - capital_before, 2),
            "indicator_values": indicator_values or {},
        })

    def log_skip(self, date, reason: str, capital: float):
        """Issue 15: Log when a trade is skipped due to constraints."""
        self.logs.append({
            "date":             str(date.date()) if hasattr(date, 'date') else str(date),
            "action":           "SKIP",
            "assets":           [],
            "num_assets":       0,
            "reason":           reason,
            "capital_before":   round(capital, 2),
            "capital_after":    round(capital, 2),
            "pnl":              0.0,
            "indicator_values": {},
        })

    def get_logs(self, max_entries: int = 200) -> list:
        """Return the most recent trade logs (capped for API response size)."""
        return self.logs[-max_entries:]


# ─── Strategy Base Class ────────────────────────────────────────────────────

class StrategyBase:
    """
    Base class providing common utilities for dedicated strategy backtesters.

    Issue 5:   PortfolioState integration
    Issue 11:  Rebalancing support (rebalance_every parameter)
    Issue 14:  TradeLogger integration
    Issue 15:  Insufficient capital safeguards
    """

    def __init__(self, initial_capital: float = 100000, rebalance_every: int = 1):
        self.initial_capital = initial_capital
        self.rebalance_every = rebalance_every  # Issue 11: 1=daily, 21=monthly
        self.portfolio = PortfolioState(initial_capital)
        self.logger    = TradeLogger()

    def prepare_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Common data preparation logic. Drops anomalous prices (Issue 2)."""
        df = data.ffill().dropna(how='all')

        # Calculate daily percentage returns
        returns = df.pct_change()

        # Mask out physically impossible single-day returns (> 50% or < -50%)
        # These are almost always data glitches.
        glitch_mask = (returns > 0.50) | (returns < -0.50)

        # Replace glitch prices with NaN, then forward fill
        df[glitch_mask] = np.nan
        return df.ffill()

    def should_rebalance(self, day_index: int) -> bool:
        """Issue 11: Check if today is a rebalancing day."""
        return day_index % self.rebalance_every == 0

    def get_rolling_volatilities(self, data: pd.DataFrame, i: int, window: int = 20) -> dict:
        """Issue 9: Get per-asset rolling volatility for position sizing."""
        if i < window:
            return {}
        returns = data.iloc[max(0, i - window):i].pct_change()
        vols = returns.std()
        return vols.to_dict()

    def get_trade_logs(self) -> list:
        """Issue 14: Return the trade audit trail."""
        return self.logger.get_logs()
