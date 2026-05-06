"""
macro_filter.py — Macroeconomic Regime Filter

Issue 4 compliance: Integrates macroeconomic indicators and sentiment data
to conditionally gate trading decisions. On each day, 4 independent signals
(Inflation, Interest_Rate, USD_Index, Sentiment) are evaluated to produce a
"regime multiplier" that scales position sizes from 0.0 (all cash) to 1.0
(full trading).

This module aligns daily macro data with the primary market data timeline
and normalises the signals for use in the strategy pipeline.
"""

import pandas as pd
import numpy as np
from app.services.data_loader import get_macro_df


# ─── Signal Thresholds ────────────────────────────────────────────────────────
# Each threshold defines the boundary between "Risk-On" and "Risk-Off".
SENTIMENT_THRESHOLD    = 0.0    # Sentiment > 0 → positive market mood
INTEREST_RATE_THRESHOLD = 3.5   # Rate < 3.5% → cheap money / accommodative
INFLATION_THRESHOLD    = 2.5    # Inflation < 2.5% → controlled / benign
USD_INDEX_THRESHOLD    = 102.0  # USD < 102 → weak dollar → risk appetite

# Regime score → position multiplier mapping
REGIME_MULTIPLIERS = {
    4: 1.0,   # All 4 signals Risk-On  → full trading
    3: 1.0,   # 3 signals Risk-On      → full trading
    2: 0.5,   # 2 signals Risk-On      → 50% position (half capital deployed)
    1: 0.0,   # 1 signal Risk-On       → all cash, no trades
    0: 0.0,   # All signals Risk-Off   → all cash, no trades
}


def compute_daily_regimes(start: str, end: str) -> pd.DataFrame:
    """
    For each trading day in [start, end], compute:
      - score (int 0–4): how many of the 4 macro signals are "Risk-On"
      - multiplier (float 0.0–1.0): position sizing factor
      - plus the raw macro values for each signal (for frontend annotations)

    Parameters
    ----------
    start : str  e.g. "2022-01-01"
    end   : str  e.g. "2024-01-01"

    Returns
    -------
    pd.DataFrame with DatetimeIndex and columns:
        Inflation, Interest_Rate, USD_Index, Sentiment,
        macro_score (int), macro_multiplier (float)
    """
    macro = get_macro_df()
    if macro.empty:
        return pd.DataFrame()

    mask = (macro.index >= pd.to_datetime(start)) & (macro.index <= pd.to_datetime(end))
    df = macro.loc[mask].copy()

    # ── 4-Signal Scoring ──────────────────────────────────────────────────────
    df["sig_sentiment"]  = (df["Sentiment"]     > SENTIMENT_THRESHOLD).astype(int)
    df["sig_rate"]       = (df["Interest_Rate"] < INTEREST_RATE_THRESHOLD).astype(int)
    df["sig_inflation"]  = (df["Inflation"]      < INFLATION_THRESHOLD).astype(int)
    df["sig_usd"]        = (df["USD_Index"]      < USD_INDEX_THRESHOLD).astype(int)

    df["macro_score"]      = df["sig_sentiment"] + df["sig_rate"] + df["sig_inflation"] + df["sig_usd"]
    df["macro_multiplier"] = df["macro_score"].map(REGIME_MULTIPLIERS)

    # Drop helper columns — keep only the useful ones for API response
    df = df.drop(columns=["sig_sentiment", "sig_rate", "sig_inflation", "sig_usd"])

    return df


def apply_macro_filter(
    raw_equity_curve: pd.Series,
    start: str,
    end: str,
    initial_capital: float,
) -> pd.Series:
    """
    Apply the macro regime multiplier to a pre-computed equity curve.

    On each day, if the regime multiplier < 1.0, a portion of capital
    sits in cash (earning zero). The filtered curve is rebuilt by
    applying daily returns scaled by the multiplier.

    Parameters
    ----------
    raw_equity_curve : pd.Series  (DatetimeIndex → portfolio value)
    start            : str
    end              : str
    initial_capital  : float

    Returns
    -------
    pd.Series — macro-filtered equity curve with same index as input
    """
    regimes = compute_daily_regimes(start, end)
    if regimes.empty:
        return raw_equity_curve  # graceful fallback — return unfiltered

    # Align regime index to the equity curve's index
    multipliers = regimes["macro_multiplier"].reindex(raw_equity_curve.index).ffill().bfill()

    # Reconstruct capital day-by-day applying the multiplier
    daily_returns = raw_equity_curve.pct_change().fillna(0)

    filtered_capital = float(initial_capital)
    filtered_curve = pd.Series(index=raw_equity_curve.index, dtype=float)
    filtered_curve.iloc[0] = filtered_capital

    for i in range(1, len(raw_equity_curve)):
        date = raw_equity_curve.index[i]
        mult = multipliers.iloc[i]
        raw_return = daily_returns.iloc[i]

        # Deployed capital earns the raw strategy return
        # Cash portion earns zero (conservative — no risk-free rate)
        effective_return = raw_return * mult
        filtered_capital = filtered_capital * (1 + effective_return)
        filtered_curve.iloc[i] = filtered_capital

    return filtered_curve


def get_regime_annotations(start: str, end: str) -> list:
    """
    Return a list of dicts suitable for the frontend chart overlay.
    Each dict represents one trading day's macro regime state.

    Used to draw color bands on the equity curve chart:
      - score 3-4 → green (Risk-On)
      - score 2   → yellow (Neutral)
      - score 0-1 → red (Risk-Off)
    """
    df = compute_daily_regimes(start, end)
    if df.empty:
        return []

    records = []
    for date, row in df.iterrows():
        records.append({
            "date":             str(date.date()),
            "macro_score":      int(row["macro_score"]),
            "macro_multiplier": float(row["macro_multiplier"]),
            "sentiment":        round(float(row["Sentiment"]), 4),
            "inflation":        round(float(row["Inflation"]), 4),
            "interest_rate":    round(float(row["Interest_Rate"]), 4),
            "usd_index":        round(float(row["USD_Index"]), 4),
        })
    return records
