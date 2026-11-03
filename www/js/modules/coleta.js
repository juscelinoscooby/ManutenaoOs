/* ===== Module: Coleta de Dados ===== */

const Coleta = {
  render() {
    let html = `
      <div class="search-bar">
        <input type="text" id="coleta-search" placeholder="Buscar leitura...">
      </div>
      <div id="coleta-list"></div>
      ${UI.fab('➕', 'Coleta.openForm()')}
    `;
    return html;
  },

  init() {
    this.renderList('');
    document.getElementById('coleta-search').addEventListener('input', e => {
      this.renderList(e.target.value);
    });
  },

  renderList(filter) {
    const list = Store.getAll('coletas');
    const filtered = list.filter(c =>
      !filter ||
      c.equipamento.toLowerCase().includes(filter.toLowerCase()) ||
      c.parametro.toLowerCase().includes(filter.toLowerCase())
    );
    const container = document.getElementById('coleta-list');
    if (filtered.length === 0) {
      container.innerHTML = UI.emptyState('📡', 'Nenhuma coleta encontrada');
      return;
    }
    container.innerHTML = filtered.map(c => `
      <div class="card-os" onclick="Coleta.openDetail('${c.id}')">
        <div class="card-os__header">
          <span class="badge badge--info">${UI.esc(c.parametro)}</span>
          <strong style="font-size:1.1rem">${UI.esc(c.valor)}</strong>
        </div>
        <h3 class="card-os__title">${UI.esc(c.equipamento)}</h3>
        ${CameraHelper.htmlCardThumbs(c)}
        <div class="card-os__meta"><span>🕐 ${UI.formatDateShort(c.data)}</span></div>
      </div>
    `).join('');
  },

  openDetail(id) {
    const c = Store.getById('coletas', id);
    if (!c) return;
    const body = `
      <div class="form-group"><label class="form-label">Equipamento</label><p>${UI.esc(c.equipamento)}</p></div>
      <div class="form-group"><label class="form-label">Parâmetro</label><p>${UI.esc(c.parametro)}</p></div>
      <div class="form-group"><label class="form-label">Valor Medido</label><p style="font-size:1.2rem;font-weight:700">${UI.esc(c.valor)}</p></div>
      <div class="form-group"><label class="form-label">Data</label><p>${UI.formatDate(c.data)}</p></div>
      ${CameraHelper.htmlDetailThumbs('coletas', c.id)}
    `;
    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        ${CameraHelper.botaoFotos('coletas', c.id)}
        <div style="display:flex;gap:var(--space-xs)">
          <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Fechar</button>
          <button class="btn btn--primary" style="flex:1" onclick="UI.closeModal();Coleta.openForm('${c.id}')">Editar</button>
          <button class="btn btn--danger" onclick="UI.closeModal();Coleta.remove('${c.id}')">🗑</button>
        </div>
      </div>
    `;
    UI.showModal(c.equipamento, body, footer);
  },

  openForm(id) {
    const c = id ? Store.getById('coletas', id) : null;
    const body = `
      <div class="form-group">
        <label class="form-label">Equipamento</label>
        <input class="form-input" id="form-equipamento" value="${c ? UI.esc(c.equipamento) : ''}" placeholder="Ex: Motor 01">
      </div>
      <div class="form-group">
        <label class="form-label">Parâmetro</label>
        <input class="form-input" id="form-parametro" value="${c ? UI.esc(c.parametro) : ''}" placeholder="Ex: Temperatura / Vibração">
      </div>
      <div class="form-group">
        <label class="form-label">Valor Medido</label>
        <input class="form-input" id="form-valor" value="${c ? UI.esc(c.valor) : ''}" placeholder="Ex: 42°C / 8 bar">
      </div>
      ${CameraHelper.htmlFormFotos('coletas', id)}
    `;
    const footer = `
      <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn--primary" style="flex:1" onclick="Coleta.save('${id || ''}')">Salvar</button>
    `;
    UI.showModal(id ? 'Editar Coleta' : 'Nova Coleta', body, footer);
  },

  save(id) {
    const data = {
      equipamento: document.getElementById('form-equipamento').value.trim(),
      parametro: document.getElementById('form-parametro').value.trim(),
      valor: document.getElementById('form-valor').value.trim(),
    };
    if (!data.equipamento || !data.valor) { UI.toast('Preencha os campos obrigatórios', 'error'); return; }
    if (id) {
      Store.update('coletas', id, data);
      UI.toast('Coleta atualizada', 'success');
    } else {
      Store.create('coletas', data);
      UI.toast('Coleta registrada', 'success');
    }
    UI.closeModal();
    this.renderList(document.getElementById('coleta-search')?.value || '');
  },

  remove(id) {
    Store.delete('coletas', id);
    UI.toast('Coleta removida', 'success');
    this.renderList(document.getElementById('coleta-search')?.value || '');
  },
};

window.Coleta = Coleta;
