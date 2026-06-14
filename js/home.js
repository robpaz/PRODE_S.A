// ============================================================
// PRODE MUNDIAL FIFA 2026 — INICIO (HOME) LOGIC
// ============================================================

window.ProdeHome = (function () {
  let countdownInterval = null;

  function init() {
    initCountdown();
    renderHomeStandings();
    renderParticipantCount();

    const refreshBtn = document.getElementById('btn-refresh-home');
    if (refreshBtn) {
      refreshBtn.onclick = function () {
        renderHomeStandings();
        renderParticipantCount();
      };
    }
  }

  async function renderParticipantCount() {
    const el = document.getElementById('hero-participant-count');
    if (!el) return;
    try {
      const total = await contarParticipantes();
      el.textContent = total;
    } catch (e) {
      el.textContent = '—';
    }
  }

  function initCountdown() {
    // Inicio oficial del Mundial (configurable en js/config.js)
    const inicio = (window.CONFIG && window.CONFIG.MUNDIAL_INICIO) || '2026-06-11T17:00:00Z';
    const targetDate = new Date(inicio).getTime();

    if (countdownInterval) clearInterval(countdownInterval);

    function updateCountdown() {
      const now = new Date().getTime();
      const diff = targetDate - now;

      const countdownEl = document.getElementById('countdown');
      if (!countdownEl) return;

      if (diff <= 0) {
        countdownEl.innerHTML = `<div class="live-badge"><span class="live-dot"></span>¡EL MUNDIAL ESTÁ EN MARCHA!</div>`;
        if (countdownInterval) clearInterval(countdownInterval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const cdDays = document.getElementById('cd-days');
      const cdHours = document.getElementById('cd-hours');
      const cdMins = document.getElementById('cd-mins');
      const cdSecs = document.getElementById('cd-secs');

      if (cdDays) cdDays.textContent = String(days).padStart(2, '0');
      if (cdHours) cdHours.textContent = String(hours).padStart(2, '0');
      if (cdMins) cdMins.textContent = String(mins).padStart(2, '0');
      if (cdSecs) cdSecs.textContent = String(secs).padStart(2, '0');
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  async function renderHomeStandings() {
    const tbody = document.getElementById('home-standings-body');
    if (!tbody) return;

    tbody.innerHTML = window.ProdeUtils.tableSkeleton(6, 5);

    try {
      const participantes = await obtenerClasificacion();

      if (participantes.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="table-empty">
              📭 Aún no hay participantes registrados. ¡Sé el primero en enviar tu predicción!
            </td>
          </tr>
        `;
        return;
      }

      // Display Top 5
      const topFive = participantes.slice(0, 5);
      let html = '';

      topFive.forEach((p, index) => {
        const pos = index + 1;
        let badgeClass = 'pos-n';
        if (pos === 1) badgeClass = 'pos-1';
        else if (pos === 2) badgeClass = 'pos-2';
        else if (pos === 3) badgeClass = 'pos-3';

        html += `
          <tr>
            <td><span class="pos-badge ${badgeClass}">${pos}</span></td>
            <td class="td-name">${escapeHTML(p.nombre)}</td>
            <td class="td-curso">${escapeHTML(p.curso)}</td>
            <td><span class="pts-value">${p.puntos}</span></td>
            <td>${p.aciertos_exactos}</td>
            <td>${window.ProdeUtils.formatDif(p.diferencia_goles)}</td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    } catch (e) {
      console.error('Error rendering standings:', e);
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="table-empty" style="color: #ef4444;">
            ⚠️ Error al conectar con el servidor.
          </td>
        </tr>
      `;
    }
  }

  const escapeHTML = (s) => window.ProdeUtils.escapeHTML(s);

  return {
    init: init,
    refreshStandings: renderHomeStandings
  };
})();
