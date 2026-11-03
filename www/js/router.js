/* ===== Manutenção OS — Hash Router ===== */

const Router = {
  currentRoute: null,
  routeHistory: [],
  _isGoingBack: false,
  modules: {},

  /** Register a module for a route */
  register(routeName, module) {
    this.modules[routeName] = module;
  },

  /** Start listening to hash changes */
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  /** Parse current hash and render the matching module */
  handleRoute() {
    let hash = window.location.hash.replace('#', '') || 'dashboard';
    const routeInfo = CONFIG.routes[hash];

    // If unknown route, default to dashboard
    if (!routeInfo) {
      hash = 'dashboard';
      window.location.hash = 'dashboard';
      return;
    }

    if (this.currentRoute && this.currentRoute !== hash && !this._isGoingBack) {
      this.routeHistory.push(this.currentRoute);
      if (this.routeHistory.length > 20) this.routeHistory.shift();
    }
    this._isGoingBack = false;
    this.currentRoute = hash;

    // Show/hide topbar back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.classList.toggle('hidden', hash === 'dashboard');
    }

    // Update topbar title
    document.getElementById('page-title').textContent = routeInfo.title;
    document.getElementById('page-subtitle').textContent = routeInfo.subtitle;

    // Update nav items (sidebar)
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === hash);
    });

    // Update bottom nav
    document.querySelectorAll('.bottom-nav__item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === hash);
    });

    // Close sidebar on navigation (mobile)
    UI.closeSidebar();

    // Render the module
    const module = this.modules[hash];
    const view = document.getElementById('view-dashboard');
    if (module && typeof module.render === 'function') {
      view.innerHTML = module.render();
      if (typeof module.init === 'function') {
        module.init();
      }
    } else if (hash === 'mais') {
      // "Mais" page: list all modules not in bottom nav
      this.renderMais(view);
    } else {
      view.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🚧</div><p class="empty-state__text">Módulo em construção</p></div>`;
    }
  },

  /** "Mais" page: list of all additional modules and actions */
  renderMais(view) {
    const maisRoutes = [
      { key: 'relatorios',   bg: 'rgba(99, 102, 241, 0.15)' },
      { key: 'vistorias',    bg: 'rgba(139, 92, 246, 0.15)' },
      { key: 'coleta',       bg: 'rgba(6, 182, 212, 0.15)' },
      { key: 'inventario',   bg: 'rgba(14, 165, 233, 0.15)' },
      { key: 'atendimentos', bg: 'rgba(245, 158, 11, 0.16)' },
      { key: 'reparos',      bg: 'rgba(239, 68, 68, 0.14)' },
      { key: 'terceiros',    bg: 'rgba(20, 184, 166, 0.15)' },
    ];
    let html = '<div class="mais-grid">';
    maisRoutes.forEach(item => {
      const info = CONFIG.routes[item.key];
      if (!info) return;
      html += `
        <div class="mais-card" onclick="window.location.hash='${item.key}'">
          <div class="mais-card__icon" style="background:${item.bg}">${info.icon}</div>
          <div class="mais-card__info">
            <div class="mais-card__title">${info.title}</div>
            <div class="mais-card__sub">${info.subtitle}</div>
          </div>
          <span class="mais-card__arrow">›</span>
        </div>`;
    });
    html += `
      <div class="mais-card" onclick="UI.openBackupModal()">
        <div class="mais-card__icon" style="background:rgba(37, 99, 235, 0.15)">📄</div>
        <div class="mais-card__info">
          <div class="mais-card__title">PDF, Backup & Exportação CSV</div>
          <div class="mais-card__sub">Gerar relatórios PDF com fotos em miniatura e cópias de segurança</div>
        </div>
        <span class="mais-card__arrow">›</span>
      </div>
    `;
    html += '</div>';
    view.innerHTML = html;
  },

  /** Navigate to a route */
  go(route) {
    window.location.hash = route;
  },

  /** Navigate back to previous route or dashboard */
  back() {
    if (this.routeHistory.length > 0) {
      const prev = this.routeHistory.pop();
      this._isGoingBack = true;
      window.location.hash = prev;
    } else if (this.currentRoute !== 'dashboard') {
      this._isGoingBack = true;
      window.location.hash = 'dashboard';
    }
  },
};

window.Router = Router;
