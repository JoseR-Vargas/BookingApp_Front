import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatPrice,
  formatDate,
  formatBookingDate,
  formatLongDateUTC,
  canCancelBooking,
  formatMoney,
} from './format.js';
import { APP_CONFIG } from '../config/appConfig.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('format', () => {
  it('formatPrice uses es-UY / UYU currency formatting', () => {
    const expected = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(1200);
    expect(formatPrice(1200)).toBe(expected);
  });

  it('formatDate uses the es-ES long format', () => {
    const expected = new Date('2030-01-07T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    expect(formatDate('2030-01-07T12:00:00')).toBe(expected);
  });

  it('formatBookingDate builds a LOCAL date (no day shift) with the short es-ES format', () => {
    const expected = new Date(2030, 0, 7).toLocaleDateString('es-ES', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });
    expect(formatBookingDate('2030-01-07')).toBe(expected);
    expect(formatBookingDate('2030-01-07')).toMatch(/7/);
  });

  it('formatLongDateUTC builds a UTC date and formats it in UTC', () => {
    expect(formatLongDateUTC('2030-01-07')).toBe(
      new Date(Date.UTC(2030, 0, 7)).toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
      })
    );
    expect(formatLongDateUTC('2030-01-07')).toMatch(/lunes/);
  });

  it('formatMoney prefixes "$" to the locale string and tolerates empty values', () => {
    expect(formatMoney(1200)).toBe('$' + (1200).toLocaleString());
    expect(formatMoney(0)).toBe('$0');
    expect(formatMoney(undefined)).toBe('$0');
  });

  describe('canCancelBooking', () => {
    it('allows cancelling when the booking is at least CANCELLATION_HOURS away', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2030-01-07T08:00:00Z'));
      const hours = APP_CONFIG.CANCELLATION_HOURS;
      const exactly = new Date(Date.now() + hours * 3600 * 1000);
      const justUnder = new Date(Date.now() + hours * 3600 * 1000 - 1000);
      expect(canCancelBooking(exactly)).toBe(true);
      expect(canCancelBooking(justUnder)).toBe(false);
    });
  });
});
