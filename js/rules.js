// ============================================================
// PRODE MUNDIAL FIFA 2026 — REGLAMENTO LOGIC
// ============================================================

window.ProdeRules = (function () {
  function init() {
    // Sincroniza los valores mostrados con la configuración central,
    // para que el puntaje/costo vivan en un solo lugar (js/config.js).
    const P = (window.CONFIG && window.CONFIG.PUNTOS) || { EXACTO: 3, RESULTADO: 1, SIN_ACIERTO: 0 };

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText('rule-pts-exacto', `+${P.EXACTO}`);
    setText('rule-pts-resultado', `+${P.RESULTADO}`);
    setText('rule-pts-sin-acierto', `${P.SIN_ACIERTO}`);
    setText('rule-costo', (window.CONFIG && window.CONFIG.COSTO_PARTICIPACION) || '10 Bs');

    console.log('✅ Reglamento page initialized.');
  }

  return {
    init: init
  };
})();
