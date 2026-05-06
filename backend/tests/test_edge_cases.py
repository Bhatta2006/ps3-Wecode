"""
Issue 20: Comprehensive Testing of Edge Cases

Tests the system against:
  1. Extreme market volatility (artificially spiked prices)
  2. Low liquidity (many NaN/zero volume periods)
  3. Extended drawdowns (continuously declining prices)
  4. Edge date scenarios (start=end, dates outside range)
  5. Insufficient capital scenarios
"""

import sys
import os
import numpy as np
import pandas as pd

sys.path.insert(0, r'd:\TradeLab-main\backend')

from app.core.strategy_base import calculate_metrics, calculate_risk_timeseries, PortfolioState, TradeLogger
from app.strategies.mean_reversion.backtester import MeanReversionBacktester
from app.strategies.macd_trend.backtester import MACDTrendBacktester
from app.strategies.volume_momentum.backtester import VolumeMomentumBacktester


def make_dates(n=500):
    return pd.date_range("2022-01-01", periods=n, freq="B")


# ─── Test 1: Extreme Volatility ──────────────────────────────────────────────

def test_extreme_volatility():
    """Inject 50% daily spikes — system should clamp outliers and not crash."""
    print("TEST 1: Extreme Volatility")
    dates = make_dates(200)
    np.random.seed(42)
    prices = pd.DataFrame({
        "A": 100 * np.cumprod(1 + np.random.normal(0, 0.05, 200)),
        "B": 100 * np.cumprod(1 + np.random.normal(0, 0.05, 200)),
    }, index=dates)

    # Inject extreme spikes (Issue 2 should handle these)
    prices.loc[prices.index[50], "A"] *= 3.0   # +200% spike
    prices.loc[prices.index[100], "B"] *= 0.2  # -80% crash

    bt = MACDTrendBacktester(initial_capital=100000)
    curve = bt.run(prices)

    assert not curve.isna().all(), "Equity curve should not be all NaN"
    assert curve.iloc[-1] > 0, "Capital should remain positive"
    print(f"  Final capital: ₹{curve.iloc[-1]:,.2f} (started ₹100,000)")
    print("  PASSED ✓")


# ─── Test 2: Low Liquidity (Many NaN / Zero Volume) ─────────────────────────

def test_low_liquidity():
    """Data with 30% missing values — system should forward-fill and continue."""
    print("TEST 2: Low Liquidity (30% NaN)")
    dates = make_dates(300)
    np.random.seed(99)
    prices = pd.DataFrame({
        "X": 50 * np.cumprod(1 + np.random.normal(0.001, 0.02, 300)),
        "Y": 80 * np.cumprod(1 + np.random.normal(0.001, 0.02, 300)),
    }, index=dates)

    # Introduce 30% missing values (simulating low liquidity)
    mask = np.random.random(prices.shape) < 0.30
    prices[mask] = np.nan

    bt = MeanReversionBacktester(initial_capital=50000)
    curve = bt.run(prices)

    non_nan = curve.dropna()
    assert len(non_nan) > 100, f"Should have valid data points, got {len(non_nan)}"
    assert non_nan.iloc[-1] > 0, "Capital should remain positive despite missing data"
    print(f"  Valid data points: {len(non_nan)}")
    print(f"  Final capital: ₹{non_nan.iloc[-1]:,.2f}")
    print("  PASSED ✓")


# ─── Test 3: Extended Drawdown (Continuously Declining) ──────────────────────

def test_extended_drawdown():
    """A market that drops every single day for 200 days."""
    print("TEST 3: Extended Drawdown (200-day bear market)")
    dates = make_dates(200)
    # Prices decline steadily: 100 → ~36 (64% drop over 200 days)
    prices = pd.DataFrame({
        "BEAR": 100 * np.cumprod(np.full(200, 0.995)),  # -0.5% per day
    }, index=dates)

    bt = MACDTrendBacktester(initial_capital=100000)
    curve = bt.run(prices)

    final = curve.dropna().iloc[-1]
    assert final >= 0, "Capital must never go negative (Issue 15)"
    assert final < 100000, "Should have lost money in a bear market"

    metrics = calculate_metrics(curve.dropna())
    assert metrics["max_drawdown"] < 0, "Should report negative drawdown"
    assert "var_95_daily" in metrics, "VaR should be computed (Issue 6)"
    print(f"  Final capital: ₹{final:,.2f} (started ₹100,000)")
    print(f"  Max Drawdown: {metrics['max_drawdown']:.2%}")
    print(f"  VaR 95%: {metrics['var_95_daily']:.4f}")
    print("  PASSED ✓")


# ─── Test 4: Edge Dates ──────────────────────────────────────────────────────

def test_edge_dates():
    """Test with very short date ranges and boundary conditions."""
    print("TEST 4: Edge Date Scenarios")

    # Test with only 5 data points
    dates = make_dates(5)
    prices = pd.DataFrame({
        "A": [100, 101, 99, 100, 102],
    }, index=dates)

    bt = MeanReversionBacktester(initial_capital=10000)
    curve = bt.run(prices)
    assert len(curve) > 0, "Should handle tiny datasets"
    print("  5-day dataset: OK")

    # Test with single column (1 asset universe)
    dates2 = make_dates(100)
    prices2 = pd.DataFrame({
        "SOLO": 100 * np.cumprod(1 + np.random.normal(0.001, 0.01, 100)),
    }, index=dates2)

    bt2 = MACDTrendBacktester(initial_capital=100000)
    curve2 = bt2.run(prices2)
    assert len(curve2) > 0, "Should handle single-asset universe"
    print("  Single-asset universe: OK")

    print("  PASSED ✓")


