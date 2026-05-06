import pandas as pd
import numpy as np
from app.core.strategy_base import StrategyBase


class BollingerBandsBacktester(StrategyBase):
    """
    Bollinger Band Squeeze Strategy — Volatility Breakout.
    Issue 8:  Signal = price crosses above upper band after squeeze
    Issue 9:  Inverse-volatility position sizing
    Issue 11: Periodic rebalancing
    Issue 14: Trade logging with bandwidth values
    Issue 15: Capital guards
    """

    def run(self, data: pd.DataFrame, window: int = 20, num_std: float = 2.0,
            hold_period: int = 5, **kwargs):
        data = self.prepare_data(data)

        sma       = data.rolling(window).mean()
        std       = data.rolling(window).std()
        upper     = sma + num_std * std
        lower     = sma - num_std * std
        bandwidth = (upper - lower) / sma.replace(0, np.nan)
        is_squeeze  = bandwidth == bandwidth.rolling(window).min()
        breakout_up = (data > upper) & is_squeeze.shift(1).fillna(False)

        capital = float(self.initial_capital)
        capital_history = pd.Series(index=data.index, dtype=float)
        start_idx = window
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

            today_breakouts = breakout_up.iloc[i]
            new_symbols = today_breakouts[today_breakouts].index
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
                        f"Bollinger breakout: {len(new_symbols)} new + {len(selected_symbols) - len(new_symbols)} held",
                        old_capital, capital,
                        indicator_values={"new_breakouts": len(new_symbols), "active_positions": len(selected_symbols)}
                    )
            else:
                self.logger.log_trade(today, "HOLD", [], "No active Bollinger breakout positions", capital, capital)

            capital_history.loc[tomorrow] = capital

        return capital_history.ffill()
