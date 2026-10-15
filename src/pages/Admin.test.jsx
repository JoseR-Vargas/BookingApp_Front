import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../ui/toast.js', () => ({
  toast: { show: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));
vi.mock('socket.io-client', () => ({ io: vi.fn() }));
// jsdom has no canvas: replace the chart wrappers with probes exposing their props.
vi.mock('react-chartjs-2', () => ({
  Line: (props) => (
    <div data-testid="line-chart" data-config={JSON.stringify({ data: props.data, options: props.options })} />
  ),
  Doughnut: (props) => (
    <div data-testid="doughnut-chart" data-config={JSON.stringify({ data: props.data, options: props.options })} />
  ),
}));

import { io } from 'socket.io-client';
import { audioService } from '../services/audioService.js';
import { toast } from '../ui/toast.js';
import Admin from './Admin.jsx';

const BASE = 'http://localhost:3000';
const YEAR = new Date().getFullYear();

function makeBooking(n, overrides = {}) {
  return {
    _id: `id-${n}`,
    client: { name: `Cliente ${n}`, email: `c${n}@example.com`, phone: `0991100${n}` },
    service: { name: 'Servicio Básico', price: 1000 },
    professional: { name: 'Alex García' },
    date: `${YEAR}-03-1${n}`,
    time: '10:00',
    notes: '',
    status: 'confirmed',
    createdAt: `2026-01-0${n}T10:00:00.000Z`,
    ...overrides,
  };
}

// Seven bookings so that the "top 5 by createdAt desc" rule is observable.
// createdAt ascends with n, so the newest is Cliente 7.
function seed() {
  return [
    makeBooking(1, { notes: 'Prefiero silla baja' }),
    makeBooking(2, { client: { name: 'Ana &amp; Co', email: 'ana@example.com' }, date: `${YEAR}-03-12` }),
    makeBooking(3, { service: { name: 'Servicio Premium', price: 2500 }, status: 'pending' }),
    makeBooking(4, { date: `${YEAR}-03-12` }),
    makeBooking(5, { professional: undefined, barber: { name: 'Barbero Viejo' } }),
    makeBooking(6, { service: { name: 'Servicio Premium', price: 2500 } }),
    makeBooking(7, { date: `${YEAR}-04-01` }),
  ];
}

let db;
let fetchMock;

function jsonResponse(data) {
  return { ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data) };
}

function installFetch() {
  fetchMock = vi.fn(async (url, init = {}) => {
    const method = init.method || 'GET';
    const key = `${method} ${String(url).replace(BASE, '')}`;
    if (db.failing.has(key)) {
      return { ok: false, status: 500, text: async () => JSON.stringify({ message: 'Backend roto' }), json: async () => ({}) };
    }
    if (key === 'GET /api/bookings') return jsonResponse(JSON.parse(JSON.stringify(db.bookings)));
    if (key === 'GET /api/bookings/statistics') return jsonResponse(db.stats);
    if (method === 'DELETE' && key.startsWith('DELETE /api/bookings/')) {
      const id = key.replace('DELETE /api/bookings/', '');
      db.bookings = db.bookings.filter((b) => b._id !== id);
      return jsonResponse({ deleted: true });
    }
    throw new Error(`Unexpected request ${key}`);
  });
  vi.stubGlobal('fetch', fetchMock);
}

const callsTo = (method, path) => fetchMock.mock.calls.filter(
  ([url, init]) => url === BASE + path && ((init && init.method) || 'GET') === method,
);

// ---- socket.io ----
let sockets;
function installSocket() {
  sockets = [];
  io.mockReset();
  io.mockImplementation(() => {
    const handlers = {};
    const socket = {
      handlers,
      on: vi.fn((event, cb) => { handlers[event] = cb; }),
      disconnect: vi.fn(),
    };
    sockets.push(socket);
    return socket;
  });
}
const latestSocket = () => sockets[sockets.length - 1];

// ---- audio ----
function installAudioContext(state = 'suspended') {
  class FakeAudioContext {
    constructor() { this.state = state; this.destination = {}; this.currentTime = 0; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    createOscillator() {
      return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } };
    }
    createGain() { return { connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
  }
  vi.stubGlobal('AudioContext', FakeAudioContext);
}

function renderAdmin({ strict = false } = {}) {
  const tree = (
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </MemoryRouter>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

async function loadedAdmin(options) {
  const view = renderAdmin(options);
  // The dashboard is ready once the recent bookings table has been populated.
  await screen.findByText('Cliente 7');
  return view;
}

const stat = (name) => within(screen.getByRole('group', { name })).getByRole('heading');
const pageTitle = () => screen.getByRole('heading', { level: 1 });
const goTo = (name) => userEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name }));
const sidebar = () => screen.getByTestId('sidebar');

beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem('isAdmin', 'true');
  sessionStorage.setItem('adminUser', 'admin');
  db = {
    bookings: seed(),
    stats: { totalBookings: 7, totalRevenue: 12500, todayBookings: 2 },
    failing: new Set(),
  };
  installFetch();
  installSocket();
  installAudioContext('running');
  audioService._reset();
  Object.values(toast).forEach((fn) => fn.mockClear());
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  window.innerWidth = 1280;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Admin dashboard', () => {
  it('loads statistics from GET /api/bookings/statistics into the three stat cards', async () => {
    await loadedAdmin();

    expect(callsTo('GET', '/api/bookings/statistics')).toHaveLength(1);
    expect(stat('Reservas Totales')).toHaveTextContent('7');
    expect(stat('Ingresos del Mes')).toHaveTextContent(`$${(12500).toLocaleString()}`);
    expect(stat('Reservas Hoy')).toHaveTextContent('2');
  });

  it('defaults every statistic to 0 when the backend omits them', async () => {
    db.stats = {};

    await loadedAdmin();

    expect(stat('Reservas Totales')).toHaveTextContent('0');
    expect(stat('Ingresos del Mes')).toHaveTextContent('$0');
    expect(stat('Reservas Hoy')).toHaveTextContent('0');
  });

  it('lists the 5 most recent bookings by createdAt, newest first, with decoded text', async () => {
    await loadedAdmin();

    const rows = within(screen.getByRole('table', { name: 'Reservas recientes' })).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(5);
    const names = rows.map((row) => within(row).getAllByRole('cell')[0].textContent);
    // Cliente 7, 6, 5, 4, 3 (Ana & Co is #2, outside the top 5).
    expect(names).toEqual(['Cliente 7', 'Cliente 6', 'Cliente 5', 'Cliente 4', 'Cliente 3']);
    // Legacy `barber` fallback is applied in this table too.
    expect(within(rows[2]).getAllByRole('cell')[4]).toHaveTextContent('Barbero Viejo');
  });

  it('shows "No hay reservas recientes" when there are no bookings', async () => {
    db.bookings = [];

    renderAdmin();

    expect(await screen.findByText('No hay reservas recientes')).toBeInTheDocument();
  });

  it('toasts "Error cargando estadísticas" when the statistics request fails', async () => {
    db.failing.add('GET /api/bookings/statistics');

    await loadedAdmin();

    expect(toast.error).toHaveBeenCalledWith('Error cargando estadísticas');
    expect(stat('Reservas Totales')).toHaveTextContent('0');
  });

  it('toasts "Error cargando reservas recientes" when the bookings request fails', async () => {
    db.failing.add('GET /api/bookings');

    renderAdmin();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error cargando reservas recientes'));
    expect(screen.getByText('No hay reservas recientes')).toBeInTheDocument();
  });
});

