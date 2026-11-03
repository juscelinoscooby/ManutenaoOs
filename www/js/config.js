/* ===== Manutenção OS — Configuration ===== */

const CONFIG = {
  appName: 'Manutenção OS',
  version: '1.0.0',
  author: 'Técnico Juscelino',
  storageKey: 'manutencao_os_v1',

  routes: {
    dashboard:    { title: 'Dashboard',                  subtitle: 'Visão geral do sistema',          icon: '📊' },
    atividade:    { title: 'Registro de Atividade',      subtitle: 'Histórico de atividades',         icon: '📝' },
    checklists:   { title: 'Rotinas Diárias',              subtitle: 'Tarefas e execuções diárias',       icon: '✅' },
    relatorios:   { title: 'Relatórios',                 subtitle: 'Relatórios de manutenção',        icon: '📄' },
    vistorias:    { title: 'Vistorias',                  subtitle: 'Inspeções e vistorias',           icon: '🔍' },
    coleta:       { title: 'Coleta de Dados',            subtitle: 'Leituras e medições',             icon: '📡' },
    inventario:   { title: 'Inventário',                 subtitle: 'Equipamentos e materiais',        icon: '📦' },
    atendimentos: { title: 'Registro de Atendimentos',   subtitle: 'Chamados e atendimentos',         icon: '🛠️' },
    reparos:      { title: 'Registro de Reparos',        subtitle: 'Reparos executados',              icon: '🔧' },
    terceiros:    { title: 'Acompanhamento de Terceiros', subtitle: 'Serviços de terceiros',          icon: '🤝' },
    mais:         { title: 'Mais',                       subtitle: 'Outras opções',                   icon: '⋮' },
  },

  // Collections managed by the store
  collections: [
    'atividades',
    'rotinas_templates',
    'rotinas_execucoes',
    'checklists',
    'relatorios',
    'vistorias',
    'coletas',
    'inventario',
    'atendimentos',
    'reparos',
    'terceiros',
  ],

  statusOptions: {
    pendente:   { label: 'Pendente',   class: 'badge--warning' },
    em_andamento:{ label: 'Em andamento', class: 'badge--info' },
    concluido:  { label: 'Concluído',  class: 'badge--success' },
    cancelado:  { label: 'Cancelado',  class: 'badge--danger' },
    aberto:     { label: 'Aberto',     class: 'badge--warning' },
    fechado:    { label: 'Fechado',    class: 'badge--success' },
  },
};

// Make available globally
window.CONFIG = CONFIG;
