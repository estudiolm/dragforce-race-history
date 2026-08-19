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

  /**
   * Abre o modal de cadastro de evento para um carro.
   * onSaved(event) é chamado após persistir com sucesso.
   */
  openEventForm(carId, onSaved) {
    const bodyHtml = `
      <div class="field">
        <label>Nome do evento</label>
        <input type="text" id="ef-name" placeholder="Ex: Racing Club — Etapa 5" />
      </div>
      <div class="field-row">
        <div class="field">
          <label>Local</label>
          <input type="text" id="ef-location" placeholder="Ex: Área 48" />
        </div>
        <div class="field">
          <label>Data</label>
          <input type="date" id="ef-date" value="${DF.utils.todayISO()}" />
        </div>
      </div>
    `;
    const footerHtml = `
      <button class="btn btn-ghost" data-close>Cancelar</button>
      <button class="btn btn-primary" id="ef-save">Cadastrar evento</button>
    `;
    DF.ui.openModal({
      title: 'Novo evento',
      bodyHtml,
      footerHtml,
      onMount: (overlay, close) => {
        overlay.querySelector('#ef-save').addEventListener('click', async () => {
          const name = overlay.querySelector('#ef-name').value.trim();
          const location = overlay.querySelector('#ef-location').value.trim();
          const date = overlay.querySelector('#ef-date').value;
          if (!name) { DF.utils.toast('Dê um nome ao evento para continuar.'); return; }
          if (!date) { DF.utils.toast('Informe a data do evento.'); return; }

          overlay.querySelector('#ef-save').disabled = true;
          try {
            const ev = await DF.db.putEvent({ carId, name, location, date });
            close();
            DF.utils.toast('Evento cadastrado.');
            onSaved && onSaved(ev);
          } catch (err) {
            DF.utils.toast(err.message || 'Erro ao salvar o evento.');
            overlay.querySelector('#ef-save').disabled = false;
          }
        });
      },
    });
  },

  /**
   * Abre o modal de cadastro de passada para um carro. Exige pelo menos
   * um evento já cadastrado (a passada pertence a um evento) — se não
   * houver nenhum, abre primeiro o cadastro de evento e encadeia.
   * onSaved(pass) é chamado após persistir com sucesso.
   */
  async openPassForm(carId, onSaved) {
    const events = await DF.db.listEventsByCar(carId);
    if (!events.length) {
      DF.utils.toast('Cadastre um evento antes de registrar uma passada.');
      DF.ui.openEventForm(carId, () => DF.ui.openPassForm(carId, onSaved));
      return;
    }

    const bodyHtml = `
      <div class="field">
        <label>Evento</label>
        <select id="pf-event">
          ${events.map((ev) => `<option value="${ev.id}">${DF.utils.escapeHtml(ev.name)} — ${DF.utils.formatDate(ev.date)}</option>`).join('')}
        </select>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Pista</label>
          <select id="pf-lane">
            <option value="E">Esquerda (E)</option>
            <option value="D">Direita (D)</option>
          </select>
        </div>
        <div class="field">
          <label>Status</label>
          <select id="pf-status">
            <option value="valido">✅ Válido</option>
            <option value="queimou">🔥 Queimou</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Reação (s)</label>
          <input type="number" id="pf-reaction" step="0.001" placeholder="Ex: 0.045" />
        </div>
        <div class="field">
          <label>Vel. final (km/h)</label>
          <input type="number" id="pf-trap" step="0.1" min="0" placeholder="Ex: 165.4" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>60 pés (s)</label>
          <input type="number" id="pf-t60" step="0.001" min="0" placeholder="Ex: 1.320" />
        </div>
        <div class="field">
          <label>100m (s)</label>
          <input type="number" id="pf-t100" step="0.001" min="0" placeholder="Ex: 5.210" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>201m (s)</label>
          <input type="number" id="pf-t201" step="0.001" min="0" placeholder="Ex: 8.840" />
        </div>
        <div class="field">
          <label>Total (reação + 201m)</label>
          <input type="text" id="pf-total" disabled placeholder="—" />
        </div>
      </div>
      <div class="field">
        <label>Observações (opcional)</label>
        <textarea id="pf-notes" rows="2" placeholder="Condições da pista, ajustes..."></textarea>
      </div>
    `;
    const footerHtml = `
      <button class="btn btn-ghost" data-close>Cancelar</button>
      <button class="btn btn-primary" id="pf-save">Registrar passada</button>
    `;
    DF.ui.openModal({
      title: 'Nova passada',
      bodyHtml,
      footerHtml,
      onMount: (overlay, close) => {
        const reactionInput = overlay.querySelector('#pf-reaction');
        const t201Input = overlay.querySelector('#pf-t201');
        const totalInput = overlay.querySelector('#pf-total');

        const updateTotal = () => {
          const r = reactionInput.value !== '' ? Number(reactionInput.value) : null;
          const t = t201Input.value !== '' ? Number(t201Input.value) : null;
          totalInput.value = (r != null && t != null && !isNaN(r) && !isNaN(t)) ? (r + t).toFixed(3) : '';
        };
        reactionInput.addEventListener('input', updateTotal);
        t201Input.addEventListener('input', updateTotal);

        overlay.querySelector('#pf-save').addEventListener('click', async () => {
          const eventId = overlay.querySelector('#pf-event').value;
          const ev = events.find((e) => e.id === eventId);
          const lane = overlay.querySelector('#pf-lane').value;
          const status = overlay.querySelector('#pf-status').value;
          const num = (sel) => { const v = overlay.querySelector(sel).value; return v !== '' ? Number(v) : null; };
          const reactionTime = num('#pf-reaction');
          const trapSpeed = num('#pf-trap');
          const t60 = num('#pf-t60');
          const t100 = num('#pf-t100');
          const t201 = num('#pf-t201');
          const notes = overlay.querySelector('#pf-notes').value.trim();
          const time = (reactionTime != null && t201 != null) ? +(reactionTime + t201).toFixed(3) : null;

          overlay.querySelector('#pf-save').disabled = true;
          try {
            const pass = await DF.db.putPass({
              carId, eventId, date: ev.date, lane, status,
              reactionTime, trapSpeed, t60, t100, t201, time, notes,
            });
            close();
            DF.utils.toast('Passada registrada.');
            onSaved && onSaved(pass);
          } catch (err) {
            DF.utils.toast(err.message || 'Erro ao salvar a passada.');
            overlay.querySelector('#pf-save').disabled = false;
          }
        });
      },
    });
  },

  /**
   * Abre o modal de cadastro de inspeção técnica para um carro.
   * onSaved(inspection) é chamado após persistir com sucesso.
   */
  openInspectionForm(carId, onSaved) {
    const bodyHtml = `
      <div class="field-row">
        <div class="field">
          <label>Data</label>
          <input type="date" id="if-date" value="${DF.utils.todayISO()}" />
        </div>
        <div class="field">
          <label>Status</label>
          <select id="if-status">
            <option value="ok">✅ OK</option>
            <option value="attention">⚠️ Atenção</option>
            <option value="critical">⛔ Crítico</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Tipo de inspeção</label>
        <input type="text" id="if-type" placeholder="Ex: Inspeção técnica geral, paraquedas, gaiola..." />
      </div>
      <div class="field">
        <label>Observações (opcional)</label>
        <textarea id="if-notes" rows="3" placeholder="Detalhes do que foi verificado..."></textarea>
      </div>
    `;
    const footerHtml = `
      <button class="btn btn-ghost" data-close>Cancelar</button>
      <button class="btn btn-primary" id="if-save">Registrar inspeção</button>
    `;
    DF.ui.openModal({
      title: 'Nova inspeção',
      bodyHtml,
      footerHtml,
      onMount: (overlay, close) => {
        overlay.querySelector('#if-save').addEventListener('click', async () => {
          const date = overlay.querySelector('#if-date').value;
          const status = overlay.querySelector('#if-status').value;
          const type = overlay.querySelector('#if-type').value.trim();
          const notes = overlay.querySelector('#if-notes').value.trim();
          if (!date) { DF.utils.toast('Informe a data da inspeção.'); return; }
          if (!type) { DF.utils.toast('Descreva o tipo de inspeção.'); return; }

          overlay.querySelector('#if-save').disabled = true;
          try {
            const insp = await DF.db.putInspection({ carId, date, type, status, notes });
            close();
            DF.utils.toast('Inspeção registrada.');
            onSaved && onSaved(insp);
          } catch (err) {
            DF.utils.toast(err.message || 'Erro ao salvar a inspeção.');
            overlay.querySelector('#if-save').disabled = false;
          }
        });
      },
    });
  },

  /**
   * Abre o modal de cadastro de manutenção para um carro.
   * onSaved(maintenance) é chamado após persistir com sucesso.
   */
  openMaintenanceForm(carId, onSaved) {
    const bodyHtml = `
      <div class="field-row">
        <div class="field">
          <label>Data</label>
          <input type="date" id="mf-date" value="${DF.utils.todayISO()}" />
        </div>
        <div class="field">
          <label>Km / horas (opcional)</label>
          <input type="number" id="mf-km" step="0.1" min="0" placeholder="Ex: 12500" />
        </div>
      </div>
      <div class="field">
        <label>Serviço realizado</label>
        <input type="text" id="mf-type" placeholder="Ex: Troca de óleo do motor, revisão de embreagem..." />
      </div>
      <div class="field">
        <label>Custo em R$ (opcional)</label>
        <input type="number" id="mf-cost" step="0.01" min="0" placeholder="Ex: 850.00" />
      </div>
      <div class="field">
        <label>Observações (opcional)</label>
        <textarea id="mf-notes" rows="3" placeholder="Peças trocadas, oficina, garantia..."></textarea>
      </div>
    `;
    const footerHtml = `
      <button class="btn btn-ghost" data-close>Cancelar</button>
      <button class="btn btn-primary" id="mf-save">Registrar manutenção</button>
    `;
    DF.ui.openModal({
      title: 'Nova manutenção',
      bodyHtml,
      footerHtml,
      onMount: (overlay, close) => {
        overlay.querySelector('#mf-save').addEventListener('click', async () => {
          const date = overlay.querySelector('#mf-date').value;
          const km = overlay.querySelector('#mf-km').value;
          const type = overlay.querySelector('#mf-type').value.trim();
          const cost = overlay.querySelector('#mf-cost').value;
          const notes = overlay.querySelector('#mf-notes').value.trim();
          if (!date) { DF.utils.toast('Informe a data da manutenção.'); return; }
          if (!type) { DF.utils.toast('Descreva o serviço realizado.'); return; }

          overlay.querySelector('#mf-save').disabled = true;
          try {
            const maint = await DF.db.putMaintenance({
              carId, date, type,
              km: km !== '' ? Number(km) : null,
              cost: cost !== '' ? Number(cost) : null,
              notes,
            });
            close();
            DF.utils.toast('Manutenção registrada.');
            onSaved && onSaved(maint);
          } catch (err) {
            DF.utils.toast(err.message || 'Erro ao salvar a manutenção.');
            overlay.querySelector('#mf-save').disabled = false;
          }
        });
      },
    });
  },
};

window.DF = DF;
