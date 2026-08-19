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
