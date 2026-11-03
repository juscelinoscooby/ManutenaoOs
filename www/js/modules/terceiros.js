/* ===== Module: Acompanhamento de Terceiros ===== */

const Terceiros = {
  render() {
    let html = '<div class="search-bar"><input type="text" id="ter-search" placeholder="Buscar empresa ou serviço..."></div>';
    html += '<div id="ter-list"></div>';
    if (UI && UI.fab) html += UI.fab('➕', 'Terceiros.openForm()');
    return html;
  },

  init() {
    this.renderList('');
    const input = document.getElementById('ter-search');
    if (input) input.addEventListener('input', e => this.renderList(e.target.value));
  },

  renderList(filter) {
    const list = Store.getAll('terceiros');
    const container = document.getElementById('ter-list');
    if (!container) return;

    const filtered = filter ? list.filter(t =>
      t.empresa && t.empresa.toLowerCase().includes(filter.toLowerCase()) ||
      t.servico && t.servico.toLowerCase().includes(filter.toLowerCase())
    ) : list;

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state__icon">🤝</div><p class="empty-state__text">Nenhum serviço de terceiro registrado</p></div>';
      return;
    }

    container.innerHTML = filtered.map(t =>
      '<div class="card-os" onclick="Terceiros.openDetail(\'' + t.id + '\')">' +
      '<div class="card-os__header">' +
      '<span class="badge">' + UI.esc(t.responsavel || 'Juscelino') + '</span>' +
      UI.statusBadge(t.status || 'pendente') +
      '</div>' +
      '<h3 class="card-os__title">' + UI.esc(t.empresa || '') + '</h3>' +
      '<p class="card-os__desc">' + UI.esc(t.servico || '') + '</p>' +
      '<div class="card-os__meta">' +
      '<span>📍 ' + UI.esc(t.local || 'N/I') + '</span>' +
      '<span>📅 ' + UI.formatDateShort(t.data || t.prazo || '') + '</span>' +
      '</div>' +
      '</div>'
    ).join('');
  },

  openDetail(id) {
    const t = Store.getById('terceiros', id);
    if (!t) return;

    const body =
      '<div class="form-group"><label class="form-label">Nome da Empresa</label><p>' + UI.esc(t.empresa || '') + '</p></div>' +
      '<div class="form-group"><label class="form-label">Local do Serviço</label><p>' + UI.esc(t.local || 'Não informado') + '</p></div>' +
      '<div class="form-group"><label class="form-label">Status</label>' + UI.statusBadge(t.status || 'pendente') + '</div>' +
      '<div class="form-group"><label class="form-label">Serviço a ser Executado</label><p>' + UI.esc(t.servico || '') + '</p></div>' +
      '<div class="form-row">' +
      '<div class="form-group"><label class="form-label">Data / Hora</label><p>' + UI.formatDateShort(t.data || t.prazo) + (t.hora ? ' às ' + UI.esc(t.hora) : '') + '</p></div>' +
      '</div>';

    const footer =
      '<div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">' +
      '<button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Terceiros.shareWhatsApp(\'' + t.id + '\')">📱 Enviar para o WhatsApp</button>' +
      CameraHelper.botaoFotos('terceiros', t.id) +
      '<div style="display:flex;gap:var(--space-xs);margin-top:var(--space-xs)">' +
      '<button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Fechar</button>' +
      '<button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal();Terceiros.openForm(\'' + t.id + '\')">Editar</button>' +
      '<button class="btn btn--danger" onclick="UI.closeModal();Terceiros.remove(\'' + t.id + '\')">🗑</button>' +
      '</div></div>';

    UI.showModal(t.empresa || 'Terceiro', body, footer);
  },

  openForm(id) {
    const t = id ? Store.getById('terceiros', id) : null;
    const now = new Date();
    const hoje = now.toISOString().split('T')[0];
    const horaAtual = now.toTimeString().slice(0,5);

    const body =
      '<div class="form-group"><label class="form-label">Nome da Empresa *</label><input class="form-input" id="form-empresa" value="' + (t ? UI.esc(t.empresa || '') : '') + '" placeholder="Empresa terceirizada"></div>' +
      '<div class="form-group"><label class="form-label">Local do Serviço *</label><input class="form-input" id="form-local" value="' + (t ? UI.esc(t.local || '') : '') + '" placeholder="Local onde será executado"></div>' +
      '<div class="form-group"><label class="form-label">Serviço a ser Executado *</label><textarea class="form-textarea" id="form-servico" placeholder="Serviço a ser executado...">' + (t ? UI.esc(t.servico || '') : '') + '</textarea></div>' +
      '<div class="form-row">' +
      '<div class="form-group"><label class="form-label">Status</label>' +
      '<select class="form-select" id="form-status">' +
      '<option value="pendente" ' + (t && t.status === 'pendente' ? 'selected' : '') + '>Pendente</option>' +
      '<option value="em_andamento" ' + (t && t.status === 'em_andamento' ? 'selected' : '') + '>Em andamento</option>' +
      '<option value="concluido" ' + (t && t.status === 'concluido' ? 'selected' : '') + '>Concluído</option>' +
      '</select></div>' +
      '<div class="form-group"><label class="form-label">Data</label><input class="form-input" type="date" id="form-data" value="' + (t ? UI.esc(t.data || '') : hoje) + '"></div>' +
      '<div class="form-group"><label class="form-label">Hora</label><input class="form-input" type="time" id="form-hora" value="' + (t ? UI.esc(t.hora || '') : horaAtual) + '"></div></div>';

    const footer =
      '<button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Cancelar</button>' +
      '<button class="btn btn--primary" style="flex:1" onclick="Terceiros.save(\'' + (id || '') + '\')">Salvar e Gerar Relatório</button>';

    UI.showModal(id ? 'Editar Terceiro' : 'Novo Serviço de Terceiro', body, footer);
  },

  save(id) {
    const empresa = document.getElementById('form-empresa').value.trim();
    const local = document.getElementById('form-local').value.trim();
    const servico = document.getElementById('form-servico').value.trim();
    const status = document.getElementById('form-status').value;
    const data = document.getElementById('form-data').value;
    const hora = document.getElementById('form-hora').value;

    if (!empresa || !servico) {
      UI.toast('Preencha os campos obrigatórios', 'error');
      return;
    }

    const recordData = { empresa, local, servico, status, data, hora };
    let saved;
    if (id) { saved = Store.update('terceiros', id, recordData); UI.toast('Serviço atualizado', 'success'); }
    else { saved = Store.create('terceiros', recordData); UI.toast('Serviço registrado', 'success'); }

    UI.closeModal();
    this.renderList(document.getElementById('ter-search')?.value || '');

    setTimeout(() => {
      if (saved && saved.id) this.openShareModal(saved.id);
    }, 300);
  },

  formatWhatsApp(t) {
    const empresaMaiusculo = (t.empresa || '').toUpperCase();
    const dataHora = (t.data || '') + ' às ' + (t.hora || '');

    let text = 'ACOMPANHAMENTO DE TERCEIROS ' + empresaMaiusculo + '\n';
    text += '-----------------------------------------------------------------------------' + '\n';
    text += dataHora + '   |   ' + (t.local || 'Não informado') + '\n\n';
    text += (t.servico || '');
    return text;
  },

  openShareModal(id) {
    const t = Store.getById('terceiros', id);
    if (!t) return;

    const formattedText = this.formatWhatsApp(t);

    const body = '<p style="font-size:.85rem;color:var(--text-muted);margin-bottom:var(--space-sm)">Relatório formatado para o WhatsApp:</p>' +
      '<textarea id="wa-text-area" class="form-textarea" style="min-height:200px;font-family:monospace;font-size:.85rem;background:var(--surface-alt)" readonly>' + UI.esc(formattedText) + '</textarea>';

    const footer =
      '<div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">' +
      '<button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Terceiros.sendToWhatsApp(\'' + t.id + '\')">📱 Enviar para o WhatsApp</button>' +
      '<button class="btn btn--secondary btn--full" onclick="Terceiros.copyToClipboard()">📋 Copiar Texto</button>' +
      '<button class="btn btn--ghost btn--full" onclick="UI.closeModal()">Fechar</button></div>';

    UI.showModal('📱 Relatório de Terceiro', body, footer);
  },

  shareWhatsApp(id) { this.openShareModal(id); },

  sendToWhatsApp(id) {
    const t = Store.getById('terceiros', id);
    if (!t) return;
    const text = this.formatWhatsApp(t);
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
    UI.confirm('Deseja excluir este serviço?', () => {
      Store.delete('terceiros', id);
      UI.toast('Serviço removido', 'success');
      this.renderList(document.getElementById('ter-search')?.value || '');
    });
  }
};

window.Terceiros = Terceiros;
