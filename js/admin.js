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
        renderSolicitudes();
        initEditor();
      } else {
        alert('Passphrase incorrecta.');
      }
    }
    enterBtn.onclick = entrar;
    passInput.onkeydown = (e) => { if (e.key === 'Enter') entrar(); };

    document.getElementById('btn-recalcular').onclick = recalcular;
    document.getElementById('btn-refresh-metricas').onclick = renderMetricas;
    document.getElementById('btn-refresh-solicitudes').onclick = renderSolicitudes;
  });

  // ---- SOLICITUDES DE CAMBIO ----
  async function renderSolicitudes() {
    const cont = document.getElementById('admin-solicitudes');
    if (!cont) return;
    cont.innerHTML = '<p>Cargando…</p>';
    try {
      const sols = await obtenerSolicitudes();
      if (!sols.length) { cont.innerHTML = '<p class="admin-empty">No hay solicitudes.</p>'; return; }
      cont.innerHTML = sols.map(s => `
        <div class="admin-sol ${s.estado === 'pendiente' ? 'pend' : 'done'}">
          <div class="admin-sol-main">
            <strong>${U().escapeHTML(s.participante_nombre || '(sin nombre)')}</strong>
            — ${U().escapeHTML(s.partido_texto || s.partido_id || '')}<br>
            <span class="admin-sol-detail">Actual: <b>${U().escapeHTML(s.marcador_actual || 's/d')}</b> → Pedido: <b>${U().escapeHTML(s.marcador_solicitado || '')}</b></span>
            ${s.solicitante ? `<br><span class="admin-sol-detail">Pide: ${U().escapeHTML(s.solicitante)}</span>` : ''}
            ${s.motivo ? `<br><span class="admin-sol-detail">Motivo: ${U().escapeHTML(s.motivo)}</span>` : ''}
          </div>
          <div class="admin-sol-actions">
            <span class="admin-sol-estado">${U().escapeHTML(s.estado)}</span>
            ${s.estado === 'pendiente'
              ? `<button class="admin-sol-btn" data-id="${s.id}" data-estado="resuelta">Marcar resuelta</button>
                 <button class="admin-sol-btn rechaz" data-id="${s.id}" data-estado="rechazada">Rechazar</button>`
              : ''}
          </div>
        </div>`).join('');
      cont.querySelectorAll('.admin-sol-btn').forEach(btn => {
        btn.onclick = async () => {
          btn.disabled = true;
          try { await actualizarEstadoSolicitud(btn.getAttribute('data-id'), btn.getAttribute('data-estado')); renderSolicitudes(); }
          catch (e) { console.error(e); alert('Error al actualizar.'); btn.disabled = false; }
        };
      });
    } catch (e) { console.error(e); cont.innerHTML = '<p>⚠️ Error al cargar solicitudes.</p>'; }
  }

  // ---- EDITOR DE PREDICCIONES ----
  async function initEditor() {
    const sel = document.getElementById('admin-editor-persona');
    if (!sel) return;
    const parts = await obtenerClasificacion();
    sel.innerHTML = parts.map(p => `<option value="${p.id}">${U().escapeHTML(p.nombre)} — ${U().escapeHTML(p.curso)}</option>`).join('');
    document.getElementById('btn-editor-cargar').onclick = () => cargarEditor(sel.value);
  }

  async function cargarEditor(participanteId) {
    const cont = document.getElementById('admin-editor');
    const guardarBtn = document.getElementById('btn-editor-guardar');
    const status = document.getElementById('editor-status');
    if (!cont) return;
    status.textContent = '';
    cont.innerHTML = '<p>Cargando…</p>';
    const preds = await obtenerPrediccionesDeParticipante(participanteId);
    const byId = {};
    preds.forEach(p => { byId[p.partido_id] = p; });

    let html = '';
    FIXTURE_GRUPOS.forEach(g => {
      html += `<h3 class="admin-grupo-title">${g.nombreGrupo}</h3><div class="admin-grupo-grid">`;
      g.partidos.forEach(m => {
        const local = EQUIPOS[m.local], visitante = EQUIPOS[m.visitante];
        const p = byId[m.id] || {};
        const gl = (p.goles_local !== undefined && p.goles_local !== null) ? p.goles_local : '';
        const gv = (p.goles_visitante !== undefined && p.goles_visitante !== null) ? p.goles_visitante : '';
        html += `
          <div class="admin-match" data-match-id="${m.id}">
            <span class="admin-match-id">${m.id}</span>
            <span class="admin-team">${U().escapeHTML(local.nombre)}</span>
            <input type="number" min="0" max="30" class="admin-score" id="ed-${m.id}-l" value="${gl}">
            <span>:</span>
            <input type="number" min="0" max="30" class="admin-score" id="ed-${m.id}-v" value="${gv}">
            <span class="admin-team">${U().escapeHTML(visitante.nombre)}</span>
          </div>`;
      });
      html += `</div>`;
    });
    cont.innerHTML = html;
    guardarBtn.style.display = '';
    guardarBtn.onclick = () => guardarEditor(participanteId);
  }

  async function guardarEditor(participanteId) {
    const status = document.getElementById('editor-status');
    const guardarBtn = document.getElementById('btn-editor-guardar');
    guardarBtn.disabled = true; status.textContent = 'Guardando…';
    try {
      let n = 0;
      for (const m of TODOS_LOS_PARTIDOS) {
        const l = document.getElementById(`ed-${m.id}-l`);
        const v = document.getElementById(`ed-${m.id}-v`);
        if (!l || !v || l.value === '' || v.value === '') continue;
        await actualizarUnaPrediccion(participanteId, m.id, parseInt(l.value, 10), parseInt(v.value, 10));
        n++;
      }
      status.textContent = `✅ Guardado (${n} partidos). Recalculá el ranking para aplicar puntos.`;
    } catch (e) {
      console.error(e); status.textContent = '⚠️ Error al guardar: ' + (e.message || e);
    } finally { guardarBtn.disabled = false; }
  }

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
