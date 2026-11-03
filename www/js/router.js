/* ===== Manutenção OS — Hash Router ===== */

const Router = {
  currentRoute: null,
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

    this.currentRoute = hash;

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

  /** "Mais" page: grid of all routes */
  renderMais(view) {
    const maisRoutes = ['relatorios', 'vistorias', 'coleta', 'inventario', 'atendimentos', 'reparos', 'terceiros'];
    let html = '<div class="stat-grid">';
    maisRoutes.forEach(r => {
      const info = CONFIG.routes[r];
      if (!info) return;
      html += `
        <div class="stat-card" style="cursor:pointer" onclick="window.location.hash='${r}'">
          <div class="stat-card__icon">${info.icon}</div>
          <div class="stat-card__label">${info.title}</div>
        </div>`;
    });
    html += `
      <div class="stat-card" style="cursor:pointer" onclick="UI.openBackupModal()">
        <div class="stat-card__icon">💾</div>
        <div class="stat-card__label">Backup e Exportação</div>
      </div>
    `;
    html += '</div>';
    view.innerHTML = html;
  },

  /** Navigate to a route */
  go(route) {
    window.location.hash = route;
  },
};

window.Router = Router;
