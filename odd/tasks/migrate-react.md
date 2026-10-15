# Feature: migrate-react

Branch: `feat/migrate-react` (branched from `master` @ 679cdda)
Engram mirror: `odd/migrate-react/tasks` (project `bookingapp_front`)
Status: IMPLEMENTATION COMPLETE (uncommitted, awaiting user commits + PR) — strategy single-pr, styling Tailwind v4 (decided by user)

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
- [x] T1 (commit fe09244; build OK, 26 tests green; RED observed: missing modules) Scaffold: Vite+React+Tailwind v4, deps, `vercel.json`, shell `index.html`, `@theme` tokens, `config`, `core/api-client`, router skeleton, Vitest setup. Route: delegated (writer) — trigger: 2+ non-trivial files
  - Pre-step: capture baseline screenshots of the 3 legacy pages into `odd/baseline/` (reference for the parity gate; removed before the PR).
- [x] T2 (uncommitted; 115 tests at the time, RED observed) Services + contract tests: booking/admin/auth/notification/audio services, utils (sanitize, entity decode, formatters). Route: delegated
- [x] T3 (uncommitted; 132 tests; pixel parity 0px at 390/1440/768) Public home: navbar, hero, services, contact, footer in Tailwind. Route: delegated
- [x] T4 (uncommitted; 182 tests; modal states diff <=0.22%) Booking flow: 3-step BookingModal (context/reducer), availability hook with legacy retry rules, Confirmation/Loading modals. Route: delegated
- [x] T5 (uncommitted; Login/Admin pages, RequireAuth guard, dashboard, bookings table/filter/delete, charts, socket+sound+badge; verified end-to-end in T6) Login + Admin. Route: delegated
- [x] T6 (uncommitted; 276 tests green, build OK; real e2e vs backend PASSED) Port tests, delete legacy (`legacy/`), README, final verification vs local backend. Route: delegated verify

## Progress / evidence
- Exploration done (parent). T1 done: fe09244. Legacy site lives in `legacy/` until T5. Baseline screenshots in `odd/baseline/` (git-excluded locally, not committed).
- T1 notes: Vitest limited to `src/**`; legacy `--container-*` tokens renamed `--container-page-*`; `pulse` keyframe -> `scale-pulse`; `@testing-library/dom` added as peer dep.
- User rule (from T2 on): the user alone runs git commit/push; agents leave work uncommitted. T2-T4 are uncommitted in the working tree.
- Review assessment: RDD not exercised yet (single-pr; assess at end per work-unit).
- T6 evidence:
  - Contract test `src/contract/backendContract.test.js` (13 tests) passed on first real run (only fixture/count typos in the test itself were fixed; no frontend mismatch found). Backend facts: `CreateBookingDto` is a plain class with NO validation decorators and there is NO global ValidationPipe, so the only server-side constraints are the Mongoose `required` flags + service checks. The escaped payload (`&#x27;` etc.) has no length/regex limit to violate. Test also cross-checks the sibling `../BookingApp_Back/src` when present (skipped otherwise).
  - REAL e2e: PASSED. Backend built from a COPY of BookingApp_Back in a temp dir (repo untouched; no node_modules installed there), MongoDB via mongodb-memory-server (Docker daemon was not running), `vite --port 5173`, Playwright/chromium. Verified: UI booking -> confirmation modal; booking in `GET /api/bookings` stored escaped (`&quot;`, `&#x27;`, `&lt;`) with status confirmed; UI marks the slot "Ocupado" and a duplicate POST returns 400 "Ya existe una reserva ..."; admin login -> table shows decoded name; booking created via API while admin open -> bell badge 1 + row appears without reload + oscillator created (sound); delete from admin UI (confirm dialog) -> `GET /api/bookings` empty. Screenshots: `odd/baseline/e2e-1..8-*.png`. All processes stopped; ports 3000/5173/27018 free.
  - Not covered by e2e: audible sound (headless; only AudioContext oscillator creation observed), production CORS (backend `NODE_ENV=production` not exercised), Vercel deploy itself.
  - `legacy/` removed (37 tracked files show as deleted); `appConfig.test.js` dead legacy-file branch removed; no `legacy/` import left in `src/`.
  - `npm run build`: dist/index.html 0.89 kB, css 50.35 kB (10.20 gzip), index.js 277.83 kB (89.43 gzip), lazy Admin chunk 234.64 kB (79.50 gzip). No `bootstrap` anywhere in src/index.html/package.json/dist; only CDN is Font Awesome (+ Google Fonts) from `index.html`.
  - `vite preview` smoke: `/`, `/login`, `/admin`, `/admin.html`, `/login.html`, `/index.html` -> 200. Legacy `.html` deep links resolving through router redirects are covered in `src/App.test.jsx`.
  - Leftovers (intentional): `console.error` in `realtimeService.js` (socket errors, same as legacy), `TODO` in `authService.js` (real auth tech debt). `vite.config.js` has a stale comment about `legacy/` Jest suites (outside T6 edit surface; safe to reword).
  - `package.json` `description` was empty -> filled; `.gitignore` already covers node_modules, dist, coverage, .env, .DS_Store, .codegraph, CLAUDE.md, skills.

