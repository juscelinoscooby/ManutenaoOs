/* ===== Module: Dashboard ===== */

const Dashboard = {
  render() {
    const stats = [
      { icon: '📝', value: Store.count('atividades'),    label: 'Atividades' },
      { icon: '✅', value: Store.count('rotinas_templates'), label: 'Rotinas Diárias' },
      { icon: '🔍', value: Store.count('vistorias'),      label: 'Vistorias' },
      { icon: '🛠️', value: Store.count('atendimentos'),   label: 'Atendimentos' },
      { icon: '🔧', value: Store.count('reparos'),        label: 'Reparos' },
      { icon: '📦', value: Store.count('inventario'),     label: 'Inventário' },
      { icon: '📄', value: Store.count('relatorios'),     label: 'Relatórios' },
      { icon: '🤝', value: Store.count('terceiros'),      label: 'Terceiros' },
    ];

    let html = '<div class="stat-grid">';
    stats.forEach(s => {
      html += `
        <div class="stat-card" style="cursor:pointer" onclick="Router.go('${s.icon === '📝' ? 'atividade' : s.icon === '✅' ? 'checklists' : s.icon === '🔍' ? 'vistorias' : s.icon === '🛠️' ? 'atendimentos' : s.icon === '🔧' ? 'reparos' : s.icon === '📦' ? 'inventario' : s.icon === '📄' ? 'relatorios' : 'terceiros'}')">
          <div class="stat-card__icon">${s.icon}</div>
          <div class="stat-card__value">${s.value}</div>
          <div class="stat-card__label">${s.label}</div>
        </div>`;
    });
    html += '</div>';

    // Recent activities
    html += '<div class="section-header"><h3>Atividades Recentes</h3></div>';
    const recent = Store.getAll('atividades').slice(0, 5);
    if (recent.length === 0) {
      html += UI.emptyState('📭', 'Nenhuma atividade registrada');
    } else {
      html += '<div>';
      recent.forEach(a => {
        html += `
          <div class="card-os">
            <div class="card-os__header">
              <span class="badge">${UI.esc(a.tipo)}</span>
              ${UI.statusBadge(a.status)}
            </div>
            <h3 class="card-os__title">${UI.esc(a.nome)}</h3>
            <p class="card-os__desc">${UI.esc(a.desc)}</p>
            <div class="card-os__meta">
              <span>📍 ${UI.esc(a.local)}</span>
              <span>🕐 ${UI.formatDateShort(a.data)}</span>
            </div>
          </div>`;
      });
      html += '</div>';
    }

    // Pending attendances
    html += '<div class="section-header mt-md"><h3>Atendimentos Abertos</h3></div>';
    const openAtt = Store.getAll('atendimentos').filter(a => a.status === 'aberto' || a.status === 'em_andamento').slice(0, 3);
    if (openAtt.length === 0) {
      html += UI.emptyState('✅', 'Nenhum atendimento em aberto');
    } else {
      html += '<div>';
      openAtt.forEach(a => {
        html += `
          <div class="card-os">
            <div class="card-os__header">
              <span class="badge badge--${a.prioridade === 'alta' ? 'danger' : a.prioridade === 'media' ? 'warning' : 'info'}">${UI.esc(a.prioridade)}</span>
              ${UI.statusBadge(a.status)}
            </div>
            <h3 class="card-os__title">${UI.esc(a.cliente)}</h3>
            <p class="card-os__desc">${UI.esc(a.equipamento)} — ${UI.esc(a.problema)}</p>
          </div>`;
      });
      html += '</div>';
    }

    return html;
  },

  init() {
    // No special init needed
  },
};

window.Dashboard = Dashboard;
