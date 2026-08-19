/* =========================================================
   DRAGFORCE · CAMADA DE DADOS LOCAL (IndexedDB)
   100% local ao navegador — sem backend/servidor. É o modo usado
   automaticamente quando js/config.js não tem credenciais do Supabase
   preenchidas. Implementa a mesma interface de js/db-supabase.js
   (DF.dbLocal / DF.dbSupabase) — quem decide qual delas vira DF.db
   é o bootstrap em js/app.js.
   ========================================================= */

const DF_DB_NAME = 'dragforce-race-history';
const DF_DB_VERSION = 2;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DF_DB_NAME, DF_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('cars')) {
        const cars = db.createObjectStore('cars', { keyPath: 'id' });
        cars.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('events')) {
        const events = db.createObjectStore('events', { keyPath: 'id' });
        events.createIndex('carId', 'carId');
        events.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('passes')) {
        const passes = db.createObjectStore('passes', { keyPath: 'id' });
        passes.createIndex('carId', 'carId');
        passes.createIndex('eventId', 'eventId');
        passes.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('inspections')) {
        const insp = db.createObjectStore('inspections', { keyPath: 'id' });
        insp.createIndex('carId', 'carId');
        insp.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('maintenances')) {
        const maint = db.createObjectStore('maintenances', { keyPath: 'id' });
        maint.createIndex('carId', 'carId');
        maint.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise = null;
function getDB() {
  if (!dbPromise) dbPromise = openDatabase();
  return dbPromise;
}

function tx(storeName, mode = 'readonly') {
  return getDB().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

var DF = window.DF || {};

DF.dbLocal = {
  uid,

  // no modo local a "foto" já É o dataURL — nada para enviar a lugar nenhum
  async uploadPhoto(carId, dataUrl) {
    return dataUrl;
  },

  // ---- Cars ----
  async listCars() {
    const store = await tx('cars');
    const all = await reqToPromise(store.getAll());
    return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async getCar(id) {
    const store = await tx('cars');
    return reqToPromise(store.get(id));
  },
  async putCar(car) {
    const toSave = { ...car };
    if (!toSave.id) toSave.id = uid('car');
    if (!toSave.createdAt) toSave.createdAt = new Date().toISOString();
    const store = await tx('cars', 'readwrite');
    await reqToPromise(store.put(toSave));
    return toSave;
  },
  async deleteCar(id) {
    const store = await tx('cars', 'readwrite');
    return reqToPromise(store.delete(id));
  },

  // ---- Events ----
  async listEventsByCar(carId) {
    const store = await tx('events');
    const idx = store.index('carId');
    const all = await reqToPromise(idx.getAll(carId));
    return all.sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  async putEvent(ev) {
    const toSave = { ...ev };
    if (!toSave.id) toSave.id = uid('evt');
    const store = await tx('events', 'readwrite');
    await reqToPromise(store.put(toSave));
    return toSave;
  },

  // ---- Passes ----
  async listPassesByCar(carId) {
    const store = await tx('passes');
    const idx = store.index('carId');
    const all = await reqToPromise(idx.getAll(carId));
    return all.sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  async putPass(p) {
    const toSave = { ...p };
    if (!toSave.id) toSave.id = uid('pass');
    const store = await tx('passes', 'readwrite');
    await reqToPromise(store.put(toSave));
    return toSave;
  },

  // ---- Inspections ----
  async listInspectionsByCar(carId) {
    const store = await tx('inspections');
    const idx = store.index('carId');
    const all = await reqToPromise(idx.getAll(carId));
    return all.sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  async putInspection(i) {
    const toSave = { ...i };
    if (!toSave.id) toSave.id = uid('insp');
    const store = await tx('inspections', 'readwrite');
    await reqToPromise(store.put(toSave));
    return toSave;
  },

  // ---- Manutenções ----
  async listMaintenancesByCar(carId) {
    const store = await tx('maintenances');
    const idx = store.index('carId');
    const all = await reqToPromise(idx.getAll(carId));
    return all.sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  async putMaintenance(m) {
    const toSave = { ...m };
    if (!toSave.id) toSave.id = uid('maint');
    const store = await tx('maintenances', 'readwrite');
    await reqToPromise(store.put(toSave));
    return toSave;
  },

  // ---- Meta (seed flag, settings) ----
  async getMeta(key) {
    const store = await tx('meta');
    const r = await reqToPromise(store.get(key));
    return r ? r.value : undefined;
  },
  async setMeta(key, value) {
    const store = await tx('meta', 'readwrite');
    return reqToPromise(store.put({ key, value }));
  },

  // ---- Aggregations ----
  async getCarSummary(carId) {
    const [passes, events, inspections, maintenances] = await Promise.all([
      DF.dbLocal.listPassesByCar(carId),
      DF.dbLocal.listEventsByCar(carId),
      DF.dbLocal.listInspectionsByCar(carId),
      DF.dbLocal.listMaintenancesByCar(carId),
    ]);
    const times = passes.filter((p) => p.status !== 'queimou').map((p) => p.time).filter((t) => typeof t === 'number' && !isNaN(t));
    const bestTime = times.length ? Math.min(...times) : null;
    const lastEvent = events[0] || null;
    return {
      bestTime,
      totalPasses: passes.length,
      totalEvents: events.length,
      totalInspections: inspections.length,
      totalMaintenances: maintenances.length,
      lastEvent,
      passes,
      events,
      inspections,
      maintenances,
    };
  },
};

window.DF = DF;
