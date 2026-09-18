# 🛒 Don Yeyo — Relevamiento y Comparativa de Precios

Aplicación móvil web (PWA / Responsive Mobile) diseñada para los relevadores y supervisores comerciales de **Don Yeyo S.A.** Permite relevar precios de la competencia en góndolas de supermercados y autoservicios, compararlos contra el catálogo de productos propios, registrar novedades de punto de venta (PDV) y sincronizar automáticamente con Google Sheets y backend seguro en la nube.

---

## 🚀 Arquitectura del Proyecto

El proyecto está estructurado como un **Monorepo** modular compuesto por:

```text
├── client/                 # Frontend SPA (React 18 + Vite + Lucide Icons)
│   ├── .env                # Variables de entorno del cliente
│   ├── .env.template       # Plantilla documentada de variables del cliente
│   └── src/                # Componentes React, hooks, servicios y estilos CSS
├── server/                 # Backend seguro (Node.js + Express + Netlify Functions)
│   ├── .env                # Variables de entorno del servidor
│   ├── .env.template       # Plantilla documentada de variables del servidor
│   └── src/                # Endpoints de Auth, IA (Voz/OCR) y Sincronización
├── netlify.toml            # Configuración para despliegue serverless en Netlify
├── package.json            # Orquestación de scripts para desarrollo y build
└── README.md               # Documentación general del sistema
```

---

## 🌟 Funcionalidades Principales

1. **Autenticación y Seguridad:**
   - Login seguro mediante petición `POST` al backend.
   - Claves de API (Anthropic / Claude) y credenciales protegidas en el backend sin exposición en el navegador.

2. **Carga Inteligente de Precios:**
   - **⚡ Modo Ráfaga:** Permite fijar un local/PDV y cargar múltiples precios rápidamente sin reingresar datos del comercio.
   - **🎙️ Entrada por Voz con IA:** Captura audio por micrófono y utiliza IA (Claude) para estructurar automáticamente local, producto, marca y precio.
   - **📷 Lectura de Etiquetas (Foto OCR):** Captura o sube una foto de la etiqueta de góndola y extrae los datos mediante visión de IA.
   - **📍 Geolocalización Automática:** Guarda coordenadas GPS (`lat`, `lng`) en cada registro si el dispositivo lo autoriza.
   - **📦 Catálogo Don Yeyo y Comparativa:** Vinculación opcional con productos propios de Don Yeyo y DeViano (`Ref DY`) y registro de **Precio Propio (`Precio Pro`)** para análisis comparativo en góndola.
   - **📊 Sincronización con Google Sheets:** Mapeo automático y normalizado de todas las columnas (incluyendo `Precio Pro` / `dyPrecio`, `Ref DY`, fecha, hora, ubicación, etc.) hacia la hoja de cálculo.

3. **Historial y Modo Offline-First:**
   - Almacenamiento local persistente por usuario con visualización de producto propio y Precio Pro.
   - Indicador visual de estado de sincronización (`🟢 Sincronizado` / `🔴 Pendiente`).
   - Sincronización automática en segundo plano al recuperar la conexión a internet.
   - Exportación de relevamientos a archivo **CSV** compatible con Excel (incluyendo columna `Precio Pro`).

4. **Dashboard de Métricas en Tiempo Real:**
   - Conteo diario de registros totales, PDVs visitados y marcas relevadas.
   - Cálculo automático de **precio promedio por marca**.

5. **Novedades de PDV:**
   - Reporte de faltantes de stock, quejas, oportunidades comerciales o problemas de exhibición con adjunto fotográfico.

6. **Panel de Administración:**
   - Gestión de operadores locales, activación/desactivación de accesos.

---

## ⚙️ Configuración y Variables de Entorno

Cada aplicación (`client` y `server`) cuenta con su propio archivo `.env` independiente. **No se utiliza un `.env` en la raíz.**

### 1. Variables del Servidor (`server/.env`)

Copia `server/.env.template` a `server/.env` y ajusta según tu entorno:

```env
# Puerto local en el que corre Express
PORT=3001

# Clave de API de Anthropic (Claude) para Voz y OCR (si está vacía usa fallback local)
ANTHROPIC_API_KEY=tu_clave_aqui

# Modelo de IA a utilizar
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# URL de Webhook de Google Apps Script (Google Sheets)
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/.../exec

# Credenciales de Administrador por defecto
ADMIN_USERNAME=admin
ADMIN_PASSWORD=dyAdmin2024

### 2. Variables del Cliente (`client/.env`)

Copia `client/.env.template` a `client/.env`:

```env
# URL Base de la API (en desarrollo usa proxy '/api')
VITE_API_BASE_URL=/api

# Título de la pestaña
VITE_APP_TITLE=Relevamiento de Precios — Don Yeyo
```

---

## 🛠️ Instalación y Puesta en Marcha

### Requisitos Previos
- **Node.js:** v18.0.0 o superior
- **NPM:** v9.0.0 o superior

### 1. Instalar todas las dependencias
Desde la raíz del proyecto, ejecuta:

```bash
npm run install:all
```

---

### 2. Ejecutar en Modo Desarrollo (Hot-Reload)

Puedes levantar todo el sistema de tres maneras según tu flujo de trabajo:

#### Opción A: Levantar Frontend y Backend juntos (Recomendado)
Desde la **raíz del proyecto**:
```bash
npm run dev
```
> Esto iniciará concurrentemente:
> - **Backend (Express):** `http://localhost:3001`
> - **Frontend (Vite + React):** `http://localhost:5173`

#### Opción B: Levantar solo el Backend
```bash
# Desde la raíz:
npm run dev:server

# O ingresando a server/:
cd server
npm run dev
```

#### Opción C: Levantar solo el Frontend
```bash
# Desde la raíz:
npm run dev:client

# O ingresando a client/:
cd client
npm run dev
```

---

### 3. Compilar para Producción

Desde la raíz:
```bash
npm run build
```

---

## ☁️ Despliegue en Netlify

El proyecto está preparado para desplegarse directamente en **Netlify** utilizando el archivo `netlify.toml`:

1. Conecta tu repositorio de GitHub / GitLab a Netlify.
2. Netlify detectará la configuración de `netlify.toml`:
   - **Publish directory:** `client/dist`
   - **Build command:** `npm run build --prefix client`
   - **Functions directory:** `netlify/functions`
3. En el panel de Netlify (*Site settings > Environment variables*), agrega las variables del servidor (`ANTHROPIC_API_KEY`, `GOOGLE_SCRIPT_URL`, `ADMIN_PASSWORD`, etc.).
4. Las llamadas a `/api/*` se resolverán automáticamente a través de la Serverless Function de Netlify (`netlify/functions/api.js`).

---

## 📄 Licencia

Desarrollado para uso interno y comercial exclusivo de **Don Yeyo S.A.**
