# Feature: migrate-react

Branch: `feat/migrate-react` (branched from `master` @ 679cdda)
Engram mirror: `odd/migrate-react/tasks` (project `bookingapp_front`)
Status: IN PROGRESS — strategy single-pr, styling Tailwind v4 (decided by user)

## Objective
Migrate the vanilla-JS frontend (3 static pages + global-scripts architecture) to React,
keeping the same layered structure (config / core / services / state / ui / pages) and the same
look & behavior, so that merging to `master` keeps working against `BookingApp_Back` with zero backend changes.

## Current-state findings (evidence)
- Pages: `index.html` (public + 3-step booking modal), `login.html`, `admin.html`.
- Live code: `js/config.js`, `js/core/api-client.js`, `js/services/*`, `js/state/booking-state.js`,
  `js/ui/*`, `js/booking-app.js` (799 L), `js/admin-app.js` (358 L). CSS under `css/`.
- DEAD code (not referenced by any HTML): `js/script.js` (1276 L), `admin/js/admin.js` (859 L), `js/skills/*`. Not migrated.
- Backend contract (BookingApp_Back, NestJS):
  - `POST /api/bookings` (timeout 30s), `GET /api/bookings`, `GET /api/bookings/statistics`, `DELETE /api/bookings/:id`
  - Socket.IO (v4) event `newBooking` on same base URL
  - Booking payload: `{client:{name,id,email,phone}, service:{id,name,price,duration}, professional:{id,name}, date:'YYYY-MM-DD', time:'HH:00', notes, status:'confirmed'}`
  - Records identified by `_id`; admin also tolerates legacy `booking.barber`.
  - CORS (prod) allows ONLY `https://booking-app-front-peach.vercel.app` -> production domain must not change.
- Base URL logic: localhost -> `http://localhost:3000`, otherwise `https://booking-app-back.vercel.app`.
- Auth is a provisional frontend-only check (`admin/admin123`, sessionStorage `isAdmin`/`adminUser`). Behavior preserved; flagged as tech debt (not in scope).
- Old code escapes user input (`sanitizeInput`) BEFORE sending; admin renders it with innerHTML. React must keep sending
  the same escaped payload (data compat) and decode the 5 entities on display, else old records show `&lt;`.
- Deploy: static site on Vercel serving `*.html`. React/Vite needs `vercel.json` (build + SPA rewrites + legacy URL redirects).

## Decisions (defaults, revisable)
- Vite + React 18 + JavaScript (JSX). Mirrors existing structure; no TS migration in scope.
- react-router-dom: `/`, `/login`, `/admin`; legacy `/login.html`, `/admin.html`, `/index.html` redirect to them.
- Styling: Tailwind CSS v4 (`tailwindcss` + `@tailwindcss/vite`) per user request. Bootstrap (CSS+JS) and react-bootstrap are DROPPED.
  Design tokens from `css/variables.css` move to `@theme` in `src/index.css`; `src/index.css` also holds keyframes/fonts only.
  All component styling is utilities in JSX. Old `css/` is used as the visual reference, then deleted in T5.
  Bootstrap markup (row/col/btn/modal/navbar/table/form-control/alert) is re-expressed with utilities; no Bootstrap classes remain.
- Modals/accessibility: `@headlessui/react` Dialog (focus trap, ESC, aria) instead of Bootstrap modal JS.
- Font Awesome stays on CDN link in `index.html` shell (icon classes come from config data).
- Visual parity gate: screenshots of old pages (captured from `master` before deleting) vs new, at mobile/desktop widths.
- Charts: chart.js + react-chartjs-2. Toasts: toastify-js (same look). Realtime: socket.io-client 4.x.
- State: React Context + useReducer replacing `bookingState`.
- Tests: Vitest + Testing Library (Jest-compatible API), replacing Jest suite; contract tests pin exact URLs/methods/payloads.

## Scope
In: everything under src/ (new), root `index.html`, `vite.config.js`, `vercel.json`, `package.json`, tests, README, removal of legacy files.
Out: backend changes, real auth, TypeScript, new features, redesign.

## Acceptance criteria
1. `npm run build` succeeds; `npm test` green.
2. Contract tests prove identical HTTP calls/payloads/socket event vs the old implementation.
3. Manual smoke against local backend: book -> confirmation; admin login -> stats/table/charts/delete; live `newBooking` toast+badge+sound.
4. `vercel.json` makes deep links (`/admin`) and legacy `.html` URLs work.
5. No dead legacy code left; no backend change required.

## Delivery strategy
`single-pr` (user decision): all work-unit commits stay on `feat/migrate-react`; ONE PR to `master` at the end. User owns push/PR/merge.
Forecast: ~3,000-3,500 authored lines (Tailwind rewrite of ~2,700 CSS lines adds to the JS port). Exceeds the ~400 budget by a wide margin;
accepted by user choice, mitigated by one commit per task so reviewers can read the PR commit-by-commit.

## Tasks
- [ ] T1 Scaffold: Vite+React+Tailwind v4, deps, `vercel.json`, shell `index.html`, `@theme` tokens, `config`, `core/api-client`, router skeleton, Vitest setup. Route: delegated (writer) — trigger: 2+ non-trivial files
  - Pre-step: capture baseline screenshots of the 3 legacy pages into `odd/baseline/` (reference for the parity gate; removed before the PR).
- [ ] T2 Services + contract tests: booking/admin/auth/notification/audio services, utils (sanitize, entity decode, formatters). Route: delegated
- [ ] T3 Public home + booking flow: Home, ServiceCard, 3-step BookingModal (context/reducer), Confirmation/Loading modals, toast. Route: delegated
- [ ] T4 Login + Admin: guard, dashboard, bookings table/filter/delete, charts, socket+sound+badge. Route: delegated
- [ ] T5 Port tests, delete legacy (`js/`, `admin/`, old html), README, final verification vs local backend. Route: delegated verify

## Progress / evidence
- Exploration done (parent). Commits: none yet.

## Next step
Confirm delivery strategy, then start T1.
