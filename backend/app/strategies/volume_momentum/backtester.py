import pandas as pd
import numpy as np
from app.core.strategy_base import StrategyBase


class VolumeMomentumBacktester(StrategyBase):
    """
    Volume-Weighted Momentum Strategy — Smart Money Signal.

    Issue 1 compliance: This strategy explicitly uses BOTH price (momentum)
    and volume (conviction) data from the ingestion pipeline, fulfilling the
    requirement to ingest and use price AND volume data.

    Logic:
    - Compute a rolling N-day price momentum (return) for each asset.
    - Compute a rolling N-day volume ratio: today's volume vs. its N-day average.
      A ratio > 1 means above-average trading activity (higher conviction).
    - SCORE = price_momentum × volume_ratio
      → High score: strong upward price move WITH high volume (institutional buying).
      → Low score: weak price move, or momentum on thin volume (unconfirmed).
    - Divide by rolling volatility to get risk-adjusted score.
    - Select the top N assets by SCORE each day.
    - Equal weight allocation among selected assets.
    """

    def run(
        self,
        data: pd.DataFrame,
        volume_data: pd.DataFrame = None,
        momentum_window: int = 20,
        top_n: int = 10,
    ):
        """
        Parameters
        ----------
        data : pd.DataFrame
            Price matrix — index=Date, columns=asset symbols.
        volume_data : pd.DataFrame, optional
            Volume matrix with the same shape as `data`.
            When provided, enables true volume-weighted scoring (Issue 1).
            When None, falls back to pure momentum/volatility scoring.
        momentum_window : int
            Rolling window for momentum and volume calculations.
        top_n : int
            Maximum number of assets to hold on any day.
        """
        data = self.prepare_data(data)

        # ── 1. Price Momentum ──────────────────────────────────────────────────
        price_momentum = data.pct_change(momentum_window)

        # ── 2. Rolling Volatility (risk denominator) ───────────────────────────
        daily_returns = data.pct_change()
        rolling_volatility = daily_returns.rolling(momentum_window).std()

        # ── 3. Volume Ratio — Issue 1: use real volume data when available ──────
        if volume_data is not None and not volume_data.empty:
            # Align volume to the same index/columns as price
            vol = volume_data.reindex(index=data.index, columns=data.columns).ffill().fillna(1)
            rolling_avg_vol = vol.rolling(momentum_window).mean().replace(0, np.nan)
            volume_ratio = vol / rolling_avg_vol   # > 1 = above-average conviction
        else:
            # Graceful fallback: treat all volume as neutral (ratio = 1.0)
            volume_ratio = pd.DataFrame(
                np.ones(data.shape), index=data.index, columns=data.columns
            )

        # ── 4. Composite Score: Momentum × Volume / Volatility ─────────────────
        # High momentum + high volume + low volatility = best trade candidates
        score = (price_momentum * volume_ratio) / rolling_volatility.replace(0, np.nan)

        # ── 5. Portfolio Simulation ────────────────────────────────────────────
        capital = float(self.initial_capital)
        capital_history = pd.Series(index=data.index, dtype=float)

        start_idx = momentum_window
        if len(data) <= start_idx:
            capital_history[:] = capital
            return capital_history

        capital_history.iloc[:start_idx] = capital

        for i in range(start_idx, len(data.index) - 1):
            today = data.index[i]
            tomorrow = data.index[i + 1]

            # Issue 15: Capital guard
            if capital <= 0:
                self.logger.log_skip(today, f"Insufficient capital: ₹{capital:.2f}", capital)
                capital_history.loc[tomorrow] = max(capital, 0)
                continue

            # Issue 11: Rebalancing
            if not self.should_rebalance(i - start_idx):
                capital_history.loc[tomorrow] = capital
                continue

            day_score = score.iloc[i]
            positive_momentum = day_score[day_score > 0]
            selected = positive_momentum.nlargest(top_n).index

            if not selected.empty:
                prices_today    = data.loc[today, selected]
                prices_tomorrow = data.loc[tomorrow, selected]
                valid = prices_today > 0
                p_today    = prices_today[valid]
                p_tomorrow = prices_tomorrow[valid]

                if not p_today.empty:
                    # Issue 9: Inverse-volatility position sizing
                    vols = self.get_rolling_volatilities(data, i)
                    shares_dict = self.portfolio.allocate_with_limits(
                        list(p_today.index), p_today.to_dict(),
                        volatilities={s: vols.get(s, 0.01) for s in p_today.index}
                    )
                    old_capital = capital
                    capital = sum(shares_dict.get(s, 0) * p_tomorrow.get(s, 0) for s in shares_dict)

                    # Issue 14: Trade logging
                    best_score = float(day_score[selected].max())
                    has_volume = volume_data is not None and not volume_data.empty
                    self.logger.log_trade(
                        today, "BUY", list(selected),
                        f"Volume momentum: {len(selected)} assets (best score: {best_score:.2f}, real volume: {has_volume})",
                        old_capital, capital,
                        indicator_values={"best_score": round(best_score, 4), "using_real_volume": has_volume}
                    )

            capital_history.loc[tomorrow] = capital

        return capital_history.ffill()
