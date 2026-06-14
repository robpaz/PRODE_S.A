// ============================================================
// PRODE MUNDIAL FIFA 2026 — RANKING PAGE LOGIC
// ============================================================

window.ProdeRanking = (function () {
  function init() {
    renderRanking();

    const refreshBtn = document.getElementById('btn-refresh-ranking');
    if (refreshBtn) {
      refreshBtn.onclick = function () {
        renderRanking();
      };
    }
  }

  async function renderRanking() {
    const podiumContainer = document.getElementById('podium-container');
    const tbody = document.getElementById('ranking-table-body');
    
    if (podiumContainer) {
      podiumContainer.innerHTML = '';
    }
    
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="table-loading">
            <span class="loading-spinner"></span>Cargando posiciones...
          </td>
        </tr>
      `;
    }

    try {
      const participantes = await obtenerClasificacion();

      if (participantes.length === 0) {
        if (podiumContainer) {
          podiumContainer.innerHTML = `<p class="podium-empty">Envía tu predicción para aparecer en el podio.</p>`;
        }
        if (tbody) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" class="table-empty">
                📭 Aún no hay participantes registrados.
              </td>
            </tr>
          `;
        }
        return;
      }

      // Render Podium (Top 3)
      if (podiumContainer) {
        let podiumHtml = '';
        
        const first = participantes[0];
        const second = participantes[1];
        const third = participantes[2];

        // 2nd Place (Left)
        if (second) {
          podiumHtml += `
            <div class="podium-item">
              <span class="podium-medal">🥈</span>
              <div class="podium-info">
                <div class="podium-nombre">${escapeHTML(second.nombre)}</div>
                <div class="podium-curso">${escapeHTML(second.curso)}</div>
                <div class="podium-pts">${second.puntos} pts</div>
              </div>
              <div class="podium-block podium-block-2"></div>
            </div>
          `;
        } else {
          podiumHtml += `<div class="podium-item" style="opacity: 0.3;"><div class="podium-block podium-block-2"></div></div>`;
        }

        // 1st Place (Middle)
        if (first) {
          podiumHtml += `
            <div class="podium-item">
              <span class="podium-medal">🥇</span>
              <div class="podium-info">
                <div class="podium-nombre" style="color: var(--gold-light); font-size: 1.2rem;">${escapeHTML(first.nombre)}</div>
                <div class="podium-curso">${escapeHTML(first.curso)}</div>
                <div class="podium-pts" style="font-size: 1.8rem;">${first.puntos} pts</div>
              </div>
              <div class="podium-block podium-block-1"></div>
            </div>
          `;
        }

        // 3rd Place (Right)
        if (third) {
          podiumHtml += `
            <div class="podium-item">
              <span class="podium-medal">🥉</span>
              <div class="podium-info">
                <div class="podium-nombre">${escapeHTML(third.nombre)}</div>
                <div class="podium-curso">${escapeHTML(third.curso)}</div>
                <div class="podium-pts">${third.puntos} pts</div>
              </div>
              <div class="podium-block podium-block-3"></div>
            </div>
          `;
        } else {
          podiumHtml += `<div class="podium-item" style="opacity: 0.3;"><div class="podium-block podium-block-3"></div></div>`;
        }

        podiumContainer.innerHTML = podiumHtml;
      }

      // Render Full Table
      if (tbody) {
        let tableHtml = '';
        participantes.forEach((p, index) => {
          const pos = index + 1;
          let badgeClass = 'pos-n';
          if (pos === 1) badgeClass = 'pos-1';
          else if (pos === 2) badgeClass = 'pos-2';
          else if (pos === 3) badgeClass = 'pos-3';

          tableHtml += `
            <tr>
              <td><span class="pos-badge ${badgeClass}">${pos}</span></td>
              <td class="td-name">${escapeHTML(p.nombre)}</td>
              <td class="td-curso">${escapeHTML(p.curso)}</td>
              <td><span class="pts-value">${p.puntos}</span></td>
              <td>${p.aciertos_exactos}</td>
              <td>${p.diferencia_goles >= 0 ? '+' : ''}${p.diferencia_goles}</td>
            </tr>
          `;
        });
        tbody.innerHTML = tableHtml;
      }

    } catch (e) {
      console.error('Error rendering ranking:', e);
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="table-empty" style="color: #ef4444;">
              ⚠️ Error al obtener el ranking.
            </td>
          </tr>
        `;
      }
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  return {
    init: init,
    refreshRanking: renderRanking
  };
})();
