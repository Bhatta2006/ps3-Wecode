import pandas as pd
import numpy as np
import os

# Path to the hackathon-provided raw datasets
# Derived relative to this file: backend/app/services/ → ../../.. → ps3-Wecode/ → data/raw/
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "raw")

# ─── In-memory cache (loaded once on first call) ───────────────────────────────
_MERGED_DF = None
_MACRO_DF = None


def _load_and_merge() -> pd.DataFrame:
    """
    Load all 4 CSV datasets, rename colliding columns, merge on Date,
    and forward/backward-fill missing values.

    Returns a fully merged DataFrame indexed by Date.
    """
    # ── 1. Load ────────────────────────────────────────────────────────────────
    equity_df = pd.read_csv(os.path.join(DATA_DIR, "equity_dataset.csv"), parse_dates=["Date"])
    macro_df  = pd.read_csv(os.path.join(DATA_DIR, "macro_dataset.csv"),  parse_dates=["Date"])
    multi_df  = pd.read_csv(os.path.join(DATA_DIR, "multi_asset_dataset.csv"), parse_dates=["Date"])
    oil_df    = pd.read_csv(os.path.join(DATA_DIR, "oil_dataset.csv"),    parse_dates=["Date"])

    # ── 2. Schema validation (Issue 16 compliance) ────────────────────────────
    _validate_schema(equity_df, ["Date", "Price", "Volume", "Returns", "SMA_10"],    "equity_dataset")
    _validate_schema(macro_df,  ["Date", "Inflation", "Interest_Rate", "USD_Index", "Sentiment"], "macro_dataset")
    _validate_schema(multi_df,  ["Date", "Oil", "Gold", "Bonds", "Oil_Returns", "Gold_Returns"], "multi_asset_dataset")
    _validate_schema(oil_df,    ["Date", "Price", "Volume", "Returns", "Volatility"], "oil_dataset")

    # ── 3. Rename colliding columns ───────────────────────────────────────────
    equity_df = equity_df.rename(columns={
        "Price":   "Equity",
        "Volume":  "Equity_Volume",
        "Returns": "Equity_Returns",
        "SMA_10":  "Equity_SMA_10",
    })
    oil_df = oil_df.rename(columns={
        "Price":      "Oil_Price",
        "Volume":     "Oil_Volume",
        "Returns":    "Oil_Returns_Daily",
        "Volatility": "Oil_Volatility",
    })

    # ── 4. Feature Engineering ─────────────────────────────────────────────────
    # Issue 3: Engineer Volatility and Momentum Features from rolling windows
    # Equity rolling volatility (20-day std of returns)
    equity_df["Equity_Volatility_20d"] = (
        equity_df["Equity_Returns"].rolling(20).std()
    )
    # Equity momentum (20-day return)
    equity_df["Equity_Momentum_20d"] = equity_df["Equity"].pct_change(20)

    # Multi-asset bond returns (not pre-computed in the raw file)
    multi_df["Bond_Returns"] = multi_df["Bonds"].pct_change()

    # Oil: volume ratio (today's volume vs. 20-day average) — used by VolumeMomentumBacktester
    oil_df["Oil_Volume_Ratio"] = (
        oil_df["Oil_Volume"] / oil_df["Oil_Volume"].rolling(20).mean()
    )

    # ── 5. Merge on Date (outer join preserves all dates) ─────────────────────
    merged = (
        equity_df
        .merge(macro_df,  on="Date", how="outer")
        .merge(multi_df,  on="Date", how="outer")
        .merge(oil_df,    on="Date", how="outer")
    )

    # ── 6. Handle Missing Values (Issue 2) ────────────────────────────────────
    # Sort by date first so forward-fill doesn't leak future data
    merged = merged.sort_values("Date")

    # Flag outlier prices (single-day moves > 40%) before filling
    for col in ["Equity", "Oil_Price", "Oil", "Gold", "Bonds"]:
        if col in merged.columns:
            daily_chg = merged[col].pct_change().abs()
            merged.loc[daily_chg > 0.40, col] = np.nan  # flag outliers as NaN

    merged = merged.ffill().bfill()
    merged = merged.set_index("Date")

    return merged


