import { describe, it, expect } from 'vitest';
import { getDayInfo, buildTimeSlots, getBookedTimes } from './schedule.js';

// 2030-01-06 is a Sunday, 2030-01-07 Monday, 2030-01-12 Saturday (local-date parsing).
const SUNDAY = '2030-01-06';
const MONDAY = '2030-01-07';
const SATURDAY = '2030-01-12';

const values = (info) => info.slots.map((s) => s.value);

describe('getDayInfo', () => {
  it('marks Sunday as closed', () => {
    expect(getDayInfo(SUNDAY)).toMatchObject({ closed: true, closedLabel: 'Domingo cerrado' });
  });

  it('closes Saturday at 18 and weekdays at the configured end hour', () => {
    expect(getDayInfo(SATURDAY)).toMatchObject({ closed: false, closingHour: 18 });
    expect(getDayInfo(MONDAY)).toMatchObject({ closed: false, closingHour: 20 });
  });
});

describe('buildTimeSlots', () => {
  it('returns no slots and the closed label on Sunday', () => {
    const info = buildTimeSlots(SUNDAY);
    expect(info.closed).toBe(true);
    expect(info.closedLabel).toBe('Domingo cerrado');
    expect(info.slots).toEqual([]);
  });

  it('ends at 17:00 on Saturday', () => {
    const slots = values(buildTimeSlots(SATURDAY));
    expect(slots[slots.length - 1]).toBe('17:00');
    expect(slots).not.toContain('18:00');
  });

  it('ends at 19:00 on weekdays and starts at 09:00', () => {
    const slots = values(buildTimeSlots(MONDAY));
    expect(slots[0]).toBe('09:00');
    expect(slots[slots.length - 1]).toBe('19:00');
    expect(slots).not.toContain('20:00');
  });

  it('skips the lunch hour 13:00', () => {
    const slots = values(buildTimeSlots(MONDAY));
    expect(slots).not.toContain('13:00');
    expect(slots).toContain('12:00');
    expect(slots).toContain('14:00');
  });

  it('flags booked times and counts the available ones', () => {
    const info = buildTimeSlots(MONDAY, ['09:00', '15:00']);
    const total = info.slots.length;
    expect(info.slots.find((s) => s.value === '09:00').booked).toBe(true);
    expect(info.slots.find((s) => s.value === '15:00').booked).toBe(true);
    expect(info.slots.find((s) => s.value === '10:00').booked).toBe(false);
    expect(info.availableCount).toBe(total - 2);
    expect(info.headerText).toBe(`Selecciona una hora (${total - 2} disponibles)`);
  });

  it('reports no availability when every slot is booked', () => {
    const all = values(buildTimeSlots(MONDAY));
    const info = buildTimeSlots(MONDAY, all);
    expect(info.availableCount).toBe(0);
    expect(info.headerText).toBe('No hay horarios disponibles');
  });

  it('uses the plain header with all slots free when bookings are unknown (null)', () => {
    const info = buildTimeSlots(MONDAY, null);
    expect(info.headerText).toBe('Selecciona una hora');
    expect(info.slots.every((s) => s.booked === false)).toBe(true);
    expect(info.availableCount).toBe(info.slots.length);
  });

  it('treats an omitted bookedTimes as an empty list', () => {
    const info = buildTimeSlots(MONDAY);
    expect(info.headerText).toBe(`Selecciona una hora (${info.slots.length} disponibles)`);
  });
});

describe('getBookedTimes', () => {
  const bookings = [
    { date: MONDAY, time: '09:00', status: 'confirmed', professional: { id: 'alex-garcia' } },
    { date: MONDAY, time: '10:00', status: 'cancelled', professional: { id: 'alex-garcia' } },
    { date: MONDAY, time: '11:00', status: 'confirmed', professional: { id: 'maria-lopez' } },
    { date: '2030-01-08', time: '12:00', status: 'confirmed', professional: { id: 'alex-garcia' } },
    { date: MONDAY, time: '14:00', status: 'pending', professional: { id: 'alex-garcia' } },
    { date: MONDAY, time: '15:00', status: 'confirmed' },
  ];

  it('keeps only non-cancelled bookings of that professional on that date', () => {
    expect(getBookedTimes(bookings, MONDAY, 'alex-garcia')).toEqual(['09:00', '14:00']);
  });

  it('compares professional ids strictly', () => {
    const numeric = [{ date: MONDAY, time: '09:00', status: 'confirmed', professional: { id: 1 } }];
    expect(getBookedTimes(numeric, MONDAY, '1')).toEqual([]);
    expect(getBookedTimes(numeric, MONDAY, 1)).toEqual(['09:00']);
  });
});
