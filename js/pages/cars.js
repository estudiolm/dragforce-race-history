/* =========================================================
   DRAGFORCE · PÁGINA CARROS (listagem em cards)
   ========================================================= */

var DF = window.DF || {};
DF.pages = DF.pages || {};

DF.pages.cars = {
  cardHtml(car, summary) {
    const photo = DF.ui.carPhotoSrc(car);
    const hasPhoto = !!car.photo;
    const last = summary.lastEvent;
    return `
      <article class="car-card" data-car-id="${car.id}">
        <div class="car-media car-media--clickable" data-lightbox="${photo}" data-alt="${DF.utils.escapeHtml(car.name)}">
          <img loading="lazy" src="${photo}" alt="${hasPhoto ? DF.utils.escapeHtml(car.name) : 'Sem foto cadastrada'}" />
          <div class="car-media__scrim"></div>
          <button class="car-media__zoom" aria-label="Ampliar foto" tabindex="-1">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
        </div>
        <div class="car-card__body">
          <div>
            <div class="car-card__name">${DF.utils.escapeHtml(car.name)}</div>
            <div class="car-card__meta">
              <span>Piloto: ${DF.utils.escapeHtml(car.pilot || '—')}</span>
              ${car.category ? `<span class="dot"></span><span class="category-pill">${DF.utils.escapeHtml(car.category)}</span>` : ''}
            </div>
          </div>

          <div class="car-card__highlight">
            <span class="car-card__highlight-label">🏆 Melhor</span>
            <span class="car-card__highlight-value">${summary.bestTime != null ? summary.bestTime.toFixed(3) : '—'}</span>
            <span class="car-card__highlight-unit">${summary.bestTime != null ? 's' : ''}</span>
          </div>

          <div class="car-card__stats">
            <span>🏁 <strong>${summary.totalEvents}</strong>&nbsp;eventos</span>
            <span>⚡ <strong>${summary.totalPasses}</strong>&nbsp;passadas</span>
          </div>

          <div class="car-card__last">
            Última atividade:<br/>
            <b>${last ? `${DF.utils.escapeHtml(last.location)} — ${DF.utils.formatDate(last.date)}` : 'Sem registros ainda'}</b>
          </div>
        </div>
        <div class="car-card__footer">
          <button class="btn btn-secondary btn-block" data-open="${car.id}">Abrir carro</button>
        </div>
      </article>
    `;
  },

  wireCardEvents(container) {
    container.querySelectorAll('[data-lightbox]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        DF.ui.openLightbox(el.getAttribute('data-lightbox'), el.getAttribute('data-alt'));
      });
    });
    container.querySelectorAll('[data-open]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.hash = `#/carros/${btn.getAttribute('data-open')}`;
      });
    });
    container.querySelectorAll('.car-card').forEach((card) => {
      card.addEventListener('click', () => {
        window.location.hash = `#/carros/${card.getAttribute('data-car-id')}`;
      });
    });
  },

  async render(root) {
    const cars = await DF.db.listCars();
    const summaries = await Promise.all(cars.map((c) => DF.db.getCarSummary(c.id)));

    root.innerHTML = `
      <div class="page-head">
        <div>
          <div class="eyebrow" style="margin-bottom:8px">Garagem</div>
          <h1 class="page-title">Carros</h1>
          <p class="page-subtitle">Todos os carros da equipe, com desempenho e histórico consolidados.</p>
        </div>
        <button class="btn btn-primary" id="btn-new-car">+ Novo carro</button>
      </div>

      <div class="toolbar">
        <div class="search-input">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="car-search" placeholder="Buscar por carro ou piloto..." />
        </div>
      </div>

      <div class="car-grid" id="cars-grid"></div>
    `;

    const grid = root.querySelector('#cars-grid');

    const draw = (filter = '') => {
      const f = filter.trim().toLowerCase();
      const filtered = cars
        .map((c, i) => ({ car: c, summary: summaries[i] }))
        .filter(({ car }) => !f || car.name.toLowerCase().includes(f) || (car.pilot || '').toLowerCase().includes(f));

      grid.innerHTML = filtered.map(({ car, summary }) => DF.pages.cars.cardHtml(car, summary)).join('') + `
        <button class="car-card car-card--add" id="add-car-card">
          <div>
            <div class="add-icon">+</div>
            <div style="font-family:var(--font-heading);font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-primary)">Adicionar carro</div>
            <div style="font-size:12.5px;margin-top:4px">Cadastre um novo carro na garagem</div>
          </div>
        </button>
      `;
      DF.pages.cars.wireCardEvents(grid);
      const addCard = grid.querySelector('#add-car-card');
      if (addCard) addCard.addEventListener('click', openNewCar);
    };

    function openNewCar() {
      DF.ui.openCarForm(null, () => DF.router.render());
    }

    root.querySelector('#btn-new-car').addEventListener('click', openNewCar);
    root.querySelector('#car-search').addEventListener('input', (e) => draw(e.target.value));

    draw();
  },
};

window.DF = DF;
