/* ===== Camera Helper (Capacitor + Web fallback + Form Thumbnails) ===== */

const CameraHelper = {
  _formFotos: [],
  _formActive: false,

  /** Comprime e padroniza imagem em JPEG (máx 1024px) para economizar localStorage e embutir no PDF */
  _comprimirImagem(dataUrl, maxDim = 1024, quality = 0.78) {
    return new Promise((resolve) => {
      if (!dataUrl) return resolve(null);
      const img = new Image();
      img.onload = () => {
        let w = img.width || 800;
        let h = img.height || 600;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  },

  /** Captura foto via câmera nativa (Capacitor) ou input file (Web). modo: 'camera' | 'galeria' */
  async capturarFoto(modo = 'camera') {
    if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('Camera')) {
      try {
        const { Camera, CameraResultType, CameraSource } = window.Capacitor.Plugins;
        const source = modo === 'galeria' ? CameraSource.Photos : CameraSource.Camera;
        const img = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: source
        });
        if (img && img.dataUrl) {
          return await this._comprimirImagem(img.dataUrl);
        }
      } catch (err) {
        const msg = (err && err.message) ? err.message : String(err);
        if (msg.toLowerCase().includes('cancel')) {
          return null;
        }
        console.warn('Capacitor Camera falhou, usando seletor Web:', err);
      }
    }

    // Fallback Web: input file (câmera traseira ou galeria)
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (modo === 'camera') {
        input.setAttribute('capture', 'environment');
      }
      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const compressed = await this._comprimirImagem(ev.target.result);
          resolve(compressed);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  },

  // ===== Gerenciamento de Fotos dentro dos Formulários (Criar / Editar) =====

  /** Inicializa o buffer de fotos para um formulário e retorna o HTML da seção de fotos */
  htmlFormFotos(collection, id) {
    const rec = (collection && id) ? Store.getById(collection, id) : null;
    this._formFotos = (rec && Array.isArray(rec.fotos)) ? JSON.parse(JSON.stringify(rec.fotos)) : [];
    this._formActive = true;

    return `
      <div class="form-group" style="border-top:1px solid var(--border);padding-top:var(--space-sm);margin-top:var(--space-sm)">
        <label class="form-label">📷 Fotos do Relatório (<span id="form-fotos-count">${this._formFotos.length}</span>)</label>
        <div style="display:flex;gap:var(--space-xs);margin-bottom:var(--space-xs)">
          <input class="form-input" id="form-foto-legenda" placeholder="Legenda da foto (opcional)" style="min-height:38px;font-size:.85rem">
        </div>
        <div style="display:flex;gap:var(--space-xs)">
          <button type="button" class="btn btn--secondary" style="flex:1;min-height:38px;font-size:.8rem" onclick="CameraHelper.addFotoNoForm('camera')">
            📷 Tirar Foto
          </button>
          <button type="button" class="btn btn--secondary" style="flex:1;min-height:38px;font-size:.8rem" onclick="CameraHelper.addFotoNoForm('galeria')">
            🖼️ Da Galeria
          </button>
        </div>
        <div id="form-fotos-grid" class="fotos-grid">
          ${this._renderFormThumbsHTML()}
        </div>
      </div>
    `;
  },

  _renderFormThumbsHTML() {
    if (!this._formFotos || this._formFotos.length === 0) {
      return '<p class="text-sm text-muted" style="grid-column:1/-1;margin-top:4px">Nenhuma foto anexada.</p>';
    }
    return this._formFotos.map((f, idx) => `
      <div class="foto-thumb">
        <img src="${f.src}" alt="Foto ${idx + 1}">
        ${f.legenda ? `<div class="foto-thumb__caption">${UI.esc(f.legenda)}</div>` : ''}
        <button type="button" class="foto-thumb__remove" onclick="CameraHelper.removerFotoDoForm(${idx})" title="Remover foto">✕</button>
      </div>
    `).join('');
  },

  _atualizarFormGrid() {
    const grid = document.getElementById('form-fotos-grid');
    const count = document.getElementById('form-fotos-count');
    if (grid) grid.innerHTML = this._renderFormThumbsHTML();
    if (count) count.textContent = String(this._formFotos.length);
  },

  async addFotoNoForm(modo = 'camera') {
    const legInput = document.getElementById('form-foto-legenda');
    const legenda = legInput ? legInput.value.trim() : '';
    const dataUrl = await this.capturarFoto(modo);
    if (!dataUrl) return;
    this._formFotos.push({
      src: dataUrl,
      legenda: legenda,
      data: new Date().toISOString()
    });
    if (legInput) legInput.value = '';
    this._atualizarFormGrid();
    UI.toast('Foto anexada ao relatório!', 'success');
  },

  removerFotoDoForm(idx) {
    this._formFotos.splice(idx, 1);
    this._atualizarFormGrid();
  },

  consumeFormFotos() {
    const fotos = this._formFotos ? [...this._formFotos] : [];
    this._formActive = false;
    this._formFotos = [];
    return fotos;
  },

  // ===== Exibição de Miniaturas nos Cards e Detalhes =====

  /** Retorna HTML de miniaturas para exibir nos cards das listagens */
  htmlCardThumbs(rec) {
    if (!rec || !rec.fotos || rec.fotos.length === 0) return '';
    return `
      <div class="card-thumbs">
        ${rec.fotos.slice(0, 4).map(f => `<img src="${f.src}" alt="Miniatura">`).join('')}
        ${rec.fotos.length > 4 ? `<span class="badge badge--info" style="align-self:center">+${rec.fotos.length - 4}</span>` : ''}
      </div>
    `;
  },

  /** Retorna HTML de miniaturas para exibir no modal de detalhes */
  htmlDetailThumbs(collection, id) {
    const rec = Store.getById(collection, id);
    const fotos = (rec && rec.fotos) ? rec.fotos : [];
    return `
      <div class="form-group" style="border-top:1px solid var(--border);padding-top:var(--space-sm);margin-top:var(--space-sm)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
          <label class="form-label" style="margin:0">📷 Fotos Anexadas (${fotos.length})</label>
          <div style="display:flex;gap:4px">
            <button type="button" class="btn btn--secondary" style="min-height:28px;padding:2px 8px;font-size:.75rem" onclick="CameraHelper.adicionarFotoDireto('${collection}','${id}','camera')">+ Câmera</button>
            <button type="button" class="btn btn--secondary" style="min-height:28px;padding:2px 8px;font-size:.75rem" onclick="CameraHelper.adicionarFotoDireto('${collection}','${id}','galeria')">+ Galeria</button>
          </div>
        </div>
        ${fotos.length === 0
          ? '<p class="text-sm text-muted">Nenhuma foto registrada.</p>'
          : `<div class="fotos-grid">
              ${fotos.map((f, i) => `
                <div class="foto-thumb" style="cursor:pointer" onclick="UI.closeModal(true);CameraHelper.verFotos('${collection}','${id}')">
                  <img src="${f.src}" alt="Foto ${i + 1}">
                  ${f.legenda ? `<div class="foto-thumb__caption">${UI.esc(f.legenda)}</div>` : ''}
                </div>
              `).join('')}
            </div>`
        }
      </div>
    `;
  },

  async adicionarFotoDireto(collection, id, modo = 'camera') {
    const dataUrl = await this.capturarFoto(modo);
    if (!dataUrl) return;
    const rec = Store.getById(collection, id);
    if (!rec) return;
    if (!rec.fotos) rec.fotos = [];
    rec.fotos.push({
      src: dataUrl,
      legenda: '',
      data: new Date().toISOString()
    });
    Store.update(collection, id, { fotos: rec.fotos });
    UI.toast('Foto adicionada!', 'success');
    UI.closeModal(true);
    this.verFotos(collection, id);
  },

  /** Adiciona uma foto a um registro existente */
  async adicionarFoto(collection, id, legenda, modo = 'camera') {
    const dataUrl = await this.capturarFoto(modo);
    if (!dataUrl) { UI.toast('Captura cancelada'); return null; }

    const rec = Store.getById(collection, id);
    if (!rec) { UI.toast('Registro não encontrado', 'error'); return null; }

    if (!rec.fotos) rec.fotos = [];
    rec.fotos.push({
      src: dataUrl,
      legenda: legenda || '',
      data: new Date().toISOString()
    });

    Store.update(collection, id, { fotos: rec.fotos });
    UI.toast('Foto adicionada!', 'success');
    return rec;
  },

  /** Remove uma foto de um registro */
  removerFoto(collection, id, index) {
    const rec = Store.getById(collection, id);
    if (!rec || !rec.fotos) return;
    rec.fotos.splice(index, 1);
    Store.update(collection, id, { fotos: rec.fotos });
    UI.toast('Foto removida', 'success');
  },

  /** Abre galeria de fotos em modal e permite adicionar novas fotos ou gerar PDF */
  verFotos(collection, id) {
    const rec = Store.getById(collection, id);
    if (!rec) return;
    const fotos = rec.fotos || [];

    const body = `
      <div class="form-group" style="background:var(--surface-alt);padding:var(--space-sm);border-radius:var(--radius-sm)">
        <label class="form-label">Adicionar Nova Foto</label>
        <input class="form-input" id="foto-legenda" placeholder="Legenda da foto (opcional)" style="margin-bottom:var(--space-xs);min-height:38px">
        <div style="display:flex;gap:var(--space-xs)">
          <button class="btn btn--primary" style="flex:1;min-height:38px;font-size:.8rem" onclick="CameraHelper._confirmAddFoto('${collection}','${id}','camera')">
            📷 Tirar Foto
          </button>
          <button class="btn btn--secondary" style="flex:1;min-height:38px;font-size:.8rem" onclick="CameraHelper._confirmAddFoto('${collection}','${id}','galeria')">
            🖼️ Escolher da Galeria
          </button>
        </div>
      </div>
      ${fotos.length === 0
        ? '<p class="text-sm text-muted text-center" style="padding:var(--space-md) 0">Nenhuma foto cadastrada neste relatório.</p>'
        : fotos.map((f, i) => `
          <div style="margin-bottom:var(--space-md);border:1px solid var(--border);border-radius:var(--radius-sm);padding:var(--space-xs)">
            <img src="${f.src}" style="width:100%;max-height:260px;object-fit:contain;border-radius:var(--radius-sm);background:#000">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
              <span class="text-sm text-muted">${f.legenda ? UI.esc(f.legenda) : `Foto #${i + 1}`}</span>
              <button class="btn btn--danger" style="font-size:.75rem;padding:4px 10px;min-height:30px"
                onclick="CameraHelper.removerFoto('${collection}','${id}',${i});CameraHelper.verFotos('${collection}','${id}')">
                🗑 Remover
              </button>
            </div>
          </div>
        `).join('')
      }
    `;

    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        <button class="btn btn--primary btn--full" onclick="ExportHelper.gerarPDFRegistro('${collection}','${id}')">
          📄 Gerar PDF com Fotos em Miniatura
        </button>
        <button class="btn btn--secondary btn--full" onclick="UI.closeModal()">Fechar</button>
      </div>
    `;
    UI.showModal(`📷 Fotos (${fotos.length})`, body, footer);
  },

  async _confirmAddFoto(collection, id, modo = 'camera') {
    const legenda = document.getElementById('foto-legenda')?.value.trim() || '';
    await this.adicionarFoto(collection, id, legenda, modo);
    this.verFotos(collection, id);
  },

  /** Renderiza botões de Fotos + Gerar PDF para modais de detalhes e compartilhamento */
  botaoFotos(collection, id) {
    const rec = Store.getById(collection, id);
    const qtd = (rec && rec.fotos) ? rec.fotos.length : 0;
    return `
      <div style="display:flex;gap:var(--space-xs);width:100%">
        <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal(true);CameraHelper.verFotos('${collection}','${id}')">
          📷 Fotos (${qtd})
        </button>
        <button class="btn btn--primary" style="flex:1" onclick="ExportHelper.gerarPDFRegistro('${collection}','${id}')">
          📄 Gerar PDF
        </button>
      </div>
    `;
  },

  /** Inicia captura e retorna dataUrl (uso direto nos módulos) */
  async capturarParaTexto() {
    return await this.capturarFoto('camera');
  }
};

window.CameraHelper = CameraHelper;
