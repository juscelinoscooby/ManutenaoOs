/* ===== Module: Vistorias ===== */

const Vistorias = {
  render() {
    let html = `<div id="vistoria-list"></div>${UI.fab('➕', 'Vistorias.openForm()')}`;
    return html;
  },

  init() {
    this.renderList();
  },

  renderList() {
    const list = Store.getAll('vistorias');
    const container = document.getElementById('vistoria-list');
    if (list.length === 0) {
      container.innerHTML = UI.emptyState('🔍', 'Nenhuma vistoria registrada');
      return;
    }
    container.innerHTML = list.map(v => `
      <div class="card-os" onclick="Vistorias.openDetail('${v.id}')">
        <div class="card-os__header">
          <span class="badge badge--${v.status === 'conforme' ? 'success' : 'danger'}">${v.status === 'conforme' ? '✅ Conforme' : '⚠️ Não conforme'}</span>
          <span>🕐 ${UI.formatDateShort(v.data)}</span>
        </div>
        <h3 class="card-os__title">📍 ${UI.esc(v.local)}</h3>
        <p class="card-os__desc">${UI.esc(v.resumo || 'Sem resumo')}</p>
      </div>
    `).join('');
  },

  openDetail(id) {
    const v = Store.getById('vistorias', id);
    if (!v) return;
    const body = `
      <div class="form-group"><label class="form-label">Local</label><p>${UI.esc(v.local)}</p></div>
      <div class="form-group"><label class="form-label">Data e Hora</label><p>${UI.esc(v.data)} às ${UI.esc(v.hora || '')}</p></div>
      <div class="form-group"><label class="form-label">Status</label><p>${v.status === 'conforme' ? '✅ Conforme' : '⚠️ Não conforme'}</p></div>
      <div class="form-group"><label class="form-label">Resumo</label><p>${UI.esc(v.resumo || 'Nenhum resumo informado')}</p></div>
    `;
    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        <button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Vistorias.shareWhatsApp('${v.id}')">
          📱 Enviar para o WhatsApp
        </button>
        ${CameraHelper.botaoFotos('vistorias', v.id)}
        <div style="display:flex;gap:var(--space-xs);margin-top:var(--space-xs)">
          <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Fechar</button>
          <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal();Vistorias.openForm('${v.id}')">Editar</button>
          <button class="btn btn--danger" onclick="UI.closeModal();Vistorias.remove('${v.id}')">🗑</button>
        </div>
      </div>
    `;
    UI.showModal(`Vistoria: ${v.local}`, body, footer);
  },

  openForm(id) {
    const v = id ? Store.getById('vistorias', id) : null;
    const now = new Date();
    const hoje = now.toISOString().split('T')[0];
    const horaAtual = now.toTimeString().slice(0,5);

    const body = `
      <div class="form-group">
        <label class="form-label">Local *</label>
        <input class="form-input" id="form-local" value="${v ? UI.esc(v.local) : ''}" placeholder="Ex: Galpão Principal / Setor A">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Data</label>
          <input class="form-input" type="date" id="form-data" value="${v ? v.data : hoje}">
        </div>
        <div class="form-group">
          <label class="form-label">Hora</label>
          <input class="form-input" type="time" id="form-hora" value="${v ? (v.hora || '') : horaAtual}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="form-status">
          <option value="conforme" ${v && v.status === 'conforme' ? 'selected' : ''}>✅ Conforme</option>
          <option value="nao_conforme" ${v && v.status === 'nao_conforme' ? 'selected' : ''}>⚠️ Não conforme</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Resumo (opcional)</label>
        <textarea class="form-textarea" id="form-resumo" placeholder="Resumo da vistoria (opcional)..." style="min-height:100px">${v ? UI.esc(v.resumo || '') : ''}</textarea>
      </div>
    `;
    const footer = `
      <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn--primary" style="flex:1" onclick="Vistorias.save('${id || ''}')">Salvar e Gerar Relatório</button>
    `;
    UI.showModal(id ? 'Editar Vistoria' : 'Nova Vistoria', body, footer);
  },

  save(id) {
    const local = document.getElementById('form-local').value.trim();
    const data = document.getElementById('form-data').value;
    const hora = document.getElementById('form-hora').value;
    const status = document.getElementById('form-status').value;
    const resumo = document.getElementById('form-resumo').value.trim();

    if (!local) {
      UI.toast('Informe o local da vistoria', 'error');
      return;
    }

    const recordData = { local, data, hora, status, resumo };
    let saved;
    if (id) {
      saved = Store.update('vistorias', id, recordData);
      UI.toast('Vistoria atualizada', 'success');
    } else {
      saved = Store.create('vistorias', recordData);
      UI.toast('Vistoria registrada', 'success');
    }
    UI.closeModal();
    this.renderList();

    setTimeout(() => {
      if (saved && saved.id) {
        this.openShareModal(saved.id);
      }
    }, 300);
  },

  formatWhatsApp(v) {
    const statusEmoji = v.status === 'conforme' ? '✅ Conforme' : '⚠️ Não conforme';
    const dataHora = `${v.data || ''} ${v.hora || ''}`.trim();
    const localMaiusculo = (v.local || '').toUpperCase();

    let text = `RELATORIO DE VISTORIA ${localMaiusculo}\n`;
    text += `-------------------------------------------------------\n`;
    text += `${dataHora}   |   ${statusEmoji}\n`;
    text += `-------------------------------------------------------\n`;
    if (v.resumo && v.resumo.trim()) {
      text += `${v.resumo.trim()}`;
    }
    return text;
  },

  openShareModal(id) {
    const v = Store.getById('vistorias', id);
    if (!v) return;

    const formattedText = this.formatWhatsApp(v);

    const body = `
      <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:var(--space-sm)">
        Relatório formatado para o WhatsApp:
      </p>
      <textarea id="wa-text-area" class="form-textarea" style="min-height:180px;font-family:monospace;font-size:.85rem;background:var(--surface-alt)" readonly>${UI.esc(formattedText)}</textarea>
    `;

    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        <button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Vistorias.sendToWhatsApp('${id}')">
          📱 Enviar para o WhatsApp
        </button>
        <button class="btn btn--secondary btn--full" onclick="Vistorias.copyToClipboard()">
          📋 Copiar Texto
        </button>
        <button class="btn btn--ghost btn--full" onclick="UI.closeModal()">
          Fechar
        </button>
      </div>
    `;

    UI.showModal('📱 Relatório de Vistoria', body, footer);
  },

  shareWhatsApp(id) {
    this.openShareModal(id);
  },

  sendToWhatsApp(id) {
    const v = Store.getById('vistorias', id);
    if (!v) return;
    const text = this.formatWhatsApp(v);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    UI.toast('Redirecionando para o WhatsApp...', 'success');
  },

  copyToClipboard() {
    const textarea = document.getElementById('wa-text-area');
    if (textarea) {
      textarea.select();
      navigator.clipboard.writeText(textarea.value).then(() => {
        UI.toast('Texto copiado!', 'success');
      }).catch(() => {
        document.execCommand('copy');
        UI.toast('Texto copiado!', 'success');
      });
    }
  },

  remove(id) {
    UI.confirm('Deseja excluir esta vistoria?', () => {
      Store.delete('vistorias', id);
      UI.toast('Vistoria removida', 'success');
      this.renderList();
    });
  },
};

window.Vistorias = Vistorias;
