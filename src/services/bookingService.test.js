import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBooking, getBookings, checkAvailability, buildBookingPayload } from './bookingService.js';
import { APP_CONFIG } from '../config/appConfig.js';

const okJson = (data) => ({ ok: true, status: 200, json: async () => data });

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('bookingService HTTP contract', () => {
  it('createBooking POSTs JSON to /api/bookings', async () => {
    fetch.mockResolvedValue(okJson({ _id: '1' }));
    const payload = { client: { name: 'Ana' }, status: 'confirmed' };

    const result = await createBooking(payload);

    expect(result).toEqual({ _id: '1' });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${APP_CONFIG.BACKEND_URL}/api/bookings`);
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify(payload));
  });

  it('createBooking aborts at 30000ms and not before', async () => {
    vi.useFakeTimers();
    let signal;
    fetch.mockImplementation((_url, init) => {
      signal = init.signal;
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    const pending = createBooking({ a: 1 });
    const assertion = expect(pending).rejects.toThrow(/Timeout/);

    await vi.advanceTimersByTimeAsync(29999);
    expect(signal.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(signal.aborted).toBe(true);
    await assertion;
  });

  it('getBookings GETs /api/bookings without a body', async () => {
    fetch.mockResolvedValue(okJson([]));

    await getBookings();

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${APP_CONFIG.BACKEND_URL}/api/bookings`);
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
  });

  it('getBookings forwards the timeout option', async () => {
    vi.useFakeTimers();
    let signal;
    fetch.mockImplementation((_url, init) => {
      signal = init.signal;
      return new Promise(() => {});
    });

    getBookings({ timeout: 15000 });
    await vi.advanceTimersByTimeAsync(14999);
    expect(signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(signal.aborted).toBe(true);
  });
});

describe('bookingService.checkAvailability', () => {
  const existing = [
    { date: '2030-01-07', time: '10:00', status: 'confirmed', professional: { id: 'alex-garcia' } },
    { date: '2030-01-07', time: '11:00', status: 'cancelled', professional: { id: 'alex-garcia' } },
    { date: '2030-01-07', time: '12:00', status: 'confirmed', professional: { id: 99 } },
    { date: '2030-01-07', time: '15:00', status: 'confirmed' },
    { date: '2030-01-07', time: '16:00', status: 'confirmed', professional: {} },
  ];

  beforeEach(() => {
    fetch.mockResolvedValue(okJson(existing));
  });

  it('is false when the same professional already has that slot', async () => {
    expect(await checkAvailability('2030-01-07', '10:00', 'alex-garcia')).toBe(false);
  });

  it('is true for a free slot or another professional', async () => {
    expect(await checkAvailability('2030-01-07', '09:00', 'alex-garcia')).toBe(true);
    expect(await checkAvailability('2030-01-07', '10:00', 'maria-lopez')).toBe(true);
    expect(await checkAvailability('2030-01-08', '10:00', 'alex-garcia')).toBe(true);
  });

  it('ignores cancelled bookings', async () => {
    expect(await checkAvailability('2030-01-07', '11:00', 'alex-garcia')).toBe(true);
  });

  it('compares ids as strings', async () => {
    expect(await checkAvailability('2030-01-07', '12:00', '99')).toBe(false);
  });

  it('ignores bookings with a missing professional or professional id', async () => {
    expect(await checkAvailability('2030-01-07', '15:00', 'alex-garcia')).toBe(true);
    expect(await checkAvailability('2030-01-07', '16:00', 'alex-garcia')).toBe(true);
  });
});

describe('buildBookingPayload', () => {
  const service = { id: 'servicio-basico', name: 'Servicio Básico', price: 1200, duration: 60, icon: 'x', description: 'y' };
  const professional = { id: 'alex-garcia', name: 'Alex García', rating: 4.9 };

  it('produces exactly the legacy wire shape, escaping user text', () => {
    const payload = buildBookingPayload({
      formData: {
        name: `<b>O'Brien</b> & "Co"`,
        id: '1234567-8',
        email: 'a@b.com',
        phone: '099123456',
        notes: `<script>alert('x')</script>`,
      },
      service,
      professional,
      date: '2030-01-07',
      time: '10:00',
    });

    expect(payload).toEqual({
      client: {
        name: '&lt;b&gt;O&#x27;Brien&lt;/b&gt; &amp; &quot;Co&quot;',
        id: '1234567-8',
        email: 'a@b.com',
        phone: '099123456',
      },
      service: { id: 'servicio-basico', name: 'Servicio Básico', price: 1200, duration: 60 },
      professional: { id: 'alex-garcia', name: 'Alex García' },
      date: '2030-01-07',
      time: '10:00',
      notes: '&lt;script&gt;alert(&#x27;x&#x27;)&lt;/script&gt;',
      status: 'confirmed',
    });
    expect(Object.keys(payload)).toEqual(['client', 'service', 'professional', 'date', 'time', 'notes', 'status']);
    expect(Object.keys(payload.client)).toEqual(['name', 'id', 'email', 'phone']);
  });

  it('defaults an empty client id and notes to empty strings', () => {
    const payload = buildBookingPayload({
      formData: { name: 'Ana', email: 'a@b.com', phone: '1' },
      service,
      professional,
      date: '2030-01-07',
      time: '10:00',
    });
    expect(payload.client.id).toBe('');
    expect(payload.notes).toBe('');
  });
});
