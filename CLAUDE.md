# Project Guidelines — Booking Frontend

Sistema de reservas para BookingApp. Frontend vanilla (HTML + CSS + JS) con Bootstrap 5.3, sin frameworks SPA.

## Architecture

- **Páginas públicas**: `index.html` (landing + modal de reserva), `login.html` (autenticación admin)
- **Panel admin**: `admin.html` con dashboard, tabla de reservas y gráficos (Chart.js)
- **Configuración centralizada**: `js/config.js` — URLs del backend, horarios, servicios, profesionales
- **Lógica de reservas**: `js/script.js` — modal multi-paso (Servicio → Fecha → Profesional → Hora → Confirmar)
- **Lógica admin**: `admin/js/admin.js` — CRUD de reservas, estadísticas, notificaciones en tiempo real (Socket.IO)
- **Backend**: NestJS REST API en `localhost:3000` (dev) / `booking-app-back.vercel.app` (prod)

## Code Style

- **Variables/funciones**: camelCase (`selectedService`, `renderBookingsTable`)
- **Objetos principales**: camelCase con estructura modular (`bookingApp`, `adminApp`, `adminAPI`)
- **Idioma**: UI y comentarios en español
- **Formato de fecha**: dd/mm/yyyy, hora en formato 24h (HH:00)
- **Moneda**: Pesos ($), sin decimales

## Key Patterns

- Estado global con variables simples (`selectedService`, `selectedDate`, `selectedTime`, `selectedProfessional`)
- Event listeners en `init()`/`DOMContentLoaded`
- `try/catch` en todas las llamadas API con mensajes amigables al usuario
- Detección de dispositivo móvil (`isMobileDevice()`) y conexión lenta (`isSlowConnection()`) para adaptar UX
- `AbortController` con timeouts para fetch en redes lentas
- Deshabilitar botón de envío durante procesamiento para evitar doble submit
- Toastify.js para notificaciones al usuario

## API Endpoints

- `GET /api/bookings` — Listar reservas (disponibilidad y admin)
- `GET /api/bookings/statistics` — Estadísticas mensuales (admin)
- `POST /api/bookings` — Crear reserva
- `DELETE /api/bookings/{id}` — Eliminar reserva (admin)

## Business Rules

- Horario: Lun-Vie 9:00–20:00, Sáb 9:00–18:00, Dom cerrado
- Pausa almuerzo: 13:00–14:00 (sin reservas)
- Cancelación mínima: 5 horas antes de la cita
- Un profesional no puede tener dos reservas en el mismo horario
- Múltiples profesionales pueden atender el mismo servicio

## Third-Party Dependencies (CDN)

- Bootstrap 5.3.0, Font Awesome 6.0.0, Toastify.js, Chart.js, Socket.IO 4.5.4
