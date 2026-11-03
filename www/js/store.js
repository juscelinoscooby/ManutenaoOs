/* ===== Manutenção OS — Data Store (localStorage) ===== */

const Store = {
  _data: {},
  _loaded: false,

  /** Load all collections from localStorage */
  init() {
    const raw = localStorage.getItem(CONFIG.storageKey);
    if (raw) {
      try { this._data = JSON.parse(raw); }
      catch (e) { this._data = {}; }
    }
    // Ensure every collection exists
    CONFIG.collections.forEach(c => {
      if (!this._data[c]) this._data[c] = [];
    });
    // Seed if empty
    if (!this._data._seeded) {
      this._seed();
      this._data._seeded = true;
    }
    this._loaded = true;
    this._save();
  },

  _save() {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(this._data));
  },

  /** Get all records from a collection */
  getAll(collection) {
    return this._data[collection] || [];
  },

  /** Get a single record by id */
  getById(collection, id) {
    return (this._data[collection] || []).find(r => r.id === id);
  },

  /** Create a new record */
  create(collection, record) {
    if (!this._data[collection]) this._data[collection] = [];
    record.id = record.id || this._uid();
    record.createdAt = record.createdAt || new Date().toISOString();
    record.updatedAt = new Date().toISOString();
    if (window.CameraHelper && CameraHelper._formActive && record.fotos === undefined) {
      record.fotos = CameraHelper.consumeFormFotos();
    }
    this._data[collection].unshift(record);
    this._save();
    return record;
  },

  /** Update a record by id */
  update(collection, id, updates) {
    const list = this._data[collection] || [];
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    if (window.CameraHelper && CameraHelper._formActive && updates.fotos === undefined) {
      updates.fotos = CameraHelper.consumeFormFotos();
    }
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    this._save();
    return list[idx];
  },

  /** Delete a record by id */
  delete(collection, id) {
    const list = this._data[collection] || [];
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    this._save();
    return true;
  },

  /** Count records in a collection */
  count(collection) {
    return (this._data[collection] || []).length;
  },

  /** Generate a unique id */
  _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  /** Seed initial demo data */
  _seed() {
    const now = new Date().toISOString();

    this._data.atividades = [
      { id: this._uid(), tipo: 'Preventiva', nome: 'Manutenção Preventiva Mensal', desc: 'Verificação de rotina de equipamentos', local: 'Setor A', data: now, status: 'concluido', responsavel: 'Juscelino' },
      { id: this._uid(), tipo: 'Corretiva', nome: 'Troca de Componente', desc: 'Substituição de peça danificada', local: 'Setor B', data: now, status: 'em_andamento', responsavel: 'Carlos' },
      { id: this._uid(), tipo: 'Inspeção', nome: 'Inspeção Visual', desc: 'Verificação visual de segurança', local: 'Setor C', data: now, status: 'pendente', responsavel: 'Ana' },
    ];

    this._data.rotinas_templates = [
      { id: this._uid(), nome: 'Rotina Casa de Bombas', descricao: 'Verificação diária dos sistemas de bombeamento', tarefas: ['Bomba Principal 01', 'Bomba de Recalque 02', 'Painel de Controle', 'Nível do Tanque'] },
      { id: this._uid(), nome: 'Checklist Geradores', descricao: 'Inspeção matinal dos geradores de emergência', tarefas: ['Nível de combustível', 'Bateria', 'Vazamentos', 'Ruídos anormais'] },
    ];

    this._data.rotinas_execucoes = [];

    this._data.relatorios = [
      { id: this._uid(), tipo: 'Mensal', titulo: 'Relatório de Setembro', periodo: 'Set/2024', status: 'concluido', data: now },
      { id: this._uid(), tipo: 'Semanal', titulo: 'Relatório Semana 38', periodo: 'Sem 38', status: 'em_andamento', data: now },
    ];

    this._data.vistorias = [
      { id: this._uid(), local: 'Galpão 1', data: '2026-10-31', hora: '14:00', status: 'conforme', resumo: 'Estrutura e pintura em bom estado' },
      { id: this._uid(), local: 'Quadro Elétrico Q-02', data: '2026-10-31', hora: '15:30', status: 'nao_conforme', resumo: 'Disjuntor com aquecimento acima do normal' },
    ];

    this._data.coletas = [
      { id: this._uid(), equipamento: 'Motor 01', parametro: 'Temperatura', valor: '42°C', data: now },
      { id: this._uid(), equipamento: 'Motor 02', parametro: 'Vibração', valor: '0.5mm/s', data: now },
      { id: this._uid(), equipamento: 'Compressor', parametro: 'Pressão', valor: '8 bar', data: now },
    ];

    this._data.inventario = [
      { id: this._uid(), descricao: 'Inventário Setor Elétrico', data: '2026-10-31', itens: [
        { nome: 'Motor Elétrico 5CV', descricao: 'Motor trifásico WEG 5CV 4 polos', local: 'Almoxarifado A', status: 'Operacional' },
        { nome: 'Filtro de Óleo', descricao: 'Filtro cartucho para compressor', local: 'Almoxarifado B', status: 'Operacional' },
        { nome: 'Correia V', descricao: 'Correia tipo A perfil estreito', local: 'Almoxarifado B', status: 'Em Paliativo' },
      ]},
      { id: this._uid(), descricao: 'Inventário Bombas e Motores', data: '2026-10-31', itens: [
        { nome: 'Bomba Centrífuga 10HP', descricao: 'Bomba Schneider 10HP 380V', local: 'Sala de Bombas', status: 'Operacional' },
        { nome: 'Motor 15CV', descricao: 'Motor Weg 15CV IP55', local: 'Sala de Bombas', status: 'Parado' },
      ]},
    ];

    this._data.atendimentos = [
      { id: this._uid(), local: 'Linha de Produção 1', data: '2026-10-31', hora: '08:15', status: 'concluido', problema: 'Parada não programada do transportador principal', resumo: 'Realizado reset e ajuste no inversor. Equipamento operando normal.' },
      { id: this._uid(), local: 'Compressor Central', data: '2026-10-31', hora: '09:40', status: 'nao_concluido', problema: 'Ruído excessivo no cabeçote', resumo: 'Aguardando peça para substituição do rolamento.' },
    ];

    this._data.reparos = [
      { id: this._uid(), local: 'Motor Principal 01', data: '2026-10-31', hora: '10:30', status: 'concluido', defeito: 'SUPERATERQUECIMENTO', solucao: 'Substituição do rolamento dianteiro e limpeza das aletas.' },
      { id: this._uid(), local: 'Bomba de Água 03', data: '2026-10-31', hora: '11:15', status: 'nao_concluido', defeito: 'VAZAMENTO NO SELO MECANICO', solucao: 'Aguardando chegada de peça sobressalente.' },
    ];

    this._data.terceiros = [
      { id: this._uid(), empresa: 'TechService Ltda', local: 'Laboratório / Instrumentação', servico: 'Calibração de instrumentos', status: 'em_andamento', data: '2026-10-31', hora: '09:00', prazo: now, responsavel: 'Ana' },
      { id: this._uid(), empresa: 'ManutPro', local: 'Subestação Principal', servico: 'Reparo de quadro elétrico', status: 'pendente', data: '2026-10-31', hora: '14:00', prazo: now, responsavel: 'Juscelino' },
    ];
  },
};

window.Store = Store;
