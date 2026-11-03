/* ===== Module: Registro de Reparos ===== */

const Reparos = {
  render() {
    let html = `
      <div class="search-bar">
        <input type="text" id="reparo-search" placeholder="Buscar reparo...">
      </div>
      <div id="reparo-list"></div>
      ${UI.fab('➕', 'Reparos.openForm()')}
    `;
    return html;
  },

  init() {
    this.renderList('');
    document.getElementById('reparo-search').addEventListener('input', e => {
      this.renderList(e.target.value);
    });
  },

  renderList(filter) {
    const list = Store.getAll('reparos');
    const filtered = list.filter(r =>
      !filter ||
      (r.local || '').toLowerCase().includes(filter.toLowerCase()) ||
      (r.defeito || '').toLowerCase().includes(filter.toLowerCase()) ||
      (r.solucao || '').toLowerCase().includes(filter.toLowerCase())
    );
    const container = document.getElementById('reparo-list');
    if (filtered.length === 0) {
      container.innerHTML = UI.emptyState('🔧', 'Nenhum reparo encontrado');
      return;
    }
    container.innerHTML = filtered.map(r => {
      const statusLabel = r.status === 'concluido' ? '🟢 Concluído' : '🟠 Ñ concluído';
      return `
        <div class="card-os" onclick="Reparos.openDetail('${r.id}')">
          <div class="card-os__header">
            <span class="badge badge--${r.status === 'concluido' ? 'success' : 'warning'}">${statusLabel}</span>
            <span>🕐 ${UI.formatDateShort(r.data)}</span>
          </div>
          <h3 class="card-os__title">📍 ${UI.esc(r.local)}</h3>
          <p class="card-os__desc"><strong>Defeito:</strong> ${UI.esc(r.defeito)}</p>
        </div>
      `;
    }).join('');
  },

  openDetail(id) {
    const r = Store.getById('reparos', id);
    if (!r) return;
    const statusLabel = r.status === 'concluido' ? '🟢 Concluído' : '🟠 Ñ concluído';
    const body = `
      <div class="form-group"><label class="form-label">Local</label><p>${UI.esc(r.local)}</p></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Data e Hora</label><p>${UI.esc(r.data)} às ${UI.esc(r.hora || '')}</p></div>
        <div class="form-group"><label class="form-label">Status</label><p>${statusLabel}</p></div>
      </div>
      <div class="form-group"><label class="form-label">Defeito</label><p>${UI.esc(r.defeito)}</p></div>
      <div class="form-group"><label class="form-label">Solução Aplicada</label><p>${UI.esc(r.solucao || 'Nenhuma solução informada')}</p></div>
    `;
    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        <button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Reparos.shareWhatsApp('${r.id}')">
          📱 Enviar para o WhatsApp
        </button>
        <div style="display:flex;gap:var(--space-xs);margin-top:var(--space-xs)">
          <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Fechar</button>
          <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal();Reparos.openForm('${r.id}')">Editar</button>
          <button class="btn btn--danger" onclick="UI.closeModal();Reparos.remove('${r.id}')">🗑</button>
        </div>
      </div>
    `;
    UI.showModal(`Reparo: ${r.local}`, body, footer);
  },

  openForm(id) {
    const r = id ? Store.getById('reparos', id) : null;
    const now = new Date();
    const hoje = now.toISOString().split('T')[0];
    const horaAtual = now.toTimeString().slice(0,5);

    // Support backward compatibility with old properties (equipamento -> local, problema -> defeito)
    const localVal = r ? (r.local || r.equipamento || '') : '';
    const defeitoVal = r ? (r.defeito || r.problema || '') : '';

    const body = `
      <div class="form-group">
        <label class="form-label">Local *</label>
        <input class="form-input" id="form-local" value="${UI.esc(localVal)}" placeholder="Ex: Motor 01 / Galpão B">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Data</label>
          <input class="form-input" type="date" id="form-data" value="${r ? r.data : hoje}">
        </div>
        <div class="form-group">
          <label class="form-label">Hora</label>
          <input class="form-input" type="time" id="form-hora" value="${r ? (r.hora || '') : horaAtual}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="form-status">
          <option value="concluido" ${r && r.status === 'concluido' ? 'selected' : ''}>🟢 Concluído</option>
          <option value="nao_concluido" ${r && (r.status === 'nao_concluido' || r.status === 'em_andamento') ? 'selected' : ''}>🟠 Ñ concluído</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Defeito *</label>
        <textarea class="form-textarea" id="form-defeito" placeholder="Descrição do defeito encontrado..." style="min-height:80px">${UI.esc(defeitoVal)}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Solução Aplicada</label>
        <textarea class="form-textarea" id="form-solucao" placeholder="O que foi feito..." style="min-height:90px">${r ? UI.esc(r.solucao || '') : ''}</textarea>
      </div>
    `;
    const footer = `
      <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn--primary" style="flex:1" onclick="Reparos.save('${id || ''}')">Salvar e Gerar Relatório</button>
    `;
    UI.showModal(id ? 'Editar Reparo' : 'Novo Reparo', body, footer);
  },

  save(id) {
    const local = document.getElementById('form-local').value.trim();
    const data = document.getElementById('form-data').value;
    const hora = document.getElementById('form-hora').value;
    const status = document.getElementById('form-status').value;
    const defeito = document.getElementById('form-defeito').value.trim();
    const solucao = document.getElementById('form-solucao').value.trim();

    if (!local || !defeito) {
      UI.toast('Informe o local e o defeito', 'error');
      return;
    }

    const recordData = { local, data, hora, status, defeito, solucao };
    let saved;
    if (id) {
      saved = Store.update('reparos', id, recordData);
      UI.toast('Reparo atualizado', 'success');
    } else {
      saved = Store.create('reparos', recordData);
      UI.toast('Reparo registrado', 'success');
    }
    UI.closeModal();
    this.renderList('');

    setTimeout(() => {
      if (saved && saved.id) {
        this.openShareModal(saved.id);
      }
    }, 300);
  },

  formatWhatsApp(r) {
    const statusText = r.status === 'concluido' ? 'CONCLUÍDO' : 'NÃO CONCLUÍDO';
    const defeitoText = (r.defeito || '').toUpperCase();
    const localText = (r.local || '').toUpperCase();
    const dataHora = `${r.data || ''} ${r.hora || ''}`.trim();

    let text = `REPARO ${statusText} - ${defeitoText}\n`;
    text += `-------------------------------------------------\n`;
    text += `${dataHora}  /  ${localText}\n`;
    if (r.solucao && r.solucao.trim()) {
      text += `\n_${r.solucao.trim()}_`;
    }
    return text;
  },

  openShareModal(id) {
    const r = Store.getById('reparos', id);
    if (!r) return;

    const formattedText = this.formatWhatsApp(r);

    const body = `
      <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:var(--space-sm)">
        Relatório formatado para o WhatsApp:
      </p>
      <textarea id="wa-text-area" class="form-textarea" style="min-height:200px;font-family:monospace;font-size:.85rem;background:var(--surface-alt)" readonly>${UI.esc(formattedText)}</textarea>
    `;

    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        <button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Reparos.sendToWhatsApp('${id}')">
          📱 Enviar para o WhatsApp
        </button>
        <button class="btn btn--secondary btn--full" onclick="Reparos.copyToClipboard()">
          📋 Copiar Texto
        </button>
        <button class="btn btn--ghost btn--full" onclick="UI.closeModal()">
          Fechar
        </button>
      </div>
    `;

    UI.showModal('📱 Relatório de Reparo', body, footer);
  },

  shareWhatsApp(id) {
    this.openShareModal(id);
  },

  sendToWhatsApp(id) {
    const r = Store.getById('reparos', id);
    if (!r) return;
    const text = this.formatWhatsApp(r);
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
    UI.confirm('Deseja excluir este reparo?', () => {
      Store.delete('reparos', id);
      UI.toast('Reparo removido', 'success');
      this.renderList('');
    });
  },
};

window.Reparos = Reparos;
