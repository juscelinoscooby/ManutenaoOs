/* ===== Module: Registro de Atendimentos ===== */

const Atendimentos = {
  render() {
    let html = `
      <div class="search-bar">
        <input type="text" id="att-search" placeholder="Buscar atendimento...">
      </div>
      <div id="att-list"></div>
      ${UI.fab('➕', 'Atendimentos.openForm()')}
    `;
    return html;
  },

  init() {
    this.renderList('');
    document.getElementById('att-search').addEventListener('input', e => {
      this.renderList(e.target.value);
    });
  },

  renderList(filter) {
    const list = Store.getAll('atendimentos');
    const filtered = list.filter(a =>
      !filter ||
      (a.local || '').toLowerCase().includes(filter.toLowerCase()) ||
      (a.problema || '').toLowerCase().includes(filter.toLowerCase()) ||
      (a.resumo || '').toLowerCase().includes(filter.toLowerCase())
    );
    const container = document.getElementById('att-list');
    if (filtered.length === 0) {
      container.innerHTML = UI.emptyState('🛠️', 'Nenhum atendimento encontrado');
      return;
    }
    container.innerHTML = filtered.map(a => {
      const statusLabel = a.status === 'concluido' ? '🟢 Verificado concluído' : '🟠 Verificado ñ concluído';
      return `
        <div class="card-os" onclick="Atendimentos.openDetail('${a.id}')">
          <div class="card-os__header">
            <span class="badge badge--${a.status === 'concluido' ? 'success' : 'warning'}">${statusLabel}</span>
            <span>🕐 ${UI.formatDateShort(a.data)}</span>
          </div>
          <h3 class="card-os__title">📍 ${UI.esc(a.local)}</h3>
          <p class="card-os__desc"><strong>Problema:</strong> ${UI.esc(a.problema)}</p>
          ${CameraHelper.htmlCardThumbs(a)}
        </div>
      `;
    }).join('');
  },

  openDetail(id) {
    const a = Store.getById('atendimentos', id);
    if (!a) return;
    const statusLabel = a.status === 'concluido' ? '🟢 Verificado concluído' : '🟠 Verificado ñ concluído';
    const body = `
      <div class="form-group"><label class="form-label">Local do Atendimento</label><p>${UI.esc(a.local)}</p></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Data e Hora</label><p>${UI.esc(a.data)} às ${UI.esc(a.hora || '')}</p></div>
        <div class="form-group"><label class="form-label">Status</label><p>${statusLabel}</p></div>
      </div>
      <div class="form-group"><label class="form-label">Problema Relatado</label><p>${UI.esc(a.problema)}</p></div>
      <div class="form-group"><label class="form-label">Resumo / Solução</label><p>${UI.esc(a.resumo || 'Nenhum resumo informado')}</p></div>
      ${CameraHelper.htmlDetailThumbs('atendimentos', a.id)}
    `;
    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        <button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Atendimentos.shareWhatsApp('${a.id}')">
          📱 Enviar para o WhatsApp
        </button>
        ${CameraHelper.botaoFotos('atendimentos', a.id)}
        <div style="display:flex;gap:var(--space-xs);margin-top:var(--space-xs)">
          <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Fechar</button>
          <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal();Atendimentos.openForm('${a.id}')">Editar</button>
          <button class="btn btn--danger" onclick="UI.closeModal();Atendimentos.remove('${a.id}')">🗑</button>
        </div>
      </div>
    `;
    UI.showModal(`Atendimento: ${a.local}`, body, footer);
  },

  openForm(id) {
    const a = id ? Store.getById('atendimentos', id) : null;
    const now = new Date();
    const hoje = now.toISOString().split('T')[0];
    const horaAtual = now.toTimeString().slice(0,5);

    const body = `
      <div class="form-group">
        <label class="form-label">Local do Atendimento *</label>
        <input class="form-input" id="form-local" value="${a ? UI.esc(a.local || a.cliente || '') : ''}" placeholder="Ex: Setor A / Linha 2">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Data</label>
          <input class="form-input" type="date" id="form-data" value="${a ? a.data : hoje}">
        </div>
        <div class="form-group">
          <label class="form-label">Hora</label>
          <input class="form-input" type="time" id="form-hora" value="${a ? (a.hora || '') : horaAtual}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="form-status">
          <option value="concluido" ${a && a.status === 'concluido' ? 'selected' : ''}>🟢 Verificado concluído</option>
          <option value="nao_concluido" ${a && a.status === 'nao_concluido' ? 'selected' : ''}>🟠 Verificado ñ concluído</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Problema Relatado *</label>
        <textarea class="form-textarea" id="form-problema" placeholder="Descrição do problema relatado..." style="min-height:80px">${a ? UI.esc(a.problema || '') : ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Resumo / Solução (opcional)</label>
        <textarea class="form-textarea" id="form-resumo" placeholder="O que foi feito / Solução aplicada..." style="min-height:90px">${a ? UI.esc(a.resumo || '') : ''}</textarea>
      </div>
      ${CameraHelper.htmlFormFotos('atendimentos', id)}
    `;
    const footer = `
      <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn--primary" style="flex:1" onclick="Atendimentos.save('${id || ''}')">Salvar e Gerar Relatório</button>
    `;
    UI.showModal(id ? 'Editar Atendimento' : 'Novo Atendimento', body, footer);
  },

  save(id) {
    const local = document.getElementById('form-local').value.trim();
    const data = document.getElementById('form-data').value;
    const hora = document.getElementById('form-hora').value;
    const status = document.getElementById('form-status').value;
    const problema = document.getElementById('form-problema').value.trim();
    const resumo = document.getElementById('form-resumo').value.trim();

    if (!local || !problema) {
      UI.toast('Informe o local e o problema relatado', 'error');
      return;
    }

    const recordData = { local, data, hora, status, problema, resumo };
    let saved;
    if (id) {
      saved = Store.update('atendimentos', id, recordData);
      UI.toast('Atendimento atualizado', 'success');
    } else {
      saved = Store.create('atendimentos', recordData);
      UI.toast('Atendimento registrado', 'success');
    }
    UI.closeModal();
    this.renderList('');

    setTimeout(() => {
      if (saved && saved.id) {
        this.openShareModal(saved.id);
      }
    }, 300);
  },

  formatWhatsApp(a) {
    const localMaiusculo = (a.local || '').toUpperCase();
    const dataHora = `${a.data || ''} ${a.hora || ''}`.trim();
    const statusText = a.status === 'concluido' ? '🟢 Verificado concluído' : '🟠 Verificado ñ concluído';

    let text = `*RELATORIO DE ATENDIMENTO ${localMaiusculo}*\n`;
    text += `--------------------------------------------------------------\n`;
    text += `${dataHora} | ${statusText}\n`;
    if (a.problema) {
      text += `_${a.problema}_\n`;
    }
    if (a.resumo && a.resumo.trim()) {
      text += `\n${a.resumo.trim()}`;
    }
    return text;
  },

  openShareModal(id) {
    const a = Store.getById('atendimentos', id);
    if (!a) return;

    const formattedText = this.formatWhatsApp(a);

    const body = `
      <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:var(--space-sm)">
        Relatório formatado para o WhatsApp:
      </p>
      <textarea id="wa-text-area" class="form-textarea" style="min-height:160px;font-family:monospace;font-size:.85rem;background:var(--surface-alt)" readonly>${UI.esc(formattedText)}</textarea>
      ${CameraHelper.htmlDetailThumbs('atendimentos', id)}
    `;

    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        <button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Atendimentos.sendToWhatsApp('${id}')">
          📱 Enviar para o WhatsApp
        </button>
        ${CameraHelper.botaoFotos('atendimentos', id)}
        <button class="btn btn--secondary btn--full" onclick="Atendimentos.copyToClipboard()">
          📋 Copiar Texto
        </button>
        <button class="btn btn--ghost btn--full" onclick="UI.closeModal()">
          Fechar
        </button>
      </div>
    `;

    UI.showModal('📱 Relatório de Atendimento', body, footer);
  },

  shareWhatsApp(id) {
    this.openShareModal(id);
  },

  sendToWhatsApp(id) {
    const a = Store.getById('atendimentos', id);
    if (!a) return;
    const text = this.formatWhatsApp(a);
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
    UI.confirm('Deseja excluir este atendimento?', () => {
      Store.delete('atendimentos', id);
      UI.toast('Atendimento removido', 'success');
      this.renderList('');
    });
  },
};

window.Atendimentos = Atendimentos;
