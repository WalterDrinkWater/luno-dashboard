const Router = {
  _current: '',

  init() {
    window.addEventListener('hashchange', () => this._navigate());
    this._navigate();
  },

  go(route) {
    window.location.hash = route;
  },

  _navigate() {
    const hash = window.location.hash || CONFIG.ROUTES.DASHBOARD;

    if (!Storage.hasApiKey() && hash !== CONFIG.ROUTES.SETUP && hash !== CONFIG.ROUTES.TUTORIAL && hash !== CONFIG.ROUTES.ABOUT) {
      window.location.hash = CONFIG.ROUTES.SETUP;
      return;
    }

    if (Storage.hasApiKey() && hash === '') {
      window.location.hash = CONFIG.ROUTES.DASHBOARD;
      return;
    }

    this._current = hash;

    const pageSetup = document.getElementById('page-setup');
    const pageTutorial = document.getElementById('page-tutorial');
    const pageDashboard = document.getElementById('page-dashboard');
    const pageAbout = document.getElementById('page-about');

    [pageSetup, pageTutorial, pageDashboard, pageAbout].forEach((p) => {
      if (p) p.classList.add('hidden');
    });

    switch (hash) {
      case CONFIG.ROUTES.SETUP:
        if (pageSetup) {
          pageSetup.classList.remove('hidden');
          if (typeof Setup !== 'undefined') Setup.init();
        }
        break;
      case CONFIG.ROUTES.TUTORIAL:
        if (pageTutorial) {
          pageTutorial.classList.remove('hidden');
          if (typeof Tutorial !== 'undefined') Tutorial.init();
        }
        break;
      case CONFIG.ROUTES.ABOUT:
        if (pageAbout) {
          pageAbout.classList.remove('hidden');
          if (typeof About !== 'undefined') About.init();
        }
        break;
      case CONFIG.ROUTES.DASHBOARD:
      default:
        if (pageDashboard) {
          pageDashboard.classList.remove('hidden');
          if (typeof Dashboard !== 'undefined') Dashboard.init();
        }
        break;
    }
    document.body.dataset.page = hash.replace('#/', '') || 'dashboard';
  },

  current() {
    return this._current || window.location.hash || CONFIG.ROUTES.DASHBOARD;
  },
};
