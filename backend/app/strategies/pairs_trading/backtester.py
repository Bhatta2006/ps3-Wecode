import pandas as pd
import numpy as np
from app.core.strategy_base import StrategyBase


class PairsTradingBacktester(StrategyBase):
    """
    Pairs Trading Strategy — Statistical Arbitrage.
    Issue 8:  Signal = Z-score of spread between correlated pairs
    Issue 11: Periodic rebalancing (implicit via z-score exit/entry)
    Issue 14: Trade logging with z-score values
    Issue 15: Capital guards
    """

    def run(self, data: pd.DataFrame, z_entry: float = 2.0, z_exit: float = 0.5,
            spread_window: int = 20, **kwargs):
        data = self.prepare_data(data)

        # Use first N columns as pair candidates (dynamic for any universe)
        cols = list(data.columns)
        pairs = []
        for j in range(0, len(cols) - 1, 2):
            pairs.append((cols[j], cols[min(j + 1, len(cols) - 1)]))
        if not pairs:
            pairs = [(cols[0], cols[0])]

        daily_returns = data.pct_change()
        pair_returns = {}

        for sym_a, sym_b in pairs:
            if sym_a not in data.columns or sym_b not in data.columns or sym_a == sym_b:
                pair_returns[f"{sym_a}_{sym_b}"] = pd.Series(0.0, index=data.index)
                continue

            price_a = data[sym_a]
            price_b = data[sym_b]
            ret_a   = daily_returns[sym_a]
            ret_b   = daily_returns[sym_b]

            spread      = np.log(price_a.clip(lower=0.01)) - np.log(price_b.clip(lower=0.01))
            spread_mean = spread.rolling(window=spread_window).mean()
            spread_std  = spread.rolling(window=spread_window).std()
            z_score     = (spread - spread_mean) / spread_std.replace(0, np.nan)

            position = pd.Series(np.nan, index=data.index)
            position[z_score < -z_entry] = 1.0
            position[z_score > z_entry]  = -1.0
            position[(z_score > -z_exit) & (z_score < z_exit)] = 0.0
            position = position.ffill().fillna(0.0).shift(1).fillna(0.0)

            pnl = position * (0.5 * ret_a - 0.5 * ret_b)
            pair_returns[f"{sym_a}_{sym_b}"] = pnl.fillna(0.0)

            # Issue 14: Log significant z-score events throughout the period
            for idx in range(spread_window, len(data)):
                date = data.index[idx]
                z = z_score.iloc[idx]
                pos = position.iloc[idx]
                if not np.isnan(z) and abs(z) > z_entry:
                    action = "LONG_SPREAD" if z < -z_entry else "SHORT_SPREAD"
                    self.logger.log_trade(
                        date, action, [sym_a, sym_b],
                        f"Pairs z-score = {z:.2f} ({'spread too low' if z < 0 else 'spread too high'})",
                        float(self.initial_capital), float(self.initial_capital),
                        indicator_values={"z_score": round(float(z), 4), "position": float(pos)}
                    )
                elif idx % 20 == 0:  # Log status every 20 days even when no signal
                    if not np.isnan(z):
                        self.logger.log_trade(
                            date, "HOLD", [sym_a, sym_b],
                            f"Pairs spread normal: z-score = {z:.2f} (within ±{z_entry})",
                            float(self.initial_capital), float(self.initial_capital),
                            indicator_values={"z_score": round(float(z), 4)}
                        )

        portfolio_daily_returns = pd.DataFrame(pair_returns).mean(axis=1)

        # Issue 15: Guard against capital going negative
        cumulative = (1 + portfolio_daily_returns).cumprod()

        cumulative = cumulative.clip(lower=0)
        capital_history = float(self.initial_capital) * cumulative

        return capital_history
