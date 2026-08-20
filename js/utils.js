/* =========================================================
   DRAGFORCE · UTILITÁRIOS
   ========================================================= */

var DF = window.DF || {};

DF.utils = {
  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * A partir da lista de passadas de um carro, calcula o melhor tempo (só
   * 201m, sem reação — mesmo critério da 7ª leva), em qual pista (E/D) ele
   * foi cravado, e o melhor tempo de cada pista separadamente (pra comparar
   * se o carro rende mais de um lado ou do outro). Usado por getCarSummary
   * nos dois backends (db.js e db-supabase.js), que só chamam essa função.
   */
  laneStats(passes) {
    const valid = passes.filter((p) => p.status !== 'queimou' && typeof p.t201 === 'number' && !isNaN(p.t201));
    let bestTime = null;
    let bestLane = null;
    const laneBest = { E: null, D: null };
    for (const p of valid) {
      if (bestTime == null || p.t201 < bestTime) { bestTime = p.t201; bestLane = p.lane || null; }
      if (p.lane === 'E' || p.lane === 'D') {
        if (laneBest[p.lane] == null || p.t201 < laneBest[p.lane]) laneBest[p.lane] = p.t201;
      }
    }
    return { bestTime, bestLane, laneBest };
  },

  // Comparativo "melhor tempo na pista E" x "melhor tempo na pista D" — mostra
  // qual lado da pista rende mais (o lado mais rápido, quando os dois já têm
  // dado, ganha destaque na cor de marca). Usado tanto na ficha do carro
  // quanto no dashboard geral da equipe (com laneBest agregado dos carros).
  laneCompareHtml(laneBest) {
    const e = laneBest && laneBest.E;
    const d = laneBest && laneBest.D;
    const eWins = e != null && (d == null || e < d);
    const dWins = d != null && (e == null || d < e);
    return `
      <div style="display:flex;gap:var(--space-5);align-items:baseline;font-family:var(--font-mono)">
        <div>
          <div style="font-size:11px;color:var(--text-muted);letter-spacing:0.08em">E</div>
          <div style="font-size:22px;font-weight:600;color:${eWins ? 'var(--df-red-bright)' : 'var(--text-primary)'}">${e != null ? e.toFixed(3) + 's' : '—'}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);letter-spacing:0.08em">D</div>
          <div style="font-size:22px;font-weight:600;color:${dWins ? 'var(--df-red-bright)' : 'var(--text-primary)'}">${d != null ? d.toFixed(3) + 's' : '—'}</div>
        </div>
      </div>
    `;
  },

  formatTime(seconds) {
    if (seconds == null || isNaN(seconds)) return '—';
    return `${Number(seconds).toFixed(3)}s`;
  },

  formatSpeed(kmh) {
    if (kmh == null || isNaN(kmh)) return '—';
    return `${Number(kmh).toFixed(1)} km/h`;
  },

  formatDate(isoDate) {
    if (!isoDate) return '—';
    const d = new Date(isoDate + 'T00:00:00');
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  formatDateLong(isoDate) {
    if (!isoDate) return '—';
    const d = new Date(isoDate + 'T00:00:00');
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  todayISO() {
    return new Date().toISOString().slice(0, 10);
  },

  formatCurrency(value) {
    if (value == null || isNaN(value)) return '—';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  formatKm(value) {
    if (value == null || isNaN(value)) return '—';
    return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
  },

  /**
   * Redimensiona e comprime uma imagem (File) para um dataURL JPEG,
   * mantendo proporção consistente (crop central 16:10) e tamanho otimizado
   * para carregamento rápido nos cards e na ficha do carro.
   */
  processCarPhoto(file, { maxWidth = 1280, ratio = 16 / 10, quality = 0.86 } = {}) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Arquivo inválido. Selecione uma imagem (JPG, PNG ou WEBP).'));
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        reject(new Error('Imagem muito grande. Envie um arquivo de até 15MB.'));
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let srcW = img.width, srcH = img.height;
        let srcRatio = srcW / srcH;
        let cropW = srcW, cropH = srcH, cropX = 0, cropY = 0;
        if (srcRatio > ratio) {
          cropW = srcH * ratio;
          cropX = (srcW - cropW) / 2;
        } else {
          cropH = srcW / ratio;
          cropY = (srcH - cropH) / 2;
        }
        const outW = Math.min(maxWidth, cropW);
        const outH = outW / ratio;
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Não foi possível ler essa imagem.'));
      };
      img.src = url;
    });
  },

  toast(message, opts = {}) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${opts.spinner ? '<span class="spinner"></span>' : ''}<span>${DF.utils.escapeHtml(message)}</span>`;
    document.body.appendChild(el);
    if (!opts.persist) {
      setTimeout(() => el.remove(), opts.duration || 2600);
    }
    return el;
  },

  qs(sel, root = document) { return root.querySelector(sel); },
  qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); },
};

window.DF = DF;
