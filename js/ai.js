// ============================================================
// PRODE MUNDIAL FIFA 2026 — CHATBOT DE OPCIONES (menú)
// ============================================================
// Bot guiado por opciones (no texto libre). 4 acciones:
//   1) Ver la tabla de posiciones
//   2) Ver el pronóstico de alguien en un partido
//   3) Solicitar cambio de pronóstico (va al panel admin)
//   4) Reglas y puntaje
// ============================================================

window.ProdeAI = (function () {
  const C = () => window.CONFIG || {};
  const U = () => window.ProdeUtils;

  let participantes = [];
  let resultadosMap = {};
  let cargado = false;
  let body = null;

  async function cargarDatos() {
    if (cargado) return;
    try {
      const [parts, res] = await Promise.all([obtenerClasificacion(), obtenerResultados()]);
      participantes = parts || [];
      resultadosMap = {};
      (res || []).forEach(r => { resultadosMap[r.partido_id] = r; });
      cargado = true;
    } catch (e) { console.error('AI cargarDatos:', e); }
  }

  function esc(s) { return U().escapeHTML(s); }
  function nombrePartido(m) {
    const l = EQUIPOS[m.local] ? EQUIPOS[m.local].nombre : m.local;
    const v = EQUIPOS[m.visitante] ? EQUIPOS[m.visitante].nombre : m.visitante;
    return `${l} vs ${v}`;
  }
  function optionsParticipantes() {
    return participantes.map(p => `<option value="${p.id}">${esc(p.nombre)} — ${esc(p.curso)}</option>`).join('');
  }
  function backBtn() { return `<button class="ai-back" data-opt="menu">← Menú</button>`; }

  function setBody(html) { if (body) { body.innerHTML = html; body.scrollTop = body.scrollHeight; } }

  // -------- Pantallas --------
  function renderMenu() {
    setBody(`
      <div class="ai-bot-msg">¡Hola! 👋 Soy el asistente del PRODE. ¿Qué querés hacer?</div>
      <div class="ai-options">
        <button class="ai-opt" data-opt="tabla">📊 Ver la tabla de posiciones</button>
        <button class="ai-opt" data-opt="ver">🔍 Ver un pronóstico</button>
        <button class="ai-opt" data-opt="solicitud">✏️ Solicitar cambio de pronóstico</button>
        <button class="ai-opt" data-opt="reglas">📜 Reglas y puntaje</button>
      </div>`);
  }

  async function renderTabla() {
    setBody(`<div class="ai-bot-msg">Cargando tabla…</div>`);
    await cargarDatos();
    let filas = participantes.map((p, i) =>
      `<tr><td>${i + 1}</td><td>${esc(p.nombre)}</td><td>${esc(p.curso)}</td><td><strong>${p.puntos}</strong></td></tr>`
    ).join('');
    if (!filas) filas = `<tr><td colspan="4">Aún no hay participantes.</td></tr>`;
    setBody(`
      <div class="ai-bot-msg">🏆 Tabla de posiciones</div>
      <div class="ai-table-wrap">
        <table class="ai-table"><thead><tr><th>#</th><th>Nombre</th><th>Curso</th><th>Pts</th></tr></thead>
        <tbody>${filas}</tbody></table>
      </div>
      ${backBtn()}`);
  }

  async function renderVer() {
    await cargarDatos();
    setBody(`
      <div class="ai-bot-msg">🔍 Elegí la persona y escribí el partido (ej: "Irak Noruega" o "Argentina").</div>
      <div class="ai-field"><label>Persona</label><select id="ai-ver-persona">${optionsParticipantes()}</select></div>
      <div class="ai-field"><label>Partido</label><input type="text" id="ai-ver-partido" placeholder="Ej: Brasil Escocia" maxlength="60"></div>
      <button class="ai-go" id="ai-ver-go">Ver pronóstico</button>
      <div id="ai-ver-result"></div>
      ${backBtn()}`);
    document.getElementById('ai-ver-go').onclick = verPronostico;
  }

  async function verPronostico() {
    const pid = document.getElementById('ai-ver-persona').value;
    const txt = document.getElementById('ai-ver-partido').value;
    const out = document.getElementById('ai-ver-result');
    const r = U().buscarPartido(txt);
    if (r.opciones) {
      out.innerHTML = `<div class="ai-bot-msg">¿Cuál de estos? Escribí los dos equipos:<br>${r.opciones.map(nombrePartido).map(esc).join('<br>')}</div>`;
      return;
    }
    if (!r.match) { out.innerHTML = `<div class="ai-bot-msg">No encontré ese partido. Probá con los nombres de los dos equipos.</div>`; return; }
    out.innerHTML = `<div class="ai-bot-msg">Buscando…</div>`;
    try {
      const preds = await obtenerPrediccionesDeParticipante(pid);
      const pred = preds.find(p => p.partido_id === r.match.id);
      const persona = participantes.find(p => p.id === pid);
      if (!pred) { out.innerHTML = `<div class="ai-bot-msg">${esc(persona ? persona.nombre : '')} no tiene pronóstico para ese partido.</div>`; return; }
      const real = resultadosMap[r.match.id];
      const res = real ? U().calcularPuntos(pred, real) : null;
      out.innerHTML = `
        <div class="ai-bot-msg">
          <strong>${esc(persona ? persona.nombre : '')}</strong> pronosticó:<br>
          ${esc(nombrePartido(r.match))} → <strong>${pred.goles_local} - ${pred.goles_visitante}</strong>
          ${real ? `<br>Resultado real: ${real.goles_local} - ${real.goles_visitante} → <strong>+${res.puntos}</strong>` : '<br><em>(partido sin resultado todavía)</em>'}
        </div>`;
    } catch (e) { out.innerHTML = `<div class="ai-bot-msg">⚠️ Error al buscar.</div>`; }
  }

  async function renderSolicitud() {
    await cargarDatos();
    setBody(`
      <div class="ai-bot-msg">✏️ Pedí un cambio de pronóstico. El admin lo revisa y decide.</div>
      <div class="ai-field"><label>Persona del pronóstico</label><select id="ai-sol-persona">${optionsParticipantes()}</select></div>
      <div class="ai-field"><label>Partido</label><input type="text" id="ai-sol-partido" placeholder="Ej: Irak Noruega" maxlength="60"></div>
      <div class="ai-field"><label>Nuevo marcador</label>
        <div class="ai-score"><input type="number" min="0" max="30" id="ai-sol-gl" placeholder="0"> : <input type="number" min="0" max="30" id="ai-sol-gv" placeholder="0"></div>
      </div>
      <div class="ai-field"><label>Tu nombre (quién pide)</label><input type="text" id="ai-sol-quien" placeholder="Opcional" maxlength="60"></div>
      <div class="ai-field"><label>Motivo</label><input type="text" id="ai-sol-motivo" placeholder="Opcional" maxlength="120"></div>
      <button class="ai-go" id="ai-sol-go">Enviar solicitud</button>
      <div id="ai-sol-result"></div>
      ${backBtn()}`);
    document.getElementById('ai-sol-go').onclick = enviarSolicitud;
  }

  async function enviarSolicitud() {
    const pid = document.getElementById('ai-sol-persona').value;
    const txt = document.getElementById('ai-sol-partido').value;
    const gl = document.getElementById('ai-sol-gl').value;
    const gv = document.getElementById('ai-sol-gv').value;
    const quien = document.getElementById('ai-sol-quien').value.trim();
    const motivo = document.getElementById('ai-sol-motivo').value.trim();
    const out = document.getElementById('ai-sol-result');

    if (gl === '' || gv === '') { out.innerHTML = `<div class="ai-bot-msg">Completá el nuevo marcador.</div>`; return; }
    const r = U().buscarPartido(txt);
    if (!r.match) {
      out.innerHTML = `<div class="ai-bot-msg">${r.opciones ? 'Sé más específico (escribí los dos equipos).' : 'No encontré ese partido.'}</div>`;
      return;
    }
    const persona = participantes.find(p => p.id === pid);
    out.innerHTML = `<div class="ai-bot-msg">Enviando…</div>`;
    try {
      const preds = await obtenerPrediccionesDeParticipante(pid);
      const actual = preds.find(p => p.partido_id === r.match.id);
      await crearSolicitudCambio({
        participante_id: pid,
        participante_nombre: persona ? persona.nombre : '',
        partido_id: r.match.id,
        partido_texto: nombrePartido(r.match),
        marcador_actual: actual ? `${actual.goles_local}-${actual.goles_visitante}` : 's/d',
        marcador_solicitado: `${parseInt(gl, 10)}-${parseInt(gv, 10)}`,
        solicitante: quien || null,
        motivo: motivo || null,
      });
      out.innerHTML = `<div class="ai-bot-msg">✅ ¡Solicitud enviada! El admin la verá en su panel. Gracias.</div>`;
    } catch (e) {
      console.error(e);
      out.innerHTML = `<div class="ai-bot-msg">⚠️ No se pudo enviar la solicitud. Probá de nuevo.</div>`;
    }
  }

  function renderReglas() {
    const P = (C().PUNTOS) || { EXACTO: 3, RESULTADO: 1, SIN_ACIERTO: 0 };
    setBody(`
      <div class="ai-bot-msg">📜 <strong>Reglas y puntaje</strong></div>
      <div class="ai-bot-msg">
        • <strong>+${P.EXACTO}</strong> si acertás el marcador exacto.<br>
        • <strong>+${P.RESULTADO}</strong> si acertás solo el ganador o el empate.<br>
        • <strong>${P.SIN_ACIERTO}</strong> si no acertás.<br><br>
        <strong>Desempate:</strong> más puntos → más aciertos exactos → menor diferencia de goles → quien envió antes.<br>
        <strong>Costo:</strong> ${esc(C().COSTO_PARTICIPACION || '10 Bs')} (QR o efectivo).<br>
        Un Prode por navegador. Los partidos ya jugados quedan bloqueados.
      </div>
      ${backBtn()}`);
  }

  function handleClick(opt) {
    if (opt === 'menu') return renderMenu();
    if (opt === 'tabla') return renderTabla();
    if (opt === 'ver') return renderVer();
    if (opt === 'solicitud') return renderSolicitud();
    if (opt === 'reglas') return renderReglas();
  }

  function initWidget() {
    if (!C().AI_ENABLED) return;
    if (document.getElementById('ai-fab')) return;

    const fab = document.createElement('button');
    fab.id = 'ai-fab';
    fab.setAttribute('aria-label', 'Abrir asistente');
    fab.innerHTML = '💬';

    const panel = document.createElement('div');
    panel.id = 'ai-panel';
    panel.className = 'ai-panel hidden';
    panel.innerHTML = `
      <div class="ai-header">
        <span>🤖 Asistente PRODE</span>
        <button id="ai-close" aria-label="Cerrar">&times;</button>
      </div>
      <div class="ai-messages" id="ai-body"></div>`;

    document.body.appendChild(fab);
    document.body.appendChild(panel);
    body = panel.querySelector('#ai-body');

    const toggle = (show) => {
      const willShow = show === undefined ? panel.classList.contains('hidden') : show;
      panel.classList.toggle('hidden', !willShow);
      if (willShow) renderMenu();
    };
    fab.onclick = () => toggle();
    panel.querySelector('#ai-close').onclick = () => toggle(false);

    // Delegación de clicks de opciones/volver
    body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-opt]');
      if (btn) handleClick(btn.getAttribute('data-opt'));
    });
  }

  window.addEventListener('DOMContentLoaded', initWidget);
  return {};
})();