describe('Admin top bar and navigation', () => {
  it('shows the admin user name from the session, with "Admin" as the fallback', async () => {
    const { unmount } = await loadedAdmin();
    expect(screen.getByText('admin')).toBeInTheDocument();
    unmount();

    sessionStorage.removeItem('adminUser');
    await loadedAdmin();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('maps each section to its page title', async () => {
    await loadedAdmin();
    expect(pageTitle()).toHaveTextContent('Dashboard');

    await goTo('Reservas');
    expect(pageTitle()).toHaveTextContent('Gestión de Reservas');

    await goTo('Reportes');
    expect(pageTitle()).toHaveTextContent('Reportes y Estadísticas');

    await goTo('Dashboard');
    expect(pageTitle()).toHaveTextContent('Dashboard');
  });

  it('marks the current section link with aria-current', async () => {
    await loadedAdmin();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');

    await goTo('Reservas');

    expect(screen.getByRole('link', { name: 'Reservas' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('collapses and expands the sidebar on desktop without showing the mobile drawer', async () => {
    await loadedAdmin();
    expect(sidebar()).toHaveAttribute('data-collapsed', 'false');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));
    expect(sidebar()).toHaveAttribute('data-collapsed', 'true');
    expect(sidebar()).toHaveAttribute('data-show', 'false');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));
    expect(sidebar()).toHaveAttribute('data-collapsed', 'false');
  });

  it('toggles both the collapsed and the show state at <= 768px (legacy toggleSidebar)', async () => {
    window.innerWidth = 768;
    await loadedAdmin();

    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));
    expect(sidebar()).toHaveAttribute('data-collapsed', 'true');
    expect(sidebar()).toHaveAttribute('data-show', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));
    expect(sidebar()).toHaveAttribute('data-collapsed', 'false');
    expect(sidebar()).toHaveAttribute('data-show', 'false');
  });

  it('closes the mobile drawer after navigating, so its backdrop does not block the page', async () => {
    window.innerWidth = 768;
    await loadedAdmin();
    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));
    expect(sidebar()).toHaveAttribute('data-show', 'true');

    await userEvent.click(screen.getByRole('link', { name: 'Reservas' }));

    expect(pageTitle()).toHaveTextContent('Gestión de Reservas');
    expect(sidebar()).toHaveAttribute('data-show', 'false');
  });

  it('keeps the sidebar state untouched when navigating on desktop', async () => {
    await loadedAdmin();
    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));
    expect(sidebar()).toHaveAttribute('data-collapsed', 'true');

    await userEvent.click(screen.getByRole('link', { name: 'Reservas' }));

    expect(sidebar()).toHaveAttribute('data-collapsed', 'true');
    expect(sidebar()).toHaveAttribute('data-show', 'false');
  });

  it('keeps the show state off at 769px (desktop rule)', async () => {
    window.innerWidth = 769;
    await loadedAdmin();

    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));

    expect(sidebar()).toHaveAttribute('data-show', 'false');
  });

  describe('logout', () => {
    it('asks for confirmation, clears the session and goes to /login when confirmed', async () => {
      await loadedAdmin();

      await userEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));

      expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de que deseas cerrar sesión?');
      expect(sessionStorage.getItem('isAdmin')).toBeNull();
      expect(sessionStorage.getItem('adminUser')).toBeNull();
      expect(await screen.findByText('login page')).toBeInTheDocument();
    });

    it('stays on the panel with the session intact when the confirmation is declined', async () => {
      window.confirm.mockReturnValue(false);
      await loadedAdmin();

      await userEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));

      expect(sessionStorage.getItem('isAdmin')).toBe('true');
      expect(screen.queryByText('login page')).not.toBeInTheDocument();
      expect(pageTitle()).toBeInTheDocument();
    });
  });
});

