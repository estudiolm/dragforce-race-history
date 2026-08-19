/* =========================================================
   DRAGFORCE · UI COMPARTILHADA
   Header ativo, modais, lightbox, formulário de carro, uploader.
   ========================================================= */

var DF = window.DF || {};
const PLACEHOLDER_CAR_IMG = 'assets/car-placeholder.svg';

DF.ui = {
  setActiveNav(path) {
    DF.utils.qsa('.main-nav a').forEach((a) => {
      const route = a.getAttribute('data-route');
      const isActive = route === '/' ? path === '/' : path.startsWith(route);
      a.classList.toggle('active', isActive);
    });
    const nav = DF.utils.qs('#main-nav');
    if (nav) nav.classList.remove('open');
  },

  carPhotoSrc(car) {
    return car && car.photo ? car.photo : PLACEHOLDER_CAR_IMG;
  },

  openLightbox(src, alt = '') {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.innerHTML = `
      <button class="lightbox__close" aria-label="Fechar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <img src="${src}" alt="${DF.utils.escapeHtml(alt)}" />
    `;
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.lightbox__close').addEventListener('click', close);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
    document.body.appendChild(overlay);
  },

  openModal({ title, bodyHtml, footerHtml, onMount, className = '' }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-panel ${className}">
        <div class="modal-header">
          <h3 class="modal-title">${DF.utils.escapeHtml(title)}</h3>
          <button class="btn-icon" data-close aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    document.body.appendChild(overlay);
    if (onMount) onMount(overlay, close);
    return { overlay, close };
  },

  /**
   * Anexa comportamento de upload/preview a um elemento .uploader
   * (input[type=file] interno). Chama onChange(dataUrl) quando concluído.
   */
  wireUploader(container, currentPhoto, onChange) {
    const input = container.querySelector('input[type=file]');
    const preview = container.querySelector('img.uploader-preview');
    const hint = container.querySelector('.uploader__hint');

    const renderPreview = (src) => {
      if (preview) {
        preview.src = src || '';
        preview.style.display = src ? 'block' : 'none';
      }
      if (hint) hint.style.display = src ? 'none' : 'flex';
      let badge = container.querySelector('.uploader__badge');
      if (src && !badge) {
        badge = document.createElement('span');
        badge.className = 'uploader__badge';
        badge.textContent = 'Trocar foto';
        container.appendChild(badge);
      } else if (!src && badge) {
        badge.remove();
      }
    };

    renderPreview(currentPhoto);

    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        DF.utils.toast('Otimizando imagem...', { spinner: true, persist: true });
        const dataUrl = await DF.utils.processCarPhoto(file);
        renderPreview(dataUrl);
        onChange(dataUrl);
        DF.utils.toast('Foto atualizada.');
      } catch (err) {
        DF.utils.toast(err.message || 'Erro ao processar imagem.');
      } finally {
        const t = document.querySelector('.toast');
        if (t && t.textContent.includes('Otimizando')) t.remove();
      }
    });
  },

  /**
   * Abre o modal de cadastro/edição de carro.
   * onSaved(car) é chamado após persistir com sucesso.
   */
  openCarForm(existingCar, onSaved) {
    const isEdit = !!existingCar;
    let photoData = existingCar ? existingCar.photo : null;

    const bodyHtml = `
      <div class="field">
        <label>Foto do carro</label>
        <div class="uploader" id="car-photo-uploader">
          <input type="file" accept="image/png,image/jpeg,image/webp" />
          <img class="uploader-preview" alt="" style="display:none" />
          <div class="uploader__hint">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 6px"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
            <div>Clique para enviar a foto do carro</div>
            <div style="opacity:.6;margin-top:2px">JPG, PNG ou WEBP · até 15MB</div>
          </div>
        </div>
      </div>
      <div class="field">
        <label>Nome do carro</label>
        <input type="text" id="cf-name" placeholder="Ex: GOL AP 2.1" value="${DF.utils.escapeHtml(existingCar?.name || '')}" />
      </div>
      <div class="field-row">
        <div class="field">
          <label>Piloto</label>
          <input type="text" id="cf-pilot" placeholder="Ex: Fernando" value="${DF.utils.escapeHtml(existingCar?.pilot || '')}" />
        </div>
        <div class="field">
          <label>Categoria</label>
          <input type="text" id="cf-category" placeholder="Ex: Índex 8.90" value="${DF.utils.escapeHtml(existingCar?.category || '')}" />
        </div>
      </div>
      <div class="field">
        <label>Observações (opcional)</label>
        <textarea id="cf-notes" rows="3" placeholder="Motor, chassi, configuração...">${DF.utils.escapeHtml(existingCar?.notes || '')}</textarea>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-ghost" data-close>Cancelar</button>
      <button class="btn btn-primary" id="cf-save">${isEdit ? 'Salvar alterações' : 'Cadastrar carro'}</button>
    `;

    DF.ui.openModal({
      title: isEdit ? 'Editar carro' : 'Novo carro',
      bodyHtml,
      footerHtml,
      onMount: (overlay, close) => {
        DF.ui.wireUploader(overlay.querySelector('#car-photo-uploader'), photoData, (dataUrl) => { photoData = dataUrl; });

        overlay.querySelector('#cf-save').addEventListener('click', async () => {
          const name = overlay.querySelector('#cf-name').value.trim();
          const pilot = overlay.querySelector('#cf-pilot').value.trim();
          const category = overlay.querySelector('#cf-category').value.trim();
          const notes = overlay.querySelector('#cf-notes').value.trim();
          if (!name) { DF.utils.toast('Dê um nome ao carro para continuar.'); return; }

          overlay.querySelector('#cf-save').disabled = true;
          try {
            let car;
            if (existingCar) {
              let photo = existingCar.photo;
              if (photoData && photoData !== existingCar.photo) {
                photo = await DF.db.uploadPhoto(existingCar.id, photoData);
              }
              car = await DF.db.putCar({ ...existingCar, name, pilot, category, notes, photo });
            } else {
              // salva primeiro (para ganhar um id), depois sobe a foto usando esse id
              car = await DF.db.putCar({ name, pilot, category, notes, photo: null });
              if (photoData) {
                const photo = await DF.db.uploadPhoto(car.id, photoData);
                car = await DF.db.putCar({ ...car, photo });
              }
            }
            close();
            DF.utils.toast(isEdit ? 'Carro atualizado.' : 'Carro cadastrado.');
            onSaved && onSaved(car);
          } catch (err) {
            DF.utils.toast(err.message || 'Erro ao salvar o carro.');
            overlay.querySelector('#cf-save').disabled = false;
          }
        });
      },
    });
  },
};

window.DF = DF;
