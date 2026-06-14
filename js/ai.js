// ============================================================
// PRODE MUNDIAL FIFA 2026 — CLIENTE IA + WIDGET DE CHAT
// ============================================================
// Habla SOLO con la Edge Function ai-proxy (que guarda la key de
// OpenRouter como secret). El cliente nunca ve la key ni llama a
// OpenRouter directo. Mandamos { tarea, params } de una allow-list.
// ============================================================

window.ProdeAI = (function () {
  const C = () => window.CONFIG || {};

  // Llama una "tarea" del proxy. Devuelve el JSON ({ reply, ... }).
  async function tarea(nombre, params) {
    // SUPABASE_URL / SUPABASE_ANON_KEY son globales definidas en supabase-client.js
    const base = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : '';
    const key = (typeof SUPABASE_ANON_KEY !== 'undefined') ? SUPABASE_ANON_KEY : '';
    const fn = C().AI_PROXY_FN || 'ai-proxy';
    const res = await fetch(`${base}/functions/v1/${fn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({ tarea: nombre, params }),
    });
    let data;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) throw new Error(data.error || 'Error de IA');
    return data;
  }

  // -------- Widget de chat (asistente) --------
  function initWidget() {
    if (!C().AI_ENABLED) return;
    if (document.getElementById('ai-fab')) return; // ya creado

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
      <div class="ai-messages" id="ai-messages">
        <div class="ai-msg ai-bot">¡Hola! Soy el asistente del PRODE. Preguntame sobre las reglas, el puntaje, el costo o cómo participar.</div>
      </div>
      <form class="ai-input-row" id="ai-form">
        <input type="text" id="ai-input" placeholder="Escribí tu pregunta..." autocomplete="off" maxlength="500">
        <button type="submit" id="ai-send">Enviar</button>
      </form>`;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    const messages = panel.querySelector('#ai-messages');
    const form = panel.querySelector('#ai-form');
    const input = panel.querySelector('#ai-input');

    const toggle = (show) => {
      panel.classList.toggle('hidden', show === false ? true : show === true ? false : panel.classList.contains('hidden') ? false : true);
      if (!panel.classList.contains('hidden')) input.focus();
    };
    fab.onclick = () => toggle();
    panel.querySelector('#ai-close').onclick = () => toggle(false);

    function addMsg(texto, who) {
      const div = document.createElement('div');
      div.className = `ai-msg ai-${who}`;
      div.textContent = texto;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }

    form.onsubmit = async (e) => {
      e.preventDefault();
      const pregunta = input.value.trim();
      if (!pregunta) return;
      addMsg(pregunta, 'user');
      input.value = '';
      const loading = addMsg('…', 'bot');
      loading.classList.add('ai-loading');
      try {
        const { reply } = await tarea('asistente', { pregunta });
        loading.classList.remove('ai-loading');
        loading.textContent = reply || 'No tengo respuesta para eso.';
      } catch (err) {
        loading.classList.remove('ai-loading');
        loading.textContent = '⚠️ ' + (err.message || 'No se pudo responder. Probá de nuevo.');
      }
    };
  }

  window.addEventListener('DOMContentLoaded', initWidget);

  return { tarea };
})();
