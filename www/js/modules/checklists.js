/* ===== Module: Rotinas Diárias (ex Checklists) ===== */

const Checklists = {
  activeTab: 'templates', // 'templates' ou 'historico'

  render() {
    let html = `
      <div class="tabs" id="rotina-tabs">
        <span class="tab ${this.activeTab === 'templates' ? 'active' : ''}" onclick="Checklists.switchTab('templates')">📋 Modelos de Rotina</span>
        <span class="tab ${this.activeTab === 'historico' ? 'active' : ''}" onclick="Checklists.switchTab('historico')">📜 Histórico de Execuções</span>
      </div>
      <div id="rotina-content"></div>
      ${this.activeTab === 'templates' ? UI.fab('➕', 'Checklists.openTemplateForm()') : ''}
    `;
    return html;
  },

  init() {
    this.renderContent();
  },

  switchTab(tab) {
    this.activeTab = tab;
    const view = document.getElementById('view-dashboard');
    if (view) {
      view.innerHTML = this.render();
      this.renderContent();
    }
  },

  renderContent() {
    const container = document.getElementById('rotina-content');
    if (!container) return;

    if (this.activeTab === 'templates') {
      const list = Store.getAll('rotinas_templates');
      if (list.length === 0) {
        container.innerHTML = UI.emptyState('📋', 'Nenhum modelo de rotina cadastrado.<br>Toque em ➕ para criar.');
        return;
      }
      container.innerHTML = list.map(t => `
        <div class="card-os">
          <div class="card-os__header">
            <span class="badge badge--info">${t.tarefas ? t.tarefas.length : 0} tarefas</span>
            <button class="btn btn--primary" style="padding:4px 12px;font-size:.8rem;min-height:32px" onclick="Checklists.openExecuteModal('${t.id}')">▶ Executar</button>
          </div>
          <h3 class="card-os__title">${UI.esc(t.nome)}</h3>
          <p class="card-os__desc">${UI.esc(t.descricao || 'Rotina diária de verificação')}</p>
          <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-sm)">
            <button class="btn btn--secondary" style="flex:1;font-size:.75rem;min-height:32px" onclick="Checklists.openTemplateForm('${t.id}')">✏️ Editar</button>
            <button class="btn btn--danger" style="padding:4px 10px;font-size:.75rem;min-height:32px" onclick="Checklists.removeTemplate('${t.id}')">🗑</button>
          </div>
        </div>
      `).join('');
    } else {
      const list = Store.getAll('rotinas_execucoes');
      if (list.length === 0) {
        container.innerHTML = UI.emptyState('📜', 'Nenhuma execução registrada ainda.<br>Execute um modelo na aba anterior.');
        return;
      }
      container.innerHTML = list.map(ex => `
        <div class="card-os" onclick="Checklists.openExecutionDetail('${ex.id}')">
          <div class="card-os__header">
            <span class="badge">${UI.esc(ex.nomeRotina)}</span>
            <span class="badge badge--${ex.statusGeral === 'concluida' ? 'success' : 'info'}">${UI.esc(ex.statusGeral)}</span>
          </div>
          <h3 class="card-os__title">${UI.esc(ex.descricaoAtividade)}</h3>
          <div class="card-os__meta">
            <span>📅 ${ex.data} às ${ex.hora}</span>
            <span>👤 ${UI.esc(ex.responsavel || 'Juscelino')}</span>
          </div>
        </div>
      `).join('');
    }
  },

  // --- Templates CRUD ---
  openTemplateForm(id) {
    const t = id ? Store.getById('rotinas_templates', id) : null;
    const tarefasText = t && t.tarefas ? t.tarefas.join('\n') : '';
    const body = `
      <div class="form-group">
        <label class="form-label">Nome da Rotina *</label>
        <input class="form-input" id="form-t-nome" value="${t ? UI.esc(t.nome) : ''}" placeholder="Ex: Rotina da Casa de Bombas">
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <input class="form-input" id="form-t-desc" value="${t ? UI.esc(t.descricao || '') : ''}" placeholder="Ex: Verificação diária de funcionamento">
      </div>
      <div class="form-group">
        <label class="form-label">Tarefas / Itens da Rotina (uma por linha)</label>
        <textarea class="form-textarea" id="form-t-tarefas" style="min-height:140px" placeholder="Bomba 1&#10;Bomba 2&#10;Quadro elétrico&#10;Nível do reservatório">${tarefasText}</textarea>
      </div>
    `;
    const footer = `
      <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn--primary" style="flex:1" onclick="Checklists.saveTemplate('${id || ''}')">Salvar Modelo</button>
    `;
    UI.showModal(id ? 'Editar Modelo de Rotina' : 'Novo Modelo de Rotina', body, footer);
  },

  saveTemplate(id) {
    const nome = document.getElementById('form-t-nome').value.trim();
    const descricao = document.getElementById('form-t-desc').value.trim();
    const tarefasText = document.getElementById('form-t-tarefas').value.trim();

    if (!nome) { UI.toast('Informe o nome da rotina', 'error'); return; }
    const tarefas = tarefasText ? tarefasText.split('\n').filter(s => s.trim()).map(s => s.trim()) : [];

    const data = { nome, descricao, tarefas };
    if (id) {
      Store.update('rotinas_templates', id, data);
      UI.toast('Modelo atualizado com sucesso', 'success');
    } else {
      Store.create('rotinas_templates', data);
      UI.toast('Modelo criado com sucesso', 'success');
    }
    UI.closeModal();
    this.renderContent();
  },

  removeTemplate(id) {
    UI.confirm('Deseja excluir este modelo de rotina?', () => {
      Store.delete('rotinas_templates', id);
      UI.toast('Modelo removido', 'success');
      this.renderContent();
    });
  },

  // --- Execution Flow (Opção A) ---
  openExecuteModal(templateId) {
    const t = Store.getById('rotinas_templates', templateId);
    if (!t) return;

    const now = new Date();
    const hoje = now.toISOString().split('T')[0];
    const horaAtual = now.toTimeString().slice(0,5);
    const statusesPermitidos = ['ligada', 'desligada', 'concluida', 'pendente', 'outras'];

    let tarefasHTML = '';
    if (t.tarefas && t.tarefas.length > 0) {
      tarefasHTML = t.tarefas.map((tr, idx) => `
        <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm);padding-bottom:var(--space-xs);border-bottom:1px solid var(--border)">
          <div style="flex:1;font-size:.9rem;font-weight:500">${UI.esc(tr)}</div>
          <select class="form-select" id="exec-status-${idx}" style="width:140px;min-height:36px;font-size:.8rem">
            ${statusesPermitidos.map(st => `<option value="${st}" ${st === 'concluida' ? 'selected' : ''}>${st.toUpperCase()}</option>`).join('')}
          </select>
        </div>
      `).join('');
    } else {
      tarefasHTML = '<p class="text-muted">Nenhuma tarefa neste modelo.</p>';
    }

    const body = `
      <input type="hidden" id="exec-template-id" value="${t.id}">
      <input type="hidden" id="exec-template-nome" value="${UI.esc(t.nome)}">

      <div class="form-group">
        <label class="form-label">Descrição da Atividade *</label>
        <input class="form-input" id="exec-desc" value="${UI.esc(t.nome)}" placeholder="Ex: Verificação geral da casa de bombas">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Data</label>
          <input class="form-input" type="date" id="exec-data" value="${hoje}">
        </div>
        <div class="form-group">
          <label class="form-label">Hora</label>
          <input class="form-input" type="time" id="exec-hora" value="${horaAtual}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Status Geral</label>
        <select class="form-select" id="exec-status-geral">
          ${statusesPermitidos.map(st => `<option value="${st}" ${st === 'concluida' ? 'selected' : ''}>${st.toUpperCase()}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Resumo (opcional)</label>
        <textarea class="form-textarea" id="exec-resumo" placeholder="Observações gerais da execução..." style="min-height:80px"></textarea>
      </div>

      <div class="form-group" style="margin-top:var(--space-md)">
        <label class="form-label">📋 Tarefas e Status Individuais</label>
        <div style="max-height:220px;overflow-y:auto;padding-right:4px">
          ${tarefasHTML}
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn--primary" style="flex:1" onclick="Checklists.saveExecution('${t.id}')">💾 Salvar e Gerar Relatório</button>
    `;

    UI.showModal(`Executar: ${t.nome}`, body, footer);
  },

  saveExecution(templateId) {
    const t = Store.getById('rotinas_templates', templateId);
    if (!t) return;

    const descricaoAtividade = document.getElementById('exec-desc').value.trim();
    const data = document.getElementById('exec-data').value;
    const hora = document.getElementById('exec-hora').value;
    const statusGeral = document.getElementById('exec-status-geral').value;
    const resumo = document.getElementById('exec-resumo').value.trim();

    if (!descricaoAtividade) {
      UI.toast('Informe a descrição da atividade', 'error');
      return;
    }

    const tarefasExec = (t.tarefas || []).map((tr, idx) => {
      const stEl = document.getElementById(`exec-status-${idx}`);
      return {
        tarefa: tr,
        status: stEl ? stEl.value : 'concluida'
      };
    });

    const executionRecord = {
      rotinaId: t.id,
      nomeRotina: t.nome,
      descricaoAtividade,
      data,
      hora,
      statusGeral,
      resumo,
      tarefas: tarefasExec,
      responsavel: 'Juscelino'
    };

    const saved = Store.create('rotinas_execucoes', executionRecord);
    UI.closeModal();
    UI.toast('Rotina executada e salva!', 'success');

    // Switch to history and open share modal for WhatsApp
    this.activeTab = 'historico';
    const view = document.getElementById('view-dashboard');
    if (view) {
      view.innerHTML = this.render();
      this.renderContent();
    }

    setTimeout(() => {
      if (saved && saved.id) {
        this.openExecutionDetail(saved.id);
      }
    }, 300);
  },

  openExecutionDetail(id) {
    const ex = Store.getById('rotinas_execucoes', id);
    if (!ex) return;

    const formattedText = this.formatExecutionWhatsApp(ex);

    const body = `
      <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:var(--space-sm)">
        Relatório formatado para o WhatsApp:
      </p>
      <textarea id="wa-text-area" class="form-textarea" style="min-height:240px;font-family:monospace;font-size:.85rem;background:var(--surface-alt)" readonly>${UI.esc(formattedText)}</textarea>
    `;

    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        <button class="btn btn--primary btn--full" style="background:#25D366;color:#fff" onclick="Checklists.sendToWhatsApp('${id}')">
          📱 Enviar para o WhatsApp
        </button>
        <button class="btn btn--secondary btn--full" onclick="Checklists.copyToClipboard()">
          📋 Copiar Texto
        </button>
        ${CameraHelper.botaoFotos('rotinas_execucoes', id)}
        <div style="display:flex;gap:var(--space-xs);margin-top:var(--space-xs)">
          <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Fechar</button>
          <button class="btn btn--danger" onclick="UI.closeModal();Checklists.removeExecution('${id}')">🗑 Excluir</button>
        </div>
      </div>
    `;

    UI.showModal('📱 Relatório da Rotina', body, footer);
  },

  formatExecutionWhatsApp(ex) {
    let text = `-----------------------------------------------------------------\n`;
    text += `*${ex.descricaoAtividade}*\n`;
    text += `*Status:* ${(ex.statusGeral || '').toUpperCase()}\n`;
    text += `*Data e hora:* ${ex.data} ${ex.hora}\n`;
    if (ex.resumo && ex.resumo.trim()) {
      text += `*Resumo:* ${ex.resumo}\n`;
    }
    if (ex.tarefas && ex.tarefas.length > 0) {
      text += `\n*Tarefas Verificadas:*\n`;
      ex.tarefas.forEach(t => {
        text += `• ${t.tarefa}: *${(t.status || '').toUpperCase()}*\n`;
      });
    }
    text += `-----------------------------------------------------------------`;
    return text;
  },

  sendToWhatsApp(id) {
    const ex = Store.getById('rotinas_execucoes', id);
    if (!ex) return;
    const text = this.formatExecutionWhatsApp(ex);
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

  removeExecution(id) {
    UI.confirm('Deseja excluir este registro de execução?', () => {
      Store.delete('rotinas_execucoes', id);
      UI.toast('Execução removida', 'success');
      this.renderContent();
    });
  },
};

window.Checklists = Checklists;
