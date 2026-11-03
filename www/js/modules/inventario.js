/* ===== Module: Inventario ===== */

const Inventario = {
  render() {
    let html = '<div class="search-bar"><input type="text" id="inv-search" placeholder="Buscar inventário..."></div>';
    html += '<div id="inv-list"></div>';
    if (UI && UI.fab) html += UI.fab('➕', 'Inventario.openForm()');
    return html;
  },

  init() {
    this.renderList('');
    const input = document.getElementById('inv-search');
    if (input) input.addEventListener('input', e => this.renderList(e.target.value));
  },

  renderList(filter) {
    const list = Store.getAll('inventario');
    const container = document.getElementById('inv-list');
    if (!container) return;

    const filtered = filter ? list.filter(i => 
      i.descricao && i.descricao.toLowerCase().includes(filter.toLowerCase()) ||
      (i.itens || []).some(item => 
        item.nome && item.nome.toLowerCase().includes(filter.toLowerCase()) ||
        item.local && item.local.toLowerCase().includes(filter.toLowerCase())
      )
    ) : list;

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📦</div><p class="empty-state__text">Nenhum inventário encontrado</p></div>';
      return;
    }

    container.innerHTML = filtered.map(i => {
      const totalItens = i.itens ? i.itens.length : 0;
      return '<div class="card-os" onclick="Inventario.openDetail(\'' + i.id + '\')">' +
        '<div class="card-os__header">' +
        '<span class="badge badge--info">' + totalItens + ' itens</span>' +
        '<span>🕐 ' + (i.data ? UI.formatDateShort(i.data) : '') + '</span>' +
        '</div>' +
        '<h3 class="card-os__title">📦 ' + UI.esc(i.descricao || '') + '</h3>' +
        '</div>';
    }).join('');
  },

  openDetail(id) {
    const i = Store.getById('inventario', id);
    if (!i) return;

    const itensHTML = (i.itens || []).map(it => 
      '<div style="padding:var(--space-xs) 0;border-bottom:1px solid var(--border)">' +
      '<strong>- ' + UI.esc(it.nome || '') + '</strong> | ' + UI.esc(it.local || '') + '<br>' +
      '<span class="text-muted">>> ' + UI.esc(it.status || '') + '</span>' +
      '</div>'
    ).join('');

    const body = '<div class="form-group"><label class="form-label">Descrição do Inventário</label><p style="font-weight:600">' + UI.esc(i.descricao || '') + '</p></div>' +
      '<div class="form-group"><label class="form-label">Itens (' + (i.itens ? i.itens.length : 0) + ')</label>' + itensHTML + '</div>';

    const footer = '<div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">' +
      '<button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Inventario.shareWhatsApp(\'' + i.id + '\')">📱 Enviar para o WhatsApp</button>' +
      '<div style="display:flex;gap:var(--space-xs);margin-top:var(--space-xs)">' +
      '<button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Fechar</button>' +
      '<button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal();Inventario.openForm(\'' + i.id + '\')">Editar</button>' +
      '<button class="btn btn--danger" onclick="UI.closeModal();Inventario.remove(\'' + i.id + '\')">🗑</button>' +
      '</div></div>';

    UI.showModal(i.descricao || 'Inventário', body, footer);
  },

  addItemRow() {
    const container = document.getElementById('itens-container');
    if (!container) return;
    const idx = container.querySelectorAll('.item-row').length + 1;
    const row = document.createElement('div');
    row.className = 'item-row';
    row.style.cssText = 'background:var(--surface-alt);padding:var(--space-sm);border-radius:var(--radius-sm);margin-bottom:var(--space-sm)';
    row.innerHTML = '<div class="form-group" style="margin-bottom:var(--space-xs)"><label class="form-label">Item ' + idx + '</label><input class="form-input item-nome" placeholder="Nome do item"></div>' +
      '<div class="form-group" style="margin-bottom:var(--space-xs)"><label class="form-label">Descrição do Item</label><input class="form-input item-descricao" placeholder="Detalhes"></div>' +
      '<div class="form-row" style="margin-bottom:0"><div class="form-group" style="margin-bottom:0"><label class="form-label">Local</label><input class="form-input item-local" placeholder="Local"></div>' +
      '<div class="form-group" style="margin-bottom:0"><label class="form-label">Status</label>' +
      '<select class="form-select item-status"><option value="Operacional">Operacional</option><option value="Em Paliativo">Em Paliativo</option><option value="Parado">Parado</option></select></div></div>' +
      '<button type="button" class="btn btn--danger" style="margin-top:var(--space-xs);font-size:.75rem;padding:2px 8px;min-height:28px" onclick="this.closest(\'.item-row\').remove()">Remover item</button>';
    container.appendChild(row);
  },

  openForm(id) {
    const i = id ? Store.getById('inventario', id) : null;
    const now = new Date();
    const hoje = now.toISOString().split('T')[0];
    const itemsList = i && i.itens ? i.itens : [{ nome: '', local: '', status: 'Operacional', descricao: '' }];

    let itensRows = '';
    itemsList.forEach((it, idx) => {
      itensRows += '<div class="item-row" style="background:var(--surface-alt);padding:var(--space-sm);border-radius:var(--radius-sm);margin-bottom:var(--space-sm)">' +
        '<div class="form-group" style="margin-bottom:var(--space-xs)"><label class="form-label">Item ' + (idx + 1) + '</label><input class="form-input item-nome" value="' + (it.nome || '') + '" placeholder="Nome do item"></div>' +
        '<div class="form-group" style="margin-bottom:var(--space-xs)"><label class="form-label">Descrição do Item</label><input class="form-input item-descricao" value="' + (it.descricao || '') + '" placeholder="Detalhes"></div>' +
        '<div class="form-row" style="margin-bottom:0"><div class="form-group" style="margin-bottom:0"><label class="form-label">Local</label><input class="form-input item-local" value="' + (it.local || '') + '" placeholder="Local"></div>' +
        '<div class="form-group" style="margin-bottom:0"><label class="form-label">Status</label>' +
        '<select class="form-select item-status"><option value="Operacional"' + (it.status === 'Operacional' ? ' selected' : '') + '>Operacional</option>' +
        '<option value="Em Paliativo"' + (it.status === 'Em Paliativo' ? ' selected' : '') + '>Em Paliativo</option>' +
        '<option value="Parado"' + (it.status === 'Parado' ? ' selected' : '') + '>Parado</option></select></div></div>' +
        '</div>';
    });

    const body = '<div class="form-group"><label class="form-label">Descrição do Inventário *</label><input class="form-input" id="form-descricao" value="' + (i ? i.descricao : '') + '" placeholder="Ex: Setor Elétrico"></div>' +
      '<div class="form-group" style="margin-top:var(--space-md)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)"><label class="form-label" style="margin:0">Itens do Inventário</label>' +
      '<button type="button" class="btn btn--primary" style="font-size:.8rem;padding:4px 10px;min-height:32px" onclick="Inventario.addItemRow()">+ Adicionar Item</button></div>' +
      '<div id="itens-container" style="max-height:280px;overflow-y:auto;padding-right:4px">' + itensRows + '</div></div>' +
      '<input type="hidden" id="form-data" value="' + (i ? i.data : hoje) + '">';

    const footer = '<button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Cancelar</button>' +
      '<button class="btn btn--primary" style="flex:1" onclick="Inventario.save(\'' + (id || '') + '\')">Salvar e Gerar Relatório</button>';

    UI.showModal(id ? 'Editar Inventário' : 'Novo Inventário', body, footer);
  },

  save(id) {
    const descricao = document.getElementById('form-descricao').value.trim();
    const data = document.getElementById('form-data').value;

    if (!descricao) { UI.toast('Informe a descrição do inventário', 'error'); return; }

    const itemRows = document.querySelectorAll('.item-row');
    const itens = [];
    itemRows.forEach(row => {
      const nome = row.querySelector('.item-nome').value.trim();
      const itemDescricao = row.querySelector('.item-descricao').value.trim();
      const local = row.querySelector('.item-local').value.trim();
      const status = row.querySelector('.item-status').value;
      if (nome) itens.push({ nome, descricao: itemDescricao, local: local || 'Não especificado', status });
    });

    if (itens.length === 0) { UI.toast('Adicione pelo menos um item válido', 'error'); return; }

    const recordData = { descricao, data, itens };
    let saved;
    if (id) { saved = Store.update('inventario', id, recordData); UI.toast('Inventário atualizado', 'success'); }
    else { saved = Store.create('inventario', recordData); UI.toast('Inventário registrado', 'success'); }

    UI.closeModal();
    this.renderList('');

    setTimeout(() => {
      if (saved && saved.id) this.openShareModal(saved.id);
    }, 300);
  },

  formatWhatsApp(i) {
    let text = 'RELATORIO DE INVETARIO ' + ((i.descricao || '').toUpperCase()) + '\n';
    text += '---------------------------------------------------------------------------------------\n';
    (i.itens || []).forEach(it => {
      text += '- ' + it.nome + ' | ' + it.local + '\n';
      if (it.descricao && it.descricao.trim()) text += '> ' + it.descricao.trim() + '\n';
      text += '> ' + it.status + '\n\n';
    });
    return text.trim();
  },

  openShareModal(id) {
    const i = Store.getById('inventario', id);
    if (!i) return;
    const formattedText = this.formatWhatsApp(i);
    const body = '<p style="font-size:.85rem;color:var(--text-muted);margin-bottom:var(--space-sm)">Relatório formatado para o WhatsApp:</p>' +
      '<textarea id="wa-text-area" style="min-height:220px;font-family:monospace;font-size:.85rem;background:var(--surface-alt)">' + UI.esc(formattedText) + '</textarea>';
    const footer = '<div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">' +
      '<button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Inventario.sendToWhatsApp(\'' + i.id + '\')">📱 Enviar para o WhatsApp</button>' +
      '<button class="btn btn--secondary btn--full" onclick="Inventario.copyToClipboard()">📋 Copiar Texto</button>' +
      '<button class="btn btn--ghost btn--full" onclick="UI.closeModal()">Fechar</button></div>';
    UI.showModal('📱 Relatório de Inventário', body, footer);
  },

  shareWhatsApp(id) { this.openShareModal(id); },

  sendToWhatsApp(id) {
    const i = Store.getById('inventario', id);
    if (!i) return;
    const text = this.formatWhatsApp(i);
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank');
    UI.toast('Redirecionando para o WhatsApp...', 'success');
  },

  copyToClipboard() {
    const textarea = document.getElementById('wa-text-area');
    if (textarea) {
      textarea.select();
      navigator.clipboard.writeText(textarea.value).then(() => UI.toast('Texto copiado!', 'success'))
        .catch(() => { document.execCommand('copy'); UI.toast('Texto copiado!', 'success'); });
    }
  },

  remove(id) {
    UI.confirm('Deseja excluir este inventário?', () => {
      Store.delete('inventario', id);
      UI.toast('Inventário removido', 'success');
      this.renderList('');
    });
  }
};

window.Inventario = Inventario;
