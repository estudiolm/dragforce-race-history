/* =========================================================
   DRAGFORCE · PÁGINA FICHA DO CARRO
   ========================================================= */

var DF = window.DF || {};
DF.pages = DF.pages || {};

DF.pages.carDetail = {
  chartInstance: null,

  statusBadge(status) {
    const map = {
      ok: { cls: 'badge-success', label: 'OK', icon: '✅' },
      attention: { cls: 'badge-warning', label: 'Atenção', icon: '⚠️' },
      critical: { cls: 'badge-danger', label: 'Crítico', icon: '⛔' },
    };
    const m = map[status] || map.ok;
    return `<span class="badge ${m.cls}">${m.icon} ${m.label}</span>`;
  },

  async render(root, carId) {
    const car = await DF.db.getCar(carId);
    if (!car) {
      root.innerHTML = `<div class="empty-state">Carro não encontrado. <a href="#/carros" style="color:var(--df-red-bright)">Voltar para a garagem</a>.</div>`;
      return;
    }
    const summary = await DF.db.getCarSummary(carId);
    const photo = DF.ui.carPhotoSrc(car);
    const hasPhoto = !!car.photo;

    root.innerHTML = `
      <a href="#/carros" style="display:inline-flex;align-items:center;gap:6px;color:var(--text-secondary);font-size:13px;margin-bottom:var(--space-4)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Voltar para a garagem
      </a>

      <div class="car-media car-media--hero car-media--clickable" id="hero-media" data-lightbox="${photo}" data-alt="${DF.utils.escapeHtml(car.name)}">
        <img src="${photo}" alt="${hasPhoto ? DF.utils.escapeHtml(car.name) : 'Sem foto cadastrada'}" />
        <div class="car-media__scrim"></div>
        <button class="car-media__zoom" aria-label="Ampliar foto" tabindex="-1" style="opacity:1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-edit-photo" style="position:absolute;bottom:16px;right:16px">Trocar foto</button>
      </div>

      <div class="page-head" style="margin-top:var(--space-5)">
        <div>
          ${car.category ? `<div class="eyebrow" style="margin-bottom:8px"><span class="category-pill">${DF.utils.escapeHtml(car.category)}</span></div>` : ''}
          <h1 class="page-title">${DF.utils.escapeHtml(car.name)}</h1>
          <p class="page-subtitle">Piloto: ${DF.utils.escapeHtml(car.pilot || '—')}${car.notes ? ` · ${DF.utils.escapeHtml(car.notes)}` : ''}</p>
        </div>
        <button class="btn btn-ghost" id="btn-edit-car">Editar carro</button>
      </div>

      <div class="stat-grid" style="margin-bottom:var(--space-6)">
        <div class="stat-tile stat-tile--accent">
          <div class="stat-tile__label">🏆 Melhor tempo</div>
          <div class="stat-tile__value">${summary.bestTime != null ? DF.utils.formatTime(summary.bestTime) : '—'}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label">⚡ Total de passadas</div>
          <div class="stat-tile__value">${summary.totalPasses}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label">🏁 Total de eventos</div>
          <div class="stat-tile__value">${summary.totalEvents}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label">🔧 Inspeções</div>
          <div class="stat-tile__value">${summary.totalInspections}</div>
        </div>
      </div>

      <div class="section-head"><div class="section-title">Evolução de tempos</div></div>
      <div class="chart-card">
        ${summary.passes.length ? `<div class="chart-card__canvas-wrap"><canvas id="evo-chart"></canvas></div>` : `<div class="empty-state">Sem passadas registradas ainda para gerar o gráfico.</div>`}
      </div>

      <div class="section-head"><div class="section-title">Histórico de eventos</div></div>
      ${summary.events.length ? `
        <div class="timeline" style="margin-bottom:var(--space-6)">
          ${summary.events.map((ev) => {
            const evPasses = summary.passes.filter((p) => p.eventId === ev.id);
            const evBest = evPasses.length ? Math.min(...evPasses.map((p) => p.time)) : null;
            return `
              <div class="timeline-item">
                <div class="timeline-item__date mono">${DF.utils.formatDateLong(ev.date)}</div>
                <div class="timeline-item__card">
                  <div class="timeline-item__title">${DF.utils.escapeHtml(ev.name)}</div>
                  <div class="timeline-item__desc">📍 ${DF.utils.escapeHtml(ev.location)}</div>
                  <div class="timeline-item__row">
                    <span class="badge badge-accent">🏆 ${evBest != null ? DF.utils.formatTime(evBest) : '—'}</span>
                    <span class="badge">⚡ ${evPasses.length} passadas</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `<div class="empty-state" style="margin-bottom:var(--space-6)">Nenhum evento registrado ainda.</div>`}

      <div class="section-head"><div class="section-title">Últimas passadas</div></div>
      ${summary.passes.length ? `
        <div class="table-wrap" style="margin-bottom:var(--space-6)">
          <table class="dt">
            <thead><tr><th>Data</th><th>Evento</th><th class="num">Tempo</th><th class="num">Vel. trap</th><th class="num">Reação</th></tr></thead>
            <tbody>
              ${summary.passes.slice(0, 12).map((p) => {
                const ev = summary.events.find((e) => e.id === p.eventId);
                const isBest = summary.bestTime != null && p.time === summary.bestTime;
                return `
                  <tr>
                    <td class="num">${DF.utils.formatDate(p.date)}</td>
                    <td>${ev ? DF.utils.escapeHtml(ev.name) : '—'}</td>
                    <td class="num ${isBest ? 'best' : ''}">${DF.utils.formatTime(p.time)}${isBest ? ' 🏆' : ''}</td>
                    <td class="num">${DF.utils.formatSpeed(p.trapSpeed)}</td>
                    <td class="num">${p.reactionTime != null ? p.reactionTime.toFixed(3) : '—'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : `<div class="empty-state" style="margin-bottom:var(--space-6)">Nenhuma passada registrada ainda.</div>`}

      <div class="section-head"><div class="section-title">Inspeções</div></div>
      ${summary.inspections.length ? `
        <div class="table-wrap" style="margin-bottom:var(--space-6)">
          <table class="dt">
            <thead><tr><th>Data</th><th>Tipo</th><th>Status</th><th>Observações</th></tr></thead>
            <tbody>
              ${summary.inspections.map((i) => `
                <tr>
                  <td class="num">${DF.utils.formatDate(i.date)}</td>
                  <td>${DF.utils.escapeHtml(i.type)}</td>
                  <td>${DF.pages.carDetail.statusBadge(i.status)}</td>
                  <td>${DF.utils.escapeHtml(i.notes || '—')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `<div class="empty-state">Nenhuma inspeção registrada ainda.</div>`}
    `;

    // lightbox
    root.querySelectorAll('[data-lightbox]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('#btn-edit-photo')) return;
        DF.ui.openLightbox(el.getAttribute('data-lightbox'), el.getAttribute('data-alt'));
      });
    });

    root.querySelector('#btn-edit-car').addEventListener('click', () => {
      DF.ui.openCarForm(car, () => DF.router.render());
    });
    root.querySelector('#btn-edit-photo').addEventListener('click', (e) => {
      e.stopPropagation();
      DF.ui.openCarForm(car, () => DF.router.render());
    });

    // chart
    if (summary.passes.length) {
      const byEvent = summary.events.slice().sort((a, b) => (a.date > b.date ? 1 : -1)).map((ev) => {
        const evPasses = summary.passes.filter((p) => p.eventId === ev.id);
        const best = evPasses.length ? Math.min(...evPasses.map((p) => p.time)) : null;
        return { label: DF.utils.formatDate(ev.date), best };
      }).filter((x) => x.best != null);

      const ctx = root.querySelector('#evo-chart').getContext('2d');
      if (DF.pages.carDetail.chartInstance) DF.pages.carDetail.chartInstance.destroy();
      DF.pages.carDetail.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: byEvent.map((x) => x.label),
          datasets: [{
            label: 'Melhor tempo (s)',
            data: byEvent.map((x) => x.best),
            borderColor: '#ff3232',
            backgroundColor: (c) => {
              const g = c.chart.ctx.createLinearGradient(0, 0, 0, 280);
              g.addColorStop(0, 'rgba(224,7,16,0.32)');
              g.addColorStop(1, 'rgba(224,7,16,0.02)');
              return g;
            },
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#0b0c11',
            pointBorderColor: '#ff3232',
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            borderWidth: 2.5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#191c29',
              borderColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1,
              titleColor: '#f2f4f8',
              bodyColor: '#9aa1b2',
              padding: 10,
              titleFont: { family: 'Rajdhani', weight: '700' },
              bodyFont: { family: 'JetBrains Mono' },
              callbacks: { label: (item) => `${item.formattedValue}s` },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#5d6273', font: { family: 'JetBrains Mono', size: 11 } },
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#5d6273', font: { family: 'JetBrains Mono', size: 11 }, callback: (v) => `${v}s` },
            },
          },
        },
      });
    }
  },
};

window.DF = DF;
