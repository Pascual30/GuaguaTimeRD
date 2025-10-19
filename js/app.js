//  app.js  //

// ---------- ESTADO GLOBAL ----------
const state = {
  barrios: [],                            // Lista de barrios (autocompletado)
  rutas: [],                              // Rutas disponibles
  alerts: [],                             // Alertas activas
  dict: {},                               // Diccionario de traducciones 
  lang: localStorage.getItem('lang') || 'es', // Idioma actual (por defecto: español)
  favs: JSON.parse(localStorage.getItem('favs') || '[]'), // Favoritas guardadas
  lowData: localStorage.getItem('lowData') === 'true',    // Modo ahorro activado
};

// ---------- SELECTORES RÁPIDOS ----------
const qs = (s) => document.querySelector(s);  // Selector CSS corto
const $ = (id) => document.getElementById(id); // Selector por ID

// ---------- INICIALIZACIÓN ----------
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadData();           // Carga los archivos JSON locales (datos + traducciones)
    renderBarrios();            // Llena el datalist con los barrios
    renderFavs();               // Muestra las rutas favoritas
    renderAlerts();             // Muestra alertas activas
    registerSW();               // Registra el Service Worker (para PWA)

    // Si estaba activado el modo ahorro, aplica la clase al body
    if (state.lowData) document.body.classList.add('low-data');

    // Aplica idioma y tema previamente guardados
    applyLang();
    applyTheme();

    // ---------- EVENTOS ----------
    $('searchForm').addEventListener('submit', handleSearch);
    $('swapBtn').addEventListener('click', swapInputs);
    $('langBtn').addEventListener('click', toggleLang);
    $('themeBtn').addEventListener('click', toggleTheme);
    $('lowDataBtn')?.addEventListener('click', toggleLowData);

  } catch (err) {
    console.error('Error inicializando app:', err);
    $('estimations').innerHTML = `<p class="error">Error cargando datos locales.</p>`;
  }
});

// ---------- CARGA DE DATOS ----------
async function loadData() {
  // Carga simultaneamente los archivos JSON necesarios
  const [barrios, rutas, alerts, dict] = await Promise.all([
    fetch('data/barrios.json').then(r => r.json()),
    fetch('data/rutas.json').then(r => r.json()),
    fetch('data/alerts.json').then(r => r.json()),
    fetch('data/i18n.json').then(r => r.json()), // Diccionario de idiomas
  ]);
  // Copia los datos cargados al estado global
  Object.assign(state, { barrios, rutas, alerts, dict });
}

// ---------- RENDERIZADO DE INTERFAZ ----------
function renderBarrios() {
  const list = $('barriosList');
  list.innerHTML = state.barrios.map(b => `<option value="${b}">`).join('');
}

function renderAlerts() {
  const c = $('alerts');
  if (!state.alerts.length) {
    c.innerHTML = `<p>No hay alertas activas.</p>`;
    return;
  }
  // Cada alerta tiene tipo (info, aviso, error) y mensaje
  c.innerHTML = state.alerts.map(a => `
    <div class="alert alert--${a.tipo.toLowerCase()}">
      <strong>${a.tipo}</strong>: ${a.mensaje}
    </div>
  `).join('');
}

function renderFavs() {
  $('countFavs').textContent = state.favs.length;
  const list = $('favsList');
  if (!state.favs.length) {
    list.innerHTML = `<li class="small muted">(sin favoritas)</li>`;
    return;
  }
  list.innerHTML = state.favs.map(f => `
    <li>
      ${f.origen} ➜ ${f.destino}
      <button class="btn-remove" onclick="removeFav('${f.id}')" aria-label="Eliminar favorita">✕</button>
    </li>
  `).join('');
}

function renderMinimap(origen, destino) {
  // Mini mapa visual con SVG (puntos conectados)
  const map = $('minimap');
  map.innerHTML = `
    <svg viewBox="0 0 200 200" width="100%" height="100%">
      <circle cx="40" cy="160" r="8" fill="#0b79f7"></circle>
      <text x="15" y="180" font-size="10">${origen}</text>
      <circle cx="160" cy="40" r="8" fill="#0b79f7"></circle>
      <text x="135" y="30" font-size="10">${destino}</text>
      <line x1="40" y1="160" x2="160" y2="40" stroke="#4da3ff" stroke-width="3"/>
    </svg>
  `;
}

