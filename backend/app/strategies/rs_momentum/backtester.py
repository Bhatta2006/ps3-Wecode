import pandas as pd
import numpy as np
from app.core.strategy_base import StrategyBase


class RSMomentumBacktester(StrategyBase):
    """
    Relative Strength Momentum — Biggest Winners Strategy.

    Logic: Buy the top-N assets by trailing 20-day return, riding the trend.
    Issue 8:  Signal = top-N momentum (relative strength ranking)
    Issue 9:  Inverse-volatility position sizing
    Issue 11: Periodic rebalancing
    Issue 14: Trade logging with momentum values
    Issue 15: Capital guards
    """

    def run(self, data: pd.DataFrame, top_n: int = 10, lookback: int = 20, **kwargs):
        data = self.prepare_data(data)
        momentum_returns = data.pct_change(periods=lookback)

        capital = float(self.initial_capital)
        capital_history = pd.Series(index=data.index, dtype=float)
        capital_history.iloc[:lookback] = capital

        for i in range(lookback, len(data.index) - 1):
            today    = data.index[i]
            tomorrow = data.index[i + 1]

            if capital <= 0:
                self.logger.log_skip(today, f"Insufficient capital: ₹{capital:.2f}", capital)
                capital_history.loc[tomorrow] = max(capital, 0)
                continue

            if not self.should_rebalance(i - lookback):
                capital_history.loc[tomorrow] = capital
                continue

            day_momentum = momentum_returns.iloc[i]
            winners = day_momentum.nlargest(top_n).index

            if not winners.empty:
                prices_today    = data.loc[today, winners]
                prices_tomorrow = data.loc[tomorrow, winners]
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

                    best_mom = float(day_momentum[winners].max())
                    self.logger.log_trade(
                        today, "BUY", list(winners),
                        f"RS Momentum: top {len(winners)} by {lookback}-day return (best: {best_mom:.2%})",
                        old_capital, capital,
                        indicator_values={"best_momentum": round(best_mom, 4)}
                    )

            capital_history.loc[tomorrow] = capital

        return capital_history.ffill()
