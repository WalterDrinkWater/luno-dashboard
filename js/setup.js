const Setup = {
  init() {
    const existingKey = Storage.getApiKey();
    const existingReferral = Storage.getReferralCode();

    if (existingKey) {
      document.getElementById('setup-key-id').value = existingKey.keyId || '';
      document.getElementById('setup-key-secret').value = existingKey.keySecret || '';
    }
    if (existingReferral) {
      document.getElementById('setup-referral').value = existingReferral;
    }
    this._updateStatus('', '');
    this._updateReferralLink();
  },

  toggleSecret() {
    const input = document.getElementById('setup-key-secret');
    const icon = document.getElementById('secret-toggle-icon');
    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = 'visibility';
    } else {
      input.type = 'password';
      icon.textContent = 'visibility_off';
    }
  },

  async testConnection() {
    const keyId = document.getElementById('setup-key-id').value.trim();
    const keySecret = document.getElementById('setup-key-secret').value.trim();

    if (!keyId || !keySecret) {
      this._updateStatus('Please enter both API Key ID and Secret.', 'error');
      return;
    }

    this._updateStatus('Testing connection...', 'loading');

    try {
      const auth = 'Basic ' + btoa(keyId + ':' + keySecret);
      const resp = await fetch(CONFIG.API_BASE_URL + '/api/1/balance', {
        headers: { Authorization: auth, Accept: 'application/json' },
      });

      if (resp.status === 401) {
        this._updateStatus('Connection failed: Invalid API key. Please check your credentials.', 'error');
        return;
      }
      if (!resp.ok) {
        this._updateStatus('Connection failed: API returned error ' + resp.status, 'error');
        return;
      }

      const data = await resp.json();
      const balances = data.balance || [];
      const assetList = balances.map((b) => b.asset).join(', ');
      this._updateStatus('Connected! Found ' + balances.length + ' account(s): ' + assetList, 'success');
    } catch (err) {
      this._updateStatus('Connection failed: ' + err.message, 'error');
    }
  },

  saveAndEnter() {
    const keyId = document.getElementById('setup-key-id').value.trim();
    const keySecret = document.getElementById('setup-key-secret').value.trim();
    const referral = document.getElementById('setup-referral').value.trim();

    if (!keyId || !keySecret) {
      this._updateStatus('Please enter both API Key ID and Secret before saving.', 'error');
      return;
    }

    Storage.saveApiKey(keyId, keySecret);
    if (referral) {
      Storage.saveReferralCode(referral);
    }

    this._updateStatus('Saved! Redirecting to dashboard...', 'success');
    setTimeout(() => Router.go(CONFIG.ROUTES.DASHBOARD), 500);
  },

  updateReferral() {
    const referral = document.getElementById('setup-referral').value.trim();
    Storage.saveReferralCode(referral);
    this._updateReferralLink();
  },

  _updateReferralLink() {
    const code = Storage.getReferralCode();
    const linkEl = document.getElementById('referral-link');
    const previewEl = document.getElementById('referral-preview');
    if (code && linkEl && previewEl) {
      previewEl.classList.remove('hidden');
      linkEl.textContent = 'https://www.luno.com/signup/' + encodeURIComponent(code);
    } else if (previewEl) {
      previewEl.classList.add('hidden');
    }
  },

  copyReferralLink() {
    const linkEl = document.getElementById('referral-link');
    if (!linkEl) return;
    navigator.clipboard.writeText(linkEl.textContent).then(() => {
      const btn = document.getElementById('copy-referral-btn');
      if (btn) {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      }
    }).catch(() => {
      alert('Failed to copy. Please copy manually.');
    });
  },

  _updateStatus(msg, type) {
    const el = document.getElementById('setup-status');
    if (!el) return;
    el.className = 'form-status';
    el.textContent = msg;
    if (type) {
      el.classList.add('form-status--' + type, 'show');
    }
  },
};
