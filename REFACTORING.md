# Plan de Refactorización — BookingApp Front

## Resumen Ejecutivo

El proyecto es una aplicación multi-página en **vanilla JS + Bootstrap 5** sin bundler ni framework. Funciona correctamente a escala actual (~1,500 líneas JS), pero presenta problemas estructurales que dificultarán el mantenimiento y la adición de features. Este plan propone una refactorización por capas sin migrar a un framework externo.

---

## Estado Actual

### Estructura existente

```
BookingApp_Front/
├── index.html
├── login.html
├── admin.html
├── js/
│   ├── config.js          # Configuración y datos estáticos
│   └── script.js          # Lógica de reservas (1,258 líneas)
├── admin/
│   ├── js/admin.js        # Lógica del panel admin (834 líneas)
│   └── css/admin.css
├── css/styles.css
├── img/
└── tests/
    ├── setup.js
    ├── helpers.js
    ├── script.test.js
    ├── admin.test.js
    └── config.test.js
```

### Problemas identificados

| # | Problema | Severidad | Ubicación |
|---|---|---|---|
| 1 | Credenciales hardcodeadas en HTML | CRÍTICO | `login.html:142-145` |
| 2 | Estado global con 9 variables sueltas | ALTO | `script.js:82-92` |
| 3 | Archivos JS monolíticos | ALTO | `script.js` (1,258 líneas), `admin.js` (834 líneas) |
| 4 | Lógica de negocio mezclada con manipulación de DOM | ALTO | Ambos archivos principales |
| 5 | Boilerplate de `fetch` + timeout duplicado 4+ veces | MEDIO | `bookingAPI`, `adminAPI` |
| 6 | Sin interceptores centralizados de requests | MEDIO | `bookingAPI`, `adminAPI` |
| 7 | Sin manejo de errores consistente | MEDIO | Múltiples llamadas API |
| 8 | Registro frágil de event listeners | MEDIO | `script.js:140-167` |
| 9 | Auth en sessionStorage sin token | BAJO | `login.html`, `admin.js` |
| 10 | Chart.js cargado por CDN pero sin uso real | BAJO | `admin.html` |

---

## Estructura Propuesta

```
BookingApp_Front/
├── index.html
├── login.html
├── admin.html
│
├── js/
│   │
│   ├── config.js                        # Sin cambios
│   │
│   ├── core/
│   │   └── api-client.js                # Cliente HTTP centralizado
│   │
│   ├── services/                        # Lógica de negocio pura (sin DOM)
│   │   ├── booking-service.js
│   │   ├── admin-service.js
│   │   └── auth-service.js
│   │
│   ├── ui/
│   │   ├── components/                  # Funciones de render puras
│   │   │   ├── service-card.js
│   │   │   ├── professional-card.js
│   │   │   ├── time-slot.js
│   │   │   └── booking-table.js
│   │   └── toast.js                     # Wrapper de Toastify
│   │
│   ├── state/
│   │   └── booking-state.js             # Estado centralizado del flujo de reserva
│   │
│   ├── booking-app.js                   # Orquestador del flujo cliente
│   └── admin-app.js                     # Orquestador del panel admin
│
├── admin/
│   └── css/admin.css
│
├── css/styles.css
├── img/
│
└── tests/
    ├── setup.js
    ├── helpers.js
    ├── services/
    │   ├── booking-service.test.js
    │   ├── admin-service.test.js
    │   └── auth-service.test.js
    └── ui/
        └── components/
            ├── service-card.test.js
            └── booking-table.test.js
```

---

## Descripción por Módulo

### `js/core/api-client.js`

Cliente HTTP único que centraliza: timeout con `AbortController`, headers, manejo de errores HTTP y errores de red. Elimina el boilerplate repetido en `bookingAPI` y `adminAPI`.

```js
// Interfaz esperada
apiClient.get(path, options)
apiClient.post(path, body, options)
apiClient.delete(path, options)
```

**Beneficio:** cualquier cambio global (añadir un header de auth, cambiar timeout, logging) se hace en un solo lugar.

---

### `js/services/booking-service.js`

