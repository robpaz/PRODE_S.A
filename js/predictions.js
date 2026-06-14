// ============================================================
// PRODE MUNDIAL FIFA 2026 — PREDICCIONES LOGIC
// ============================================================

window.ProdePredictions = (function () {
  let activeGroup = 'A'; // Default group tab

  let userIp = null;
  let isBlocked = false;

  async function init() {
    renderGroupTabs();
    renderFixture();
    setupEventListeners();
    updateProgress();

    // 1. Verificar bloqueo por localStorage local
    if (localStorage.getItem('prode_enviado') === 'true') {
      isBlocked = true;
      aplicarBloqueoDeFormulario('dispositivo');
      return;
    }

    // 2. Obtener IP pública y verificar en la base de datos
    userIp = await obtenerIpPublica();
    if (userIp) {
      const ipExiste = await verificarIpExistente(userIp);
      if (ipExiste) {
        isBlocked = true;
        aplicarBloqueoDeFormulario('ip');
      }
    }
  }

  async function obtenerIpPublica() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500); // 3.5s timeout
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
        <div style="color: #f87171; border: 1px solid rgba(248,113,113,0.3); padding: 16px; border-radius: var(--r-md); background: rgba(239,68,68,0.08); font-family: var(--font-head); font-weight: 600; font-size: 0.85rem; text-align: center; margin-bottom: 24px;">
          🚫 <strong>Acceso Limitado:</strong> ${msgText}
        </div>
      `;
    }

    // Deshabilitar todos los campos de marcador
    const inputs = document.querySelectorAll('.score-input, #user-nombre, #user-curso');
    inputs.forEach(input => {
      input.disabled = true;
      input.style.opacity = '0.5';
      input.style.cursor = 'not-allowed';
    });

    // Deshabilitar botón de rellenar al azar
    const autoFillBtn = document.getElementById('btn-auto-fill');
    if (autoFillBtn) {
      autoFillBtn.disabled = true;
      autoFillBtn.style.opacity = '0.5';
      autoFillBtn.style.cursor = 'not-allowed';
    }
  }

  function renderGroupTabs() {
    const navContainer = document.getElementById('group-nav-container');
    if (!navContainer) return;

    let html = '';
    // Groups A to L
    FIXTURE_GRUPOS.forEach(g => {
      const isCurrent = g.grupo === activeGroup;
      html += `
        <button type="button" class="group-nav-btn ${isCurrent ? 'current' : ''}" data-group="${g.grupo}">
          GRUPO ${g.grupo}
        </button>
      `;
    });
    // Add "VER TODOS" option
    html += `
      <button type="button" class="group-nav-btn ${activeGroup === 'all' ? 'current' : ''}" data-group="all">
        VER TODOS
      </button>
    `;

    navContainer.innerHTML = html;

    // Attach click events
    const buttons = navContainer.querySelectorAll('.group-nav-btn');
    buttons.forEach(btn => {
      btn.onclick = function () {
        buttons.forEach(b => b.classList.remove('current'));
        btn.classList.add('current');

        activeGroup = btn.getAttribute('data-group');
        filterGroupsVisibility();
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
          <div class="grupo-matches">
      `;

      g.partidos.forEach(match => {
        const local = EQUIPOS[match.local];
        const visitante = EQUIPOS[match.visitante];

        html += `
          <div class="match-card" id="match-card-${match.id}">
            <!-- Local Team -->
            <div class="team-local">
              <span class="team-name">${local.nombre}</span>
              <img src="${flagUrl(local.bandera)}" class="team-flag" alt="${local.nombre}">
            </div>
            <!-- Score Inputs -->
            <div class="score-block">
              <input type="number" min="0" class="score-input" placeholder="-" 
                     data-match-id="${match.id}" data-team-type="local" 
                     id="input-${match.id}-local">
              <span class="score-sep">:</span>
              <input type="number" min="0" class="score-input" placeholder="-" 
                     data-match-id="${match.id}" data-team-type="visitante" 
                     id="input-${match.id}-visitante">
            </div>
            <!-- Visitante Team -->
            <div class="team-visitante">
              <img src="${flagUrl(visitante.bandera)}" class="team-flag" alt="${visitante.nombre}">
              <span class="team-name">${visitante.nombre}</span>
            </div>
            <!-- Match Meta -->
            <div class="match-meta">
              <span class="match-jornada">JORNADA ${match.jornada}</span>
              <span class="match-date">${match.fecha}</span>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    // Add a quick random generator button for testing/wow effect
    html = `
      <div style="display: none;">
        <button type="button" class="btn-secondary" id="btn-auto-fill" style="padding: 10px 20px; font-size: 0.8rem; border-color: var(--border-gold);">
          🎲 COMPLETAR AL AZAR (PRUEBAS)
        </button>
      </div>
    ` + html;

    container.innerHTML = html;

    // Filter which groups are visible
    filterGroupsVisibility();

    // Attach input listeners for live progress updates
    const inputs = container.querySelectorAll('.score-input');
    inputs.forEach(input => {
      input.oninput = function () {
        // Enforce integer & non-negative
        if (input.value !== '') {
          let val = parseInt(input.value, 10);
          if (isNaN(val) || val < 0) val = 0;
          input.value = val;
        }

        // Highlight match card if filled
        const matchId = input.getAttribute('data-match-id');
        checkMatchCardFilled(matchId);

        // Update progress bar
        updateProgress();
      };
    });

    // Attach random generator button
    const autoFillBtn = document.getElementById('btn-auto-fill');
    if (autoFillBtn) {
      autoFillBtn.onclick = fillRandomPredictions;
    }
  }

  function filterGroupsVisibility() {
    const sections = document.querySelectorAll('.grupo-section');
    sections.forEach(sec => {
      const groupId = sec.id.replace('grupo-section-', '');
      if (activeGroup === 'all' || activeGroup === groupId) {
        sec.classList.remove('hidden');
      } else {
        sec.classList.add('hidden');
      }
    });
  }

  function checkMatchCardFilled(matchId) {
    const card = document.getElementById(`match-card-${matchId}`);
    if (!card) return;

    const valLocal = document.getElementById(`input-${matchId}-local`).value;
    const valVisitante = document.getElementById(`input-${matchId}-visitante`).value;

    if (valLocal !== '' && valVisitante !== '') {
      card.classList.add('filled');
    } else {
      card.classList.remove('filled');
    }
  }

  function updateProgress() {
    const totalMatches = TODOS_LOS_PARTIDOS.length;
    let filledCount = 0;

    TODOS_LOS_PARTIDOS.forEach(match => {
      const valLocal = document.getElementById(`input-${match.id}-local`).value;
      const valVisitante = document.getElementById(`input-${match.id}-visitante`).value;
      if (valLocal !== '' && valVisitante !== '') {
        filledCount++;
      }
    });

    const progressFill = document.getElementById('prediction-progress-bar');
    const progressText = document.getElementById('prediction-progress-text');

    if (progressFill) {
      const percent = (filledCount / totalMatches) * 100;
      progressFill.style.width = `${percent}%`;
    }
    if (progressText) {
      progressText.textContent = `${filledCount} / ${totalMatches} partidos pronosticados`;
    }

    return { filledCount, totalMatches };
  }

  function fillRandomPredictions() {
    TODOS_LOS_PARTIDOS.forEach(match => {
      const inputLocal = document.getElementById(`input-${match.id}-local`);
      const inputVisitante = document.getElementById(`input-${match.id}-visitante`);

      if (inputLocal && inputVisitante) {
        inputLocal.value = Math.floor(Math.random() * 4); // 0 to 3
        inputVisitante.value = Math.floor(Math.random() * 4); // 0 to 3
        checkMatchCardFilled(match.id);
      }
    });
    updateProgress();
    window.ProdeApp.showToast('🎯 Completado', 'Se han completado todos los partidos de manera aleatoria.', false);
  }

  function setupEventListeners() {
    const form = document.getElementById('prode-form');
    if (!form) return;

    form.onsubmit = async function (e) {
      e.preventDefault();

      if (isBlocked) {
        window.ProdeApp.showToast('Acceso limitado', 'No puedes enviar múltiples predicciones.', true);
        return;
      }

      const { filledCount, totalMatches } = updateProgress();
      if (filledCount < totalMatches) {
        window.ProdeApp.showToast(
          'Faltan Pronósticos',
          `Te faltan completar ${totalMatches - filledCount} partidos para enviar tu Prode.`,
          true
        );
        // Navigate/scroll to first empty match
        for (const match of TODOS_LOS_PARTIDOS) {
          const valLocal = document.getElementById(`input-${match.id}-local`).value;
          const valVisitante = document.getElementById(`input-${match.id}-visitante`).value;
          if (valLocal === '' || valVisitante === '') {
            // Find parent group and switch tab if not "all"
            const group = match.id.charAt(0);
            if (activeGroup !== 'all' && activeGroup !== group) {
              activeGroup = group;
              renderGroupTabs();
              filterGroupsVisibility();
            }
            // Scroll to the card
            const card = document.getElementById(`match-card-${match.id}`);
            if (card) {
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
              card.style.borderColor = 'red';
              setTimeout(() => {
                card.style.borderColor = '';
              }, 2000);
            }
            break;
          }
        }
        return;
      }

      // Collect data
      const nombre = document.getElementById('user-nombre').value.trim();
      const curso = document.getElementById('user-curso').value.trim();

      if (!nombre || !curso) {
        window.ProdeApp.showToast('Campos vacíos', 'El Nombre y Curso son obligatorios.', true);
        return;
      }

      // Re-verificar IP inmediatamente antes de guardar
      if (userIp) {
        const ipExiste = await verificarIpExistente(userIp);
        if (ipExiste) {
          isBlocked = true;
          aplicarBloqueoDeFormulario('ip');
          window.ProdeApp.showToast('Acceso limitado', 'Esta conexión IP ya envió su Prode.', true);
          return;
        }
      }

      const predictionsData = TODOS_LOS_PARTIDOS.map(match => {
        const goles_local = parseInt(document.getElementById(`input-${match.id}-local`).value, 10);
        const goles_visitante = parseInt(document.getElementById(`input-${match.id}-visitante`).value, 10);
        return {
          partido_id: match.id,
          goles_local,
          goles_visitante
        };
      });

      const submitBtn = document.getElementById('btn-submit-prode');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="loading-spinner"></span> ENVIANDO...`;

      try {
        // Step 1: Insert participant (with IP)
        const participanteId = await insertarParticipante(nombre, curso, userIp);

        // Step 2: Insert predictions
        await insertarPredicciones(participanteId, predictionsData);

        // Bloquear localmente en este dispositivo
        localStorage.setItem('prode_enviado', 'true');
        isBlocked = true;
        aplicarBloqueoDeFormulario('dispositivo');

        // If in mock mode, assign them random points so they appear on leaderboard
        if (!window.supabaseConfigurado) {
          const mockParticipantes = JSON.parse(localStorage.getItem('prode_participantes_mock') || '[]');
          const idx = mockParticipantes.findIndex(p => p.id === participanteId);
          if (idx !== -1) {
            // Give them a random score to make it look like they played and got scores!
            mockParticipantes[idx].puntos = Math.floor(Math.random() * 30) + 15; // 15 to 45 pts
            mockParticipantes[idx].aciertos_exactos = Math.floor(mockParticipantes[idx].puntos / 3.5);
            mockParticipantes[idx].diferencia_goles = Math.floor((mockParticipantes[idx].puntos - (mockParticipantes[idx].aciertos_exactos * 3)) + Math.random() * 5);
            localStorage.setItem('prode_participantes_mock', JSON.stringify(mockParticipantes));
          }
        }

        window.ProdeApp.showToast(
          '🏆 ¡Prode Enviado!',
          'Tus pronósticos se han guardado. Revisa la tabla de posiciones.',
          false
        );

        // Reset form
        form.reset();
        TODOS_LOS_PARTIDOS.forEach(m => checkMatchCardFilled(m.id));
        updateProgress();

        // Refresh views
        if (window.ProdeHome) window.ProdeHome.refreshStandings();
        if (window.ProdeRanking) window.ProdeRanking.refreshRanking();

        // Navigate to standings
        setTimeout(() => {
          window.location.hash = '#ranking';
        }, 1500);

      } catch (err) {
        console.error('Error submitting prode:', err);
        window.ProdeApp.showToast('Error de conexión', 'No se pudo guardar la predicción. Inténtalo de nuevo.', true);
      } finally {
        submitBtn.disabled = false;
        if (!isBlocked) {
          submitBtn.innerHTML = origText;
        }
      }
    };
  }

  return {
    init: init
  };
})();
