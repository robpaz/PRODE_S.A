// ============================================================
// PRODE MUNDIAL FIFA 2026 — PREDICCIONES LOGIC
// ============================================================

window.ProdePredictions = (function () {
  let activeGroup = 'A';       // tab de grupo activo
  let activeJornada = 'all';   // filtro de jornada: 'all' | '1' | '2' | '3'

  let userIp = null;
  let isBlocked = false;       // bloqueo duro (sin edición posible)
  let editMode = false;        // editando un Prode ya enviado
  let editParticipanteId = null;

  const U = () => window.ProdeUtils;
  const C = () => window.CONFIG || {};
  const LS = () => (C().LS || {});

  // Partidos que aún se pueden pronosticar (kickoff no pasó).
  function partidosEditables() {
    return TODOS_LOS_PARTIDOS.filter(m => !U().partidoCerrado(m));
  }

  async function init() {
    renderGroupTabs();
    renderJornadaFilter();
    renderFixture();
    setupEventListeners();

    const token = localStorage.getItem(LS().TOKEN || 'prode_token');
    const enviado = localStorage.getItem(LS().ENVIADO || 'prode_enviado') === 'true';

    // 1. Editar Prode existente (si está permitido y hay token)
    if (enviado && token && C().ALLOW_EDIT) {
      await entrarModoEdicion(token);
      updateProgress();
      return;
    }

    // 2. Bloqueo por dispositivo
    if (enviado) {
      isBlocked = true;
      aplicarBloqueoDeFormulario('dispositivo');
      updateProgress();
      return;
    }

    // 3. Restaurar borrador local
    if (C().PERSIST_DRAFT) restaurarBorrador();
    updateProgress();

    // 4. Verificar IP y bloquear si ya envió desde esta red
    userIp = await obtenerIpPublica();
    if (userIp) {
      const ipExiste = await verificarIpExistente(userIp);
      if (ipExiste) {
        isBlocked = true;
        aplicarBloqueoDeFormulario('ip');
      }
    }
  }

  // ---- MODO EDICIÓN ----------------------------------------
  async function entrarModoEdicion(participanteId) {
    editMode = true;
    editParticipanteId = participanteId;

    try {
      const participante = await obtenerParticipante(participanteId);
      const preds = await obtenerPrediccionesDeParticipante(participanteId);

      if (participante) {
        const nombreEl = document.getElementById('user-nombre');
        const cursoEl = document.getElementById('user-curso');
        if (nombreEl) nombreEl.value = participante.nombre || '';
        if (cursoEl) cursoEl.value = participante.curso || '';
      }

      preds.forEach(p => {
        const il = document.getElementById(`input-${p.partido_id}-local`);
        const iv = document.getElementById(`input-${p.partido_id}-visitante`);
        if (il) il.value = p.goles_local;
        if (iv) iv.value = p.goles_visitante;
        checkMatchCardFilled(p.partido_id);
      });

      // Banner informativo
      const msgContainer = document.getElementById('block-message-container');
      if (msgContainer) {
        msgContainer.innerHTML = `
          <div class="info-banner-edit">
            ✏️ <strong>Modo edición:</strong> ya enviaste tu Prode. Podés ajustar los partidos
            que todavía no se jugaron y guardar los cambios.
          </div>`;
      }
      const submitBtn = document.getElementById('btn-submit-prode');
      if (submitBtn) {
        submitBtn.querySelector('.submit-text').textContent = 'GUARDAR CAMBIOS';
      }
    } catch (e) {
      console.error('Error al entrar en modo edición:', e);
    }
  }

  async function obtenerIpPublica() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(id);
      const data = await res.json();
      return data.ip;
    } catch (e) {
      console.warn('No se pudo obtener la IP pública:', e);
      return null;
    }
  }

  function aplicarBloqueoDeFormulario(motivo) {
    const submitBtn = document.getElementById('btn-submit-prode');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `🚫 ENVIAR BLOQUEADO`;
    }

    const msgContainer = document.getElementById('block-message-container');
    if (msgContainer) {
      const msgText = motivo === 'dispositivo'
        ? 'Ya has registrado tu Prode desde este dispositivo móvil o computadora.'
        : 'Ya se ha enviado una predicción desde tu conexión de red local (IP).';
      msgContainer.innerHTML = `
        <div class="block-banner">
          🚫 <strong>Acceso Limitado:</strong> ${msgText}
        </div>`;
    }

    const inputs = document.querySelectorAll('.score-input, #user-nombre, #user-curso');
    inputs.forEach(input => {
      input.disabled = true;
      input.style.opacity = '0.5';
      input.style.cursor = 'not-allowed';
    });

    const autoFillBtn = document.getElementById('btn-auto-fill');
    if (autoFillBtn) {
      autoFillBtn.disabled = true;
      autoFillBtn.style.opacity = '0.5';
    }
  }

  function renderGroupTabs() {
    const navContainer = document.getElementById('group-nav-container');
    if (!navContainer) return;

    let html = '';
    FIXTURE_GRUPOS.forEach(g => {
      const isCurrent = g.grupo === activeGroup;
      html += `
        <button type="button" class="group-nav-btn ${isCurrent ? 'current' : ''}" data-group="${g.grupo}">
          GRUPO ${g.grupo}
        </button>`;
    });
    html += `
      <button type="button" class="group-nav-btn ${activeGroup === 'all' ? 'current' : ''}" data-group="all">
        VER TODOS
      </button>`;

    navContainer.innerHTML = html;

    navContainer.querySelectorAll('.group-nav-btn').forEach(btn => {
      btn.onclick = function () {
        navContainer.querySelectorAll('.group-nav-btn').forEach(b => b.classList.remove('current'));
        btn.classList.add('current');
        activeGroup = btn.getAttribute('data-group');
        filterVisibility();
      };
    });
  }

  function renderJornadaFilter() {
    const container = document.getElementById('jornada-filter-container');
    if (!container) return;
    const jornadas = [
      { v: 'all', t: 'TODAS' },
      { v: '1', t: 'JORNADA 1' },
      { v: '2', t: 'JORNADA 2' },
      { v: '3', t: 'JORNADA 3' },
    ];
    container.innerHTML = jornadas.map(j =>
      `<button type="button" class="jornada-btn ${activeJornada === j.v ? 'current' : ''}" data-jornada="${j.v}">${j.t}</button>`
    ).join('');

    container.querySelectorAll('.jornada-btn').forEach(btn => {
      btn.onclick = function () {
        container.querySelectorAll('.jornada-btn').forEach(b => b.classList.remove('current'));
        btn.classList.add('current');
        activeJornada = btn.getAttribute('data-jornada');
        filterVisibility();
      };
    });
  }

  function renderFixture() {
    const container = document.getElementById('groups-container');
    if (!container) return;

    let html = '';

    FIXTURE_GRUPOS.forEach(g => {
      const teamsStr = g.equipos.map(eq => EQUIPOS[eq] ? EQUIPOS[eq].nombre : eq).join(' • ');
      const noteHtml = g.soloDesdeJornada2 ? `<span class="grupo-note">Solo Jornadas 2 y 3</span>` : '';

      html += `
        <div class="grupo-section" id="grupo-section-${g.grupo}">
          <div class="grupo-header">
            <div class="grupo-header-left">
              <span class="grupo-badge">${g.nombreGrupo}</span>
              <span class="grupo-equipos">${teamsStr}</span>
            </div>
            ${noteHtml}
          </div>
          <div class="grupo-matches">`;

      g.partidos.forEach(match => {
        const local = EQUIPOS[match.local];
        const visitante = EQUIPOS[match.visitante];
        const cerrado = U().partidoCerrado(match);
        const disabledAttr = cerrado ? 'disabled' : '';
        const lockBadge = cerrado ? `<span class="match-lock" title="Cerrado: el partido ya comenzó">🔒 CERRADO</span>` : '';

        html += `
          <div class="match-card ${cerrado ? 'locked' : ''}" id="match-card-${match.id}" data-jornada="${match.jornada}">
            <div class="team-local">
              <span class="team-name">${U().escapeHTML(local.nombre)}</span>
              <img src="${flagUrl(local.bandera)}" class="team-flag" alt="${U().escapeHTML(local.nombre)}">
            </div>
            <div class="score-block">
              <input type="number" min="0" max="30" class="score-input" placeholder="-"
                     data-match-id="${match.id}" data-team-type="local"
                     id="input-${match.id}-local" ${disabledAttr}
                     aria-label="Goles de ${U().escapeHTML(local.nombre)}">
              <span class="score-sep">:</span>
              <input type="number" min="0" max="30" class="score-input" placeholder="-"
                     data-match-id="${match.id}" data-team-type="visitante"
                     id="input-${match.id}-visitante" ${disabledAttr}
                     aria-label="Goles de ${U().escapeHTML(visitante.nombre)}">
            </div>
            <div class="team-visitante">
              <img src="${flagUrl(visitante.bandera)}" class="team-flag" alt="${U().escapeHTML(visitante.nombre)}">
              <span class="team-name">${U().escapeHTML(visitante.nombre)}</span>
            </div>
            <div class="match-meta">
              <span class="match-jornada">JORNADA ${match.jornada}</span>
              <span class="match-date">${match.fecha}</span>
              ${lockBadge}
            </div>
          </div>`;
      });

      html += `</div></div>`;
    });

    // Botón de relleno aleatorio (oculto, para pruebas)
    html = `
      <div style="display: none;">
        <button type="button" class="btn-secondary" id="btn-auto-fill">🎲 COMPLETAR AL AZAR (PRUEBAS)</button>
      </div>` + html;

    container.innerHTML = html;

    filterVisibility();

    container.querySelectorAll('.score-input').forEach(input => {
      input.oninput = function () {
        if (input.value !== '') {
          let val = parseInt(input.value, 10);
          if (isNaN(val) || val < 0) val = 0;
          if (val > 30) val = 30;
          input.value = val;
        }
        const matchId = input.getAttribute('data-match-id');
        checkMatchCardFilled(matchId);
        updateProgress();
        if (C().PERSIST_DRAFT && !editMode) guardarBorrador();
      };
    });

    const autoFillBtn = document.getElementById('btn-auto-fill');
    if (autoFillBtn) autoFillBtn.onclick = fillRandomPredictions;
  }

  function filterVisibility() {
    document.querySelectorAll('.grupo-section').forEach(sec => {
      const groupId = sec.id.replace('grupo-section-', '');
      const grupoVisible = (activeGroup === 'all' || activeGroup === groupId);
      sec.classList.toggle('hidden', !grupoVisible);

      // Filtrar tarjetas por jornada dentro del grupo visible
      let visibleEnSeccion = 0;
      sec.querySelectorAll('.match-card').forEach(card => {
        const j = card.getAttribute('data-jornada');
        const jornadaVisible = (activeJornada === 'all' || activeJornada === j);
        card.classList.toggle('hidden', !jornadaVisible);
        if (jornadaVisible) visibleEnSeccion++;
      });
      // Ocultar grupo si la jornada filtrada no tiene partidos en él
      if (grupoVisible && visibleEnSeccion === 0) sec.classList.add('hidden');
    });
  }

  function checkMatchCardFilled(matchId) {
    const card = document.getElementById(`match-card-${matchId}`);
    if (!card) return;
    const valLocal = document.getElementById(`input-${matchId}-local`).value;
    const valVisitante = document.getElementById(`input-${matchId}-visitante`).value;
    card.classList.toggle('filled', valLocal !== '' && valVisitante !== '');
  }

  function updateProgress() {
    const editables = partidosEditables();
    const totalMatches = editables.length;
    let filledCount = 0;

    editables.forEach(match => {
      const valLocal = document.getElementById(`input-${match.id}-local`).value;
      const valVisitante = document.getElementById(`input-${match.id}-visitante`).value;
      if (valLocal !== '' && valVisitante !== '') filledCount++;
    });

    const progressFill = document.getElementById('prediction-progress-bar');
    const progressText = document.getElementById('prediction-progress-text');
    if (progressFill) {
      const percent = totalMatches > 0 ? (filledCount / totalMatches) * 100 : 100;
      progressFill.style.width = `${percent}%`;
    }
    if (progressText) {
      progressText.textContent = `${filledCount} / ${totalMatches} partidos pronosticados`;
    }
    return { filledCount, totalMatches };
  }

  // ---- BORRADOR LOCAL --------------------------------------
  function guardarBorrador() {
    const draft = { scores: {}, nombre: '', curso: '' };
    TODOS_LOS_PARTIDOS.forEach(m => {
      const l = document.getElementById(`input-${m.id}-local`);
      const v = document.getElementById(`input-${m.id}-visitante`);
      if (l && v && (l.value !== '' || v.value !== '')) {
        draft.scores[m.id] = { l: l.value, v: v.value };
      }
    });
    const nombreEl = document.getElementById('user-nombre');
    const cursoEl = document.getElementById('user-curso');
    if (nombreEl) draft.nombre = nombreEl.value;
    if (cursoEl) draft.curso = cursoEl.value;
    try { localStorage.setItem(LS().DRAFT || 'prode_draft', JSON.stringify(draft)); } catch (e) {}
  }

  function restaurarBorrador() {
    let draft;
    try { draft = JSON.parse(localStorage.getItem(LS().DRAFT || 'prode_draft') || 'null'); } catch (e) { draft = null; }
    if (!draft) return;
    Object.entries(draft.scores || {}).forEach(([id, sc]) => {
      const l = document.getElementById(`input-${id}-local`);
      const v = document.getElementById(`input-${id}-visitante`);
      if (l && !l.disabled) l.value = sc.l;
      if (v && !v.disabled) v.value = sc.v;
      checkMatchCardFilled(id);
    });
    const nombreEl = document.getElementById('user-nombre');
    const cursoEl = document.getElementById('user-curso');
    if (nombreEl && draft.nombre) nombreEl.value = draft.nombre;
    if (cursoEl && draft.curso) cursoEl.value = draft.curso;
  }

  function limpiarBorrador() {
    try { localStorage.removeItem(LS().DRAFT || 'prode_draft'); } catch (e) {}
  }

  function fillRandomPredictions() {
    partidosEditables().forEach(match => {
      const il = document.getElementById(`input-${match.id}-local`);
      const iv = document.getElementById(`input-${match.id}-visitante`);
      if (il && iv && !il.disabled) {
        il.value = Math.floor(Math.random() * 4);
        iv.value = Math.floor(Math.random() * 4);
        checkMatchCardFilled(match.id);
      }
    });
    updateProgress();
    if (C().PERSIST_DRAFT && !editMode) guardarBorrador();
    window.ProdeApp.showToast('🎯 Completado', 'Se completaron los partidos abiertos de forma aleatoria.', false);
  }

  function irAlSiguienteVacio() {
    for (const match of partidosEditables()) {
      const l = document.getElementById(`input-${match.id}-local`).value;
      const v = document.getElementById(`input-${match.id}-visitante`).value;
      if (l === '' || v === '') {
        const group = match.id.charAt(0);
        if (activeGroup !== 'all' && activeGroup !== group) activeGroup = group;
        if (activeJornada !== 'all' && activeJornada !== String(match.jornada)) activeJornada = 'all';
        renderGroupTabs();
        renderJornadaFilter();
        filterVisibility();
        const card = document.getElementById(`match-card-${match.id}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('highlight');
          setTimeout(() => card.classList.remove('highlight'), 2000);
        }
        return;
      }
    }
    window.ProdeApp.showToast('✅ Todo completo', 'No quedan partidos abiertos sin pronosticar.', false);
  }

  function setupEventListeners() {
    const form = document.getElementById('prode-form');
    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        iniciarEnvio();
      };
    }
    const nextBtn = document.getElementById('btn-next-empty');
    if (nextBtn) nextBtn.onclick = irAlSiguienteVacio;

    const nombreEl = document.getElementById('user-nombre');
    const cursoEl = document.getElementById('user-curso');
    [nombreEl, cursoEl].forEach(el => {
      if (el) el.addEventListener('input', () => { if (C().PERSIST_DRAFT && !editMode) guardarBorrador(); });
    });

    // Modal de confirmación
    const modalConfirm = document.getElementById('confirm-modal-ok');
    const modalCancel = document.getElementById('confirm-modal-cancel');
    if (modalConfirm) modalConfirm.onclick = () => { cerrarModal(); guardarProde(); };
    if (modalCancel) modalCancel.onclick = cerrarModal;
  }

  // Valida y, si corresponde, abre el modal de confirmación.
  function iniciarEnvio() {
    if (isBlocked) {
      window.ProdeApp.showToast('Acceso limitado', 'No puedes enviar múltiples predicciones.', true);
      return;
    }

    const { filledCount, totalMatches } = updateProgress();
    if (filledCount < totalMatches) {
      window.ProdeApp.showToast('Faltan Pronósticos',
        `Te faltan ${totalMatches - filledCount} partidos abiertos por completar.`, true);
      irAlSiguienteVacio();
      return;
    }

    const nombre = (document.getElementById('user-nombre').value || '').trim();
    const curso = (document.getElementById('user-curso').value || '').trim();
    if (!nombre || !curso) {
      window.ProdeApp.showToast('Campos vacíos', 'El Nombre y Curso son obligatorios.', true);
      return;
    }

    if (C().CONFIRM_BEFORE_SUBMIT) {
      abrirModalConfirmacion(nombre, curso, filledCount);
    } else {
      guardarProde();
    }
  }

  function abrirModalConfirmacion(nombre, curso, filled) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) { guardarProde(); return; }
    const resumen = document.getElementById('confirm-modal-summary');
    if (resumen) {
      resumen.innerHTML = `
        Vas a ${editMode ? 'actualizar' : 'enviar'} <strong>${filled}</strong> pronósticos como
        <strong>${U().escapeHTML(nombre)}</strong> (${U().escapeHTML(curso)}).`;
    }
    modal.classList.add('show');
  }

  function cerrarModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.remove('show');
  }

  // Ejecuta el guardado real (insert o edición).
  async function guardarProde() {
    const nombre = (document.getElementById('user-nombre').value || '').trim();
    const curso = (document.getElementById('user-curso').value || '').trim();

    const predictionsData = TODOS_LOS_PARTIDOS.map(match => {
      const l = document.getElementById(`input-${match.id}-local`).value;
      const v = document.getElementById(`input-${match.id}-visitante`).value;
      if (l === '' || v === '') return null;
      return { partido_id: match.id, goles_local: parseInt(l, 10), goles_visitante: parseInt(v, 10) };
    }).filter(Boolean);

    const submitBtn = document.getElementById('btn-submit-prode');
    const origHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="loading-spinner"></span> ${editMode ? 'GUARDANDO...' : 'ENVIANDO...'}`;

    try {
      if (editMode) {
        // --- EDICIÓN ---
        await actualizarPredicciones(editParticipanteId, predictionsData);
        window.ProdeApp.showToast('✅ Cambios guardados', 'Tu Prode fue actualizado correctamente.', false);
      } else {
        // --- ENVÍO NUEVO ---
        if (userIp) {
          const ipExiste = await verificarIpExistente(userIp);
          if (ipExiste) {
            isBlocked = true;
            aplicarBloqueoDeFormulario('ip');
            window.ProdeApp.showToast('Acceso limitado', 'Esta conexión IP ya envió su Prode.', true);
            return;
          }
        }

        let participanteId;
        if (C().USE_EDGE_FUNCTION && window.supabaseConfigurado) {
          participanteId = await enviarProdeViaEdge(nombre, curso, predictionsData);
        } else {
          participanteId = await insertarParticipante(nombre, curso, userIp);
          await insertarPredicciones(participanteId, predictionsData);
        }

        localStorage.setItem(LS().ENVIADO || 'prode_enviado', 'true');
        localStorage.setItem(LS().TOKEN || 'prode_token', participanteId);
        limpiarBorrador();
        isBlocked = true;

        // En modo mock, asignar puntaje aleatorio para poblar el ranking demo.
        if (!window.supabaseConfigurado) {
          const key = LS().PARTICIPANTES_MOCK || 'prode_participantes_mock';
          const mockParticipantes = JSON.parse(localStorage.getItem(key) || '[]');
          const idx = mockParticipantes.findIndex(p => p.id === participanteId);
          if (idx !== -1) {
            mockParticipantes[idx].puntos = Math.floor(Math.random() * 30) + 15;
            mockParticipantes[idx].aciertos_exactos = Math.floor(mockParticipantes[idx].puntos / 3.5);
            mockParticipantes[idx].diferencia_goles = Math.floor((mockParticipantes[idx].puntos - (mockParticipantes[idx].aciertos_exactos * 3)) + Math.random() * 5);
            localStorage.setItem(key, JSON.stringify(mockParticipantes));
          }
        }

        window.ProdeApp.showToast('🏆 ¡Prode Enviado!', 'Tus pronósticos se guardaron. Revisá la tabla de posiciones.', false);
        aplicarBloqueoDeFormulario('dispositivo');
      }

      if (window.ProdeHome) window.ProdeHome.refreshStandings();
      if (window.ProdeRanking) window.ProdeRanking.refreshRanking();

      setTimeout(() => { window.location.hash = editMode ? '#miprode' : '#ranking'; }, 1400);

    } catch (err) {
      window.ProdeApp.handleError('guardarProde', err, 'No se pudo guardar la predicción. Inténtalo de nuevo.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = origHTML;
    }
  }

  return {
    init: init
  };
})();
