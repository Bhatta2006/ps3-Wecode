import { meanReversionStrategy } from "./meanReversion";
import { scalpingStrategy } from "./scalping";
import { momentumStrategy } from "./momentum";
import { rsiStrategy } from "./rsi";
import { macdStrategy } from "./macd";

export const strategies = {
  "mean-reversion": meanReversionStrategy,
  scalping: scalpingStrategy,
  momentum: momentumStrategy,
  rsi: rsiStrategy,
  macd: macdStrategy,
};
