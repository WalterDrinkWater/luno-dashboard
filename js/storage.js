const Storage = {
  getApiKey() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveApiKey(keyId, keySecret) {
    localStorage.setItem(
      CONFIG.STORAGE_KEYS.API_KEY,
      JSON.stringify({ keyId, keySecret, savedAt: Date.now() })
    );
  },

  clearApiKey() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.API_KEY);
  },

  hasApiKey() {
    const key = this.getApiKey();
    return !!(key && key.keyId && key.keySecret);
  },

  getReferralCode() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.REFERRAL_CODE) || '';
  },

  saveReferralCode(code) {
    if (code) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.REFERRAL_CODE, code);
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.REFERRAL_CODE);
    }
  },

  getAssetVisibility() {
    try {
      return JSON.parse(localStorage.getItem('luno_asset_visibility')) || {};
    } catch {
      return {};
    }
  },

  saveAssetVisibility(asset, visible) {
    const map = this.getAssetVisibility();
    map[asset] = visible;
    localStorage.setItem('luno_asset_visibility', JSON.stringify(map));
  },

  saveBulkAssetVisibility(visMap) {
    localStorage.setItem('luno_asset_visibility', JSON.stringify(visMap));
  },
};
