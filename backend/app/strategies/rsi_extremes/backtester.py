import pandas as pd
import numpy as np
from app.core.strategy_base import StrategyBase


class RSIExtremesBacktester(StrategyBase):
    """
    RSI Extremes Strategy — Mean Reversion via Oscillator.
    Issue 8:  Signal = RSI < 30 (oversold → buy expecting bounce)
    Issue 9:  Inverse-volatility position sizing
    Issue 11: Periodic rebalancing
    Issue 14: Trade logging with RSI values
    Issue 15: Capital guards
    """

    def run(self, data: pd.DataFrame, rsi_period: int = 14, oversold: float = 30.0, **kwargs):
        data = self.prepare_data(data)

        delta    = data.diff()
        gain     = delta.clip(lower=0)
        loss     = -delta.clip(upper=0)
        avg_gain = gain.ewm(com=rsi_period - 1, min_periods=rsi_period).mean()
        avg_loss = loss.ewm(com=rsi_period - 1, min_periods=rsi_period).mean()
        rs       = avg_gain / avg_loss.replace(0, np.nan)
        rsi_df   = 100 - (100 / (1 + rs))

        capital = float(self.initial_capital)
        capital_history = pd.Series(index=data.index, dtype=float)
        start_idx = rsi_period
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

            rsi_today = rsi_df.iloc[i]
            selected  = rsi_today[rsi_today < oversold].index

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

                    min_rsi = float(rsi_today[selected].min())
                    self.logger.log_trade(
                        today, "BUY", list(selected),
                        f"RSI oversold: {len(selected)} assets below RSI {oversold} (lowest: {min_rsi:.1f})",
                        old_capital, capital,
                        indicator_values={"min_rsi": round(min_rsi, 2), "oversold_count": len(selected)}
                    )
            else:
                self.logger.log_trade(today, "HOLD", [], "No oversold assets (RSI > 30 for all)", capital, capital)

            capital_history.loc[tomorrow] = capital

        return capital_history.ffill()
