# Plan de Implementación: Migración y Modernización Monorepo (React + Vite + Node/Express + Netlify Functions)

Transformación de la aplicación monolítica HTML ([APP.html](file:///c:/Users/gabrielt/Documents/Proyectos/AppComparativaPrecios%28Tomy%29/APP.html)) en una arquitectura modular profesional tipo **Monorepo** con cliente React + Vite, servidor backend seguro en Node.js (con soporte para Netlify Functions), PWA con soporte offline y control de versiones con Git.

---

## Nombre Recomendado para el Proyecto

Se proponen las siguientes opciones:
1. **`donyeyo-precios-app`** *(Recomendado: claro, alineado al estándar de nomenclatura corporativa Don Yeyo)*
2. **`dy-relevamiento-precios`**
3. **`dy-price-radar`**

---

## User Review Required

> [!IMPORTANT]
> - **Variables de Entorno Individuales:** Se configurarán dos archivos `.env` independientes: `client/.env` y `server/.env` (junto con sus respectivos `.env.template` comentados). El root **no** contendrá `.env`.
> - **Arquitectura Monorepo:** La raíz contendrá un `package.json` con scripts para correr `npm run dev` unificado (mediante `concurrently`), pero también permitirá ejecutar `npm run dev` independientemente desde `client/` y `server/`.
> - **Seguridad de APIs:** Las llamadas a la API de Inteligencia Artificial (Anthropic / Claude) para voz y OCR de fotos se moverán 100% al backend en Node/Express, protegiendo las API keys que antes estaban en riesgo en el cliente.
> - **Compatibilidad Netlify:** Se estructurará el backend con `serverless-http` / función serverless y un `netlify.toml` para que el deploy a Netlify levante tanto la SPA de Vite como las Netlify Functions (`/api/*`) automáticamente.

---

## Estructura del Monorepo

```text
AppComparativaPrecios/
├── .gitignore
├── README.md
├── package.json               # Scripts unificados (dev, build, install:all)
├── netlify.toml               # Configuración de build y redirects para Netlify
├── client/                    # Frontend React + Vite
│   ├── .env                   # Variables cliente (VITE_API_BASE_URL, etc.)
│   ├── .env.template          # Plantilla documentada
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/        # Login, Header, CargarPrecio, Historial, Dashboard, Novedades, Admin
│       ├── services/          # api.js, storage.js (IndexedDB / LocalStorage), sync.js
│       ├── data/              # dyProducts.js (Catálogo oficial Don Yeyo)
│       └── styles/            # CSS tokens, temas Don Yeyo, diseño responsive mobile
└── server/                    # Backend Node.js / Express / Netlify Functions
    ├── .env                   # Variables server (PORT, ANTHROPIC_API_KEY, SCRIPT_URL, etc.)
    ├── .env.template          # Plantilla documentada
    ├── package.json
    └── src/
        ├── index.js           # Servidor local Express con Hot-Reload (nodemon/watch)
        ├── lambda.js          # Handler para Netlify Functions (serverless-http)
        ├── routes/
        │   ├── auth.routes.js # Login seguro (proxy o auth local con hash)
        │   ├── ai.routes.js   # Proxies de IA para parsing de voz y visión OCR
        │   └── sync.routes.js # Proxies de sincronización hacia Google Sheets
        └── services/
            └── aiService.js   # Lógica de prompts e integración con Anthropic SDK / fetch
```

---

## Proposed Changes

### 1. Inicialización de Git y Configuración Raíz
- Inicializar repositorio Git (`git init`).
- Crear [.gitignore](file:///c:/Users/gabrielt/Documents/Proyectos/AppComparativaPrecios%28Tomy%29/.gitignore) ignorando `node_modules`, `.env`, `dist`, `.netlify`, etc.
- Crear [package.json](file:///c:/Users/gabrielt/Documents/Proyectos/AppComparativaPrecios%28Tomy%29/package.json) en la raíz con herramientas de orquestación (`concurrently`, scripts de `dev`, `build`, `install:all`).
- Crear [netlify.toml](file:///c:/Users/gabrielt/Documents/Proyectos/AppComparativaPrecios%28Tomy%29/netlify.toml) para redirecciones y build de SPA + Netlify Functions.

### 2. Backend Seguro (`server/`)
- Crear `server/package.json` con dependencias (`express`, `cors`, `dotenv`, `serverless-http`, `@anthropic-ai/sdk` o `node-fetch`).
- Crear `server/.env` y `server/.env.template` comentados:
  - `PORT=3001`
  - `ANTHROPIC_API_KEY=tu_api_key_aqui`
  - `GOOGLE_SCRIPT_URL=https://script.google.com/...`
  - `ADMIN_USER=admin`
  - `ADMIN_PASS=...`
- Implementar rutas:
  - `POST /api/auth/login`: validación segura sin exponer credenciales en URLs.
  - `POST /api/ai/parse-voice`: recibe el texto transcripto y devuelve el JSON estructurado.
  - `POST /api/ai/parse-image`: recibe la imagen en base64 de la etiqueta y devuelve el producto y precio leídos.
  - `POST /api/sync/price` y `POST /api/sync/novedad`: puente seguro hacia Google Sheets con manejo de errores real.
- Configurar adaptador `lambda.js` para Netlify Functions (`/.netlify/functions/api`).

### 3. Frontend Moderno (`client/`)
- Inicializar app React + Vite en `client/`.
- Crear `client/.env` y `client/.env.template`:
  - `VITE_API_BASE_URL=http://localhost:3001/api`
- Diseñar la interfaz estética y responsive (Don Yeyo: Azul marino `#1a2b6b`, Rojo acento `#E8003D`, tipografía moderna, micro-animaciones, Toast UI).
- Migrar y enriquecer componentes:
  - **Login:** Autenticación con soporte offline/online.
  - **Cargar Precio:** Modo ráfaga, autocompletado de PDV, geolocalización, captura por voz y lectura de foto OCR mediante los endpoints del backend, vinculación con el catálogo `DY_PRODUCTS`.
  - **Historial:** Lista de relevamientos, estados de sincronización (`sincronizado` / `pendiente`), filtros, exportación a CSV y eliminación.
  - **Dashboard:** Métricas del día (promedio por marca, PDVs visitados, registros totales).
  - **Novedades PDV:** Reportes de góndola con fotos y comentarios.
  - **Admin:** Gestión de usuarios locales y estado activo/inactivo.
- Capa de datos offline (`IndexedDB` + fallback a `localStorage`) con cola de sincronización automática al recuperar conexión (`navigator.onLine`).

### 4. Documentación (`README.md`)
- Crear [README.md](file:///c:/Users/gabrielt/Documents/Proyectos/AppComparativaPrecios%28Tomy%29/README.md) exhaustivo y en castellano con:
  - Descripción y arquitectura del proyecto.
  - Requisitos previos e instalación paso a paso.
  - Comandos para ejecutar en conjunto (`npm run dev` en root) o de forma independiente (`client` / `server`).
  - Variables de entorno explicadas para cliente y servidor.
  - Guía de despliegue en Netlify (SPA + Functions).
  - Documentación de las funcionalidades clave (Modo Ráfaga, IA Voz/OCR, Offline).

---

## Verification Plan

### 1. Pruebas Automatizadas y de Scripts
- `npm run install:all`: Verificar que instale dependencias de root, client y server.
- `npm run dev` (root): Verificar que levante concurrentemente Vite (p. ej. `http://localhost:5173`) y Express (p. ej. `http://localhost:3001`) con hot-reload.
- `npm run dev` dentro de `server/`: Verificar ejecución aislada del backend.
- `npm run dev` dentro de `client/`: Verificar ejecución aislada del frontend.
- `npm run build`: Verificar que compile `client/dist` y el build de producción sin errores.

### 2. Pruebas Funcionales (E2E y Manuales)
- **Login:** Ingreso con credenciales de admin y credenciales locales/remotas.
- **Carga de Relevamientos:** Creación de registro manual, modo ráfaga, y cálculo en Dashboard.
- **Integración IA:** Probar endpoint de voz y OCR de imagen.
- **Sincronización:** Probar almacenamiento local y cola de sincronización.
- **Exportación:** Descarga de archivo CSV formateado.
