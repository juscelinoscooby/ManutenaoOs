/* ===== Module: Dashboard ===== */

const Dashboard = {
  render() {
    const stats = [
      { icon: '📝', route: 'atividade',    bg: 'rgba(37, 99, 235, 0.14)',  value: Store.count('atividades'),        label: 'Atividades' },
      { icon: '✅', route: 'checklists',   bg: 'rgba(16, 185, 129, 0.15)', value: Store.count('rotinas_templates'), label: 'Rotinas Diárias' },
      { icon: '🔍', route: 'vistorias',    bg: 'rgba(139, 92, 246, 0.15)', value: Store.count('vistorias'),         label: 'Vistorias' },
      { icon: '🛠️', route: 'atendimentos', bg: 'rgba(245, 158, 11, 0.16)', value: Store.count('atendimentos'),      label: 'Atendimentos' },
      { icon: '🔧', route: 'reparos',      bg: 'rgba(239, 68, 68, 0.14)',  value: Store.count('reparos'),           label: 'Reparos' },
      { icon: '📦', route: 'inventario',   bg: 'rgba(14, 165, 233, 0.15)', value: Store.count('inventario'),        label: 'Inventário' },
      { icon: '📄', route: 'relatorios',   bg: 'rgba(99, 102, 241, 0.15)', value: Store.count('relatorios'),        label: 'Relatórios' },
      { icon: '🤝', route: 'terceiros',    bg: 'rgba(20, 184, 166, 0.15)', value: Store.count('terceiros'),         label: 'Terceiros' },
    ];

    const totalRegistros = stats.reduce((acc, s) => acc + s.value, 0);
    const dataHoje = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });

    // Hero Banner with Quick Actions
    let html = `
      <div class="hero-banner">
        <div class="hero-banner__top">
          <div>
            <div class="hero-banner__greeting">Olá, Técnico Juscelino 👋</div>
            <div class="hero-banner__date" style="text-transform:capitalize">${dataHoje}</div>
          </div>
          <span class="hero-banner__pill">📊 ${totalRegistros} registros</span>
        </div>
        <div class="hero-actions">
          <button class="hero-action-btn" onclick="Router.go('atividade');setTimeout(() => Atividade.openForm(), 60)">➕ Nova Atividade</button>
          <button class="hero-action-btn" onclick="Router.go('atendimentos');setTimeout(() => Atendimentos.openForm(), 60)">🛠️ Novo Atendimento</button>
          <button class="hero-action-btn" onclick="Router.go('vistorias');setTimeout(() => Vistorias.openForm(), 60)">🔍 Nova Vistoria</button>
          <button class="hero-action-btn" onclick="UI.openBackupModal()">📄 Gerar PDF / Backup</button>
        </div>
      </div>
    `;

    // Stat Cards Grid
    html += '<div class="stat-grid">';
    stats.forEach(s => {
      html += `
        <div class="stat-card" style="cursor:pointer" onclick="Router.go('${s.route}')">
          <div class="stat-card__icon" style="background:${s.bg}">${s.icon}</div>
          <div class="stat-card__info">
            <div class="stat-card__value">${s.value}</div>
            <div class="stat-card__label">${s.label}</div>
          </div>
        </div>`;
    });
    html += '</div>';

    // Recent activities
    html += `
      <div class="section-header">
        <h3>📝 Atividades Recentes</h3>
        <span class="section-header__link" onclick="Router.go('atividade')">Ver todas →</span>
      </div>
    `;
    const recent = Store.getAll('atividades').slice(0, 5);
    if (recent.length === 0) {
      html += UI.emptyState('📭', 'Nenhuma atividade registrada');
    } else {
      html += '<div>';
      recent.forEach(a => {
        html += `
          <div class="card-os" onclick="Router.go('atividade');setTimeout(() => Atividade.openDetail('${a.id}'), 50)">
            <div class="card-os__header">
              <span class="badge">${UI.esc(a.tipo)}</span>
              ${UI.statusBadge(a.status)}
            </div>
            <h3 class="card-os__title">${UI.esc(a.nome)}</h3>
            <p class="card-os__desc">${UI.esc(a.desc)}</p>
            ${window.CameraHelper ? CameraHelper.htmlCardThumbs(a) : ''}
            <div class="card-os__meta">
              <span>📍 ${UI.esc(a.local)}</span>
              <span>🕐 ${UI.formatDateShort(a.data)}</span>
              ${a.fotos && a.fotos.length ? `<span>📷 ${a.fotos.length} foto(s)</span>` : ''}
            </div>
          </div>`;
      });
      html += '</div>';
    }

    // Pending attendances
    html += `
      <div class="section-header mt-md">
        <h3>🛠️ Atendimentos Pendentes</h3>
        <span class="section-header__link" onclick="Router.go('atendimentos')">Ver todos →</span>
      </div>
    `;
    const openAtt = Store.getAll('atendimentos').filter(a => a.status === 'nao_concluido' || a.status === 'aberto' || a.status === 'em_andamento').slice(0, 3);
    if (openAtt.length === 0) {
      html += UI.emptyState('✅', 'Nenhum atendimento pendente');
    } else {
      html += '<div>';
      openAtt.forEach(a => {
        const statusLabel = a.status === 'concluido' ? '🟢 Verificado concluído' : '🟠 Verificado ñ concluído';
        html += `
          <div class="card-os" onclick="Router.go('atendimentos');setTimeout(() => Atendimentos.openDetail('${a.id}'), 50)">
            <div class="card-os__header">
              <span class="badge badge--warning">${statusLabel}</span>
              <span>🕐 ${UI.formatDateShort(a.data)}</span>
            </div>
            <h3 class="card-os__title">📍 ${UI.esc(a.local || a.cliente || '')}</h3>
            <p class="card-os__desc">${UI.esc(a.problema || '')}</p>
            ${window.CameraHelper ? CameraHelper.htmlCardThumbs(a) : ''}
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
