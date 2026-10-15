import { describe, it, expect } from 'vitest';
import {
  getRecentBookings,
  filterByDate,
  sumConfirmedRevenue,
  getMonthlyCounts,
  getServiceCounts,
  getProfessionalName,
} from './adminStats.js';

const year = new Date().getFullYear();

const mk = (over) => ({
  _id: 'x',
  date: `${year}-01-10`,
  status: 'confirmed',
  createdAt: '2030-01-01T00:00:00Z',
  service: { name: 'Servicio Básico', price: 1200 },
  professional: { name: 'Alex García' },
  ...over,
});

describe('getRecentBookings', () => {
  it('sorts by createdAt desc and limits to n without mutating the input', () => {
    const input = [
      mk({ _id: 'a', createdAt: '2030-01-01T00:00:00Z' }),
      mk({ _id: 'b', createdAt: '2030-03-01T00:00:00Z' }),
      mk({ _id: 'c', createdAt: '2030-02-01T00:00:00Z' }),
    ];
    const snapshot = input.map((b) => b._id);

    const result = getRecentBookings(input, 2);

    expect(result.map((b) => b._id)).toEqual(['b', 'c']);
    expect(input.map((b) => b._id)).toEqual(snapshot);
    expect(result).not.toBe(input);
  });

  it('defaults to 5 items', () => {
    const input = Array.from({ length: 8 }, (_, i) => mk({ _id: String(i) }));
    expect(getRecentBookings(input)).toHaveLength(5);
  });
});

describe('filterByDate', () => {
  const input = [mk({ date: '2030-01-10' }), mk({ date: '2030-01-11' })];

  it('returns only bookings of that exact date', () => {
    expect(filterByDate(input, '2030-01-10')).toHaveLength(1);
  });

  it('returns all bookings when no date is selected', () => {
    expect(filterByDate(input, '')).toHaveLength(2);
  });
});

describe('sumConfirmedRevenue', () => {
  it('sums only confirmed bookings', () => {
    const input = [
      mk({ status: 'confirmed', service: { price: 500 } }),
      mk({ status: 'cancelled', service: { price: 9999 } }),
      mk({ status: 'confirmed', service: { price: 700 } }),
      mk({ status: 'pending', service: { price: 1 } }),
    ];
    expect(sumConfirmedRevenue(input)).toBe(1200);
  });

  it('is 0 for an empty list', () => {
    expect(sumConfirmedRevenue([])).toBe(0);
  });
});

describe('getMonthlyCounts', () => {
  it('returns 12 buckets counting only the current year', () => {
    const input = [
      mk({ date: `${year}-01-05` }),
      mk({ date: `${year}-01-20` }),
      mk({ date: `${year}-12-31` }),
      mk({ date: `${year - 1}-01-05` }),
      mk({ date: undefined }),
    ];
    const counts = getMonthlyCounts(input);
    expect(counts).toHaveLength(12);
    expect(counts[0]).toBe(2);
    expect(counts[11]).toBe(1);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('accepts an explicit year and tolerates null input', () => {
    expect(getMonthlyCounts([mk({ date: '2020-03-01' })], 2020)[2]).toBe(1);
    expect(getMonthlyCounts(null)).toEqual(Array(12).fill(0));
  });
});

describe('getServiceCounts', () => {
  it('groups by service name preserving first-seen order', () => {
    const input = [
      mk({ service: { name: 'A' } }),
      mk({ service: { name: 'B' } }),
      mk({ service: { name: 'A' } }),
      mk({ service: {} }),
    ];
    expect(getServiceCounts(input)).toEqual({ labels: ['A', 'B'], data: [2, 1] });
  });

  it('returns empty arrays for no data', () => {
    expect(getServiceCounts([])).toEqual({ labels: [], data: [] });
  });
});

describe('getProfessionalName', () => {
  it('prefers professional, then legacy barber, then N/A', () => {
    expect(getProfessionalName({ professional: { name: 'P' }, barber: { name: 'B' } })).toBe('P');
    expect(getProfessionalName({ barber: { name: 'B' } })).toBe('B');
    expect(getProfessionalName({})).toBe('N/A');
  });
});
