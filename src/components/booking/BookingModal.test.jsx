import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_CONFIG } from '../../config/appConfig.js';
import { BookingProvider } from '../../state/bookingState.jsx';
import { toast } from '../../ui/toast.js';
import { formatLongDateUTC, formatMoney } from '../../utils/format.js';
import BookingModal from './BookingModal.jsx';

// Whole flows (typing included) run in jsdom; give slow CI machines some headroom.
vi.setConfig({ testTimeout: 20000 });

// The toast wrapper is the UI seam: every user-facing message is asserted through it.
vi.mock('../../ui/toast.js', () => ({
  toast: {
    show: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Dates far in the future so the `min=today` attribute is irrelevant.
const MONDAY = '2030-03-04';
const OTHER_MONDAY = '2030-03-11';
const SATURDAY = '2030-03-09';
const SUNDAY = '2030-03-10';
const API_URL = 'http://localhost:3000/api/bookings';

const MESSAGES = {
  desktopFallback:
    'No se pudieron verificar las reservas existentes. Se muestran todos los horarios disponibles. Te recomendamos confirmar por teléfono.',
  mobileFallback:
    'No se pueden verificar las reservas. Se muestran todos los horarios. Te recomendamos llamar para confirmar.',
};

const jsonResponse = (status, data) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

// Fake backend installed at the `fetch` boundary, so the REAL apiClient + bookingService run
// and the tests can assert the exact URL / method / body that reaches the network.
function installBackend({ bookings = [] } = {}) {
  const backend = {
    bookings,
    calls: [],
    getError: null,
    postResponse: null,
    postGate: null,
    get posts() {
      return backend.calls.filter((c) => c.method === 'POST');
    },
    get gets() {
      return backend.calls.filter((c) => c.method === 'GET');
    },
  };

  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET';
    backend.calls.push({
      url,
      method,
      body: options.body ? JSON.parse(options.body) : null,
      headers: options.headers,
    });
    if (method === 'POST') {
      if (backend.postGate) await backend.postGate;
      if (backend.postResponse) return backend.postResponse;
      return jsonResponse(201, { _id: 'new-id', ...JSON.parse(options.body) });
    }
    if (backend.getError) throw backend.getError;
    return jsonResponse(200, backend.bookings);
  });
  vi.stubGlobal('fetch', fetchMock);
  return backend;
}

const existingBooking = (overrides = {}) => ({
  _id: 'b1',
  date: MONDAY,
  time: '10:00',
  status: 'confirmed',
  professional: { id: 'alex-garcia', name: 'Alex García' },
  ...overrides,
});

function Harness({ initialOpen = true }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <BookingProvider>
      <button type="button" onClick={() => setOpen(true)}>
        reopen
      </button>
      <BookingModal open={open} onClose={() => setOpen(false)} />
    </BookingProvider>
  );
}

const bookingDialog = () => screen.getByRole('dialog', { name: 'Reservar tu Cita' });
const queryBookingDialog = () => screen.queryByRole('dialog', { name: 'Reservar tu Cita' });
const dateInput = () => screen.getByLabelText('Fecha de la cita');
const timeSelect = () => screen.getByLabelText('Hora de la cita');
const nextButton = () => screen.getByRole('button', { name: /Siguiente/ });
const professionalCard = (name) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

async function chooseService(user, name) {
  await user.click(screen.getByRole('button', { name: new RegExp(name) }));
  // Legacy auto-advances 400ms after the selection (real timers: findBy polls up to 1s).
  await screen.findByRole('heading', { name: 'Fecha y Hora' });
}

async function fillSchedule(user, { date = MONDAY, professional = 'Alex García', time = '11:00' } = {}) {
  fireEvent.change(dateInput(), { target: { value: date } });
  if (professional) await user.click(professionalCard(professional));
  if (time) {
    await waitFor(() => expect(within(timeSelect()).getByRole('option', { name: time })).toBeInTheDocument());
    await user.selectOptions(timeSelect(), time);
  }
}

async function goToForm(user, schedule) {
  await chooseService(user, 'Servicio Básico');
  await fillSchedule(user, schedule);
  await user.click(nextButton());
  await screen.findByRole('heading', { name: 'Tus Datos' });
}

async function fillClient(user, overrides = {}) {
  const data = {
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '+598 98 114 696',
    notes: '',
    terms: true,
    ...overrides,
  };
  await user.type(screen.getByLabelText('Nombre completo'), data.name);
  await user.type(screen.getByLabelText('Dirección de email'), data.email);
  await user.type(screen.getByLabelText('Número de teléfono'), data.phone);
  if (data.notes) await user.type(screen.getByLabelText('Notas adicionales'), data.notes);
  if (data.terms) await user.click(screen.getByRole('checkbox', { name: /Acepto los/ }));
}

const confirmButton = () => screen.getByRole('button', { name: /Confirmar Reserva|Procesando/ });

async function reachReadyToConfirm(user, { schedule, client } = {}) {
  await goToForm(user, schedule);
  await fillClient(user, client);
}

let originalInnerWidth;

beforeEach(() => {
  originalInnerWidth = globalThis.innerWidth;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  globalThis.innerWidth = originalInnerWidth;
});

describe('BookingModal happy path', () => {
  it('walks the 3 steps and posts the legacy-shaped payload, then shows the confirmation', async () => {
    const backend = installBackend({ bookings: [existingBooking({ time: '10:00' })] });
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    expect(bookingDialog()).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Elige tu Servicio' })).toBeInTheDocument();

    await goToForm(user);
    await fillClient(user, { notes: 'Sin gluten' });
    await user.click(confirmButton());

    const confirmation = await screen.findByRole('dialog', { name: '¡Reserva Confirmada!' });
    expect(within(confirmation).getByText('Servicio Básico')).toBeInTheDocument();
    expect(within(confirmation).getByText('Alex García')).toBeInTheDocument();
    expect(within(confirmation).getByText(formatLongDateUTC(MONDAY))).toBeInTheDocument();
    expect(within(confirmation).getByText('11:00')).toBeInTheDocument();
    expect(within(confirmation).getByText(formatMoney(1200))).toBeInTheDocument();
    expect(within(confirmation).getByText('juan@example.com')).toBeInTheDocument();

    // Wire contract: exact URL, method and body (including status 'confirmed').
    expect(backend.posts).toHaveLength(1);
    const [post] = backend.posts;
    expect(post.url).toBe(API_URL);
    expect(post.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(post.body).toEqual({
      client: { name: 'Juan Pérez', id: '', email: 'juan@example.com', phone: '+598 98 114 696' },
      service: { id: 'servicio-basico', name: 'Servicio Básico', price: 1200, duration: 60 },
      professional: { id: 'alex-garcia', name: 'Alex García' },
      date: MONDAY,
      time: '11:00',
      notes: 'Sin gluten',
      status: 'confirmed',
    });

    // Order of network calls: slots lookup, pre-submit availability check, then the POST.
    expect(backend.calls.map((c) => c.method)).toEqual(['GET', 'GET', 'POST']);
    expect(backend.calls.every((c) => c.url === API_URL)).toBe(true);

    // The booking modal is gone and no error toast was shown.
    await waitFor(() => expect(queryBookingDialog()).not.toBeInTheDocument());
    expect(toast.error).not.toHaveBeenCalled();

    // The confirmation can be dismissed with its own button.
    await user.click(within(confirmation).getByRole('button', { name: 'Cerrar confirmación' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '¡Reserva Confirmada!' })).not.toBeInTheDocument(),
    );
  });

  it('highlights the chosen service and keeps only that one pressed', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    const basic = screen.getByRole('button', { name: /Servicio Básico/ });
    const premium = screen.getByRole('button', { name: /Servicio Premium/ });
    expect(basic).toHaveAttribute('aria-pressed', 'false');

    await user.click(basic);
    expect(basic).toHaveAttribute('aria-pressed', 'true');
    expect(premium).toHaveAttribute('aria-pressed', 'false');
    await screen.findByRole('heading', { name: 'Fecha y Hora' });
  });

  it('auto-advances to step 2 exactly 400ms after choosing a service', async () => {
    installBackend();
    render(<Harness />);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    fireEvent.click(screen.getByRole('button', { name: /Consulta Inicial/ }));
    expect(screen.queryByRole('heading', { name: 'Fecha y Hora' })).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(screen.queryByRole('heading', { name: 'Fecha y Hora' })).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('heading', { name: 'Fecha y Hora' })).toBeInTheDocument();
  });

  it('shows the selected-service summary box with legacy labels', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    await chooseService(user, 'Servicio Premium');
    const box = screen.getByTestId('selected-service-info');
    expect(box).toHaveTextContent('Servicio: Servicio Premium');
    expect(box).toHaveTextContent('Profesional: No seleccionado');
    expect(box).toHaveTextContent(`Precio: ${formatMoney(2500)}`);
    expect(box).toHaveTextContent('Fecha: No seleccionada');
    expect(box).toHaveTextContent('Hora: No seleccionada');
    expect(box).toHaveTextContent('Duración: 90 minutos');

    await fillSchedule(user);
    expect(box).toHaveTextContent('Profesional: Alex García');
    expect(box).toHaveTextContent(`Fecha: ${formatLongDateUTC(MONDAY)}`);
    expect(box).toHaveTextContent('Hora: 11:00');
  });

  it('offers only the professionals attached to the chosen service', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    const service = APP_CONFIG.SERVICES.find((s) => s.id === 'consulta-inicial');
    const original = service.professionals;
    service.professionals = ['maria-lopez'];
    try {
      render(<Harness />);
      await chooseService(user, 'Consulta Inicial');

      expect(professionalCard('María López')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Alex García/ })).not.toBeInTheDocument();
    } finally {
      service.professionals = original;
    }
  });

  it('keeps the date input min=today (legacy setupDateValidation)', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');

    expect(dateInput()).toHaveAttribute('min', new Date().toISOString().split('T')[0]);
    expect(dateInput()).toBeRequired();
  });
});

