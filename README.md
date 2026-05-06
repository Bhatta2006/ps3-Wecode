# Hedge Fund Risk Modeling & Semi-Automated Trading System

## Team Information
- **Team Name**: WeCode
- **Year**: 2nd Year
- **All-Female Team**: No

## Architecture Overview

TradeLab is a full-stack hedge fund backtesting platform built with a **FastAPI + Python** backend and **React + Vite** frontend. Raw CSV datasets (equity, oil, multi-asset, macro) are ingested through a validated pipeline that detects schema errors (Issue 16), imputes missing data without forward-looking bias (Issue 2), and engineers rolling volatility/momentum features (Issue 3). Macroeconomic indicators are aligned and scored via a 4-signal regime filter that gates capital deployment (Issue 4).

Ten distinct strategy backtesters inherit from a shared `StrategyBase` that provides: `PortfolioState` for real-time cash/position tracking with 25% concentration limits (Issue 5), inverse-volatility position sizing (Issue 9), periodic rebalancing (Issue 11), and `TradeLogger` for explainable audit trails (Issue 14). Capital guards prevent negative-balance trades (Issue 15). Transaction costs compound daily as realistic friction (Issue 10).

Post-execution, the system computes Sharpe Ratio (Issue 12), VaR at 95%/99% (Issue 6), Max Drawdown with rolling risk timeseries (Issue 7), and Alpha/Beta versus a buy-and-hold benchmark (Issue 13). The signal engine (Issue 8) drives all trade decisions. The React dashboard visualizes equity curves, metrics, portfolio state, and trade logs (Issue 18). Execution time is tracked for scalability (Issue 17). Architecture is documented end-to-end (Issue 19), and a 9-scenario edge-case test suite validates stability under extreme conditions (Issue 20).

**Note:** Please do not change the format or spelling of anything in this README. The fields are extracted using a script, so any changes to the structure or formatting may break the extraction process.
