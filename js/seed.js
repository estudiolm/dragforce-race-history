/* =========================================================
   DRAGFORCE · DADOS DE EXEMPLO
   Populado apenas na primeira execução, só para demonstrar o layout.
   Pode ser removido a qualquer momento em Configurações (ou limpando
   o IndexedDB do navegador).
   ========================================================= */

var DF = window.DF || {};

DF.seed = {
  async run() {
    const already = await DF.db.getMeta('seeded');
    if (already) return;

    const carId = DF.db.uid('car');
    const car = {
      id: carId,
      name: 'GOL AP 2.1',
      pilot: 'Fernando',
      category: 'Índex 8.90',
      photo: null, // sem foto real cadastrada — usa o placeholder elegante
      notes: 'Motor AP 2.1 turbo, transmissão sequencial, chassi gaiola homologado.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 240).toISOString(),
    };
    await DF.db.putCar(car);

    const events = [
      { name: 'Racing Club — Etapa 1', location: 'Área 48', date: '2026-02-08' },
      { name: 'Templo do Bagre Open', location: 'Templo do Bagre', date: '2026-03-15' },
      { name: 'Racing Club — Etapa 2', location: 'Área 48', date: '2026-04-19' },
      { name: 'Duelo de Turbos', location: 'Autódromo de Interlagos', date: '2026-05-24' },
      { name: 'Racing Club — Etapa 3', location: 'Área 48', date: '2026-06-21' },
      { name: 'Copa Aceleração', location: 'Templo do Bagre', date: '2026-07-19' },
      { name: 'Racing Club — Etapa 4', location: 'Área 48', date: '2026-08-16' },
    ];

    // tempos totais base (reação + 201m) decrescentes (evoluindo) por evento, com variação por passada
    const baseTimes = [9.42, 9.28, 9.15, 9.03, 8.97, 8.94, 8.91];
    let passCount = 0;

    for (let i = 0; i < events.length; i++) {
      const evId = DF.db.uid('evt');
      await DF.db.putEvent({ id: evId, carId, ...events[i] });

      const passesInEvent = i === events.length - 1 ? 6 : Math.floor(Math.random() * 2) + 6; // ~6-7
      for (let j = 0; j < passesInEvent; j++) {
        passCount++;
        const lane = passCount % 2 === 0 ? 'D' : 'E';

        // ordem real dentro do evento (1ª, 2ª, 3ª passada...) — cada tentativa uns
        // minutos depois da anterior no mesmo dia de evento
        const createdAt = new Date(new Date(events[i].date + 'T09:00:00').getTime() + j * 6 * 60000).toISOString();

        // ~1 a cada 8 passadas "queima" a largada (sai no vermelho) — sem tempo válido
        const queimou = passCount % 8 === 0;
        if (queimou) {
          await DF.db.putPass({
            id: DF.db.uid('pass'),
            carId,
            eventId: evId,
            date: events[i].date,
            createdAt,
            lane,
            status: 'queimou',
            reactionTime: +(-(0.005 + Math.random() * 0.06)).toFixed(3),
            trapSpeed: null,
            t60: null,
            t100: null,
            t201: null,
            time: null,
            notes: 'Saída antecipada — queimou a largada.',
          });
          continue;
        }

        const jitter = (Math.random() * 0.18) - 0.03;
        const time = +(baseTimes[i] + jitter).toFixed(3);
        const reactionTime = +(0.02 + Math.random() * 0.38).toFixed(3);
        const t201 = +(time - reactionTime).toFixed(3);
        const t100 = +(t201 * 0.615 + (Math.random() * 0.06 - 0.03)).toFixed(3);
        const t60 = +(t201 * 0.155 + (Math.random() * 0.03 - 0.015)).toFixed(3);
        await DF.db.putPass({
          id: DF.db.uid('pass'),
          carId,
          eventId: evId,
          date: events[i].date,
          createdAt,
          lane,
          status: 'valido',
          reactionTime,
          t60,
          t100,
          t201,
          trapSpeed: +(150 + (9.5 - time) * 22 + Math.random() * 3).toFixed(1),
          time,
          notes: j === 0 ? 'Passada de qualificação' : '',
        });
      }
    }

    const inspections = [
      { date: '2026-02-05', type: 'Inspeção técnica geral', status: 'ok', notes: 'Estrutura, cintos e extintor aprovados para a temporada.' },
      { date: '2026-04-15', type: 'Revisão de motor', status: 'ok', notes: 'Compressão e folgas dentro do padrão. Troca de velas.' },
      { date: '2026-06-18', type: 'Inspeção de segurança (paraquedas/gaiola)', status: 'attention', notes: 'Paraquedas com desgaste no cordame — recomendada substituição em até 2 eventos.' },
      { date: '2026-08-10', type: 'Revisão de transmissão', status: 'ok', notes: 'Óleo trocado, embreagem dentro da vida útil estimada.' },
    ];
    for (const insp of inspections) {
      await DF.db.putInspection({ id: DF.db.uid('insp'), carId, ...insp });
    }

    const maintenances = [
      { date: '2026-01-20', type: 'Revisão geral de pré-temporada', km: 118400, cost: 1450.00, notes: 'Troca de óleo, filtros e velas. Checagem geral do motor.' },
      { date: '2026-03-28', type: 'Troca de embreagem', km: 119050, cost: 3200.00, notes: 'Kit de embreagem reforçado + platô.' },
      { date: '2026-05-30', type: 'Troca de óleo do motor', km: 119600, cost: 380.00, notes: 'Óleo sintético 5W40 + filtro.' },
      { date: '2026-07-25', type: 'Revisão de transmissão sequencial', km: 120100, cost: 950.00, notes: 'Ajuste de câmbio e troca de óleo da caixa.' },
    ];
    for (const m of maintenances) {
      await DF.db.putMaintenance({ id: DF.db.uid('maint'), carId, ...m });
    }

    await DF.db.setMeta('seeded', true);
  },
};

window.DF = DF;
