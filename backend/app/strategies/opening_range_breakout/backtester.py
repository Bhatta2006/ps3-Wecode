import pandas as pd
import numpy as np
from app.core.strategy_base import StrategyBase


class OpeningRangeBreakoutBacktester(StrategyBase):
    """
    Opening Range Breakout (ORB) Strategy — Daily Momentum.
    Issue 8:  Signal = price closes above rolling N-day high
    Issue 9:  Inverse-volatility position sizing
    Issue 11: Periodic rebalancing
    Issue 14: Trade logging with breakout magnitude
    Issue 15: Capital guards
    """

    def run(self, data: pd.DataFrame, range_days: int = 5, top_n: int = 10,
            hold_period: int = 5, **kwargs):
        data = self.prepare_data(data)

        rolling_high = data.shift(1).rolling(range_days).max()
        rolling_low  = data.shift(1).rolling(range_days).min()
        breakout_up  = data > rolling_high
        range_size   = (rolling_high - rolling_low).replace(0, np.nan)
        breakout_magnitude = (data - rolling_high) / range_size

        capital = float(self.initial_capital)
        capital_history = pd.Series(index=data.index, dtype=float)
        start_idx = range_days + 1
        if len(data) <= start_idx:
            capital_history[:] = capital
            return capital_history
        capital_history.iloc[:start_idx] = capital
        active_holds = {}

        for i in range(start_idx, len(data.index) - 1):
            today    = data.index[i]
            tomorrow = data.index[i + 1]

            if capital <= 0:
                self.logger.log_skip(today, f"Insufficient capital: ₹{capital:.2f}", capital)
                capital_history.loc[tomorrow] = max(capital, 0)
                continue

            expired = [s for s in active_holds if active_holds[s] <= 1]
            for s in expired:
                del active_holds[s]
            for s in active_holds:
                active_holds[s] -= 1

            is_breakout     = breakout_up.iloc[i]
            magnitude_today = breakout_magnitude.iloc[i][is_breakout]
            new_symbols     = magnitude_today.nlargest(top_n).index
            for sym in new_symbols:
                active_holds[sym] = hold_period

            selected_symbols = list(active_holds.keys())

            if selected_symbols:
                prices_today    = data.loc[today, selected_symbols]
                prices_tomorrow = data.loc[tomorrow, selected_symbols]
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

                    self.logger.log_trade(
                        today, "BUY", selected_symbols,
                        f"ORB: {len(new_symbols)} new breakouts + {len(selected_symbols) - len(new_symbols)} held",
                        old_capital, capital,
                        indicator_values={"new_breakouts": len(new_symbols), "total_positions": len(selected_symbols)}
                    )
            else:
                self.logger.log_trade(today, "HOLD", [], "No active breakout positions", capital, capital)

            capital_history.loc[tomorrow] = capital

        return capital_history.ffill()
