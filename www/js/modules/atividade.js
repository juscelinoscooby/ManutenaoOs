/* ===== Module: Registro de Atividade ===== */

const Atividade = {
  render() {
    let html = `
      <div class="search-bar">
        <input type="text" id="atividade-search" placeholder="Buscar atividade...">
      </div>
      <div id="atividade-list"></div>
      ${UI.fab('➕', 'Atividade.openForm()')}
    `;
    return html;
  },

  init() {
    this.renderList('');
    document.getElementById('atividade-search').addEventListener('input', e => {
      this.renderList(e.target.value);
    });
  },

  renderList(filter) {
    const list = Store.getAll('atividades');
    const filtered = list.filter(a =>
      !filter ||
      a.nome.toLowerCase().includes(filter.toLowerCase()) ||
      a.tipo.toLowerCase().includes(filter.toLowerCase()) ||
      (a.local || '').toLowerCase().includes(filter.toLowerCase()) ||
      (a.equipamentos || '').toLowerCase().includes(filter.toLowerCase()) ||
      (a.servicos || '').toLowerCase().includes(filter.toLowerCase())
    );
    const container = document.getElementById('atividade-list');
    if (filtered.length === 0) {
      container.innerHTML = UI.emptyState('📭', 'Nenhuma atividade encontrada');
      return;
    }
    container.innerHTML = filtered.map(a => `
      <div class="card-os" onclick="Atividade.openDetail('${a.id}')">
        <div class="card-os__header">
          <span class="badge">${UI.esc(a.tipo)}</span>
          ${UI.statusBadge(a.status)}
        </div>
        <h3 class="card-os__title">${UI.esc(a.nome)}</h3>
        <p class="card-os__desc">${UI.esc(a.desc)}</p>
        <div class="card-os__meta">
          <span>📍 ${UI.esc(a.local || 'N/I')}</span>
          <span>🕐 ${UI.formatDateShort(a.data)}</span>
          <span>👤 ${UI.esc(a.responsavel || 'N/I')}</span>
        </div>
      </div>
    `).join('');
  },

  openDetail(id) {
    const a = Store.getById('atividades', id);
    if (!a) return;

    const equipamentosList = a.equipamentos ? a.equipamentos.split('\n').filter(e => e.trim()).map(e => `<li>${UI.esc(e)}</li>`).join('') : '<em>Nenhum informado</em>';
    const servicosList = a.servicos ? a.servicos.split('\n').filter(s => s.trim()).map(s => `<li>${UI.esc(s)}</li>`).join('') : '<em>Nenhum informado</em>';

    const body = `
      <div class="form-group"><label class="form-label">Tipo</label><p>${UI.esc(a.tipo)}</p></div>
      <div class="form-group"><label class="form-label">Nome da Atividade</label><p>${UI.esc(a.nome)}</p></div>
      <div class="form-group"><label class="form-label">Descrição</label><p>${UI.esc(a.desc || 'Sem descrição')}</p></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Local</label><p>${UI.esc(a.local || 'N/A')}</p></div>
        <div class="form-group"><label class="form-label">Responsável</label><p>${UI.esc(a.responsavel || 'N/A')}</p></div>
      </div>
      <div class="form-group"><label class="form-label">Status</label>${UI.statusBadge(a.status)}</div>
      <div class="form-group"><label class="form-label">Data</label><p>${UI.formatDate(a.data)}</p></div>

      <div class="form-group" style="border-top:1px solid var(--border);padding-top:var(--space-sm);margin-top:var(--space-sm);">
        <label class="form-label">⚙️ Equipamentos Verificados</label>
        <ul style="padding-left:18px;font-size:.9rem">${equipamentosList}</ul>
      </div>

      <div class="form-group">
        <label class="form-label">🛠️ Serviços Executados</label>
        <ul style="padding-left:18px;font-size:.9rem">${servicosList}</ul>
      </div>
    `;

    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        <button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Atividade.shareWhatsApp('${a.id}')">
          💬 Compartilhar via WhatsApp
        </button>
        ${CameraHelper.botaoFotos('atividades', a.id)}
        <div style="display:flex;gap:var(--space-xs);margin-top:var(--space-xs)">
          <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Fechar</button>
          <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal();Atividade.openForm('${a.id}')">Editar</button>
          <button class="btn btn--danger" onclick="UI.closeModal();Atividade.remove('${a.id}')">🗑</button>
        </div>
      </div>
    `;
    UI.showModal(a.nome, body, footer);
  },

  openForm(id) {
    const a = id ? Store.getById('atividades', id) : null;
    const tipos = ['Preventiva', 'Corretiva', 'Inspeção', 'Predictiva', 'Outro'];
    const statuses = ['pendente', 'em_andamento', 'concluido', 'cancelado'];

    const body = `
      <div class="form-group">
        <label class="form-label">Tipo de Atividade</label>
        <select class="form-select" id="form-tipo">
          ${tipos.map(t => `<option ${a && a.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Nome da Atividade *</label>
        <input class="form-input" id="form-nome" value="${a ? UI.esc(a.nome) : ''}" placeholder="Ex: Casa de bombas">
      </div>
      <div class="form-group">
        <label class="form-label">Descrição Geral</label>
        <textarea class="form-textarea" id="form-desc" placeholder="Resumo do objetivo da atividade">${a ? UI.esc(a.desc) : ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Local / Setor</label>
          <input class="form-input" id="form-local" value="${a ? UI.esc(a.local) : ''}" placeholder="Ex: ss3">
        </div>
        <div class="form-group">
          <label class="form-label">Responsável / Técnico</label>
          <input class="form-input" id="form-responsavel" value="${a ? UI.esc(a.responsavel) : 'Juscelino'}" placeholder="Nome do técnico">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Data</label>
          <input class="form-input" type="date" id="form-data" value="${a ? a.data : new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">Hora</label>
          <input class="form-input" type="time" id="form-hora" value="${a ? (a.hora || '') : new Date().toTimeString().slice(0,5)}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="form-status">
          ${statuses.map(s => `<option value="${s}" ${a && a.status === s ? 'selected' : ''}>${CONFIG.statusOptions[s].label}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">⚙️ Equipamentos Verificados (1 por linha)</label>
        <textarea class="form-textarea" id="form-equipamentos" placeholder="Motor Elétrico 01&#10;Bomba Centrifuga 02" style="min-height:90px">${a ? UI.esc(a.equipamentos || '') : ''}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">🛠️ Serviços Executados por Linha (1 por linha)</label>
        <textarea class="form-textarea" id="form-servicos" placeholder="Limpeza e reaperto dos bornes&#10;Substituição do filtro" style="min-height:100px">${a ? UI.esc(a.servicos || '') : ''}</textarea>
      </div>
    `;

    const footer = `
      <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn--primary" style="flex:1" onclick="Atividade.save('${id || ''}')">Salvar Atividade</button>
    `;
    UI.showModal(id ? 'Editar Atividade' : 'Nova Atividade', body, footer);
  },

  save(id) {
    const now = new Date();
    const data = {
      tipo: document.getElementById('form-tipo').value,
      nome: document.getElementById('form-nome').value.trim(),
      desc: document.getElementById('form-desc').value.trim(),
      local: document.getElementById('form-local').value.trim(),
      responsavel: document.getElementById('form-responsavel').value.trim(),
      status: document.getElementById('form-status').value,
      data: document.getElementById('form-data')?.value || now.toISOString().split('T')[0],
      hora: document.getElementById('form-hora')?.value || now.toTimeString().slice(0,5),
      equipamentos: document.getElementById('form-equipamentos').value.trim(),
      servicos: document.getElementById('form-servicos').value.trim(),
    };

    if (!data.nome) {
      UI.toast('Informe o nome da atividade', 'error');
      return;
    }

    let savedRecord;
    if (id) {
      savedRecord = Store.update('atividades', id, data);
      UI.toast('Atividade atualizada com sucesso', 'success');
    } else {
      savedRecord = Store.create('atividades', data);
      UI.toast('Atividade registrada com sucesso', 'success');
    }

    UI.closeModal();
    this.renderList(document.getElementById('atividade-search')?.value || '');

    setTimeout(() => {
      if (savedRecord && savedRecord.id) {
        this.openShareModal(savedRecord.id);
      }
    }, 300);
  },

  remove(id) {
    Store.delete('atividades', id);
    UI.toast('Atividade removida', 'success');
    this.renderList(document.getElementById('atividade-search')?.value || '');
  },

  /** Gerar texto exato no formato solicitado pelo usuário */
  formatTextWhatsApp(a) {
    const statusLabel = CONFIG.statusOptions[a.status]?.label ? CONFIG.statusOptions[a.status].label.toUpperCase() : (a.status || '').toUpperCase();
    const dataFormatada = (a.data || '') + (a.hora ? ' às ' + a.hora : '');

    const eqLines = a.equipamentos ? a.equipamentos.split('\n').filter(e => e.trim()) : [];
    const svLines = a.servicos ? a.servicos.split('\n').filter(s => s.trim()) : [];

    let text = `📋 *RELATÓRIO DE ATIVIDADE DE MANUTENÇÃO*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔹 *Atividade:* ${a.nome || '—'}\n`;
    text += `🏷️ *Tipo:* ${a.tipo || '—'}\n`;
    text += `📌 *Status:* ${statusLabel}\n`;
    text += `📍 *Local/Setor:* ${a.local || '—'}\n\n`;
    text += `📅 *Data:* ${dataFormatada}\n`;

    if (a.desc) {
      text += `\n📝 *Descrição Geral:*\n_${a.desc}_\n`;
    } else {
      text += `\n📝 *Descrição Geral:*\n_Sem descrição_\n`;
    }

    text += `\n⚙️ *EQUIPAMENTOS VERIFICADOS (${eqLines.length}):*\n`;
    if (eqLines.length > 0) {
      eqLines.forEach(eq => {
        text += `• ${eq.trim()}\n`;
      });
    } else {
      text += `• Nenhum equipamento informado\n`;
    }

    text += `\n🛠️ *SERVIÇOS EXECUTADOS (${svLines.length}):*\n`;
    if (svLines.length > 0) {
      svLines.forEach((sv, i) => {
        text += `${i + 1}. ${sv.trim()}\n`;
      });
    } else {
      text += `1. Nenhum serviço informado\n`;
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━━━`;

    return text;
  },

  openShareModal(id) {
    const a = Store.getById('atividades', id);
    if (!a) return;

    const formattedText = this.formatTextWhatsApp(a);

    const body = `
      <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:var(--space-sm)">
        Relatório formatado para o WhatsApp:
      </p>
      <textarea id="wa-text-area" class="form-textarea" style="min-height:240px;font-family:monospace;font-size:.85rem;background:var(--surface-alt)" readonly>${UI.esc(formattedText)}</textarea>
    `;

    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        <button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Atividade.sendToWhatsApp('${id}')">
          📱 Enviar para o WhatsApp
        </button>
        <button class="btn btn--secondary btn--full" onclick="Atividade.copyToClipboard()">
          📋 Copiar Texto
        </button>
        <button class="btn btn--ghost btn--full" onclick="UI.closeModal()">
          Fechar
        </button>
      </div>
    `;

    UI.showModal('📱 Relatório para WhatsApp', body, footer);
  },

  shareWhatsApp(id) {
    this.openShareModal(id);
  },

  sendToWhatsApp(id) {
    const a = Store.getById('atividades', id);
    if (!a) return;

    const formattedText = this.formatTextWhatsApp(a);
    const encoded = encodeURIComponent(formattedText);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(waUrl, '_blank');
    UI.toast('Redirecionando para o WhatsApp...', 'success');
  },

  copyToClipboard() {
    const textarea = document.getElementById('wa-text-area');
    if (textarea) {
      textarea.select();
      navigator.clipboard.writeText(textarea.value).then(() => {
        UI.toast('Texto copiado para a área de transferência!', 'success');
      }).catch(() => {
        document.execCommand('copy');
        UI.toast('Texto copiado!', 'success');
      });
    }
  },
};

window.Atividade = Atividade;