## Next step
User reviews and commits (agents never commit), then pushes and opens the single PR to `master`. T1 is already committed (fe09244). Suggested Conventional Commits, one per task (stage by path):
1. `feat(services): add booking/admin/auth/realtime/audio services, utils and contract tests` (T2: `src/services`, `src/utils`, `src/ui`, plus `src/contract` + `src/core` tests if desired)
2. `feat(home): port public home (navbar, hero, services, contact, footer) to React + Tailwind` (T3: `src/components/{home,layout,ui}`, `src/pages/Home*`, `src/index.css`)
3. `feat(booking): add 3-step booking modal with state, availability hook and confirmation` (T4: `src/components/booking`, `src/state`, `src/hooks/useAvailableTimes.js`)
4. `feat(admin): add login, auth guard and admin panel with charts and live notifications` (T5: `src/components/{admin,auth}`, `src/pages/{Admin,Login}*`, `src/hooks/{useAdminData,useBookingNotifications}.js`, `src/App*.jsx`)
5. `chore: remove legacy static site, add README and backend contract test` (T6: `legacy/` deletions, `README.md`, `src/contract`, `src/config/appConfig.test.js`, `package.json`)
Notes: `.atl/` changes are skill-registry noise (commit or discard at will). `odd/` is a feature-tracking dir; the user may commit it or leave it out; `odd/baseline/` is git-excluded locally (screenshots, not for the PR).

- Prod CORS verified (local, NODE_ENV=production, real Chromium via host-resolver-rules): allowed origin https://booking-app-front-peach.vercel.app works for HTTP + Socket.IO; other origins (incl. localhost, www, http, Vercel preview domains) get no ACAO. Not verified: real Vercel deploy, NODE_ENV on Vercel, live push in a second admin session, audible sound.

## Preline integration (post-T6, uncommitted)
- Request: apply the installed Preline plugins to see them in the app (visible change accepted where Preline replaces existing UI; dark/gold identity kept).
- Runtime strategy: SINGLE-PLUGIN packages (`@preline/<x>/non-auto.mjs`), one lazy chunk each, instance per component (`src/lib/usePrelineInstance.js`), `src/lib/preline.js` loader; full `preline` package removed (would duplicate runtimes). Globals: `src/vendor-globals.js` (jQuery + DataTables), `src/vendor-globals-datepicker.js` (lodash merge/mergeWith as `window._`; added deps `lodash.merge`, `lodash.mergewith`). `PrelineInit` (route-level `autoInit`) deleted with its 4 tests: it could not see markup mounted after the route change (lazy Admin chunk, dialogs); its guarantees (init after mount, destroy, cancel-on-unmount, StrictMode) are covered by `usePrelineInstance.test.jsx`.
- Applied: (1) theme via `@preline/*/theme.css` + `:root` token mapping + `<html class="dark">`, border-color rule neutralized; (3) admin user dropdown; (4) bookings datatable (search/sort/pagination, Spanish, rows read as text, rebuilt via key on data change, search/sort kept); (5) datepicker (ISO `YYYY-MM-DD`, min = today in the modal, popup moved inside the host so Headless UI sees it as inside the dialog, Escape closes only the calendar); (6) booking time select (rebuilt in place on option change, `setValue` sync); (7) professional combobox in the admin bookings filters (NEW additive demo capability, not legacy parity); (8) overlay: Headless UI KEPT for the booking/confirmation/loading modals (38 booking-flow tests pin its focus-trap/ESC/inert/timing semantics and jsdom cannot run hs-overlay, so a swap would only test a shim); hs-overlay backs the admin mobile sidebar drawer (backdrop, Escape/backdrop close, focus trap, scroll lock; plugin only exists at <= 768px).
- Preline gotchas found: `destroy()` does not unregister its keyboard handlers (we unregister them), Preline's global Enter handler `preventDefault`s Enter inside registered components (menu item must have no child elements; drawer links stop Enter propagation), datepicker `destroy()` replaces the input with a clone (input created imperatively), overlay `destroy()` strips `hidden`/does not free `body` scroll lock (handled), plugin collections are only created by `autoInit` (created in the loader).
- Verification: `npm test` 369 passing (32 files); build OK; Playwright (outside the repo) against dev (StrictMode) and the production build at 1440 and 390: dropdown, datatable (search/sort/paginate/delete/XSS text), date + professional filters, booking flow with POST body shape, drawer; Home/Login/modal-step-1 pixel-identical to the previous baselines (0-1 px).
- Screenshots: `odd/baseline/preline-*.png`.