describe('time slots', () => {
  it('renders a booked slot disabled and labelled " — Ocupado"', async () => {
    installBackend({ bookings: [existingBooking({ time: '10:00' })] });
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');
    await fillSchedule(user, { time: null });

    const busy = await within(timeSelect()).findByRole('option', { name: '10:00 — Ocupado' });
    expect(busy).toBeDisabled();
    expect(within(timeSelect()).getByRole('option', { name: '09:00' })).toBeEnabled();
    expect(within(timeSelect()).getByRole('option', { name: 'Selecciona una hora (9 disponibles)' })).toBeInTheDocument();
  });

  it('ignores cancelled bookings and bookings of other professionals or days', async () => {
    installBackend({
      bookings: [
        existingBooking({ time: '09:00', status: 'cancelled' }),
        existingBooking({ time: '12:00', professional: { id: 'maria-lopez', name: 'María López' } }),
        existingBooking({ time: '15:00', date: OTHER_MONDAY }),
      ],
    });
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');
    await fillSchedule(user, { time: null });

    await within(timeSelect()).findByRole('option', { name: 'Selecciona una hora (10 disponibles)' });
    expect(within(timeSelect()).queryByRole('option', { name: /Ocupado/ })).not.toBeInTheDocument();
  });

  it('shows the 9:00-12:00 and 14:00-19:00 hours on weekdays (lunch 13:00 excluded)', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');
    await fillSchedule(user, { time: null });
    await within(timeSelect()).findByRole('option', { name: /disponibles/ });

    const values = within(timeSelect())
      .getAllByRole('option')
      .map((o) => o.value)
      .filter(Boolean);
    expect(values).toEqual(['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']);
    expect(values).not.toContain('13:00');
    expect(values).not.toContain('20:00');
  });

  it('closes on Sunday with the "Domingo cerrado" label (before and after choosing a professional)', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');

    fireEvent.change(dateInput(), { target: { value: SUNDAY } });
    expect(within(timeSelect()).getByRole('option', { name: 'Domingo cerrado' })).toBeInTheDocument();
    expect(within(timeSelect()).getAllByRole('option')).toHaveLength(1);

    await user.click(professionalCard('Alex García'));
    await within(timeSelect()).findByRole('option', { name: 'Domingo cerrado' });
    expect(within(timeSelect()).getAllByRole('option')).toHaveLength(1);
  });

  it('closes at 18:00 on Saturday (last slot 17:00)', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');
    await fillSchedule(user, { date: SATURDAY, time: null });
    await within(timeSelect()).findByRole('option', { name: /disponibles/ });

    const values = within(timeSelect())
      .getAllByRole('option')
      .map((o) => o.value)
      .filter(Boolean);
    expect(values).toContain('17:00');
    expect(values).not.toContain('18:00');
    expect(values).not.toContain('19:00');
  });

  it('shows the plain slot list (all free) after picking a date but before a professional', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');

    expect(within(timeSelect()).getByRole('option', { name: 'Selecciona una fecha primero' })).toBeInTheDocument();

    fireEvent.change(dateInput(), { target: { value: MONDAY } });
    expect(within(timeSelect()).getByRole('option', { name: 'Selecciona una hora' })).toBeInTheDocument();
    expect(within(timeSelect()).getByRole('option', { name: '09:00' })).toBeEnabled();
  });

  it('shows the loading option text while bookings are being fetched', async () => {
    const backend = installBackend();
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const originalFetch = globalThis.fetch;
    vi.stubGlobal('fetch', async (...args) => {
      await gate;
      return originalFetch(...args);
    });
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');
    await fillSchedule(user, { time: null });

    expect(within(timeSelect()).getByRole('option', { name: 'Verificando horarios disponibles' })).toBeInTheDocument();
    release();
    await within(timeSelect()).findByRole('option', { name: /disponibles\)/ });
    expect(backend.gets).toHaveLength(1);
  });
});