def _validate_schema(df: pd.DataFrame, required_cols: list, name: str):
    """Issue 16: Validate that all required columns exist in the dataset."""
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"[{name}] Invalid schema — missing columns: {missing}")


def get_merged_dataset() -> pd.DataFrame:
    """Return the cached merged dataset, loading it on first call."""
    global _MERGED_DF
    if _MERGED_DF is None:
        try:
            _MERGED_DF = _load_and_merge()
        except Exception as e:
            print(f"[data_loader] ERROR loading datasets: {e}")
            return pd.DataFrame()
    return _MERGED_DF


def get_macro_df() -> pd.DataFrame:
    """Return the macro dataset alone (used by macro_filter.py)."""
    global _MACRO_DF
    if _MACRO_DF is None:
        df = get_merged_dataset()
        if df.empty:
            return pd.DataFrame()
        _MACRO_DF = df[["Inflation", "Interest_Rate", "USD_Index", "Sentiment"]].copy()
    return _MACRO_DF


# ─── Public API (mirrors old yahoo_finance.py interface) ──────────────────────

def fetch_constituents(universe: str) -> list:
    """
    Map universe name to asset price columns.
    Used to determine which assets flow into the strategy engine.
    """
    universe = universe.upper()
    if universe in ["MULTI", "MULTI_ASSET"]:
        return ["Oil", "Gold", "Bonds"]
    elif universe == "OIL":
        return ["Oil_Price"]
    # Default: EQUITY, NIFTY, DOW, MACRO_EQUITY all use the equity series
    return ["Equity"]


def fetch_ohlcv(symbol: str, start: str, end: str) -> pd.DataFrame:
    """
    Return a date-filtered DataFrame with standardised OHLCV columns
    (Close, Adj Close, Volume) for benchmark calculations.

    Also includes Volatility for OIL (used in position sizing — Issue 9).
    """
    df = get_merged_dataset()
    if df.empty:
        return pd.DataFrame()

    mask = (df.index >= pd.to_datetime(start)) & (df.index <= pd.to_datetime(end))
    out = df.loc[mask].copy().reset_index()

    if symbol == "Oil_Price":
        out["Close"]     = out["Oil_Price"]
        out["Adj Close"] = out["Oil_Price"]
        out["Volume"]    = out["Oil_Volume"]
        out["Volatility"]= out["Oil_Volatility"]   # Issue 9: expose for position sizing
    elif symbol in ["Oil", "Gold", "Bonds"]:
        price_col = symbol
        out["Close"]     = out[price_col]
        out["Adj Close"] = out[price_col]
        out["Volume"]    = out.get("Oil_Volume", 10000)
    else:
        # Default → Equity
        out["Close"]     = out["Equity"]
        out["Adj Close"] = out["Equity"]
        out["Volume"]    = out["Equity_Volume"]

    return out


def fetch_universe_data(symbols: list, start: str, end: str) -> dict:
    """
    Return a dict with two aligned DataFrames:
      - 'prices':  (Date index) × (symbol columns) — asset prices
      - 'volumes': (Date index) × (symbol columns) — trading volumes

    Issue 1: Ingests price AND volume data as required.
    The 'volumes' key is used by VolumeMomentumBacktester to compute real
    volume-weighted momentum scores instead of falling back to price-only.
    """
    df = get_merged_dataset()
    if df.empty:
        return {"prices": pd.DataFrame(), "volumes": pd.DataFrame()}

    mask = (df.index >= pd.to_datetime(start)) & (df.index <= pd.to_datetime(end))
    sub = df.loc[mask].copy()

    # Volume column mapping per symbol
    VOLUME_MAP = {
        "Equity":    "Equity_Volume",
        "Oil":       "Oil_Volume",
        "Oil_Price": "Oil_Volume",
        "Gold":      None,   # no volume in dataset — use fallback
        "Bonds":     None,
    }

    prices  = pd.DataFrame(index=sub.index)
    volumes = pd.DataFrame(index=sub.index)

    for sym in symbols:
        prices[sym] = sub[sym] if sym in sub.columns else sub["Equity"]

        vol_col = VOLUME_MAP.get(sym)
        if vol_col and vol_col in sub.columns:
            volumes[sym] = sub[vol_col]
        else:
            volumes[sym] = 10000  # neutral fallback — won't distort volume ratio

    return {"prices": prices, "volumes": volumes}
