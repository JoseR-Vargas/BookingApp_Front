import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBookings, getStatistics, deleteBooking } from './adminService.js';
import { APP_CONFIG } from '../config/appConfig.js';

const okJson = (data) => ({ ok: true, status: 200, json: async () => data });

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({})));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('adminService HTTP contract', () => {
  it('getBookings => GET /api/bookings', async () => {
    await getBookings();
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${APP_CONFIG.BACKEND_URL}/api/bookings`);
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
  });

  it('getStatistics => GET /api/bookings/statistics', async () => {
    await getStatistics();
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${APP_CONFIG.BACKEND_URL}/api/bookings/statistics`);
    expect(init.method).toBe('GET');
  });

  it('deleteBooking(id) => DELETE /api/bookings/<id> with no body', async () => {
    await deleteBooking('abc123');
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${APP_CONFIG.BACKEND_URL}/api/bookings/abc123`);
    expect(init.method).toBe('DELETE');
    expect(init.body).toBeUndefined();
  });

  it('returns the parsed response body', async () => {
    fetch.mockResolvedValue(okJson({ totalBookings: 3 }));
    expect(await getStatistics()).toEqual({ totalBookings: 3 });
  });
});
