/* ===== Module: Relatórios ===== */

const Relatorios = {
  render() {
    let html = `
      <div class="tabs" id="rel-tabs">
        <span class="tab active" data-filter="all">Todos</span>
        <span class="tab" data-filter="Mensal">Mensais</span>
        <span class="tab" data-filter="Semanal">Semais</span>
      </div>
      <div id="rel-list"></div>
      ${UI.fab('➕', 'Relatorios.openForm()')}
    `;
    return html;
  },

  init() {
    this.renderList('all');
    document.querySelectorAll('#rel-tabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('#rel-tabs .tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        this.renderList(t.dataset.filter);
      });
    });
  },

  renderList(filter) {
    const list = Store.getAll('relatorios');
    const filtered = filter === 'all' ? list : list.filter(r => r.tipo === filter);
    const container = document.getElementById('rel-list');
    if (filtered.length === 0) {
      container.innerHTML = UI.emptyState('📄', 'Nenhum relatório encontrado');
      return;
    }
    container.innerHTML = filtered.map(r => `
      <div class="card-os" onclick="Relatorios.openDetail('${r.id}')">
        <div class="card-os__header">
          <span class="badge">${UI.esc(r.tipo)}</span>
          ${UI.statusBadge(r.status)}
        </div>
        <h3 class="card-os__title">${UI.esc(r.titulo)}</h3>
        <div class="card-os__meta"><span>📅 ${UI.esc(r.periodo)}</span><span>🕐 ${UI.formatDateShort(r.data)}</span></div>
      </div>
    `).join('');
  },

  openDetail(id) {
    const r = Store.getById('relatorios', id);
    if (!r) return;
    const body = `
      <div class="form-group"><label class="form-label">Tipo</label><p>${UI.esc(r.tipo)}</p></div>
      <div class="form-group"><label class="form-label">Título</label><p>${UI.esc(r.titulo)}</p></div>
      <div class="form-group"><label class="form-label">Período</label><p>${UI.esc(r.periodo)}</p></div>
      <div class="form-group"><label class="form-label">Status</label>${UI.statusBadge(r.status)}</div>
      <div class="form-group"><label class="form-label">Data</label><p>${UI.formatDate(r.data)}</p></div>
    `;
    const footer = `
      <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Fechar</button>
      <button class="btn btn--primary" onclick="UI.closeModal();Relatorios.openForm('${r.id}')">Editar</button>
      <button class="btn btn--danger" onclick="UI.closeModal();Relatorios.remove('${r.id}')">🗑</button>
    `;
    UI.showModal(r.titulo, body, footer);
  },

  openForm(id) {
    const r = id ? Store.getById('relatorios', id) : null;
    const body = `
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select class="form-select" id="form-tipo">
          <option ${r && r.tipo === 'Mensal' ? 'selected' : ''}>Mensal</option>
          <option ${r && r.tipo === 'Semanal' ? 'selected' : ''}>Semanal</option>
          <option ${r && r.tipo === 'Diário' ? 'selected' : ''}>Diário</option>
          <option ${r && r.tipo === 'Trimestral' ? 'selected' : ''}>Trimestral</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Título</label>
        <input class="form-input" id="form-titulo" value="${r ? UI.esc(r.titulo) : ''}" placeholder="Título do relatório">
      </div>
      <div class="form-group">
        <label class="form-label">Período</label>
        <input class="form-input" id="form-periodo" value="${r ? UI.esc(r.periodo) : ''}" placeholder="Ex: Out/2024">
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="form-status">
          <option value="pendente" ${r && r.status === 'pendente' ? 'selected' : ''}>Pendente</option>
          <option value="em_andamento" ${r && r.status === 'em_andamento' ? 'selected' : ''}>Em andamento</option>
          <option value="concluido" ${r && r.status === 'concluido' ? 'selected' : ''}>Concluído</option>
        </select>
      </div>
    `;
    const footer = `
      <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn--primary" style="flex:1" onclick="Relatorios.save('${id || ''}')">Salvar</button>
    `;
    UI.showModal(id ? 'Editar Relatório' : 'Novo Relatório', body, footer);
  },

  save(id) {
    const data = {
      tipo: document.getElementById('form-tipo').value,
      titulo: document.getElementById('form-titulo').value.trim(),
      periodo: document.getElementById('form-periodo').value.trim(),
      status: document.getElementById('form-status').value,
    };
    if (!data.titulo) { UI.toast('Informe o título', 'error'); return; }
    if (id) {
      Store.update('relatorios', id, data);
      UI.toast('Relatório atualizado', 'success');
    } else {
      Store.create('relatorios', data);
      UI.toast('Relatório criado', 'success');
    }
    UI.closeModal();
    const active = document.querySelector('#rel-tabs .tab.active');
    this.renderList(active ? active.dataset.filter : 'all');
  },

  remove(id) {
    Store.delete('relatorios', id);
    UI.toast('Relatório removido', 'success');
    const active = document.querySelector('#rel-tabs .tab.active');
    this.renderList(active ? active.dataset.filter : 'all');
  },
};

window.Relatorios = Relatorios;
