// ---------- ESTADO GLOBAL ----------
const state = {
  barrios: [],
  rutas: [],
  alerts: [],
  dict: {}, 
  lang: localStorage.getItem('lang') || 'es',
  favs: JSON.parse(localStorage.getItem('favs') || '[]'),
  lowData: localStorage.getItem('lowData') === 'true',
};

// ---------- SELECTORES RÁPIDOS ----------
const $ = (id) => document.getElementById(id);

// ---------- INICIALIZACIÓN ----------
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadData();
    renderBarrios();
    renderFavs();
    renderAlerts();
    registerSW();

    if (state.lowData) document.body.classList.add('low-data');

    applyLang();
    applyTheme();

    // Eventos (con operador opcional por seguridad)
    $('searchForm')?.addEventListener('submit', handleSearch);
    $('swapBtn')?.addEventListener('click', swapInputs);
    $('langBtn')?.addEventListener('click', toggleLang);
    $('themeBtn')?.addEventListener('click', toggleTheme);
    $('lowDataBtn')?.addEventListener('click', toggleLowData);

  } catch (err) {
    console.error('Error inicializando app:', err);
    const est = $('estimations');
    if (est) est.innerHTML = `<p class="error">Error cargando datos. Asegúrate de usar un servidor local.</p>`;
  }
});

// ---------- CARGA DE DATOS ----------
async function loadData() {
  const [barrios, rutas, alerts, dict] = await Promise.all([
    fetch('data/barrios.json').then(r => r.ok ? r.json() : []),
    fetch('data/rutas.json').then(r => r.ok ? r.json() : []),
    fetch('data/alerts.json').then(r => r.ok ? r.json() : []),
    fetch('data/i18n.json').then(r => r.ok ? r.json() : {}),
  ]);
  Object.assign(state, { barrios, rutas, alerts, dict });
}

// ---------- RENDERIZADO ----------
function renderBarrios() {
  const list = $('barriosList');
  if (list) {
    list.innerHTML = state.barrios.map(b => `<option value="${b}">`).join('');
  }
}

function renderAlerts() {
  const c = $('alerts');
  if (!c) return;
  if (!state.alerts.length) {
    c.innerHTML = `<p data-i18n="noAlerts">No hay alertas activas.</p>`;
    return;
  }
  c.innerHTML = state.alerts.map(a => `
    <div class="alert alert--${a.tipo.toLowerCase()}">
      <strong>${a.tipo}</strong>: ${a.mensaje}
    </div>
  `).join('');
}

function renderFavs() {
  const count = $('countFavs');
  if (count) count.textContent = state.favs.length;
  
  const list = $('favsList');
  if (!list) return;
  
  if (!state.favs.length) {
    list.innerHTML = `<li class="small muted" data-i18n="noFavs">(sin favoritas)</li>`;
    return;
  }
  list.innerHTML = state.favs.map(f => `
    <li>
      ${f.origen} ➜ ${f.destino}
      <button class="btn-remove" onclick="removeFav('${f.id}')" aria-label="Eliminar">✕</button>
    </li>
  `).join('');
}

function renderMinimap(origen, destino) {
  const map = $('minimap');
  if (!map) return;
  map.innerHTML = `
    <svg viewBox="0 0 200 100" width="100%" height="100%">
      <circle cx="30" cy="50" r="6" fill="#0b79f7"></circle>
      <text x="10" y="80" font-size="10" fill="currentColor">${origen}</text>
      <circle cx="170" cy="50" r="6" fill="#0b79f7"></circle>
      <text x="140" y="80" font-size="10" fill="currentColor">${destino}</text>
      <line x1="36" y1="50" x2="164" y2="50" stroke="#4da3ff" stroke-width="2" stroke-dasharray="4"/>
    </svg>
  `;
}

function renderRutas(rutas, o, d) {
  const cont = $('estimations');
  if (!cont) return;
  
  if (!rutas.length) {
    cont.innerHTML = `<p>No se encontraron rutas directas.</p>`;
    return;
  }

  cont.innerHTML = rutas.map(r => `
    <article class="route">
      <div class="meta">
        <span class="badge">${r.tipo}</span>
        <span>${r.tiempo} min</span>
        <span>RD$${r.costo}</span>
      </div>
      <button class="fav" onclick="saveFav('${r.id}','${o}','${d}')">⭐</button>
    </article>
  `).join('');
}

// ---------- LÓGICA DE NEGOCIO ----------
function handleSearch(e) {
  e.preventDefault();
  const o = $('origen').value.trim();
  const d = $('destino').value.trim();

  if (!o || !d) return;
  if (o === d) {
    $('estimations').innerHTML = `<p class="error">El origen y destino son iguales.</p>`;
    return;
  }

  renderMinimap(o, d);
  const resultados = state.rutas.filter(r => r.origen === o && r.destino === d);
  renderRutas(resultados, o, d);
}

function swapInputs() {
  const o = $('origen'), d = $('destino');
  [o.value, d.value] = [d.value, o.value];
}

function saveFav(id, origen, destino) {
  if (state.favs.find(f => f.id === id)) return;
  state.favs.push({ id, origen, destino });
  localStorage.setItem('favs', JSON.stringify(state.favs));
  renderFavs();
}

function removeFav(id) {
  state.favs = state.favs.filter(f => f.id !== id);
  localStorage.setItem('favs', JSON.stringify(state.favs));
  renderFavs();
}

// ---------- CONFIGURACIONES ----------
function toggleLang() {
  state.lang = state.lang === 'es' ? 'en' : 'es';
  localStorage.setItem('lang', state.lang);
  applyLang();
}

function applyLang() {
  const d = state.dict?.[state.lang];
  if (!d) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (d[key]) el.textContent = d[key];
  });

  if ($('langBtn')) $('langBtn').textContent = state.lang.toUpperCase();
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function applyTheme() {
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
}

function toggleLowData() {
  state.lowData = !state.lowData;
  localStorage.setItem('lowData', state.lowData);
  document.body.classList.toggle('low-data', state.lowData);
}

async function registerSW() {
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('service-worker.js'); } 
    catch (e) { console.warn('SW no se pudo registrar:', e); }
  }
}

// EXPOSICIÓN GLOBAL PARA HTML
Object.assign(window, { 
  toggleLang, toggleTheme, toggleLowData, swapInputs, 
  saveFav, removeFav, handleSearch 
});
