import pandas as pd
import numpy as np
from app.core.strategy_base import StrategyBase


class TripleEMABacktester(StrategyBase):
    """
    Triple EMA Ribbon Strategy — Trend Following via Smoothing.
    Issue 8:  Signal = EMA8 > EMA21 > EMA55 with pullback bounce
    Issue 9:  Inverse-volatility position sizing
    Issue 11: Periodic rebalancing
    Issue 14: Trade logging with EMA/trend strength
    Issue 15: Capital guards
    """

    def run(self, data: pd.DataFrame, fast: int = 8, med: int = 21, slow: int = 55,
            top_n: int = 10, **kwargs):
        data = self.prepare_data(data)

        ema_fast = data.ewm(span=fast, adjust=False).mean()
        ema_med  = data.ewm(span=med, adjust=False).mean()
        ema_slow = data.ewm(span=slow, adjust=False).mean()

        aligned = (ema_fast > ema_med) & (ema_med > ema_slow)
        pullback_bounce = (
            (data.shift(1) < ema_fast.shift(1)) &
            (data.shift(1) > ema_med.shift(1)) &
            (data > ema_fast)
        )
        trend_strength = (ema_fast - ema_slow) / ema_slow.replace(0, np.nan)

        capital = float(self.initial_capital)
        capital_history = pd.Series(index=data.index, dtype=float)
        start_idx = slow
        if len(data) <= start_idx:
            capital_history[:] = capital
            return capital_history
        capital_history.iloc[:start_idx] = capital

        for i in range(start_idx, len(data.index) - 1):
            today    = data.index[i]
            tomorrow = data.index[i + 1]

            if capital <= 0:
                self.logger.log_skip(today, f"Insufficient capital: ₹{capital:.2f}", capital)
                capital_history.loc[tomorrow] = max(capital, 0)
                continue

            if not self.should_rebalance(i - start_idx):
                capital_history.loc[tomorrow] = capital
                continue

            is_aligned  = aligned.iloc[i]
            is_bouncing = pullback_bounce.iloc[i]
            strength    = trend_strength.iloc[i]

            eligible = strength[is_aligned]
            bounce_boost = is_bouncing[is_aligned].astype(float) * 100.0
            eligible = eligible + bounce_boost
            selected = eligible.nlargest(top_n).index

            if not selected.empty:
                prices_today    = data.loc[today, selected]
                prices_tomorrow = data.loc[tomorrow, selected]
                valid    = prices_today > 0
                p_today  = prices_today[valid]
                p_tomorrow = prices_tomorrow[valid]

                if not p_today.empty:
                    vols = self.get_rolling_volatilities(data, i)
                    shares_dict = self.portfolio.allocate_with_limits(
                        list(p_today.index), p_today.to_dict(),
                        volatilities={s: vols.get(s, 0.01) for s in p_today.index}
                    )
                    old_capital = capital
                    capital = sum(shares_dict.get(s, 0) * p_tomorrow.get(s, 0) for s in shares_dict)

                    bounces = int(is_bouncing[selected].sum())
                    self.logger.log_trade(
                        today, "BUY", list(selected),
                        f"Triple EMA aligned: {len(selected)} in uptrend ({bounces} with pullback bounce)",
                        old_capital, capital,
                        indicator_values={"aligned_count": int(is_aligned.sum()), "bounce_count": bounces}
                    )

            capital_history.loc[tomorrow] = capital

        return capital_history.ffill()
