// Static pin of what the frontend sends against what BookingApp_Back requires.
//
// Backend facts (read from ../BookingApp_Back, which this test never modifies):
//  - CreateBookingDto is a plain class with NO class-validator decorators and main.ts registers
//    NO global ValidationPipe, so there are no length/regex/enum limits at the HTTP layer.
//  - The real constraints are the Mongoose `Booking` schema `required` flags (a missing required
//    value yields "Error de validación" -> 400) and the explicit checks in BookingsService.create().
// The validator below encodes exactly those constraints, strictly (exact JS types, no coercion).

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('socket.io-client', () => ({ io: vi.fn() }));

import { io } from 'socket.io-client';
import { APP_CONFIG } from '../config/appConfig.js';
import { buildBookingPayload } from '../services/bookingService.js';
import * as bookingService from '../services/bookingService.js';
import * as adminService from '../services/adminService.js';
import { connectBookingSocket } from '../services/realtimeService.js';

// --- Encoded backend constraints (src/bookings/schemas/booking.schema.ts + bookings.service.ts) ---

const isNonEmptyString = (v) => typeof v === 'string' && v.length > 0;
const isString = (v) => typeof v === 'string';
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);

// field path -> [predicate, description]
const REQUIRED = {
  'client.name': [isNonEmptyString, 'non-empty string'],
  'client.email': [isNonEmptyString, 'non-empty string'],
  'client.phone': [isNonEmptyString, 'non-empty string'],
  'service.id': [isNonEmptyString, 'non-empty string'],
  'service.name': [isNonEmptyString, 'non-empty string'],
  'service.price': [isNumber, 'number'],
  'service.duration': [isNumber, 'number'],
  'professional.id': [isNonEmptyString, 'non-empty string'],
  'professional.name': [isNonEmptyString, 'non-empty string'],
  date: [isNonEmptyString, 'non-empty string'],
  time: [isNonEmptyString, 'non-empty string'],
};
const OPTIONAL = {
  'client.id': [isString, 'string'],
  notes: [isString, 'string'],
  status: [isString, 'string'],
};

const getPath = (obj, path) => path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);

// Mirrors the Mongoose schema + service-level checks. Returns a list of violations (empty = accepted).
function validateCreateBooking(payload) {
  const errors = [];
  for (const [path, [ok, label]] of Object.entries(REQUIRED)) {
    if (!ok(getPath(payload, path))) errors.push(`${path} must be a ${label}`);
  }
  for (const [path, [ok, label]] of Object.entries(OPTIONAL)) {
    const value = getPath(payload, path);
    if (value !== undefined && !ok(value)) errors.push(`${path} must be a ${label}`);
  }
  return errors;
}

// Fixture: worst case for escaping (every sanitized character present) and a real catalog entry.
const SERVICE = APP_CONFIG.SERVICES[0];
const PROFESSIONAL = APP_CONFIG.PROFESSIONALS[0];
const NASTY = `Ana "O'Brien" <b>&</b>`;

const payloadFor = (formData) => buildBookingPayload({
  formData,
  service: SERVICE,
  professional: PROFESSIONAL,
  date: '2030-01-15',
  time: '10:00',
});

