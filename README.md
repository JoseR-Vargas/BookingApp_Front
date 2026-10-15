# BookingApp Front

Appointment booking web app: a public site with a 3-step booking flow (service → date/time/professional → client details) and a provisional admin panel (dashboard, bookings table, charts, live notifications). It talks to the NestJS API in `BookingApp_Back`.

## Stack

- React 18 + Vite (JavaScript / JSX)
- Tailwind CSS v4 (design tokens in `@theme`, see `src/index.css`)
- react-router-dom, `@headlessui/react` (dialogs), chart.js + react-chartjs-2, socket.io-client, toastify-js
- Vitest + Testing Library
- Font Awesome and Google Fonts are loaded from CDN in `index.html`

## Scripts

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Vite dev server (http://localhost:5173)   |
| `npm run build`   | Production build into `dist/`             |
| `npm run preview` | Serves the production build locally       |
| `npm test`        | Runs the Vitest suite once                |

## Backend URL

Resolved at load time in `src/config/appConfig.js` from `window.location.hostname`:

- `localhost` / `127.0.0.1` → `http://localhost:3000`
- anything else → `https://booking-app-back.vercel.app`

There is no `.env` configuration. To develop locally, run `BookingApp_Back` on port 3000.

> The production backend only allows CORS (HTTP and Socket.IO) from `https://booking-app-front-peach.vercel.app`. The production domain of this frontend must not change unless the backend is updated too.

## Backend contract

`POST /api/bookings` (30 s timeout), `GET /api/bookings`, `GET /api/bookings/statistics`, `DELETE /api/bookings/:id`, and the Socket.IO event `newBooking`. The contract is pinned by `src/contract/backendContract.test.js` (payload shape vs the backend schema, endpoints, event name) and by the service tests.

User text is HTML-escaped before it is sent (`sanitizeInput`), exactly as the pre-React app did, so records stay compatible. The UI decodes those five entities when displaying (`decodeEntities`).

## Project structure

```
src/
  config/      APP_CONFIG: backend URL, business hours, services, professionals
  core/        apiClient: fetch wrapper with timeout and error mapping
  services/    booking, admin, auth, realtime (socket) and audio services (no React)
  state/       booking flow state (React context + reducer)
  hooks/       useAdminData, useAvailableTimes, useBookingNotifications
  ui/          toast wrapper
  utils/       sanitize, formatting, schedule, device and admin-stats helpers
  components/  home/, booking/, admin/, auth/, layout/, ui/ (Tailwind utilities in JSX)
  pages/       Home, Login, Admin
  contract/    backend contract tests
  test/        Vitest setup
```

## Routes

| Path     | Page                                   |
| -------- | -------------------------------------- |
| `/`      | Public home + booking modal            |
| `/login` | Admin login                            |
| `/admin` | Admin panel (requires the session flag) |

Legacy URLs `/index.html`, `/login.html` and `/admin.html` redirect to `/`, `/login` and `/admin`.

## Admin authentication (known tech debt)

Login is a provisional, frontend-only check (credentials in `src/services/authService.js`, session flags `isAdmin` / `adminUser` in `sessionStorage`). It is not real security: the admin API endpoints are public. It is kept only for behavior parity (including the 5-attempt lockout); replacing it with a real `POST /api/auth/login` is pending backend support.

## Deploy (Vercel)

`vercel.json` sets the Vite framework preset, `npm run build` → `dist`, and a catch-all rewrite to `/index.html` so deep links (`/admin`) are served by the SPA router. Static assets are served by the filesystem before the rewrite.