describe('availability recomputation (deliberate improvements)', () => {
  it('refreshes the slots when the date changes after a professional was chosen', async () => {
    const backend = installBackend({ bookings: [existingBooking({ date: OTHER_MONDAY, time: '16:00' })] });
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');
    await fillSchedule(user, { time: null });
    await within(timeSelect()).findByRole('option', { name: 'Selecciona una hora (10 disponibles)' });
    expect(backend.gets).toHaveLength(1);

    fireEvent.change(dateInput(), { target: { value: OTHER_MONDAY } });

    const busy = await within(timeSelect()).findByRole('option', { name: '16:00 — Ocupado' });
    expect(busy).toBeDisabled();
    expect(backend.gets).toHaveLength(2);
  });

  it('keeps the selected time while it stays valid and clears it when it is no longer free', async () => {
    installBackend({ bookings: [existingBooking({ date: OTHER_MONDAY, time: '11:00' })] });
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');
    await fillSchedule(user, { time: '11:00' });
    expect(timeSelect()).toHaveValue('11:00');
    expect(screen.getByTestId('selected-service-info')).toHaveTextContent('Hora: 11:00');

    // Another professional, same date: 11:00 is still free, so it is kept.
    await user.click(professionalCard('María López'));
    await waitFor(() => expect(timeSelect()).toHaveValue('11:00'));
    expect(screen.getByTestId('selected-service-info')).toHaveTextContent('Hora: 11:00');

    // Back to Alex on a date where Alex is busy at 11:00: the stale time must go away.
    await user.click(professionalCard('Alex García'));
    fireEvent.change(dateInput(), { target: { value: OTHER_MONDAY } });
    await within(timeSelect()).findByRole('option', { name: '11:00 — Ocupado' });

    // The stale time is cleared from the state AND from the select.
    await waitFor(() => expect(screen.getByTestId('selected-service-info')).toHaveTextContent('Hora: No seleccionada'));
    expect(timeSelect()).toHaveValue('');
    await user.click(nextButton());
    expect(toast.error).toHaveBeenCalledWith('Por favor selecciona una hora');
  });

  it('clears the selected time when the date becomes a closed Sunday', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');
    await fillSchedule(user, { time: '11:00' });

    fireEvent.change(dateInput(), { target: { value: SUNDAY } });
    await within(timeSelect()).findByRole('option', { name: 'Domingo cerrado' });

    await waitFor(() => expect(screen.getByTestId('selected-service-info')).toHaveTextContent('Hora: No seleccionada'));
  });
});

