// ============================================================
// PRODE MUNDIAL FIFA 2026 — UTILIDADES COMPARTIDAS
// ============================================================
// Helpers reutilizables por todos los módulos. Evita duplicación.
// ============================================================

window.ProdeUtils = (function () {
  /**
   * Escapa caracteres HTML peligrosos para evitar inyección al renderizar
   * texto provisto por el usuario (nombre, curso).
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }[tag] || tag));
  }

  /**
   * Devuelve true si el kickoff (ISO) de un partido ya pasó.
   * Si el feature flag está apagado o no hay kickoff, devuelve false.
   * @param {object} match
   * @returns {boolean}
   */
  function partidoCerrado(match) {
    if (!window.CONFIG || !window.CONFIG.LOCK_BY_KICKOFF) return false;
    if (!match || !match.kickoff) return false;
    return new Date(match.kickoff).getTime() <= Date.now();
  }

  /**
   * Formatea la diferencia de goles con signo (+/-).
   * @param {number} dif
   * @returns {string}
   */
  function formatDif(dif) {
    const n = Number(dif) || 0;
    return (n >= 0 ? '+' : '') + n;
  }

  /**
   * Calcula los puntos de una predicción contra un resultado real,
   * según las reglas de CONFIG.PUNTOS. Espejo del RPC de Supabase
   * (usado solo para mostrar puntaje en vivo en "Mi Prode").
   * @returns {{puntos:number, exacto:boolean, resultado:boolean}}
   */
  function calcularPuntos(pred, real) {
    const P = (window.CONFIG && window.CONFIG.PUNTOS) || { EXACTO: 3, RESULTADO: 1, SIN_ACIERTO: 0 };
    if (!real || real.goles_local === null || real.goles_local === undefined) {
      return { puntos: 0, exacto: false, resultado: false };
    }
    const exacto = pred.goles_local === real.goles_local && pred.goles_visitante === real.goles_visitante;
    if (exacto) return { puntos: P.EXACTO, exacto: true, resultado: true };

    const signo = (a, b) => (a > b ? 1 : a < b ? -1 : 0);
    const aciertoResultado = signo(pred.goles_local, pred.goles_visitante) === signo(real.goles_local, real.goles_visitante);
    if (aciertoResultado) return { puntos: P.RESULTADO, exacto: false, resultado: true };

    return { puntos: P.SIN_ACIERTO, exacto: false, resultado: false };
  }

  /**
   * Devuelve N filas de skeleton para tablas mientras cargan.
   * @param {number} cols  número de columnas
   * @param {number} rows  número de filas
   * @returns {string}
   */
  function tableSkeleton(cols = 6, rows = 5) {
    let html = '';
    for (let r = 0; r < rows; r++) {
      html += '<tr class="skeleton-row">';
      for (let c = 0; c < cols; c++) {
        html += '<td><span class="skeleton-bar"></span></td>';
      }
      html += '</tr>';
    }
    return html;
  }

  return {
    escapeHTML,
    partidoCerrado,
    formatDif,
    calcularPuntos,
    tableSkeleton,
  };
})();
