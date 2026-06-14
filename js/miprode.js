// ============================================================
// PRODE MUNDIAL FIFA 2026 — "MI PRODE" LOGIC
// ============================================================
// Muestra el Prode enviado por el participante (solo lectura) y,
// a medida que se cargan los resultados oficiales, los puntos
// obtenidos partido a partido.
// ============================================================

window.ProdeMiProde = (function () {
  const U = () => window.ProdeUtils;
  const LS = () => ((window.CONFIG && window.CONFIG.LS) || {});

  async function init() {
    const cont = document.getElementById('miprode-container');
    if (!cont) return;

    const token = localStorage.getItem(LS().TOKEN || 'prode_token');
    if (!token) {
      cont.innerHTML = `
        <div class="miprode-empty">
          <p>📭 Todavía no enviaste tu Prode desde este dispositivo.</p>
          <a href="#prediccion" class="btn-primary">HACER MI PREDICCIÓN</a>
        </div>`;
      return;
    }

    cont.innerHTML = `<div class="table-loading"><span class="loading-spinner"></span>Cargando tu Prode...</div>`;

    try {
      const [participante, preds, resultados] = await Promise.all([
        obtenerParticipante(token),
        obtenerPrediccionesDeParticipante(token),
        obtenerResultados(),
      ]);

      if (!preds || preds.length === 0) {
        cont.innerHTML = `<div class="miprode-empty"><p>No se encontraron tus pronósticos.</p></div>`;
        return;
      }

      const mapR = {};
      (resultados || []).forEach(r => { mapR[r.partido_id] = r; });

      const predById = {};
      preds.forEach(p => { predById[p.partido_id] = p; });

      let totalPuntos = 0, exactos = 0;
      let filas = '';

      TODOS_LOS_PARTIDOS.forEach(match => {
        const pred = predById[match.id];
        if (!pred) return;
        const real = mapR[match.id];
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

      cont.innerHTML = `
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
        ${window.CONFIG && window.CONFIG.ALLOW_EDIT ? '<a href="#prediccion" class="btn-secondary miprode-edit-btn">✏️ EDITAR MI PRODE</a>' : ''}
        <div class="standings-card">
          <div class="table-wrapper">
            <table class="standings-table miprode-table">
              <thead>
                <tr><th>JOR</th><th>MI PRONÓSTICO</th><th>RESULTADO</th><th>PTS</th></tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
          </div>
        </div>`;
    } catch (e) {
      window.ProdeApp.handleError('miprode', e, 'No se pudo cargar tu Prode.');
      cont.innerHTML = `<div class="miprode-empty"><p>⚠️ Error al cargar tu Prode.</p></div>`;
    }
  }

  return { init };
})();