describe('availability fetch failures', () => {
  it('retries twice on a network failure, then warns and shows every slot as free', async () => {
    const backend = installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');

    backend.getError = new TypeError('Failed to fetch');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.change(dateInput(), { target: { value: MONDAY } });
    fireEvent.click(professionalCard('Alex García'));

    const optionTexts = () => within(timeSelect()).getAllByRole('option').map((o) => o.textContent);
    expect(optionTexts()).toEqual(['Verificando horarios disponibles']);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(optionTexts()).toEqual(['🔄 Reintentando... (1/2)']);
    expect(backend.gets).toHaveLength(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1499);
    });
    expect(backend.gets).toHaveLength(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(backend.gets).toHaveLength(2);
    expect(optionTexts()).toEqual(['🔄 Reintentando... (2/2)']);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(backend.gets).toHaveLength(3);

    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledWith(MESSAGES.desktopFallback, 10000);
    expect(optionTexts()[0]).toBe('Selecciona una hora (10 disponibles)');
    expect(within(timeSelect()).queryByRole('option', { name: /Ocupado/ })).not.toBeInTheDocument();

    // No further retries are scheduled.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(backend.gets).toHaveLength(3);
  });

  it('uses the mobile copy and the longer retry delay on small screens', async () => {
    const backend = installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');

    globalThis.innerWidth = 500;
    backend.getError = new TypeError('Failed to fetch');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.change(dateInput(), { target: { value: MONDAY } });
    fireEvent.click(professionalCard('Alex García'));

    const optionTexts = () => within(timeSelect()).getAllByRole('option').map((o) => o.textContent);
    expect(optionTexts()).toEqual(['Cargando horarios...']);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(optionTexts()).toEqual(['📱 Reintentando conexión... (1/2)']);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2499);
    });
    expect(backend.gets).toHaveLength(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(backend.gets).toHaveLength(2);
    expect(optionTexts()).toEqual(['📱 Reintentando conexión... (2/2)']);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(backend.gets).toHaveLength(3);
    expect(toast.warning).toHaveBeenCalledWith(MESSAGES.mobileFallback, 10000);
  });

  it('retries on a Timeout error and recovers when a later attempt succeeds', async () => {
    const backend = installBackend({ bookings: [existingBooking({ time: '10:00' })] });
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');

    backend.getError = new Error('Timeout: La solicitud tardó demasiado tiempo.');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.change(dateInput(), { target: { value: MONDAY } });
    fireEvent.click(professionalCard('Alex García'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(within(timeSelect()).getByRole('option', { name: '🔄 Reintentando... (1/2)' })).toBeInTheDocument();

    backend.getError = null;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(within(timeSelect()).getByRole('option', { name: '10:00 — Ocupado' })).toBeDisabled();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('does not retry an HTTP error: it warns immediately and shows every slot as free', async () => {
    const backend = installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');

    backend.getError = new Error('HTTP error! status: 500');
    await fillSchedule(user, { time: null });

    await within(timeSelect()).findByRole('option', { name: 'Selecciona una hora (10 disponibles)' });
    expect(backend.gets).toHaveLength(1);
    expect(toast.warning).toHaveBeenCalledWith(MESSAGES.desktopFallback, 10000);
  });
});

describe('step navigation and validation', () => {
  it('hides Anterior on step 1 and navigates back and forth', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    expect(screen.queryByRole('button', { name: /Anterior/ })).not.toBeInTheDocument();
    expect(nextButton()).toBeInTheDocument();

    await chooseService(user, 'Servicio Básico');
    await user.click(screen.getByRole('button', { name: /Anterior/ }));
    expect(screen.getByRole('heading', { name: 'Elige tu Servicio' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Fecha y Hora' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Anterior/ })).not.toBeInTheDocument();
    // The selection survives the round trip.
    expect(screen.getByRole('button', { name: /Servicio Básico/ })).toHaveAttribute('aria-pressed', 'true');

    await user.click(nextButton());
    expect(screen.getByRole('heading', { name: 'Fecha y Hora' })).toBeInTheDocument();
  });

  it('labels the footer button for each step', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    expect(nextButton()).toHaveTextContent('Siguiente');
    await goToForm(user);
    expect(screen.getByRole('button', { name: 'Confirmar Reserva' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /Siguiente/ })).not.toBeInTheDocument();
  });

  it('asks for a service on step 1', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    await user.click(nextButton());

    expect(toast.error).toHaveBeenCalledWith('Por favor selecciona un servicio');
    expect(screen.getByRole('heading', { name: 'Elige tu Servicio' })).toBeInTheDocument();
  });

  it('asks for date, then time, then professional on step 2 (in that order)', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await chooseService(user, 'Servicio Básico');

    await user.click(nextButton());
    expect(toast.error).toHaveBeenLastCalledWith('Por favor selecciona una fecha');

    fireEvent.change(dateInput(), { target: { value: MONDAY } });
    await user.click(nextButton());
    expect(toast.error).toHaveBeenLastCalledWith('Por favor selecciona una hora');

    // Slots are selectable before a professional is chosen (legacy), so the professional is asked last.
    await user.selectOptions(timeSelect(), '11:00');
    await user.click(nextButton());
    expect(toast.error).toHaveBeenLastCalledWith('Por favor selecciona un profesional');

    expect(toast.error).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('heading', { name: 'Fecha y Hora' })).toBeInTheDocument();
  });

  it('flags the form as validated and toasts when step 3 is submitted empty', async () => {
    const backend = installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await goToForm(user);

    const form = screen.getByTestId('client-form');
    expect(form).not.toHaveAttribute('data-validated');

    await user.click(confirmButton());

    expect(toast.error).toHaveBeenCalledWith('Por favor completa todos los campos requeridos');
    expect(form).toHaveAttribute('data-validated', 'true');
    expect(screen.getByText('Por favor ingresa tu nombre completo')).toBeInTheDocument();
    expect(screen.getByText('Por favor ingresa un email válido')).toBeInTheDocument();
    expect(screen.getByText('Por favor ingresa tu teléfono')).toBeInTheDocument();
    expect(screen.getByText('Debes aceptar los términos y condiciones')).toBeInTheDocument();
    expect(backend.posts).toHaveLength(0);
  });

  it('keeps the legacy form attributes (required, placeholders, hidden cédula, optional notes)', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await goToForm(user);

    const name = screen.getByLabelText('Nombre completo');
    expect(name).toBeRequired();
    expect(name).toHaveAttribute('placeholder', 'Tu nombre completo');
    const email = screen.getByLabelText('Dirección de email');
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toBeRequired();
    expect(email).toHaveAttribute('placeholder', 'tu@email.com');
    const phone = screen.getByLabelText('Número de teléfono');
    expect(phone).toHaveAttribute('type', 'tel');
    expect(phone).toBeRequired();
    expect(phone).toHaveAttribute('placeholder', '+598 98 114 696');
    const notes = screen.getByLabelText('Notas adicionales');
    expect(notes).not.toBeRequired();
    expect(notes).toHaveAttribute('placeholder', 'Cualquier comentario especial...');
    expect(screen.getByRole('checkbox', { name: /Acepto los/ })).toBeRequired();
    expect(screen.getByRole('link', { name: 'términos y condiciones' })).toHaveAttribute('target', '_blank');
    // The "Cédula" field exists but is not shown (legacy `display: none` column).
    expect(screen.getByLabelText('Número de cédula')).not.toBeVisible();
  });

  it('rejects an invalid email on step 3', async () => {
    const backend = installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await reachReadyToConfirm(user, { client: { email: 'not-an-email' } });

    await user.click(confirmButton());

    expect(toast.error).toHaveBeenCalledWith('Por favor completa todos los campos requeridos');
    expect(backend.posts).toHaveLength(0);
  });
});

