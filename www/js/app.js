/* ===== Manutenção OS — Application Bootstrap ===== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize data store (localStorage + seed data)
  Store.init();

  // 2. Register all modules into the router
  Router.register('dashboard', Dashboard);
  Router.register('atividade', Atividade);
  Router.register('checklists', Checklists);
  Router.register('relatorios', Relatorios);
  Router.register('vistorias', Vistorias);
  Router.register('coleta', Coleta);
  Router.register('inventario', Inventario);
  Router.register('atendimentos', Atendimentos);
  Router.register('reparos', Reparos);
  Router.register('terceiros', Terceiros);

  // 3. Bind UI event listeners (sidebar, overlay, sync)
  UI.bindGlobal();

  // 4. Start routing
  Router.init();
});
