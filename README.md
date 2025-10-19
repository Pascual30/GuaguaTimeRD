# RutasDR — Aplicación Web de Rutas de Transporte Público en República Dominicana

**RutasDR** es una aplicación web 100% en el navegador (sin backend externo) que permite consultar rutas de transporte urbano e interurbano entre distintos barrios o sectores dominicanos.  
Funciona como una **PWA ligera**, con soporte offline, modo oscuro y modo ahorro de datos.

---

## Funcionalidades principales

- ✅ **Elección de origen y destino** entre barrios dominicanos.
- 🚍 **Visualización de rutas disponibles** (concho, guagua, carro público, motoconcho) con tiempos y costos estimados.
- ⚖️ **Comparación de rutas** por tiempo o costo.
- ⭐ **Guardado de rutas favoritas** en el dispositivo (usa `localStorage`).
- ⚠️ **Visualización de alertas activas** (lluvia, hora pico, paro, etc.).
- 💾 **Funcionamiento 100% local** con datos en archivos `.json`.
- 📱 **Diseño responsive**, accesible y optimizado para móviles y escritorio.

---

## 💡 Extras implementados

| Funcionalidad | Descripción |
|----------------|-------------|
| 🌓 **Modo oscuro automático** | Detecta `prefers-color-scheme` y permite alternar manualmente. |
| 🗺️ **Mini-mapa SVG** | Muestra un esquema visual simple entre origen y destino. |
| ⚡ **PWA ligera** | `manifest.json` y `service-worker.js` para cachear archivos y usar offline. |
| 🔋 **Modo ahorro de datos** | Oculta imágenes y animaciones innecesarias para reducir consumo. |
| 🌐 **i18n (ES/EN)** | Diccionario JSON (`data/i18n.json`) para cambiar idioma dinámicamente. |
| ♿ **Accesibilidad** | Estructura semántica (`header`, `nav`, `main`, `section`, `footer`), etiquetas `aria` y manejo de foco. |
| 💨 **Rendimiento** | Optimizada para buen puntaje en Lighthouse (Performance + Accessibility). |

---

## Estructura del proyecto
/
├── index.html
├── manifest.json
├── service-worker.js
├── /css/
│ └── styles.css
├── /js/
│ └── app.js
├── /data/
│ ├── barrios.json
│ ├── rutas.json
│ ├── alerts.json
│ └── i18n.json
├── /icons/
│ ├── icon-192.png
│ └── icon-512.png
└── README.md

