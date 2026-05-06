import pandas as pd
import numpy as np
from app.core.strategy_base import StrategyBase


class MeanReversionBacktester(StrategyBase):
    """
    Mean Reversion (Biggest Losers) Strategy.

    Logic: Buy yesterday's biggest losers expecting a bounce back.
    Issue 8:  Signal = bottom-N daily returns (buy oversold assets)
    Issue 9:  Inverse-volatility position sizing
    Issue 11: Periodic rebalancing
    Issue 14: Trade logging with rationale
    Issue 15: Capital guards
    """

    def run(self, data: pd.DataFrame, top_n: int = 10, **kwargs):
        data = self.prepare_data(data)
        daily_returns = data.pct_change()

        capital = float(self.initial_capital)
        capital_history = pd.Series(index=data.index, dtype=float)
        capital_history.iloc[0] = capital

        for i in range(len(data.index) - 1):
            today    = data.index[i]
            tomorrow = data.index[i + 1]

            # Issue 15: Insufficient capital check
            if capital <= 0:
                self.logger.log_skip(today, f"Insufficient capital: ₹{capital:.2f}", capital)
                capital_history.loc[tomorrow] = max(capital, 0)
                continue

            # Issue 11: Skip non-rebalance days
            if not self.should_rebalance(i):
                self.logger.log_trade(today, "HOLD", [], "Not a rebalance day", capital, capital)
                capital_history.loc[tomorrow] = capital
                continue

            day_returns = daily_returns.iloc[i]
            losers = day_returns.nsmallest(top_n).index

            if not losers.empty:
                prices_today    = data.loc[today, losers]
                prices_tomorrow = data.loc[tomorrow, losers]

                valid    = prices_today > 0
                p_today  = prices_today[valid]
                p_tomorrow = prices_tomorrow[valid]

                if not p_today.empty:
                    # Issue 9: inverse-volatility weighting
                    vols = self.get_rolling_volatilities(data, i)
                    prices_dict = p_today.to_dict()
                    shares_dict = self.portfolio.allocate_with_limits(
                        list(p_today.index), prices_dict,
                        volatilities={s: vols.get(s, 0.01) for s in p_today.index}
                    )

                    # Calculate new capital
                    old_capital = capital
                    new_capital = 0.0
                    for sym in shares_dict:
                        if sym in p_tomorrow.index:
                            new_capital += shares_dict[sym] * p_tomorrow[sym]
                    if new_capital > 0:
                        capital = new_capital

                    # Issue 14: Log the trade with rationale
                    worst_return = float(day_returns[losers].min())
                    self.logger.log_trade(
                        today, "BUY", list(losers),
                        f"Mean reversion: buying {len(losers)} biggest losers (worst return: {worst_return:.2%})",
                        old_capital, capital,
                        indicator_values={"worst_daily_return": round(worst_return, 4)}
                    )

            capital_history.loc[tomorrow] = capital

        return capital_history.ffill()
