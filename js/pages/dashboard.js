/* =========================================================
   DRAGFORCE · PÁGINA DASHBOARD
   ========================================================= */

var DF = window.DF || {};

DF.pages = DF.pages || {};

DF.pages.dashboard = {
  async render(root) {
    const cars = await DF.db.listCars();

    const summaries = await Promise.all(cars.map((c) => DF.db.getCarSummary(c.id)));
    const totalPasses = summaries.reduce((s, x) => s + x.totalPasses, 0);
    const totalEvents = new Set(summaries.flatMap((x) => x.events.map((e) => e.location + e.date))).size;

    // melhor tempo da equipe (entre todos os carros) + em qual carro/pista aconteceu,
    // e o melhor tempo de cada lado da pista somando todos os carros — mesmo critério
    // "só 201m" usado em cada carro (DF.utils.laneStats), aplicado ao conjunto todo
    let overallBest = null, overallBestCar = null, overallBestLane = null;
    const teamLaneBest = { E: null, D: null };
    cars.forEach((car, i) => {
      const s = summaries[i];
      if (s.bestTime != null && (overallBest == null || s.bestTime < overallBest)) {
        overallBest = s.bestTime; overallBestCar = car; overallBestLane = s.bestLane;
      }
      ['E', 'D'].forEach((lane) => {
        const v = s.laneBest && s.laneBest[lane];
        if (v != null && (teamLaneBest[lane] == null || v < teamLaneBest[lane])) teamLaneBest[lane] = v;
      });
    });

    // pega o carro com atividade mais recente
    let recent = [];
    cars.forEach((car, i) => {
      summaries[i].events.forEach((ev) => recent.push({ car, ev }));
    });
    recent.sort((a, b) => (a.ev.date < b.ev.date ? 1 : -1));
    recent = recent.slice(0, 6);

    root.innerHTML = `
      <div class="page-head">
        <div>
          <div class="eyebrow" style="margin-bottom:8px">Visão geral da equipe</div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Panorama de desempenho de toda a garagem DragForce em um só lugar.</p>
        </div>
        <a href="#/carros" class="btn btn-primary">Ver todos os carros</a>
      </div>

      <div class="stat-grid" style="margin-bottom:var(--space-6)">
        <div class="stat-tile stat-tile--accent">
          <div class="stat-tile__label">🏆 Melhor tempo da equipe</div>
          <div class="stat-tile__value">${overallBest != null ? DF.utils.formatTime(overallBest) : '—'}</div>
          ${overallBestCar ? `<div class="stat-tile__delta">${DF.utils.escapeHtml(overallBestCar.name)}${overallBestLane ? ` · Pista ${overallBestLane}` : ''}</div>` : ''}
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label">🛣️ Melhor por lado</div>
          ${DF.utils.laneCompareHtml(teamLaneBest)}
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label">🚗 Carros na garagem</div>
          <div class="stat-tile__value">${cars.length}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label">🏁 Eventos disputados</div>
          <div class="stat-tile__value">${totalEvents}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label">⚡ Total de passadas</div>
          <div class="stat-tile__value">${totalPasses}</div>
        </div>
      </div>

      <div class="section-head">
        <div class="section-title">Atividade recente</div>
        <a href="#/carros" style="font-size:13px;color:var(--text-secondary)">Ver garagem completa →</a>
      </div>

      ${recent.length ? `
        <div class="table-wrap" style="margin-bottom:var(--space-6)">
          <table class="dt">
            <thead><tr><th>Carro</th><th>Piloto</th><th>Evento</th><th>Local</th><th>Data</th></tr></thead>
            <tbody>
              ${recent.map((r) => `
                <tr style="cursor:pointer" data-goto="#/carros/${r.car.id}">
                  <td style="color:var(--text-primary);font-family:var(--font-heading);font-weight:600;text-transform:uppercase">${DF.utils.escapeHtml(r.car.name)}</td>
                  <td>${DF.utils.escapeHtml(r.car.pilot || '—')}</td>
                  <td>${DF.utils.escapeHtml(r.ev.name)}</td>
                  <td>${DF.utils.escapeHtml(r.ev.location)}</td>
                  <td class="num">${DF.utils.formatDate(r.ev.date)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state">Nenhuma atividade registrada ainda. Cadastre um carro para começar.</div>
      `}

      <div class="section-head">
        <div class="section-title">Garagem</div>
      </div>
      <div class="car-grid" id="dash-car-grid"></div>
    `;

    root.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => { window.location.hash = el.getAttribute('data-goto'); });
    });

    const grid = root.querySelector('#dash-car-grid');
    grid.innerHTML = cars.slice(0, 3).map((c, i) => DF.pages.cars.cardHtml(c, summaries[i])).join('')
      || `<div class="empty-state" style="grid-column:1/-1">Sua garagem está vazia. <a href="#/carros" style="color:var(--df-red-bright)">Cadastre o primeiro carro</a>.</div>`;
    DF.pages.cars.wireCardEvents(grid);
  },
};

window.DF = DF;
