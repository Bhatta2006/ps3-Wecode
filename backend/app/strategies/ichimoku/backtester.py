import pandas as pd
import numpy as np
from app.core.strategy_base import StrategyBase


class IchimokuBacktester(StrategyBase):
    """
    Ichimoku Kinko Hyo Strategy — Multi-Dimensional Trend.
    Issue 8:  Signal = Tenkan > Kijun AND price > Kumo cloud
    Issue 9:  Inverse-volatility position sizing
    Issue 11: Periodic rebalancing
    Issue 14: Trade logging with cloud strength
    Issue 15: Capital guards
    """

    def run(self, data: pd.DataFrame, top_n: int = 10, **kwargs):
        data = self.prepare_data(data)

        tenkan   = (data.rolling(9).max() + data.rolling(9).min()) / 2
        kijun    = (data.rolling(26).max() + data.rolling(26).min()) / 2
        senkou_a = ((tenkan + kijun) / 2).shift(26)
        senkou_b = ((data.rolling(52).max() + data.rolling(52).min()) / 2).shift(26)

        is_bullish = (tenkan > kijun) & (data > senkou_a) & (data > senkou_b)
        crossover_strength = tenkan - kijun

        capital = float(self.initial_capital)
        capital_history = pd.Series(index=data.index, dtype=float)
        start_idx = 78
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

            bullish_today  = is_bullish.iloc[i]
            strength_today = crossover_strength.iloc[i]
            eligible = strength_today[bullish_today].nlargest(top_n).index

            if not eligible.empty:
                prices_today    = data.loc[today, eligible]
                prices_tomorrow = data.loc[tomorrow, eligible]
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

                    max_strength = float(strength_today[eligible].max())
                    self.logger.log_trade(
                        today, "BUY", list(eligible),
                        f"Ichimoku bullish: {len(eligible)} above cloud (max TK-KJ gap: {max_strength:.2f})",
                        old_capital, capital,
                        indicator_values={"crossover_strength": round(max_strength, 4), "bullish_count": int(bullish_today.sum())}
                    )
            else:
                self.logger.log_trade(today, "HOLD", [], "No Ichimoku bullish confirmations", capital, capital)

            capital_history.loc[tomorrow] = capital

        return capital_history.ffill()
