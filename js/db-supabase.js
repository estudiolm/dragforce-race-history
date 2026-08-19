/* =========================================================
   DRAGFORCE · CAMADA DE DADOS SUPABASE
   Mesma interface de js/db.js (DF.dbLocal), só que lendo/escrevendo
   num projeto Supabase real (Postgres + Auth + Storage) — é o modo
   "produção / equipe" descrito em GUIA-GITHUB-SUPABASE.md.

   Ativado automaticamente pelo bootstrap em js/app.js quando
   js/config.js tem supabaseUrl + supabaseAnonKey preenchidos.
   ========================================================= */

var DF = window.DF || {};

function sbClient() {
  if (!DF.supabase) {
    DF.supabase = window.supabase.createClient(window.DF_CONFIG.supabaseUrl, window.DF_CONFIG.supabaseAnonKey);
  }
  return DF.supabase;
}
DF.supabaseClient = sbClient; // usado também por js/auth.js

function throwIfError(error) {
  if (error) throw new Error(error.message || 'Erro ao falar com o Supabase.');
}

// ---- mapeamento camelCase (app) <-> snake_case (Postgres) ----
const carFromDb = (r) => ({ id: r.id, name: r.name, pilot: r.pilot, category: r.category, notes: r.notes, photo: r.photo_url, createdAt: r.created_at });
const carToDb = (c) => ({ id: c.id, name: c.name, pilot: c.pilot || null, category: c.category || null, notes: c.notes || null, photo_url: c.photo || null });

const eventFromDb = (r) => ({ id: r.id, carId: r.car_id, name: r.name, location: r.location, date: r.date });
const eventToDb = (e) => ({ id: e.id, car_id: e.carId, name: e.name, location: e.location || null, date: e.date });

const passFromDb = (r) => ({
  id: r.id, carId: r.car_id, eventId: r.event_id, date: r.date,
  lane: r.lane, status: r.status || 'valido',
  time: r.time != null ? Number(r.time) : null,
  trapSpeed: r.trap_speed != null ? Number(r.trap_speed) : null,
  reactionTime: r.reaction_time != null ? Number(r.reaction_time) : null,
  t60: r.t_60 != null ? Number(r.t_60) : null,
  t100: r.t_100 != null ? Number(r.t_100) : null,
  t201: r.t_201 != null ? Number(r.t_201) : null,
  notes: r.notes,
});
const passToDb = (p) => ({
  id: p.id, car_id: p.carId, event_id: p.eventId || null, date: p.date,
  lane: p.lane || null, status: p.status || 'valido',
  time: p.time, trap_speed: p.trapSpeed, reaction_time: p.reactionTime,
  t_60: p.t60, t_100: p.t100, t_201: p.t201,
  notes: p.notes || null,
});

const inspFromDb = (r) => ({ id: r.id, carId: r.car_id, date: r.date, type: r.type, status: r.status, notes: r.notes });
const inspToDb = (i) => ({ id: i.id, car_id: i.carId, date: i.date, type: i.type, status: i.status || 'ok', notes: i.notes || null });

const maintFromDb = (r) => ({ id: r.id, carId: r.car_id, date: r.date, type: r.type, km: r.km != null ? Number(r.km) : null, cost: r.cost != null ? Number(r.cost) : null, notes: r.notes });
const maintToDb = (m) => ({ id: m.id, car_id: m.carId, date: m.date, type: m.type, km: m.km != null && m.km !== '' ? Number(m.km) : null, cost: m.cost != null && m.cost !== '' ? Number(m.cost) : null, notes: m.notes || null });

