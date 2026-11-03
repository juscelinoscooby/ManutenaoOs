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
    this.closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h3>${title}</h3>
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

  closeModal() {
    const el = document.getElementById('modal-overlay');
    if (el) {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 250);
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

  /** Bind sidebar toggle and overlay */
  bindGlobal() {
    document.getElementById('menu-btn').addEventListener('click', () => this.toggleSidebar());
    document.getElementById('overlay').addEventListener('click', () => this.closeSidebar());
    document.getElementById('sync-btn').addEventListener('click', () => {
      this.toast('Dados sincronizados', 'success');
    });
  },
};

window.UI = UI;
