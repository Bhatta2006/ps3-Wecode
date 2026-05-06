import pandas as pd
import numpy as np
from app.core.strategy_base import StrategyBase


class MACDTrendBacktester(StrategyBase):
    """
    MACD Trend Following Strategy.

    Logic: Buy assets where MACD > Signal line (confirmed uptrend).
    Issue 8:  Signal = MACD crossover (bullish when MACD > Signal)
    Issue 9:  Inverse-volatility position sizing
    Issue 11: Periodic rebalancing
    Issue 14: Trade logging with MACD/Signal values
    Issue 15: Capital guards
    """

    def run(self, data: pd.DataFrame, top_n: int = 10, fast_period: int = 12,
            slow_period: int = 26, signal_period: int = 9, **kwargs):
        data = self.prepare_data(data)

        fast_ema    = data.ewm(span=fast_period, adjust=False).mean()
        slow_ema    = data.ewm(span=slow_period, adjust=False).mean()
        macd_line   = fast_ema - slow_ema
        signal_line = macd_line.ewm(span=signal_period, adjust=False).mean()

        capital = float(self.initial_capital)
        capital_history = pd.Series(index=data.index, dtype=float)
        start_idx = slow_period
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

            day_macd   = macd_line.iloc[i]
            day_signal = signal_line.iloc[i]
            bullish    = day_macd > day_signal
            gap        = day_macd[bullish] - day_signal[bullish]
            winners    = gap.nlargest(top_n).index

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

                    max_gap = float(gap.max())
                    self.logger.log_trade(
                        today, "BUY", list(winners),
                        f"MACD bullish crossover: {len(winners)} assets (max gap: {max_gap:.4f})",
                        old_capital, capital,
                        indicator_values={"macd_gap": round(max_gap, 4), "bullish_count": int(bullish.sum())}
                    )
            else:
                self.logger.log_trade(today, "HOLD", [], "No MACD bullish crossovers detected", capital, capital)

            capital_history.loc[tomorrow] = capital

        return capital_history.ffill()
