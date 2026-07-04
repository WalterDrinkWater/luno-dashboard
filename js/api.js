const API = {
  _authHeader() {
    const key = Storage.getApiKey();
    if (!key) throw new Error('API key not configured');
    return 'Basic ' + btoa(key.keyId + ':' + key.keySecret);
  },

  async _get(endpoint, requiresAuth = true) {
    const headers = { Accept: 'application/json' };
    if (requiresAuth) {
      headers.Authorization = this._authHeader();
    }
    const resp = await fetch(CONFIG.API_BASE_URL + endpoint, { headers });
    if (resp.status === 401) throw new Error('Invalid or expired API key');
    if (resp.status === 429) throw new Error('Rate limited. Please wait a moment.');
    if (!resp.ok) throw new Error(`API error (${resp.status})`);
    return resp.json();
  },

  async fetchBalance() {
    return this._get('/api/1/balance');
  },

  async fetchTickers() {
    return this._get('/api/1/tickers', false);
  },

  async fetchTrades(pair) {
    const allTrades = [];
    let since = 0;
    let hasMore = true;

    while (hasMore) {
      const data = await this._get(
        `/api/1/listtrades?pair=${encodeURIComponent(pair)}&since=${since}&limit=100`
      );
      const trades = data.trades || [];
      allTrades.push(...trades);
      if (trades.length < 100) {
        hasMore = false;
      } else {
        since = trades[trades.length - 1].timestamp + 1;
      }
    }

    return allTrades;
  },
};
