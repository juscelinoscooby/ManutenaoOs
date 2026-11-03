/* ===== Export Helper (PDF Nativo com Miniaturas / CSV / JSON Backup / Impressão) ===== */

const ExportHelper = {

  /** Mapeia os dados de qualquer registro em pares [Rótulo, Valor] legíveis */
  _extrairCamposRegistro(collection, rec) {
    const statusMap = {
      pendente: 'Pendente',
      em_andamento: 'Em andamento',
      concluido: 'Concluído',
      concluida: 'Concluída',
      nao_concluido: 'Não concluído',
      cancelado: 'Cancelado',
      conforme: 'Conforme',
      nao_conforme: 'Não conforme',
      ligada: 'Ligada',
      desligada: 'Desligada'
    };
    const st = statusMap[rec.status || rec.statusGeral] || rec.status || rec.statusGeral || '';
    const campos = [];

    if (collection === 'atividades') {
      campos.push(['Atividade', rec.nome || '—']);
      campos.push(['Tipo', rec.tipo || '—']);
      campos.push(['Status', st]);
      campos.push(['Local / Setor', rec.local || '—']);
      campos.push(['Data / Hora', `${rec.data || ''} ${rec.hora || ''}`.trim()]);
      campos.push(['Responsável', rec.responsavel || 'Juscelino']);
      if (rec.desc) campos.push(['Descrição Geral', rec.desc]);
      if (rec.equipamentos) campos.push(['Equipamentos Verificados', rec.equipamentos.replace(/\n/g, ' | ')]);
      if (rec.servicos) campos.push(['Serviços Executados', rec.servicos.replace(/\n/g, ' | ')]);
    } else if (collection === 'rotinas_execucoes') {
      campos.push(['Rotina', rec.nomeRotina || '—']);
      campos.push(['Descrição da Atividade', rec.descricaoAtividade || '—']);
      campos.push(['Status Geral', st]);
      campos.push(['Data / Hora', `${rec.data || ''} ${rec.hora || ''}`.trim()]);
      campos.push(['Responsável', rec.responsavel || 'Juscelino']);
      if (rec.resumo) campos.push(['Resumo', rec.resumo]);
      if (Array.isArray(rec.tarefas) && rec.tarefas.length) {
        campos.push(['Tarefas Verificadas', rec.tarefas.map(t => `${t.tarefa}: ${(t.status || '').toUpperCase()}`).join(' | ')]);
      }
    } else if (collection === 'relatorios') {
      campos.push(['Título do Relatório', rec.titulo || '—']);
      campos.push(['Tipo', rec.tipo || '—']);
      campos.push(['Período', rec.periodo || '—']);
      campos.push(['Status', st]);
      campos.push(['Data', UI.formatDateShort(rec.data)]);
      if (rec.descricao) campos.push(['Descrição / Observações', rec.descricao]);
    } else if (collection === 'vistorias') {
      campos.push(['Local da Vistoria', rec.local || '—']);
      campos.push(['Status', st]);
      campos.push(['Data / Hora', `${rec.data || ''} ${rec.hora || ''}`.trim()]);
      if (rec.resumo) campos.push(['Resumo da Vistoria', rec.resumo]);
    } else if (collection === 'coletas') {
      campos.push(['Equipamento', rec.equipamento || '—']);
      campos.push(['Parâmetro', rec.parametro || '—']);
      campos.push(['Valor Medido', rec.valor || '—']);
      campos.push(['Data', UI.formatDate(rec.data)]);
    } else if (collection === 'inventario') {
      campos.push(['Inventário', rec.descricao || '—']);
      campos.push(['Data', rec.data || '—']);
      if (Array.isArray(rec.itens) && rec.itens.length) {
        campos.push(['Itens Cadastrados', rec.itens.map(i => `${i.nome} (${i.local || 'N/I'} - ${i.status || ''})${i.descricao ? ': ' + i.descricao : ''}`).join(' | ')]);
      }
    } else if (collection === 'atendimentos') {
      campos.push(['Local do Atendimento', rec.local || '—']);
      campos.push(['Status', st]);
      campos.push(['Data / Hora', `${rec.data || ''} ${rec.hora || ''}`.trim()]);
      if (rec.problema) campos.push(['Problema Relatado', rec.problema]);
      if (rec.resumo) campos.push(['Resumo / Solução', rec.resumo]);
    } else if (collection === 'reparos') {
      campos.push(['Local / Equipamento', rec.local || '—']);
      campos.push(['Status', st]);
      campos.push(['Data / Hora', `${rec.data || ''} ${rec.hora || ''}`.trim()]);
      if (rec.defeito) campos.push(['Defeito Encontrado', rec.defeito]);
      if (rec.solucao) campos.push(['Solução Aplicada', rec.solucao]);
    } else if (collection === 'terceiros') {
      campos.push(['Empresa Terceirizada', rec.empresa || '—']);
      campos.push(['Local do Serviço', rec.local || '—']);
      campos.push(['Status', st]);
      campos.push(['Data / Hora', `${rec.data || UI.formatDateShort(rec.prazo) || ''} ${rec.hora || ''}`.trim()]);
      if (rec.servico) campos.push(['Serviço Executado', rec.servico]);
    } else {
      Object.keys(rec).forEach(k => {
        if (k !== 'id' && k !== 'fotos' && k !== 'createdAt' && k !== 'updatedAt') {
          campos.push([k, typeof rec[k] === 'object' ? JSON.stringify(rec[k]) : String(rec[k])]);
        }
      });
    }
    return campos;
  },

  _tituloColecao(collection) {
    const map = {
      atividades: 'RELATÓRIO DE ATIVIDADES DE MANUTENÇÃO',
      rotinas_execucoes: 'RELATÓRIO DE EXECUÇÃO DE ROTINAS DIÁRIAS',
      relatorios: 'RELATÓRIO GERAL DE MANUTENÇÃO',
      vistorias: 'RELATÓRIO TÉCNICO DE VISTORIAS',
      coletas: 'RELATÓRIO DE COLETA DE DADOS E MEDIÇÕES',
      inventario: 'RELATÓRIO DE INVENTÁRIO DE EQUIPAMENTOS',
      atendimentos: 'RELATÓRIO DE ATENDIMENTOS TÉCNICOS',
      reparos: 'RELATÓRIO DE REPAROS EXECUTADOS',
      terceiros: 'RELATÓRIO DE ACOMPANHAMENTO DE TERCEIROS'
    };
    return map[collection] || 'RELATÓRIO DE MANUTENÇÃO OS';
  },

  /** Abre o modal de pré-visualização e geração de PDF para um único registro */
  gerarPDFRegistro(collection, id) {
    const rec = Store.getById(collection, id);
    if (!rec) {
      UI.toast('Registro não encontrado', 'error');
      return;
    }
    this._abrirModalPreviewPDF(this._tituloColecao(collection), [rec], collection, `relatorio_${collection}_${id}.pdf`);
  },

  /** Abre o modal de pré-visualização e geração de PDF para todos os registros de uma coleção */
  gerarPDFColecao(collection, nomePersonalizado) {
    const lista = Store.getAll(collection);
    if (!lista || lista.length === 0) {
      UI.toast('Não há registros para gerar PDF neste módulo', 'error');
      return;
    }
    const titulo = nomePersonalizado || this._tituloColecao(collection);
    this._abrirModalPreviewPDF(titulo, lista, collection, `relatorio_${collection}_${Date.now()}.pdf`);
  },

  /** Exibe pré-visualização do relatório com fotos em miniatura e botões para compartilhar/baixar o PDF */
  _abrirModalPreviewPDF(titulo, registros, collection, nomeArquivo) {
    this._pdfContext = { titulo, registros, collection, nomeArquivo };
    const singleId = registros.length === 1 ? registros[0].id : null;

    const cardsHTML = registros.map((rec, idx) => {
      const campos = this._extrairCamposRegistro(collection, rec);
      const fotos = Array.isArray(rec.fotos) ? rec.fotos : [];
      return `
        <div style="border:1px solid var(--border-dark);border-radius:var(--radius-sm);padding:var(--space-sm);margin-bottom:var(--space-sm);background:#fff">
          <div style="font-weight:700;color:var(--primary);border-bottom:1px solid var(--border);padding-bottom:4px;margin-bottom:6px;font-size:.85rem">
            #${idx + 1} — ${UI.esc(campos[0] ? campos[0][1] : 'Registro')}
          </div>
          ${campos.map(([k, v]) => `
            <div style="font-size:.8rem;margin-bottom:3px">
              <strong>${UI.esc(k)}:</strong> ${UI.esc(v)}
            </div>
          `).join('')}
          <div style="margin-top:8px;padding-top:6px;border-top:1px dashed var(--border)">
            <div style="font-size:.75rem;font-weight:600;color:var(--text-muted);margin-bottom:4px">
              📷 Fotos em Miniatura no PDF (${fotos.length}):
            </div>
            ${fotos.length === 0
              ? '<span class="text-sm text-muted" style="font-size:.75rem">Sem fotos anexadas</span>'
              : `<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:6px">
                  ${fotos.map((f, fi) => `
                    <div style="border:1px solid var(--border);border-radius:4px;padding:3px;text-align:center;background:var(--surface-alt)">
                      <img src="${f.src}" style="width:100%;height:64px;object-fit:cover;border-radius:3px;display:block">
                      <div style="font-size:10px;color:var(--text-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        ${UI.esc(f.legenda || `Foto ${fi + 1}`)}
                      </div>
                    </div>
                  `).join('')}
                </div>`
            }
          </div>
        </div>
      `;
    }).join('');

    const body = `
      <div style="background:var(--surface-alt);padding:var(--space-sm);border-radius:var(--radius-sm);max-height:52vh;overflow-y:auto">
        <div style="background:var(--primary);color:#fff;padding:8px 10px;border-radius:4px;margin-bottom:var(--space-sm)">
          <div style="font-weight:700;font-size:.9rem">${UI.esc(titulo)}</div>
          <div style="font-size:.7rem;opacity:.9">Emissão: ${new Date().toLocaleString('pt-BR')} | Técnico Juscelino</div>
        </div>
        ${cardsHTML}
      </div>
    `;

    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        <button class="btn btn--primary btn--full" onclick="ExportHelper._executarGeracaoPDF('compartilhar')">
          📲 Compartilhar / Salvar PDF (c/ Fotos)
        </button>
        <div style="display:flex;gap:var(--space-xs)">
          <button class="btn btn--secondary" style="flex:1" onclick="ExportHelper._executarGeracaoPDF('baixar')">
            ⬇️ Baixar .PDF
          </button>
          ${singleId ? `
            <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal(true);CameraHelper.verFotos('${collection}','${singleId}')">
              📷 + Fotos
            </button>
          ` : ''}
          <button class="btn btn--secondary" onclick="UI.closeModal()">Fechar</button>
        </div>
      </div>
    `;

    UI.showModal('📄 Relatório PDF com Miniaturas', body, footer);
  },

  /** Gera o binário PDF 1.4 real com miniaturas JPEG embutidas e compartilha/baixa */
  async _executarGeracaoPDF(acao = 'compartilhar') {
    const ctx = this._pdfContext;
    if (!ctx) return;
    UI.toast('Gerando arquivo PDF com miniaturas...');

    try {
      const pdfBytes = await this._construirBinarioPDF(ctx.titulo, ctx.registros, ctx.collection);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      // 1. Tentativa via Capacitor Nativo (Filesystem + Share) no APK Android
      if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        const Plugins = window.Capacitor.Plugins || {};
        if (Plugins.Filesystem) {
          const base64Data = this._uint8ToBase64(pdfBytes);
          const safeName = ctx.nomeArquivo.replace(/[^a-zA-Z0-9._-]/g, '_');
          const writeRes = await Plugins.Filesystem.writeFile({
            path: safeName,
            data: base64Data,
            directory: 'CACHE'
          });
          if (Plugins.Share && writeRes && writeRes.uri) {
            await Plugins.Share.share({
              title: ctx.titulo,
              text: `${ctx.titulo} — Manutenção OS`,
              url: writeRes.uri,
              dialogTitle: 'Compartilhar ou Salvar Relatório PDF'
            });
            UI.toast('PDF gerado com sucesso!', 'success');
            return;
          }
        }
      }

      // 2. Tentativa via Web Share API com arquivo (navegadores mobile modernos)
      if (acao === 'compartilhar' && navigator.canShare) {
        const file = new File([blob], ctx.nomeArquivo, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: ctx.titulo,
            text: `${ctx.titulo} — Manutenção OS`,
            files: [file]
          });
          UI.toast('PDF compartilhado!', 'success');
          return;
        }
      }

      // 3. Download direto do arquivo .pdf
      this._baixar(blob, ctx.nomeArquivo);
      UI.toast('PDF baixado com sucesso!', 'success');
    } catch (err) {
      const msg = (err && err.message) ? err.message : String(err);
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('abort')) {
        console.error('Erro ao gerar PDF:', err);
        UI.toast('Erro ao gerar PDF: ' + msg, 'error');
      }
    }
  },

  /** Converte imagem dataURL em miniatura JPEG (320x240) como Uint8Array para embutir no PDF */
  _gerarMiniaturaJpegBytes(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const W = 320, H = 240;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, W, H);

        // Calcula corte centralizado (cover)
        const scale = Math.max(W / (img.width || W), H / (img.height || H));
        const sw = W / scale;
        const sh = H / scale;
        const sx = Math.max(0, ((img.width || W) - sw) / 2);
        const sy = Math.max(0, ((img.height || H) - sh) / 2);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

        const jpegUrl = canvas.toDataURL('image/jpeg', 0.84);
        const base64 = jpegUrl.split(',')[1] || '';
        const binStr = atob(base64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        resolve({ bytes, width: W, height: H });
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  },

  /** Codifica string JS para bytes Windows-1252 / WinAnsi e escapa caracteres especiais do PDF */
  _pdfEscapeWinAnsi(str) {
    const clean = String(str ?? '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/[—–]/g, '-')
      .replace(/[•]/g, '-')
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
    let out = '';
    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      if (ch === '(' || ch === ')' || ch === '\\') out += '\\' + ch;
      else out += ch;
    }
    return out;
  },

  /** Quebra texto longo em múltiplas linhas respeitando limite de caracteres */
  _quebrarLinhas(texto, maxChars = 78) {
    const palavras = String(texto ?? '').split(/\s+/);
    const linhas = [];
    let atual = '';
    palavras.forEach(p => {
      if (!atual) {
        atual = p;
      } else if ((atual + ' ' + p).length <= maxChars) {
        atual += ' ' + p;
      } else {
        linhas.push(atual);
        atual = p;
      }
    });
    if (atual) linhas.push(atual);
    return linhas.length ? linhas : [''];
  },

  /** Constrói um arquivo PDF 1.4 válido com cabeçalho, registros e fotos em miniatura (3 por linha) */
  async _construirBinarioPDF(titulo, registros, collection) {
    // 1. Pré-processa todas as miniaturas JPEG
    const imagensPDF = []; // [{ name: 'Im1', bytes, width, height }]
    const mapaFotosRegistro = [];

    for (let rIdx = 0; rIdx < registros.length; rIdx++) {
      const rec = registros[rIdx];
      const fotos = Array.isArray(rec.fotos) ? rec.fotos : [];
      const thumbsRec = [];
      for (let fIdx = 0; fIdx < fotos.length; fIdx++) {
        const f = fotos[fIdx];
        if (!f || !f.src) continue;
        const jpeg = await this._gerarMiniaturaJpegBytes(f.src);
        if (jpeg) {
          const imName = `Im${imagensPDF.length + 1}`;
          imagensPDF.push({ name: imName, ...jpeg });
          thumbsRec.push({ name: imName, legenda: f.legenda || `Foto ${fIdx + 1}` });
        }
      }
      mapaFotosRegistro.push(thumbsRec);
    }

    // 2. Monta as páginas (A4: 595.28 x 841.89 pt)
    const pagesOps = [];
    let ops = [];
    let y = 0;

    const iniciarNovaPagina = () => {
      if (ops.length > 0) pagesOps.push(ops.join('\n'));
      ops = [];
      // Cabeçalho azul
      ops.push('0.102 0.451 0.910 rg');
      ops.push('36 762 523 48 re f');
      ops.push('1 1 1 rg');
      ops.push(`BT /F2 13 Tf 48 790 Td (${this._pdfEscapeWinAnsi(titulo)}) Tj ET`);
      const sub = `Manutencao OS | Emissao: ${new Date().toLocaleString('pt-BR')} | Responsavel: Tecnico Juscelino`;
      ops.push(`BT /F1 9 Tf 48 773 Td (${this._pdfEscapeWinAnsi(sub)}) Tj ET`);
      y = 740;
    };

    iniciarNovaPagina();

    for (let rIdx = 0; rIdx < registros.length; rIdx++) {
      const rec = registros[rIdx];
      const campos = this._extrairCamposRegistro(collection, rec);
      const thumbs = mapaFotosRegistro[rIdx] || [];

      if (y < 130) iniciarNovaPagina();

      // Faixa de título do registro
      ops.push('0.910 0.941 0.996 rg');
      ops.push(`36 ${y - 18} 523 22 re f`);
      ops.push('0.102 0.451 0.910 rg');
      const cabecalhoItem = `REGISTRO #${rIdx + 1} - ${campos[0] ? campos[0][1] : ''}`;
      ops.push(`BT /F2 10.5 Tf 44 ${y - 11} Td (${this._pdfEscapeWinAnsi(cabecalhoItem)}) Tj ET`);
      y -= 30;

      // Campos de texto
      campos.forEach(([rotulo, valor]) => {
        const linhas = this._quebrarLinhas(`${rotulo}: ${valor}`, 82);
        linhas.forEach((linha, lIdx) => {
          if (y < 55) iniciarNovaPagina();
          ops.push('0.12 0.16 0.20 rg');
          const font = lIdx === 0 ? '/F2' : '/F1';
          ops.push(`BT ${font} 9.5 Tf 44 ${y} Td (${this._pdfEscapeWinAnsi(linha)}) Tj ET`);
          y -= 14;
        });
      });

      // Seção de miniaturas de fotos (3 por linha)
      if (thumbs.length > 0) {
        if (y < 165) iniciarNovaPagina();
        y -= 4;
        ops.push('0.35 0.40 0.45 rg');
        ops.push(`BT /F2 9 Tf 44 ${y} Td (${this._pdfEscapeWinAnsi(`Fotos Anexadas (${thumbs.length}):`)}) Tj ET`);
        y -= 10;

        const thumbW = 156;
        const thumbH = 114;
        const gapX = 18;
        const startX = 44;

        for (let tIdx = 0; tIdx < thumbs.length; tIdx++) {
          const col = tIdx % 3;
          if (col === 0) {
            if (y - thumbH - 24 < 45) iniciarNovaPagina();
          }
          const x = startX + col * (thumbW + gapX);
          const imgBottomY = y - thumbH;

          // Desenha a imagem XObject
          ops.push(`q ${thumbW} 0 0 ${thumbH} ${x} ${imgBottomY} cm /${thumbs[tIdx].name} Do Q`);
          // Moldura da miniatura
          ops.push('0.80 0.83 0.86 RG 0.8 w');
          ops.push(`${x} ${imgBottomY} ${thumbW} ${thumbH} re S`);
          // Legenda da miniatura
          const legCurta = String(thumbs[tIdx].legenda || '').slice(0, 28);
          ops.push('0.25 0.28 0.32 rg');
          ops.push(`BT /F1 8 Tf ${x + 2} ${imgBottomY - 11} Td (${this._pdfEscapeWinAnsi(legCurta)}) Tj ET`);

          if (col === 2 || tIdx === thumbs.length - 1) {
            y -= (thumbH + 24);
          }
        }
      }

      // Linha separadora entre registros
      y -= 6;
      if (y > 50) {
        ops.push('0.88 0.90 0.92 RG 0.6 w');
        ops.push(`36 ${y} 523 0 re S`);
        y -= 14;
      }
    }

    if (ops.length > 0) pagesOps.push(ops.join('\n'));

    // 3. Monta os objetos PDF binários
    // Obj 1: Catalog, Obj 2: Pages, Obj 3: Font F1 (Helvetica), Obj 4: Font F2 (Helvetica-Bold)
    // Obj 5..4+M: Image XObjects
    // Obj 5+M..: Page + Content objects
    const totalImages = imagensPDF.length;
    const firstImgObjId = 5;
    const firstPageObjId = 5 + totalImages;

    const chunks = [];
    let byteOffset = 0;
    const offsets = {};

    const pushString = (str) => {
      const arr = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        arr[i] = str.charCodeAt(i) & 0xFF;
      }
      chunks.push(arr);
      byteOffset += arr.length;
    };

    const pushBytes = (arr) => {
      chunks.push(arr);
      byteOffset += arr.length;
    };

    pushString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

    // Obj 1: Catalog
    offsets[1] = byteOffset;
    pushString('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // Obj 2: Pages
    const pageKids = pagesOps.map((_, idx) => `${firstPageObjId + idx * 2} 0 R`).join(' ');
    offsets[2] = byteOffset;
    pushString(`2 0 obj\n<< /Type /Pages /Kids [ ${pageKids} ] /Count ${pagesOps.length} >>\nendobj\n`);

    // Obj 3: Font Regular
    offsets[3] = byteOffset;
    pushString('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');

    // Obj 4: Font Bold
    offsets[4] = byteOffset;
    pushString('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n');

    // Image XObjects
    for (let i = 0; i < totalImages; i++) {
      const objId = firstImgObjId + i;
      const img = imagensPDF[i];
      offsets[objId] = byteOffset;
      pushString(
        `${objId} 0 obj\n` +
        `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\n` +
        `stream\n`
      );
      pushBytes(img.bytes);
      pushString('\nendstream\nendobj\n');
    }

    const xObjectDict = imagensPDF.map((img, i) => `/${img.name} ${firstImgObjId + i} 0 R`).join(' ');

    // Pages + Contents
    for (let p = 0; p < pagesOps.length; p++) {
      const pageObjId = firstPageObjId + p * 2;
      const contentObjId = pageObjId + 1;
      const streamStr = pagesOps[p];

      offsets[pageObjId] = byteOffset;
      pushString(
        `${pageObjId} 0 obj\n` +
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << ${xObjectDict} >> >> ` +
        `/Contents ${contentObjId} 0 R >>\n` +
        `endobj\n`
      );

      offsets[contentObjId] = byteOffset;
      pushString(
        `${contentObjId} 0 obj\n` +
        `<< /Length ${streamStr.length} >>\n` +
        `stream\n${streamStr}\nendstream\n` +
        `endobj\n`
      );
    }

    const totalObjects = firstPageObjId + pagesOps.length * 2 - 1;
    const xrefOffset = byteOffset;
    pushString(`xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`);
    for (let id = 1; id <= totalObjects; id++) {
      const off = String(offsets[id] || 0).padStart(10, '0');
      pushString(`${off} 00000 n \n`);
    }
    pushString(
      `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\n` +
      `startxref\n${xrefOffset}\n%%EOF`
    );

    // Concatena todos os chunks num único Uint8Array
    const finalPdf = new Uint8Array(byteOffset);
    let pos = 0;
    for (const chunk of chunks) {
      finalPdf.set(chunk, pos);
      pos += chunk.length;
    }
    return finalPdf;
  },

  _uint8ToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  /** Exporta uma coleção em CSV (compatível com Excel BR: ; e BOM) */
  exportarCSV(collection, nomeArquivo) {
    const dados = Store.getAll(collection);
    if (!dados || !dados.length) {
      UI.toast('Não há dados para exportar', 'error');
      return;
    }

    const linhas = dados.map(item => {
      const flat = {};
      Object.keys(item).forEach(k => {
        if (k === 'fotos') {
          flat.qtd_fotos = Array.isArray(item.fotos) ? item.fotos.length : 0;
          return;
        }
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

  /** Compatibilidade: redireciona impressão para o gerador de PDF com miniaturas */
  imprimirRelatorio(titulo) {
    const rota = Router.currentRoute || 'relatorios';
    const mapRotaColecao = {
      atividade: 'atividades',
      checklists: 'rotinas_execucoes',
      relatorios: 'relatorios',
      vistorias: 'vistorias',
      coleta: 'coletas',
      inventario: 'inventario',
      atendimentos: 'atendimentos',
      reparos: 'reparos',
      terceiros: 'terceiros'
    };
    const col = mapRotaColecao[rota] || 'relatorios';
    this.gerarPDFColecao(col, titulo);
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