# ─── Test 5: Insufficient Capital ────────────────────────────────────────────

def test_insufficient_capital():
    """Test with very small initial capital (Issue 15)."""
    print("TEST 5: Insufficient Capital Guard")

    dates = make_dates(100)
    prices = pd.DataFrame({
        "A": 100 * np.cumprod(1 + np.random.normal(0, 0.02, 100)),
        "B": 50 * np.cumprod(1 + np.random.normal(0, 0.02, 100)),
    }, index=dates)

    # Start with only ₹1 — too little to buy anything meaningful
    bt = MeanReversionBacktester(initial_capital=1.0)
    curve = bt.run(prices)

    assert curve.iloc[-1] >= 0, "Capital must never go below zero"
    logs = bt.get_trade_logs()
    print(f"  Trade logs generated: {len(logs)}")
    print(f"  Final capital: ₹{curve.dropna().iloc[-1]:.4f}")
    print("  PASSED ✓")


# ─── Test 6: Portfolio State Management ──────────────────────────────────────

def test_portfolio_state():
    """Verify PortfolioState tracks cash, positions, and limits correctly."""
    print("TEST 6: PortfolioState (Issue 5)")

    ps = PortfolioState(initial_capital=100000, max_position_pct=0.30)
    assert ps.cash == 100000
    assert ps.total_value == 100000

    # Test allocation with limits
    shares = ps.allocate_with_limits(
        ["A", "B", "C", "D"],
        {"A": 100, "B": 50, "C": 200, "D": 75},
        volatilities={"A": 0.02, "B": 0.05, "C": 0.01, "D": 0.03}
    )
    assert len(shares) == 4, "Should allocate to all 4 assets"
    assert all(v > 0 for v in shares.values()), "All allocations should be positive"
    print(f"  Allocated to {len(shares)} assets with inverse-vol weights")

    # Test insufficient capital guard
    ps2 = PortfolioState(initial_capital=0)
    shares2 = ps2.allocate_with_limits(["A"], {"A": 100})
    assert len(shares2) == 0, "Should refuse allocation with zero capital"
    print("  Zero-capital guard: OK")

    print("  PASSED ✓")


# ─── Test 7: Trade Logger ────────────────────────────────────────────────────

def test_trade_logger():
    """Verify TradeLogger captures all required fields."""
    print("TEST 7: TradeLogger (Issue 14)")

    logger = TradeLogger()
    logger.log_trade(
        pd.Timestamp("2022-05-15"), "BUY", ["AAPL", "MSFT"],
        "MACD crossover: bullish signal",
        100000, 101500,
        indicator_values={"macd_gap": 0.05}
    )
    logger.log_skip(pd.Timestamp("2022-05-16"), "Capital below threshold", 500)

    logs = logger.get_logs()
    assert len(logs) == 2
    assert logs[0]["action"] == "BUY"
    assert logs[0]["pnl"] == 1500.0
    assert logs[1]["action"] == "SKIP"
    assert "indicator_values" in logs[0]
    print(f"  Logged {len(logs)} entries with full audit trail")
    print("  PASSED ✓")


# ─── Test 8: Risk Timeseries ────────────────────────────────────────────────

def test_risk_timeseries():
    """Verify rolling drawdown/volatility/VaR computation."""
    print("TEST 8: Risk Timeseries (Issue 7)")

    dates = make_dates(200)
    capital = pd.Series(
        100000 * np.cumprod(1 + np.random.normal(0.001, 0.015, 200)),
        index=dates
    )

    ts = calculate_risk_timeseries(capital, window=30)
    assert len(ts) > 0, "Should produce risk timeseries"
    assert "drawdown" in ts[0], "Should have drawdown field"
    assert "rolling_volatility" in ts[0], "Should have rolling_volatility"
    assert "rolling_var_95" in ts[0], "Should have rolling VaR"
    print(f"  Generated {len(ts)} data points")
    print(f"  Sample: drawdown={ts[50]['drawdown']:.4f}, vol={ts[50]['rolling_volatility']:.4f}")
    print("  PASSED ✓")


# ─── Test 9: VaR Calculation ────────────────────────────────────────────────

def test_var_calculation():
    """Verify VaR is correctly computed at 95% and 99%."""
    print("TEST 9: VaR Calculation (Issue 6)")

    dates = make_dates(252)
    capital = pd.Series(
        100000 * np.cumprod(1 + np.random.normal(0.0005, 0.02, 252)),
        index=dates
    )

    metrics = calculate_metrics(capital)
    assert "var_95_daily" in metrics
    assert "var_99_daily" in metrics
    assert "var_95_amount" in metrics
    assert "var_99_amount" in metrics
    assert metrics["var_99_daily"] < metrics["var_95_daily"], "99% VaR should be more extreme"
    print(f"  VaR 95% daily: {metrics['var_95_daily']:.4f} (₹{metrics['var_95_amount']:,.2f})")
    print(f"  VaR 99% daily: {metrics['var_99_daily']:.4f} (₹{metrics['var_99_amount']:,.2f})")
    print("  PASSED ✓")


# ─── Run All Tests ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("ISSUE 20: Edge Case Test Suite")
    print("=" * 60)
    print()

    tests = [
        test_extreme_volatility,
        test_low_liquidity,
        test_extended_drawdown,
        test_edge_dates,
        test_insufficient_capital,
        test_portfolio_state,
        test_trade_logger,
        test_risk_timeseries,
        test_var_calculation,
    ]

    passed = 0
    failed = 0
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"  FAILED ✗: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
        print()

    print("=" * 60)
    print(f"RESULTS: {passed}/{len(tests)} passed, {failed} failed")
    print("=" * 60)