Toda la lógica de negocio relacionada con reservas, **sin referencias al DOM**. Usa `apiClient` internamente.

```js
bookingService.createBooking(data)
bookingService.getAvailableTimes(date, professionalId)
bookingService.checkAvailability(date, time, professionalId)
```

---

### `js/services/admin-service.js`

Lógica del panel admin, sin DOM. Usa `apiClient`.

```js
adminService.getBookings()
adminService.getStatistics()
adminService.deleteBooking(id)
```

---

### `js/services/auth-service.js`

Manejo de autenticación. El login llama al backend (`POST /api/auth/login`) en lugar de validar credenciales en el frontend. Guarda el token recibido.

```js
authService.login(username, password)   // POST al backend
authService.logout()
authService.isAuthenticated()
authService.getToken()
```

**Elimina:** credenciales hardcodeadas en `login.html`.

---

### `js/state/booking-state.js`

Objeto centralizado que reemplaza las 9 variables globales sueltas del flujo de reserva.

```js
// Antes (script.js)
let currentStep = 1;
let selectedService = null;
let selectedDate = null;
// ...

// Después
const bookingState = {
  get(key),
  set(key, value),
  reset(),
  isValid()
}
```

---

### `js/ui/components/*.js`

Funciones puras de render que reciben datos y devuelven HTML string o nodo DOM. Sin lógica de negocio ni llamadas API.

```js
// Ejemplo: service-card.js
function renderServiceCard(service) {
  return `<div class="service-card" data-id="${service.id}">...</div>`;
}
```

---

### `js/ui/toast.js`

Wrapper de Toastify que centraliza los tipos (`success`, `error`, `warning`, `info`) y la duración por defecto.

```js
toast.success(message)
toast.error(message)
toast.warning(message)
```

---

### `js/booking-app.js` y `js/admin-app.js`

Orquestadores: reciben eventos del DOM, llaman a `services`, actualizan `state`, llaman a `ui/components`. Son los únicos que conocen tanto el DOM como los servicios.

---

## Plan de Ejecución por Fases

### Fase 1 — Seguridad (Crítico)
- [ ] Crear `auth-service.js` con login contra backend
- [ ] Eliminar credenciales hardcodeadas de `login.html`
- [ ] Validar token en `admin.js` en lugar de sessionStorage plano

### Fase 2 — Core HTTP
- [ ] Crear `core/api-client.js`
- [ ] Reemplazar `bookingAPI` y `adminAPI` con `apiClient`
- [ ] Verificar que los tests existentes siguen pasando

### Fase 3 — Estado centralizado
- [ ] Crear `state/booking-state.js`
- [ ] Reemplazar variables globales en `script.js`
- [ ] Actualizar tests de `script.test.js`

### Fase 4 — Separación de capas (Services)
- [ ] Extraer `booking-service.js` desde `script.js`
- [ ] Extraer `admin-service.js` desde `admin.js`
- [ ] Mover lógica de negocio fuera de los orquestadores

### Fase 5 — Componentes UI
- [ ] Extraer funciones de render a `ui/components/`
- [ ] Refactorizar `booking-app.js` para usar los componentes
- [ ] Crear `ui/toast.js`

### Fase 6 — Tests
- [ ] Reorganizar tests en `tests/services/` y `tests/ui/`
- [ ] Añadir tests unitarios para los nuevos módulos
- [ ] Verificar cobertura general

---

## Decisión sobre Framework

Para el tamaño actual del proyecto (3 páginas HTML, ~1,500 líneas JS), **no se recomienda migrar a React/Vue**. El refactor propuesto resuelve todos los problemas estructurales con vanilla JS modular.

Reconsiderar si:
- Se añaden más de 5 páginas nuevas
- Se requiere estado compartido entre páginas
- El equipo ya tiene experiencia con un framework específico

---

## Compatibilidad

- Sin cambios en `index.html`, `admin.html` ni `login.html` (excepto Fase 1)
- Sin build tools adicionales (el proyecto sigue siendo estático)
- Los tests existentes deben seguir pasando al final de cada fase