describe('Admin bookings section', () => {
  async function openBookings() {
    await loadedAdmin();
    await goTo('Reservas');
    return screen.findByRole('table', { name: 'Reservas' });
  }
  const rowsOf = (table) => within(table).getAllByRole('row').slice(1);
  // The datatable owns its rows, so the <table> element is REPLACED whenever the data changes:
  // look it up again instead of holding on to the element rendered before the change.
  const currentTable = () => screen.getByRole('table', { name: 'Reservas' });

  it('shows every booking with decoded text, notes and the "Sin notas" placeholder', async () => {
    const table = await openBookings();

    const rows = rowsOf(table);
    expect(rows).toHaveLength(7);
    expect(within(table).getByText('Ana & Co')).toBeInTheDocument();
    expect(within(table).queryByText(/&amp;/)).not.toBeInTheDocument();
    expect(within(table).getByText('Prefiero silla baja')).toBeInTheDocument();
    expect(within(table).getAllByText('Sin notas')).toHaveLength(6);
  });

  it('offers the (additive) professional filter with every professional found in the bookings', async () => {
    await openBookings();

    const filter = screen.getByRole('combobox', { name: 'Filtrar por profesional' });
    expect(filter).toBeInTheDocument();
    const options = screen.getAllByRole('option', { hidden: true }).map((option) => option.textContent);
    expect(options).toEqual(['Todos', 'Alex García', 'Barbero Viejo']);
  });

  it('shows "No hay reservas registradas" for an empty list', async () => {
    db.bookings = [];
    renderAdmin();
    await screen.findByText('No hay reservas recientes');

    await goTo('Reservas');

    expect(await screen.findByText('No hay reservas registradas')).toBeInTheDocument();
  });

  it('toasts "Error cargando reservas" when the full list cannot be loaded', async () => {
    await loadedAdmin();
    db.failing.add('GET /api/bookings');

    await goTo('Reservas');
    await userEvent.click(screen.getByRole('button', { name: /Actualizar/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error cargando reservas'));
  });

  it('totals only CONFIRMED bookings in the filtered revenue display', async () => {
    await openBookings();

    // 1000*5 confirmed (1,2,4,5,7) + 2500 (booking 6) = 7500; booking 3 (2500) is pending.
    expect(screen.getByTestId('filtered-total-revenue')).toHaveTextContent(`$${(7500).toLocaleString()}`);
  });

  describe('date filter', () => {
    it('refetches the bookings, filters by exact date and toasts the plural count', async () => {
      await openBookings();
      const before = callsTo('GET', '/api/bookings').length;

      fireEvent.change(screen.getByLabelText('Filtrar por fecha'), { target: { value: `${YEAR}-03-12` } });

      await waitFor(() => expect(toast.info).toHaveBeenCalledWith('Mostrando 2 reservas'));
      expect(callsTo('GET', '/api/bookings')).toHaveLength(before + 1);
      const names = rowsOf(currentTable()).map((row) => within(row).getAllByRole('cell')[0].textContent);
      expect(names).toHaveLength(2);
      expect(names[0]).toContain('Ana & Co');
      expect(names[1]).toContain('Cliente 4');
    });

    it('uses the singular for exactly one match and recomputes the confirmed total', async () => {
      await openBookings();

      fireEvent.change(screen.getByLabelText('Filtrar por fecha'), { target: { value: `${YEAR}-04-01` } });

      await waitFor(() => expect(toast.info).toHaveBeenCalledWith('Mostrando 1 reserva'));
      expect(screen.getByTestId('filtered-total-revenue')).toHaveTextContent(`$${(1000).toLocaleString()}`);
    });

    it('says "0 reservas" (plural) when nothing matches', async () => {
      await openBookings();

      fireEvent.change(screen.getByLabelText('Filtrar por fecha'), { target: { value: `${YEAR}-12-31` } });

      await waitFor(() => expect(toast.info).toHaveBeenCalledWith('Mostrando 0 reservas'));
      expect(screen.getByText('No hay reservas registradas')).toBeInTheDocument();
      expect(screen.getByTestId('filtered-total-revenue')).toHaveTextContent('$0');
    });

    it('toasts "Error aplicando filtros" when the refetch fails', async () => {
      await openBookings();
      db.failing.add('GET /api/bookings');

      fireEvent.change(screen.getByLabelText('Filtrar por fecha'), { target: { value: `${YEAR}-03-12` } });

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error aplicando filtros'));
    });

    it('"Actualizar" clears the date, reloads the full list and toasts "Filtros limpiados"', async () => {
      await openBookings();
      const input = screen.getByLabelText('Filtrar por fecha');
      fireEvent.change(input, { target: { value: `${YEAR}-03-12` } });
      await waitFor(() => expect(rowsOf(currentTable())).toHaveLength(2));
      const before = callsTo('GET', '/api/bookings').length;

      await userEvent.click(screen.getByRole('button', { name: /Actualizar/ }));

      await waitFor(() => expect(toast.info).toHaveBeenCalledWith('Filtros limpiados'));
      expect(input).toHaveValue('');
      expect(callsTo('GET', '/api/bookings')).toHaveLength(before + 1);
      expect(rowsOf(currentTable())).toHaveLength(7);
    });
  });

  describe('delete', () => {
    const deleteButtonFor = (table, name) => {
      const row = within(table).getAllByRole('row').find((r) => within(r).queryByText(name));
      return within(row).getByRole('button', { name: 'Eliminar reserva' });
    };

    it('confirms with the legacy message, DELETEs by _id, refreshes everything and toasts success', async () => {
      const table = await openBookings();
      const bookingsGetsBefore = callsTo('GET', '/api/bookings').length;
      const statsGetsBefore = callsTo('GET', '/api/bookings/statistics').length;

      await userEvent.click(deleteButtonFor(table, 'Cliente 3'));

      expect(window.confirm).toHaveBeenCalledWith(
        '¿Estás seguro de que quieres eliminar la reserva de Cliente 3?\n\nEsta acción no se puede deshacer.',
      );
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Reserva de Cliente 3 eliminada exitosamente'));
      expect(toast.info).toHaveBeenCalledWith('Eliminando reserva...');
      expect(callsTo('DELETE', '/api/bookings/id-3')).toHaveLength(1);
      // Dashboard (stats + recent) and bookings list are both reloaded.
      expect(callsTo('GET', '/api/bookings/statistics')).toHaveLength(statsGetsBefore + 1);
      expect(callsTo('GET', '/api/bookings').length).toBeGreaterThanOrEqual(bookingsGetsBefore + 2);
      expect(within(currentTable()).queryByText('Cliente 3')).not.toBeInTheDocument();
      expect(rowsOf(currentTable())).toHaveLength(6);
    });

    it('shows the decoded client name in the confirm dialog and the success toast', async () => {
      const table = await openBookings();

      await userEvent.click(deleteButtonFor(table, 'Ana & Co'));

      expect(window.confirm).toHaveBeenCalledWith(
        '¿Estás seguro de que quieres eliminar la reserva de Ana & Co?\n\nEsta acción no se puede deshacer.',
      );
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Reserva de Ana & Co eliminada exitosamente'));
      expect(callsTo('DELETE', '/api/bookings/id-2')).toHaveLength(1);
    });

    it('does nothing at all when the confirmation is declined', async () => {
      window.confirm.mockReturnValue(false);
      const table = await openBookings();
      const callsBefore = fetchMock.mock.calls.length;

      await userEvent.click(deleteButtonFor(table, 'Cliente 3'));

      expect(fetchMock.mock.calls.length).toBe(callsBefore);
      expect(toast.info).not.toHaveBeenCalledWith('Eliminando reserva...');
      expect(rowsOf(table)).toHaveLength(7);
    });

    it('toasts "Error eliminando reserva: <message>" when the DELETE fails and keeps the row', async () => {
      const table = await openBookings();
      db.failing.add('DELETE /api/bookings/id-3');

      await userEvent.click(deleteButtonFor(table, 'Cliente 3'));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error eliminando reserva: Backend roto'));
      expect(toast.success).not.toHaveBeenCalled();
      expect(within(table).getByText('Cliente 3')).toBeInTheDocument();
    });
  });
});

describe('Admin reports section', () => {
  it('renders both charts with datasets built from the current bookings', async () => {
    await loadedAdmin();

    await goTo('Reportes');

    const line = JSON.parse(screen.getByTestId('line-chart').getAttribute('data-config'));
    // 6 bookings in March (1,2,3,4,5,6) and one in April (7).
    expect(line.data.datasets[0].data.slice(0, 5)).toEqual([0, 0, 6, 1, 0]);
    const doughnut = JSON.parse(screen.getByTestId('doughnut-chart').getAttribute('data-config'));
    expect(doughnut.data.labels).toEqual(['Servicio Básico', 'Servicio Premium']);
    expect(doughnut.data.datasets[0].data).toEqual([5, 2]);
  });

  it('updates the charts after the data changes (delete) instead of freezing at first render', async () => {
    await loadedAdmin();
    await goTo('Reservas');
    const table = await screen.findByRole('table', { name: 'Reservas' });
    const row = within(table).getAllByRole('row').find((r) => within(r).queryByText('Cliente 6'));
    await userEvent.click(within(row).getByRole('button', { name: 'Eliminar reserva' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    await goTo('Reportes');

    const doughnut = JSON.parse(screen.getByTestId('doughnut-chart').getAttribute('data-config'));
    expect(doughnut.data.datasets[0].data).toEqual([5, 1]);
  });
});

describe('Admin realtime notifications', () => {
  const bellBadge = () => within(screen.getByRole('button', { name: 'Nuevas reservas' }));

  it('connects to the backend socket on mount and disconnects on unmount', async () => {
    const { unmount } = await loadedAdmin();

    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith(BASE);
    expect(latestSocket().disconnect).not.toHaveBeenCalled();

    unmount();

    expect(latestSocket().disconnect).toHaveBeenCalledTimes(1);
  });

  it('is safe under StrictMode double mounting: first socket closed, second one live', async () => {
    const { unmount } = await loadedAdmin({ strict: true });

    expect(io).toHaveBeenCalledTimes(2);
    expect(sockets[0].disconnect).toHaveBeenCalledTimes(1);
    expect(sockets[1].disconnect).not.toHaveBeenCalled();

    act(() => { latestSocket().handlers.newBooking(makeBooking(8)); });
    expect(bellBadge().getByText('1')).toBeInTheDocument();

    unmount();
    expect(sockets[1].disconnect).toHaveBeenCalledTimes(1);
  });

  it('shows no badge until a booking arrives', async () => {
    await loadedAdmin();

    expect(bellBadge().queryByText('0')).not.toBeInTheDocument();
  });

  it('on newBooking: bumps the badge, toasts, plays the sound after 100ms and refreshes the dashboard', async () => {
    const play = vi.spyOn(audioService, 'playNotification').mockImplementation(() => {});
    await loadedAdmin();
    const statsBefore = callsTo('GET', '/api/bookings/statistics').length;
    const listBefore = callsTo('GET', '/api/bookings').length;
    db.stats = { ...db.stats, totalBookings: 8 };
    db.bookings = [...db.bookings, makeBooking(8, { createdAt: '2026-02-01T10:00:00.000Z' })];

    act(() => { latestSocket().handlers.newBooking(makeBooking(8)); });

    expect(bellBadge().getByText('1')).toBeInTheDocument();
    expect(play).not.toHaveBeenCalled();
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledWith('Nueva reserva recibida!');
    await waitFor(() => expect(stat('Reservas Totales')).toHaveTextContent('8'));
    expect(callsTo('GET', '/api/bookings/statistics')).toHaveLength(statsBefore + 1);
    // Dashboard section: only the recent-bookings fetch, no full bookings list reload.
    expect(callsTo('GET', '/api/bookings')).toHaveLength(listBefore + 1);
    expect(await screen.findByText('Cliente 8')).toBeInTheDocument();
  });

  it('counts consecutive notifications', async () => {
    vi.spyOn(audioService, 'playNotification').mockImplementation(() => {});
    await loadedAdmin();

    act(() => { latestSocket().handlers.newBooking(makeBooking(8)); });
    act(() => { latestSocket().handlers.newBooking(makeBooking(9)); });

    expect(bellBadge().getByText('2')).toBeInTheDocument();
  });

  it('also reloads the bookings list when the bookings section is active', async () => {
    vi.spyOn(audioService, 'playNotification').mockImplementation(() => {});
    await loadedAdmin();
    await goTo('Reservas');
    await screen.findByRole('table', { name: 'Reservas' });
    const listBefore = callsTo('GET', '/api/bookings').length;
    db.bookings = [...db.bookings, makeBooking(8, { createdAt: '2026-02-01T10:00:00.000Z' })];

    act(() => { latestSocket().handlers.newBooking(makeBooking(8)); });

    // dashboard recent fetch + bookings list fetch
    await waitFor(() => expect(callsTo('GET', '/api/bookings')).toHaveLength(listBefore + 2));
    expect(await within(screen.getByRole('table', { name: 'Reservas' })).findByText('Cliente 8')).toBeInTheDocument();
  });

  it('bell click clears the badge, opens the bookings section and reloads it', async () => {
    vi.spyOn(audioService, 'playNotification').mockImplementation(() => {});
    await loadedAdmin();
    act(() => { latestSocket().handlers.newBooking(makeBooking(8)); });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Nueva reserva recibida!'));
    const listBefore = callsTo('GET', '/api/bookings').length;

    await userEvent.click(screen.getByRole('button', { name: 'Nuevas reservas' }));

    expect(bellBadge().queryByText('1')).not.toBeInTheDocument();
    expect(pageTitle()).toHaveTextContent('Gestión de Reservas');
    await waitFor(() => expect(callsTo('GET', '/api/bookings').length).toBeGreaterThan(listBefore));
  });
});

describe('Admin sound activation', () => {
  it('hides "Activar Sonido" when audio is already running', async () => {
    await loadedAdmin();

    expect(screen.queryByRole('button', { name: /Activar sonido/i })).not.toBeInTheDocument();
  });

  it('shows the button when the browser blocks audio, then hides it once activated (and toasts)', async () => {
    installAudioContext('suspended');
    await loadedAdmin();
    const button = await screen.findByRole('button', { name: /Activar sonido/i });

    await userEvent.click(button);

    expect(toast.success).toHaveBeenCalledWith('Sonido de notificaciones activado');
    await waitFor(() => expect(screen.queryByRole('button', { name: /Activar sonido/i })).not.toBeInTheDocument());
  });

  it('initialises the audio service on mount and activates it on the first click anywhere, once', async () => {
    const init = vi.spyOn(audioService, 'init');
    const activate = vi.spyOn(audioService, 'activate');
    await loadedAdmin();
    expect(init).toHaveBeenCalledTimes(1);

    await userEvent.click(document.body);
    await userEvent.click(document.body);

    expect(activate).toHaveBeenCalledTimes(1);
  });
});