// ---------- BUSQUEDA DE RUTAS ----------
function handleSearch(e) {
  e.preventDefault();
  const o = $('origen').value.trim();
  const d = $('destino').value.trim();

  // Validaciones básicas
  if (!o || !d) {
    $('estimations').innerHTML = `<p class="error">Por favor, selecciona origen y destino válidos.</p>`;
    return;
  }
  if (o === d) {
    $('estimations').innerHTML = `<p class="error">El origen y destino no pueden ser iguales.</p>`;
    return;
  }

  renderMinimap(o, d);
  const rutas = calcRutas(o, d);
  renderRutas(rutas, o, d);
}

// Busca rutas que coincidan con el origen y destino
function calcRutas(o, d) {
  return state.rutas
    .filter(r => r.origen === o && r.destino === d)
    .sort((a, b) => a.tiempo - b.tiempo);
}

function renderRutas(rutas, o, d) {
  const cont = $('estimations');
  if (!rutas.length) {
    cont.innerHTML = `<p>No se encontraron rutas entre ${o} y ${d}.</p>`;
    return;
  }

  // Muestra las rutas ordenadas por tiempo
  cont.innerHTML = rutas.map(r => `
    <article class="route" tabindex="0" role="button" aria-label="Ruta ${r.tipo}">
      <div class="meta">
        <span class="badge">${r.tipo}</span>
        <span>${r.tiempo} min</span>
        <span>${r.costo} RD$</span>
      </div>
      <button class="fav" title="Guardar favorita" 
        onclick="saveFav('${r.id}','${o}','${d}')">⭐</button>
    </article>
  `).join('');
}

// Intercambia los valores de los campos origen/destino
function swapInputs() {
  const o = $('origen'), d = $('destino');
  [o.value, d.value] = [d.value, o.value];
}

// ---------- FAVORITOS ----------
function saveFav(id, origen, destino) {
  if (state.favs.find(f => f.id === id)) return; // Evita duplicados
  state.favs.push({ id, origen, destino });
  localStorage.setItem('favs', JSON.stringify(state.favs));
  renderFavs();
}

function removeFav(id) {
  state.favs = state.favs.filter(f => f.id !== id);
  localStorage.setItem('favs', JSON.stringify(state.favs));
  renderFavs();
}

// Hace disponibles las funciones desde HTML inline
window.removeFav = removeFav;
window.saveFav = saveFav;

// ---------- CAMBIO DE IDIOMA ----------
function toggleLang() {
  // Cambia entre español e ingles
  state.lang = state.lang === 'es' ? 'en' : 'es';
  localStorage.setItem('lang', state.lang);
  applyLang();
}
// ---------- HACER FUNCIONES GLOBALES (NECESARIO CON type="module") ----------
window.toggleLang = toggleLang;
window.toggleTheme = toggleTheme;
window.toggleLowData = toggleLowData;
window.swapInputs = swapInputs;
window.handleSearch = handleSearch;
window.saveFav = saveFav;
window.removeFav = removeFav;

function applyLang() {
  const d = state.dict?.[state.lang];
  if (!d) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (d[key]) el.textContent = d[key];
  });

  const btn = $('langBtn');
  if (btn) btn.textContent = state.lang.toUpperCase();

  if (state.alerts.length) renderAlerts();

  console.log(`Idioma aplicado: ${state.lang.toUpperCase()}`);
}


// ---------- MODO AHORRO DE DATOS ----------
function toggleLowData() {
  state.lowData = !state.lowData;
  localStorage.setItem('lowData', state.lowData);
  document.body.classList.toggle('low-data', state.lowData);

  const d = state.dict[state.lang];
  const msg = state.lowData ? d["lowData_on"] : d["lowData_off"];
  alert(msg);
}

// ---------- TEMA (CLARO/OSCURO) ----------
function toggleTheme() {
  const root = document.documentElement;
  const dark = root.classList.toggle('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  applyTheme();
}

function applyTheme() {
  const saved = localStorage.getItem('theme');
  const root = document.documentElement;
  if (saved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// ---------- REGISTRO DE SERVICE WORKER ----------
async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('service-worker.js');
      console.log('Service Worker registrado.');
    } catch (err) {
      console.warn('SW no se pudo registrar:', err);
    }
  }
}
