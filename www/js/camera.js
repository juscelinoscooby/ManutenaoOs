/* ===== Camera Helper (Capacitor + Web fallback) ===== */

const CameraHelper = {
  /** Captura foto via câmera nativa (Capacitor) ou input file (Web) */
  async capturarFoto() {
    if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('Camera')) {
      try {
        const { Camera, CameraResultType, CameraSource } = window.Capacitor.Plugins;
        const img = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });
        return img.dataUrl;
      } catch (err) {
        if (err && err.message && err.message.indexOf('User cancelled') === -1) {
          console.error('Erro na câmera:', err);
        }
        return null;
      }
    }

    // Fallback Web: input file com captura de câmera traseira
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');
      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  },

  /** Adiciona uma foto a um registro existente */
  async adicionarFoto(collection, id, legenda) {
    const dataUrl = await this.capturarFoto();
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

  /** Abre galeria de fotos em modal */
  verFotos(collection, id) {
    const rec = Store.getById(collection, id);
    if (!rec || !rec.fotos || rec.fotos.length === 0) {
      UI.toast('Nenhuma foto registrada');
      return;
    }
    const body = rec.fotos.map((f, i) => `
      <div style="margin-bottom:var(--space-md)">
        <img src="${f.src}" style="width:100%;border-radius:var(--radius-sm);border:1px solid var(--border)">
        ${f.legenda ? `<p class="text-sm text-muted" style="margin-top:4px">${UI.esc(f.legenda)}</p>` : ''}
        <button class="btn btn--danger" style="font-size:.75rem;padding:4px 10px;min-height:32px;margin-top:6px"
          onclick="CameraHelper.removerFoto('${collection}','${id}',${i});CameraHelper.verFotos('${collection}','${id}')">
          🗑 Remover
        </button>
      </div>
    `).join('');

    const footer = `
      <div style="display:flex;flex-direction:column;gap:var(--space-xs);width:100%">
        <button class="btn btn--primary btn--full" onclick="CameraHelper._addFotoModal('${collection}','${id}')">➕ Adicionar Foto</button>
        <button class="btn btn--secondary btn--full" onclick="UI.closeModal()">Fechar</button>
      </div>
    `;
    UI.showModal('📷 Fotos do Registro', body, footer);
  },

  _addFotoModal(collection, id) {
    UI.closeModal();
    const rec = Store.getById(collection, id);
    if (!rec) return;
    setTimeout(() => {
      const body = `
        <div class="form-group">
          <label class="form-label">Legenda da foto (opcional)</label>
          <input class="form-input" id="foto-legenda" placeholder="Ex: Detalhe do defeito">
        </div>
      `;
      const footer = `
        <button class="btn btn--secondary" style="flex:1" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn--primary" style="flex:1" onclick="CameraHelper._confirmAddFoto('${collection}','${id}')">📷 Capturar Foto</button>
      `;
      UI.showModal('Nova Foto', body, footer);
    }, 260);
  },

  async _confirmAddFoto(collection, id) {
    const legenda = document.getElementById('foto-legenda')?.value.trim() || '';
    UI.closeModal();
    await this.adicionarFoto(collection, id, legenda);
    setTimeout(() => this.verFotos(collection, id), 260);
  },

  /** Renderiza botão de fotos para modais de detalhes */
  botaoFotos(collection, id) {
    const rec = Store.getById(collection, id);
    const qtd = (rec && rec.fotos) ? rec.fotos.length : 0;
    return `
      <button class="btn btn--secondary btn--full" onclick="UI.closeModal();setTimeout(() => CameraHelper.verFotos('${collection}','${id}'), 260)">
        📷 Fotos (${qtd})
      </button>
    `;
  },

  /** Inicia captura e retorna dataUrl (uso direto nos módulos) */
  async capturarParaTexto() {
    return await this.capturarFoto();
  }
};

window.CameraHelper = CameraHelper;