describe('POST /api/bookings payload vs CreateBookingDto / Booking schema', () => {
  it('satisfies every required field and type for a regular booking', () => {
    const payload = payloadFor({
      name: 'Ana Pérez', id: '12345678', email: 'ana@example.com', phone: '+54 11 5555-1234', notes: 'First visit',
    });

    expect(validateCreateBooking(payload)).toEqual([]);
    expect(payload.status).toBe('confirmed');
    expect(payload.time).toMatch(/^\d{2}:00$/);
    expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('satisfies the contract when the optional id and notes are left empty', () => {
    const payload = payloadFor({ name: 'Ana', email: 'ana@example.com', phone: '555' });

    expect(validateCreateBooking(payload)).toEqual([]);
    expect(payload.client.id).toBe('');
    expect(payload.notes).toBe('');
  });

  it('still satisfies the contract after HTML escaping (no length/regex limit exists server-side)', () => {
    const payload = payloadFor({ name: NASTY, id: NASTY, email: 'a@b.co', phone: '1', notes: NASTY });

    expect(validateCreateBooking(payload)).toEqual([]);
    // Documented behavior: the ESCAPED text is what is persisted (legacy data compatibility).
    expect(payload.client.name).toBe('Ana &quot;O&#x27;Brien&quot; &lt;b&gt;&amp;&lt;/b&gt;');
    expect(payload.notes).toBe(payload.client.name);
  });

  it('sends only keys the schema knows about (nothing is silently dropped or rejected)', () => {
    const payload = payloadFor({ name: 'Ana', id: '1', email: 'a@b.co', phone: '1', notes: 'n' });

    expect(Object.keys(payload).sort()).toEqual(
      ['client', 'date', 'notes', 'professional', 'service', 'status', 'time'],
    );
    expect(Object.keys(payload.client).sort()).toEqual(['email', 'id', 'name', 'phone']);
    expect(Object.keys(payload.service).sort()).toEqual(['duration', 'id', 'name', 'price']);
    expect(Object.keys(payload.professional).sort()).toEqual(['id', 'name']);
  });

  it('every catalog service/professional pair produces an accepted payload', () => {
    for (const service of APP_CONFIG.SERVICES) {
      for (const professional of APP_CONFIG.PROFESSIONALS) {
        const payload = buildBookingPayload({
          formData: { name: 'Ana', email: 'a@b.co', phone: '1' },
          service,
          professional,
          date: '2030-01-15',
          time: '09:00',
        });
        expect(validateCreateBooking(payload)).toEqual([]);
      }
    }
  });

  it('the validator itself rejects what the backend would reject (guards against a vacuous test)', () => {
    const good = payloadFor({ name: 'Ana', email: 'a@b.co', phone: '1' });

    expect(validateCreateBooking({ ...good, client: { ...good.client, email: '' } })).toContain(
      'client.email must be a non-empty string',
    );
    expect(validateCreateBooking({ ...good, service: { ...good.service, price: '500' } })).toContain(
      'service.price must be a number',
    );
    expect(validateCreateBooking({ ...good, professional: undefined })).toContain(
      'professional.id must be a non-empty string',
    );
    expect(validateCreateBooking({ ...good, date: undefined })).toContain('date must be a non-empty string');
  });
});

// --- Endpoints and socket event ---

// Backend route table: global prefix 'api' (main.ts) + @Controller('bookings') + method decorators.
const BACKEND_ROUTES = [
  ['POST', '/api/bookings'],
  ['GET', '/api/bookings'],
  ['GET', '/api/bookings/statistics'],
  ['DELETE', '/api/bookings/:id'],
];

const matchesRoute = (method, url) => BACKEND_ROUTES.some(([m, template]) => (
  m === method && new RegExp(`^${template.replace(':id', '[^/]+')}$`).test(url)
));

describe('endpoints used by the services exist in the backend controller', () => {
  let calls;

  beforeEach(() => {
    calls = [];
    vi.stubGlobal('fetch', vi.fn(async (url, options) => {
      calls.push({ method: options.method, url: String(url).replace(APP_CONFIG.BACKEND_URL, '') });
      return { ok: true, json: async () => [] };
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('every call issued by bookingService and adminService maps to a backend route', async () => {
    await bookingService.createBooking(payloadFor({ name: 'Ana', email: 'a@b.co', phone: '1' }));
    await bookingService.getBookings();
    await adminService.getBookings();
    await adminService.getStatistics();
    await adminService.deleteBooking('665f1c2e9b1d4a0012345678');

    expect(calls).toEqual([
      { method: 'POST', url: '/api/bookings' },
      { method: 'GET', url: '/api/bookings' },
      { method: 'GET', url: '/api/bookings' },
      { method: 'GET', url: '/api/bookings/statistics' },
      { method: 'DELETE', url: '/api/bookings/665f1c2e9b1d4a0012345678' },
    ]);
    for (const { method, url } of calls) {
      expect(matchesRoute(method, url), `${method} ${url}`).toBe(true);
    }
  });

  it('checkAvailability only reads GET /api/bookings (POST /availability is not used)', async () => {
    await bookingService.checkAvailability('2030-01-15', '10:00', 'alex-garcia');

    expect(calls).toEqual([{ method: 'GET', url: '/api/bookings' }]);
  });
});

describe('Socket.IO contract', () => {
  it("listens to the 'newBooking' event on the backend base URL", () => {
    const handlers = {};
    io.mockReturnValue({ on: (event, cb) => { handlers[event] = cb; }, disconnect: vi.fn() });

    connectBookingSocket(APP_CONFIG.BACKEND_URL, { onNewBooking: vi.fn() });

    expect(io).toHaveBeenCalledWith(APP_CONFIG.BACKEND_URL);
    expect(Object.keys(handlers)).toContain('newBooking');
  });
});

// --- Cross-check against the real backend source when the sibling repo is checked out ---

const BACK = resolve(process.cwd(), '../BookingApp_Back/src');
const backendAvailable = existsSync(resolve(BACK, 'bookings/bookings.controller.ts'));

describe.skipIf(!backendAvailable)('cross-check with ../BookingApp_Back source (sibling checkout)', () => {
  const read = (rel) => readFileSync(resolve(BACK, rel), 'utf8');

  it('controller declares the pinned routes under the global /api prefix', () => {
    const controller = read('bookings/bookings.controller.ts');
    const main = read('main.ts');

    expect(main).toMatch(/setGlobalPrefix\(\s*'api'/);
    expect(controller).toMatch(/@Controller\(\s*'bookings'\s*\)/);
    expect(controller).toMatch(/@Post\(\)\s+async create\(/);
    expect(controller).toMatch(/@Get\(\)\s+findAll\(/);
    expect(controller).toMatch(/@Get\(\s*'statistics'\s*\)/);
    expect(controller).toMatch(/@Delete\(\s*':id'\s*\)/);
  });

  it("gateway emits the 'newBooking' event", () => {
    expect(read('bookings/bookings.gateway.ts')).toMatch(/\.emit\(\s*'newBooking'/);
  });

  it('DTO still carries no validation decorators and no global ValidationPipe is registered', () => {
    // If this fails the backend started enforcing limits: re-derive the validator above.
    expect(read('bookings/dto/create-booking.dto.ts')).not.toMatch(/@Is|@Length|@Matches|@Min|@Max/);
    expect(read('main.ts')).not.toMatch(/ValidationPipe/);
    expect(read('app.module.ts')).not.toMatch(/ValidationPipe/);
  });

  it('schema required fields equal the encoded REQUIRED set (client.id is the only optional leaf)', () => {
    const schema = read('bookings/schemas/booking.schema.ts');

    expect(schema).toMatch(/id: \{ type: String, required: false \}/);
    // 3 client + 4 service + 2 professional required leaves, plus the date and time props.
    expect((schema.match(/required: true \}/g) || []).length).toBe(11);
    expect(schema).toMatch(/@Prop\(\{ required: true \}\)\s+date: string;/);
    expect(schema).toMatch(/@Prop\(\{ required: true \}\)\s+time: string;/);
    expect(Object.keys(REQUIRED)).toHaveLength(11);
  });
});
