/* ===== Export Helper (CSV / JSON backup / Impressão) ===== */

const ExportHelper = {

  /** Exporta uma coleção em CSV (compatível com Excel BR: ; e BOM) */
  exportarCSV(collection, nomeArquivo) {
    const dados = Store.getAll(collection);
    if (!dados || !dados.length) {
      UI.toast('Não há dados para exportar', 'error');
      return;
    }

    // Achata objetos aninhados (itens, fotos, tarefas) em texto
    const linhas = dados.map(item => {
      const flat = {};
      Object.keys(item).forEach(k => {
        let v = item[k];
        if (Array.isArray(v)) {
          v = v.map(x => typeof x === 'object' ? Object.values(x).join(' ') : x).join(' | ');
        } else if (v && typeof v === 'object') {
          v = JSON.stringify(v);
        }
        flat[k] = v;
      });
      return flat;
    });

    const cabecalhos = Object.keys(linhas[0]);
    const csv = [
      cabecalhos.join(';'),
      ...linhas.map(l => cabecalhos.map(c => `"${String(l[c] ?? '').replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    this._baixar(blob, nomeArquivo || `${collection}_${Date.now()}.csv`);
    UI.toast('CSV exportado!', 'success');
  },

  /** Backup completo em JSON */
  exportarBackupJSON() {
    const dados = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    this._baixar(blob, `backup_manutencao_${Date.now()}.json`);
    UI.toast('Backup gerado!', 'success');
  },

  /** Importa um backup JSON */
  importarBackupJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const dados = JSON.parse(ev.target.result);
          if (!dados || typeof dados !== 'object') throw new Error('Formato inválido');
          localStorage.setItem(CONFIG.storageKey, JSON.stringify(dados));
          UI.toast('Backup restaurado! Recarregando...', 'success');
          setTimeout(() => location.reload(), 1200);
        } catch (err) {
          UI.toast('Erro ao importar: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  /** Abre a impressão de um relatório (HTML atual da view) */
  imprimirRelatorio(titulo, elementoHtml) {
    const conteudo = elementoHtml ? elementoHtml.innerHTML : (document.querySelector('.view') || {}).innerHTML || '';
    const jan = window.open('', '', 'width=900,height=650');
    if (!jan) { UI.toast('Permita pop-ups para imprimir', 'error'); return; }
    jan.document.write(`
      <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${titulo}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#202124}
        h1{color:#1a73e8;border-bottom:2px solid #1a73e8;padding-bottom:6px}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
        th{background:#f2f2f2}
        .card-os{border:1px solid #ddd;padding:12px;margin-bottom:10px;border-radius:6px;page-break-inside:avoid}
        img{max-width:100%}
        @media print{.no-print{display:none}body{padding:0}}
      </style></head><body>
      <h1>${titulo}</h1>
      <p style="color:#5f6368;font-size:12px">Emissão: ${new Date().toLocaleString('pt-BR')} &nbsp;|&nbsp; Responsável: Técnico Juscelino</p>
      <div>${conteudo}</div>
      </body></html>
    `);
    jan.document.close();
    jan.focus();
    setTimeout(() => { jan.print(); jan.close(); }, 300);
  },

  /** Baixa blob via link temporário */
  _baixar(blob, nome) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
};

window.ExportHelper = ExportHelper;
