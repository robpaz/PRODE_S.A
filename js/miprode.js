// ============================================================
// PRODE MUNDIAL FIFA 2026 — "PREDICCIONES" (visor de todos)
// ============================================================
// Muestra las predicciones de CUALQUIER participante (elegido de una
// lista), no solo las del dispositivo actual. Así los que enviaron
// antes de existir el token también pueden ver sus pronósticos.
// Si el dispositivo tiene token, se preselecciona ese participante.
// ============================================================

window.ProdeMiProde = (function () {
  const U = () => window.ProdeUtils;
  const LS = () => ((window.CONFIG && window.CONFIG.LS) || {});
  let resultadosMap = {};
  let participantesCache = [];

  async function init() {
    const cont = document.getElementById('miprode-container');
    if (!cont) return;

    cont.innerHTML = `<div class="table-loading"><span class="loading-spinner"></span>Cargando predicciones...</div>`;

    try {
      const [participantes, resultados] = await Promise.all([
        obtenerClasificacion(),
        obtenerResultados(),
      ]);
      participantesCache = participantes || [];

      resultadosMap = {};
      (resultados || []).forEach(r => { resultadosMap[r.partido_id] = r; });

      if (!participantesCache.length) {
        cont.innerHTML = `
          <div class="miprode-empty">
            <p>📭 Aún no hay participantes registrados.</p>
            <a href="#prediccion" class="btn-primary">HACER MI PREDICCIÓN</a>
          </div>`;
        return;
      }

      const token = localStorage.getItem(LS().TOKEN || 'prode_token');
      const options = participantesCache.map(p =>
        `<option value="${p.id}">${U().escapeHTML(p.nombre)} — ${U().escapeHTML(p.curso)}</option>`
      ).join('');

      cont.innerHTML = `
        <div class="miprode-selector">
          <label for="miprode-select">Ver predicciones de:</label>
          <select id="miprode-select">${options}</select>
        </div>
        <div id="miprode-detalle"></div>`;

      const sel = document.getElementById('miprode-select');
      const inicial = (token && participantesCache.some(p => p.id === token))
        ? token
        : participantesCache[0].id;
      sel.value = inicial;
      sel.onchange = () => renderDetalle(sel.value);
      renderDetalle(inicial);
    } catch (e) {
      window.ProdeApp.handleError('miprode', e, 'No se pudieron cargar las predicciones.');
      cont.innerHTML = `<div class="miprode-empty"><p>⚠️ Error al cargar las predicciones.</p></div>`;
    }
  }

  async function renderDetalle(participanteId) {
    const det = document.getElementById('miprode-detalle');
    if (!det) return;
    det.innerHTML = `<div class="table-loading"><span class="loading-spinner"></span>Cargando...</div>`;

    try {
      const participante = participantesCache.find(p => p.id === participanteId);
      const preds = await obtenerPrediccionesDeParticipante(participanteId);

      if (!preds || preds.length === 0) {
        det.innerHTML = `<div class="miprode-empty"><p>Este participante no tiene pronósticos cargados.</p></div>`;
        return;
      }

      const predById = {};
      preds.forEach(p => { predById[p.partido_id] = p; });

      let totalPuntos = 0, exactos = 0, filas = '';
      TODOS_LOS_PARTIDOS.forEach(match => {
        const pred = predById[match.id];
        if (!pred) return;
        const real = resultadosMap[match.id];
        const local = EQUIPOS[match.local];
        const visitante = EQUIPOS[match.visitante];
        const res = real ? U().calcularPuntos(pred, real) : null;
        if (res) { totalPuntos += res.puntos; if (res.exacto) exactos++; }

        const realTxt = real
          ? `${real.goles_local} - ${real.goles_visitante}`
          : '<span class="miprode-pending">Pendiente</span>';
        const ptsTxt = real
          ? `<span class="miprode-pts pts-${res.puntos}">+${res.puntos}</span>`
          : '—';

        filas += `
          <tr>
            <td class="miprode-jornada">J${match.jornada}</td>
            <td class="miprode-match">
              ${U().escapeHTML(local.nombre)} <strong>${pred.goles_local} - ${pred.goles_visitante}</strong> ${U().escapeHTML(visitante.nombre)}
            </td>
            <td class="miprode-real">${realTxt}</td>
            <td class="miprode-pts-cell">${ptsTxt}</td>
          </tr>`;
      });

      det.innerHTML = `
        <div class="miprode-header-card">
          <div>
            <div class="miprode-nombre">${U().escapeHTML(participante ? participante.nombre : '')}</div>
            <div class="miprode-curso">${U().escapeHTML(participante ? participante.curso : '')}</div>
          </div>
          <div class="miprode-stats">
            <div><span class="miprode-stat-num">${participante ? participante.puntos : totalPuntos}</span><span class="miprode-stat-lbl">PUNTOS</span></div>
            <div><span class="miprode-stat-num">${participante ? participante.aciertos_exactos : exactos}</span><span class="miprode-stat-lbl">EXACTOS</span></div>
          </div>
        </div>
        <div class="standings-card">
          <div class="table-wrapper">
            <table class="standings-table miprode-table">
              <thead>
                <tr><th>JOR</th><th>PRONÓSTICO</th><th>RESULTADO</th><th>PTS</th></tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
          </div>
        </div>`;
    } catch (e) {
      window.ProdeApp.handleError('miprode-detalle', e, 'No se pudo cargar el detalle.');
      det.innerHTML = `<div class="miprode-empty"><p>⚠️ Error al cargar el detalle.</p></div>`;
    }
  }

  return { init };
})();
