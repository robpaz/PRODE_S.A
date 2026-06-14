// ============================================================
// PRODE MUNDIAL FIFA 2026 — PANEL ADMIN
// ============================================================
// Carga de resultados oficiales + recálculo del ranking + métricas
// por curso. Protección por passphrase del lado del cliente (NO es
// seguridad fuerte; ver sql/setup.sql sección 5 para endurecer).
// ============================================================

(function () {
  const U = () => window.ProdeUtils;
  // Cambiá esta passphrase. Es una barrera básica, no seguridad real.
  const ADMIN_PASS = 'sanagustin2026';

  document.addEventListener('DOMContentLoaded', () => {
    initSupabase();

    const gate = document.getElementById('admin-gate');
    const panel = document.getElementById('admin-panel');
    const passInput = document.getElementById('admin-pass');
    const enterBtn = document.getElementById('admin-enter');

    function entrar() {
      if (passInput.value === ADMIN_PASS) {
        gate.classList.add('hidden');
        panel.classList.remove('hidden');
        renderResultadosForm();
        renderMetricas();
      } else {
        alert('Passphrase incorrecta.');
      }
    }
    enterBtn.onclick = entrar;
    passInput.onkeydown = (e) => { if (e.key === 'Enter') entrar(); };

    document.getElementById('btn-recalcular').onclick = recalcular;
    document.getElementById('btn-refresh-metricas').onclick = renderMetricas;
  });

  async function renderResultadosForm() {
    const cont = document.getElementById('admin-resultados');
    if (!cont) return;
    const resultados = await obtenerResultados();
    const mapR = {};
    resultados.forEach(r => { mapR[r.partido_id] = r; });

    let html = '';
    FIXTURE_GRUPOS.forEach(g => {
      html += `<h3 class="admin-grupo-title">${g.nombreGrupo}</h3><div class="admin-grupo-grid">`;
      g.partidos.forEach(m => {
        const local = EQUIPOS[m.local];
        const visitante = EQUIPOS[m.visitante];
        const r = mapR[m.id] || {};
        const gl = (r.goles_local !== undefined && r.goles_local !== null) ? r.goles_local : '';
        const gv = (r.goles_visitante !== undefined && r.goles_visitante !== null) ? r.goles_visitante : '';
        html += `
          <div class="admin-match" data-match-id="${m.id}">
            <span class="admin-match-id">${m.id}</span>
            <span class="admin-team">${U().escapeHTML(local.nombre)}</span>
            <input type="number" min="0" max="30" class="admin-score" id="res-${m.id}-l" value="${gl}">
            <span>:</span>
            <input type="number" min="0" max="30" class="admin-score" id="res-${m.id}-v" value="${gv}">
            <span class="admin-team">${U().escapeHTML(visitante.nombre)}</span>
            <button class="admin-save-btn" data-match-id="${m.id}">Guardar</button>
          </div>`;
      });
      html += `</div>`;
    });
    cont.innerHTML = html;

    cont.querySelectorAll('.admin-save-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-match-id');
        const l = document.getElementById(`res-${id}-l`).value;
        const v = document.getElementById(`res-${id}-v`).value;
        if (l === '' || v === '') { alert('Completá ambos marcadores.'); return; }
        btn.disabled = true; btn.textContent = '...';
        try {
          await guardarResultado(id, parseInt(l, 10), parseInt(v, 10), true);
          btn.textContent = '✓';
          setTimeout(() => { btn.textContent = 'Guardar'; btn.disabled = false; }, 1200);
        } catch (e) {
          console.error(e); alert('Error al guardar.'); btn.textContent = 'Guardar'; btn.disabled = false;
        }
      };
    });
  }

  async function recalcular() {
    const btn = document.getElementById('btn-recalcular');
    const status = document.getElementById('recalc-status');
    btn.disabled = true; status.textContent = 'Recalculando...';
    try {
      await recalcularRanking();
      status.textContent = '✅ Ranking recalculado.';
      renderMetricas();
    } catch (e) {
      console.error(e);
      status.textContent = '⚠️ Error al recalcular: ' + (e.message || e);
    } finally {
      btn.disabled = false;
    }
  }

  async function renderMetricas() {
    const totalEl = document.getElementById('metrica-total');
    const cursoCont = document.getElementById('metrica-cursos');
    if (totalEl) totalEl.textContent = await contarParticipantes();
    if (cursoCont) {
      const porCurso = await contarPorCurso();
      cursoCont.innerHTML = porCurso.length
        ? porCurso.map(c => `<li><span>${U().escapeHTML(c.curso)}</span><strong>${c.total}</strong></li>`).join('')
        : '<li>Sin participantes aún.</li>';
    }
  }
})();
