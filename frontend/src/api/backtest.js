import axios from 'axios';

const BASE_URL = 'http://localhost:8001';

// Helper to get the token from localStorage
const getToken = () => localStorage.getItem('tl_token');

// Helper to build auth headers. Will be undefined if not logged in.
const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  listStrategies: () => axios.get(`${BASE_URL}/strategies`).then(r => r.data),

  runBacktest: ({ strategyId, universe = 'EQUITY', start = '2022-01-01', end = '2024-01-01', initialCapital = 100000, macroFilter = false }) =>
    axios.get(`${BASE_URL}/run`, {
      params: {
        strategy_id:     strategyId,
        universe,
        start,
        end,
        initial_capital: initialCapital,
        macro_filter:    macroFilter,
      },
      // Attach token if user is logged in — backend will auto-save the result to DB
      headers: authHeaders(),
    }).then(r => r.data),

  getOHLC: (symbol, start, end) =>
    axios.get(`${BASE_URL}/data/ohlcv`, {
      params: { symbol, start, end }
    }).then(r => r.data),

  // ── Auth ──────────────────────────────────────────────
  signup: ({ email, password, firstName }) =>
    axios.post(`${BASE_URL}/auth/signup`, {
      email,
      password,
      first_name: firstName,
    }).then(r => r.data),

  login: ({ email, password }) =>
    axios.post(`${BASE_URL}/auth/login`, null, {
      params: { email, password },
    }).then(r => r.data),

  // ── History ──────────────────────────────────────────
  getHistory: () =>
    axios.get(`${BASE_URL}/history`, {
      headers: authHeaders(),
    }).then(r => r.data),
};