describe('submit sequence', () => {
  it('blocks the submit when the pre-check says the slot was just taken', async () => {
    const backend = installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await reachReadyToConfirm(user);

    // Somebody else books 11:00 with Alex between the slot lookup and the confirmation.
    backend.bookings = [existingBooking({ time: '11:00' })];
    await user.click(confirmButton());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        `❌ Lo sentimos, Alex García ya tiene una reserva para ${MONDAY} a las 11:00. Por favor selecciona otra hora o profesional.`,
      ),
    );
    expect(backend.posts).toHaveLength(0);
    expect(screen.queryByRole('dialog', { name: 'Procesando tu reserva...' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirmar Reserva' })).toBeEnabled());
    expect(bookingDialog()).toBeInTheDocument();
  });

  it('proceeds with the booking when the availability check itself fails', async () => {
    const backend = installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await reachReadyToConfirm(user);

    backend.getError = new Error('boom');
    await user.click(confirmButton());

    await screen.findByRole('dialog', { name: '¡Reserva Confirmada!' });
    expect(backend.posts).toHaveLength(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('toasts the server error, closes the loading modal and re-enables the button when the POST fails', async () => {
    const backend = installBackend();
    backend.postResponse = jsonResponse(500, { message: 'Boom' });
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await reachReadyToConfirm(user);

    await user.click(confirmButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error al procesar la reserva: Boom', 5000));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Procesando tu reserva...' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Confirmar Reserva' })).toBeEnabled();
    expect(screen.queryByRole('dialog', { name: '¡Reserva Confirmada!' })).not.toBeInTheDocument();
    expect(bookingDialog()).toBeInTheDocument();

    // After the failure the user can try again.
    backend.postResponse = null;
    await user.click(screen.getByRole('button', { name: 'Confirmar Reserva' }));
    await screen.findByRole('dialog', { name: '¡Reserva Confirmada!' });
    expect(backend.posts).toHaveLength(2);
  });

  it('shows the loading modal and a disabled "Procesando..." button while the POST is in flight', async () => {
    const backend = installBackend();
    let release;
    backend.postGate = new Promise((resolve) => {
      release = resolve;
    });
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await reachReadyToConfirm(user);

    await user.click(confirmButton());

    const loading = await screen.findByRole('dialog', { name: 'Procesando tu reserva...' });
    expect(within(loading).getByText('Por favor espera un momento')).toBeInTheDocument();
    // The booking dialog sits under the loading one (inert), hence `hidden: true`.
    expect(screen.getByRole('button', { name: /Procesando\.\.\./, hidden: true })).toBeDisabled();

    // The legacy "Cerrar" only hides the loading modal; the submission keeps going.
    await user.click(within(loading).getByRole('button', { name: 'Cerrar' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Procesando tu reserva...' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /Procesando\.\.\./ })).toBeDisabled();

    release();
    await screen.findByRole('dialog', { name: '¡Reserva Confirmada!' });
    expect(backend.posts).toHaveLength(1);
  });

  it('sends ONE request when the confirm button is clicked repeatedly', async () => {
    const backend = installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await reachReadyToConfirm(user);

    const button = confirmButton();
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await screen.findByRole('dialog', { name: '¡Reserva Confirmada!' });
    expect(backend.posts).toHaveLength(1);
  });

  it('sends ONE request on a real double click', async () => {
    const backend = installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await reachReadyToConfirm(user);

    await user.dblClick(confirmButton());

    await screen.findByRole('dialog', { name: '¡Reserva Confirmada!' });
    expect(backend.posts).toHaveLength(1);
  });

  it('escapes user text on the wire but never injects it as markup', async () => {
    const backend = installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await reachReadyToConfirm(user, {
      client: {
        name: '<b>x</b>',
        email: "o'brien&co@example.com",
        notes: '<img src=x onerror=alert(1)> "quoted" & more',
      },
    });

    await user.click(confirmButton());

    const confirmation = await screen.findByRole('dialog', { name: '¡Reserva Confirmada!' });
    const [post] = backend.posts;
    expect(post.body.client.name).toBe('&lt;b&gt;x&lt;/b&gt;');
    expect(post.body.client.email).toBe('o&#x27;brien&amp;co@example.com');
    expect(post.body.notes).toBe('&lt;img src=x onerror=alert(1)&gt; &quot;quoted&quot; &amp; more');
    expect(post.body.client.phone).toBe('+598 98 114 696');

    // Deliberate improvement (c): the confirmation shows the raw typed email, as plain text.
    expect(within(confirmation).getByText("o'brien&co@example.com")).toBeInTheDocument();
    expect(document.querySelector('b')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
  });
});

describe('modal lifecycle', () => {
  it('resets everything when the modal is opened again', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    await chooseService(user, 'Servicio Básico');
    await fillSchedule(user);
    await user.click(nextButton());
    await screen.findByRole('heading', { name: 'Tus Datos' });
    await user.type(screen.getByLabelText('Nombre completo'), 'Juan');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(queryBookingDialog()).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'reopen' }));

    expect(await screen.findByRole('heading', { name: 'Elige tu Servicio' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Tus Datos' })).not.toBeInTheDocument();
    for (const button of screen.getAllByRole('button', { name: /Consulta|Servicio|Sesión/ })) {
      expect(button).toHaveAttribute('aria-pressed', 'false');
    }
    expect(screen.queryByRole('button', { name: /Anterior/ })).not.toBeInTheDocument();

    await chooseService(user, 'Sesión Exprés');
    expect(dateInput()).toHaveValue('');
    expect(timeSelect()).toHaveValue('');
    expect(screen.getByTestId('selected-service-info')).toHaveTextContent('Profesional: No seleccionado');
    await user.click(nextButton());
    expect(toast.error).toHaveBeenLastCalledWith('Por favor selecciona una fecha');

    // The client form was rebuilt too.
    fireEvent.change(dateInput(), { target: { value: MONDAY } });
    await user.selectOptions(timeSelect(), '11:00');
    await user.click(professionalCard('Alex García'));
    await user.click(nextButton());
    await screen.findByRole('heading', { name: 'Tus Datos' });
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('');
    expect(screen.getByTestId('client-form')).not.toHaveAttribute('data-validated');
  });

  it('closes with Escape and with the header close button, but not by clicking the backdrop', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    // Static backdrop (legacy data-bs-backdrop="static"): a click on the dimmed area around the
    // dialog box (the full-viewport scroller) keeps it open.
    await user.click(screen.getByTestId('modal-viewport'));
    expect(bookingDialog()).toBeInTheDocument();

    await user.click(within(bookingDialog()).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(queryBookingDialog()).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'reopen' }));
    await screen.findByRole('dialog', { name: 'Reservar tu Cita' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(queryBookingDialog()).not.toBeInTheDocument());
  });

  it('keeps focus inside the dialog and locks the page scroll while it is open', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    const dialog = bookingDialog();
    expect(dialog).toHaveAttribute('aria-labelledby');
    await waitFor(() => expect(dialog).toContainElement(document.activeElement));
    for (let i = 0; i < 6; i += 1) await user.tab();
    expect(dialog).toContainElement(document.activeElement);
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('cannot dismiss the confirmation with Escape (legacy data-bs-keyboard="false")', async () => {
    installBackend();
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await reachReadyToConfirm(user);
    await user.click(confirmButton());
    await screen.findByRole('dialog', { name: '¡Reserva Confirmada!' });

    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: '¡Reserva Confirmada!' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar confirmación' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '¡Reserva Confirmada!' })).not.toBeInTheDocument(),
    );
  });
});
