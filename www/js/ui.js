/* ===== Manutenção OS — UI Utilities ===== */

const UI = {

  /** Toggle sidebar drawer (mobile) */
  toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('overlay');
    sb.classList.toggle('open');
    ov.classList.toggle('show');
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
  },

  /** Show a toast notification */
  toast(message, type = '') {
    let el = document.querySelector('.toast');
    if (el) el.remove();
    el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast--' + type : '');
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 2500);
  },

  /** Show a bottom-sheet modal */
  showModal(title, bodyHTML, footerHTML = '') {
    this.closeModal(true);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <div class="modal__header-left">
            <button class="modal__back" onclick="UI.closeModal()" title="Voltar">⬅ Voltar</button>
            <h3>${title}</h3>
          </div>
          <button class="modal__close" onclick="UI.closeModal()">✕</button>
        </div>
        <div class="modal__body">${bodyHTML}</div>
        ${footerHTML ? `<div class="modal__footer">${footerHTML}</div>` : ''}
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    // Close on overlay click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) this.closeModal();
    });
  },

  closeModal(immediate = false) {
    const el = document.getElementById('modal-overlay');
    if (el) {
      if (immediate) {
        el.remove();
      } else {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 250);
      }
    }
  },

  /** Confirm dialog (returns via callback) */
  confirm(message, onConfirm) {
    this.showModal('Confirmação', `<p style="font-size:.9rem;padding:var(--space-md) 0">${message}</p>`,
      `<button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Cancelar</button>
       <button class="btn btn--danger" style="flex:1" onclick="UI.closeModal();(${onConfirm})();">Confirmar</button>`);
  },

  /** Format date for display */
  formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  },

  formatDateShort(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
  },

  /** Get status badge HTML */
  statusBadge(status) {
    const opt = CONFIG.statusOptions[status];
    if (!opt) return `<span class="badge badge--status">${status}</span>`;
    return `<span class="badge ${opt.class}">${opt.label}</span>`;
  },

  /** Escape HTML */
  esc(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  /** Render empty state */
  emptyState(icon, text) {
    return `<div class="empty-state"><div class="empty-state__icon">${icon}</div><p class="empty-state__text">${text}</p></div>`;
  },

  /** Render a FAB button */
  fab(icon, onclick) {
    return `<button class="btn btn--fab" onclick="${onclick}">${icon}</button>`;
  },

  /** Bind sidebar toggle, back buttons, theme toggle and overlay */
  bindGlobal() {
    this.initTheme();
    document.getElementById('menu-btn').addEventListener('click', () => this.toggleSidebar());
    document.getElementById('overlay').addEventListener('click', () => this.closeSidebar());
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => Router.back());
    }
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }
    document.getElementById('sync-btn').addEventListener('click', () => {
      this.openBackupModal();
    });

    // Suporte ao botão físico/gesto de Voltar no Android (Capacitor)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.addListener('backButton', () => {
        const modal = document.getElementById('modal-overlay');
        const sidebar = document.getElementById('sidebar');
        if (modal) {
          this.closeModal();
        } else if (sidebar && sidebar.classList.contains('open')) {
          this.closeSidebar();
        } else if (Router.currentRoute && Router.currentRoute !== 'dashboard') {
          Router.back();
        } else {
          window.Capacitor.Plugins.App.exitApp();
        }
      });
    }
  },

  /** Modal de Backup, Restauração, Exportação e PDF */
  openBackupModal() {
    const body = `
      <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        <p class="text-sm text-muted">Gere relatórios em PDF com fotos em miniatura, exporte planilhas CSV ou faça backup dos dados.</p>
        <div class="form-group" style="margin-bottom:0;background:var(--surface-alt);padding:var(--space-sm);border-radius:var(--radius-sm)">
          <label class="form-label">📄 Gerar Relatório em PDF (com Fotos em Miniatura)</label>
          <div style="display:flex;gap:var(--space-xs)">
            <select class="form-select" id="export-pdf-collection" style="flex:1">
              <option value="atividades">Atividades</option>
              <option value="rotinas_execucoes">Execuções de Rotinas</option>
              <option value="relatorios">Relatórios</option>
              <option value="vistorias">Vistorias</option>
              <option value="atendimentos">Atendimentos</option>
              <option value="reparos">Reparos</option>
              <option value="inventario">Inventário</option>
              <option value="coletas">Coleta de Dados</option>
              <option value="terceiros">Terceiros</option>
            </select>
            <button class="btn btn--primary" onclick="ExportHelper.gerarPDFColecao(document.getElementById('export-pdf-collection').value)">
              📄 Gerar PDF
            </button>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:0;background:var(--surface-alt);padding:var(--space-sm);border-radius:var(--radius-sm)">
          <label class="form-label">📊 Exportar Módulo para Excel (CSV)</label>
          <div style="display:flex;gap:var(--space-xs)">
            <select class="form-select" id="export-csv-collection" style="flex:1">
              <option value="atividades">Atividades</option>
              <option value="rotinas_execucoes">Execuções de Rotinas</option>
              <option value="relatorios">Relatórios</option>
              <option value="vistorias">Vistorias</option>
              <option value="atendimentos">Atendimentos</option>
              <option value="reparos">Reparos</option>
              <option value="inventario">Inventário</option>
              <option value="coletas">Coleta de Dados</option>
              <option value="terceiros">Terceiros</option>
            </select>
            <button class="btn btn--secondary" onclick="ExportHelper.exportarCSV(document.getElementById('export-csv-collection').value)">
              CSV
            </button>
          </div>
        </div>
        <div style="display:flex;gap:var(--space-xs);margin-top:var(--space-xs)">
          <button class="btn btn--secondary" style="flex:1" onclick="ExportHelper.exportarBackupJSON()">
            💾 Baixar Backup
          </button>
          <button class="btn btn--secondary" style="flex:1" onclick="ExportHelper.importarBackupJSON()">
            📂 Restaurar Backup
          </button>
        </div>
      </div>
    `;
    const footer = `<button class="btn btn--secondary btn--full" onclick="UI.closeModal()">Fechar</button>`;
    this.showModal('📄 PDF, Backup & Exportação', body, footer);
  },

  initTheme() {
    const saved = localStorage.getItem('manutencao_os_theme') || 'light';
    this._applyTheme(saved);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('manutencao_os_theme', next);
    this._applyTheme(next);
    this.toast(next === 'dark' ? 'Modo escuro ativado 🌙' : 'Modo claro ativado ☀️');
  },

  _applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#0f172a' : '#2563eb');
  },
};

window.UI = UI;