DF.dbSupabase = {
  uid(prefix) {
    // usado só como fallback (o Postgres já gera uuid sozinho ao inserir sem id)
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  },

  async uploadPhoto(carId, dataUrl) {
    const sb = sbClient();
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${carId}/${Date.now()}.jpg`;
    const { error } = await sb.storage.from('car-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    throwIfError(error);
    const { data } = sb.storage.from('car-photos').getPublicUrl(path);
    return data.publicUrl;
  },

  // ---- Cars ----
  async listCars() {
    const { data, error } = await sbClient().from('cars').select('*').order('created_at', { ascending: false });
    throwIfError(error);
    return (data || []).map(carFromDb);
  },
  async getCar(id) {
    const { data, error } = await sbClient().from('cars').select('*').eq('id', id).maybeSingle();
    throwIfError(error);
    return data ? carFromDb(data) : null;
  },
  async putCar(car) {
    const sb = sbClient();
    if (car.id) {
      const { data, error } = await sb.from('cars').update(carToDb(car)).eq('id', car.id).select().single();
      throwIfError(error);
      return carFromDb(data);
    }
    const payload = carToDb(car);
    delete payload.id;
    const { data, error } = await sb.from('cars').insert(payload).select().single();
    throwIfError(error);
    return carFromDb(data);
  },
  async deleteCar(id) {
    const { error } = await sbClient().from('cars').delete().eq('id', id);
    throwIfError(error);
  },

  // ---- Events ----
  async listEventsByCar(carId) {
    const { data, error } = await sbClient().from('events').select('*').eq('car_id', carId).order('date', { ascending: false });
    throwIfError(error);
    return (data || []).map(eventFromDb);
  },
  async putEvent(ev) {
    const sb = sbClient();
    const payload = eventToDb(ev);
    if (!payload.id) delete payload.id;
    const { data, error } = payload.id
      ? await sb.from('events').update(payload).eq('id', payload.id).select().single()
      : await sb.from('events').insert(payload).select().single();
    throwIfError(error);
    return eventFromDb(data);
  },

  // ---- Passes ----
  async listPassesByCar(carId) {
    const { data, error } = await sbClient().from('passes').select('*').eq('car_id', carId).order('date', { ascending: false });
    throwIfError(error);
    return (data || []).map(passFromDb);
  },
  async putPass(p) {
    const sb = sbClient();
    const payload = passToDb(p);
    if (!payload.id) delete payload.id;
    const { data, error } = payload.id
      ? await sb.from('passes').update(payload).eq('id', payload.id).select().single()
      : await sb.from('passes').insert(payload).select().single();
    throwIfError(error);
    return passFromDb(data);
  },
  async deletePass(id) {
    const { error } = await sbClient().from('passes').delete().eq('id', id);
    throwIfError(error);
  },

  // ---- Inspections ----
  async listInspectionsByCar(carId) {
    const { data, error } = await sbClient().from('inspections').select('*').eq('car_id', carId).order('date', { ascending: false });
    throwIfError(error);
    return (data || []).map(inspFromDb);
  },
  async putInspection(i) {
    const sb = sbClient();
    const payload = inspToDb(i);
    if (!payload.id) delete payload.id;
    const { data, error } = payload.id
      ? await sb.from('inspections').update(payload).eq('id', payload.id).select().single()
      : await sb.from('inspections').insert(payload).select().single();
    throwIfError(error);
    return inspFromDb(data);
  },

  // ---- Manutenções ----
  async listMaintenancesByCar(carId) {
    const { data, error } = await sbClient().from('maintenances').select('*').eq('car_id', carId).order('date', { ascending: false });
    throwIfError(error);
    return (data || []).map(maintFromDb);
  },
  async putMaintenance(m) {
    const sb = sbClient();
    const payload = maintToDb(m);
    if (!payload.id) delete payload.id;
    const { data, error } = payload.id
      ? await sb.from('maintenances').update(payload).eq('id', payload.id).select().single()
      : await sb.from('maintenances').insert(payload).select().single();
    throwIfError(error);
    return maintFromDb(data);
  },

  // ---- Meta (não usado em modo Supabase — sem seed automático) ----
  async getMeta() { return undefined; },
  async setMeta() { /* no-op */ },

  // ---- Aggregations ----
  async getCarSummary(carId) {
    const [passes, events, inspections, maintenances] = await Promise.all([
      DF.dbSupabase.listPassesByCar(carId),
      DF.dbSupabase.listEventsByCar(carId),
      DF.dbSupabase.listInspectionsByCar(carId),
      DF.dbSupabase.listMaintenancesByCar(carId),
    ]);
    const times = passes.filter((p) => p.status !== 'queimou').map((p) => p.time).filter((t) => typeof t === 'number' && !isNaN(t));
    const bestTime = times.length ? Math.min(...times) : null;
    const lastEvent = events[0] || null;
    return { bestTime, totalPasses: passes.length, totalEvents: events.length, totalInspections: inspections.length, totalMaintenances: maintenances.length, lastEvent, passes, events, inspections, maintenances };
  },
};

window.DF = DF;
