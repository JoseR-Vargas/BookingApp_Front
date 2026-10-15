import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BookingProvider, bookingReducer, initialBookingState, useBooking } from './bookingState.jsx';

const SERVICE = { id: 'servicio-basico', name: 'Servicio Básico', price: 1200, duration: 60, professionals: ['alex-garcia'] };
const PROFESSIONAL = { id: 'alex-garcia', name: 'Alex García' };

const setup = () => renderHook(() => useBooking(), { wrapper: BookingProvider });

describe('bookingReducer', () => {
  it('starts like the legacy bookingState', () => {
    expect(initialBookingState).toEqual({
      currentStep: 1,
      selectedService: null,
      selectedDate: null,
      selectedTime: null,
      selectedProfessional: null,
      isSubmitting: false,
    });
  });

  it('ignores unknown actions', () => {
    expect(bookingReducer(initialBookingState, { type: 'nope' })).toBe(initialBookingState);
  });
});

describe('useBooking', () => {
  it('exposes the initial state and an invalid selection', () => {
    const { result } = setup();

    expect(result.current.state).toEqual(initialBookingState);
    expect(result.current.isValid()).toBe(false);
  });

  it('sets every field through its action', () => {
    const { result } = setup();

    act(() => {
      result.current.setService(SERVICE);
      result.current.setDate('2030-03-04');
      result.current.setTime('11:00');
      result.current.setProfessional(PROFESSIONAL);
      result.current.setStep(2);
      result.current.setSubmitting(true);
    });

    expect(result.current.state).toEqual({
      currentStep: 2,
      selectedService: SERVICE,
      selectedDate: '2030-03-04',
      selectedTime: '11:00',
      selectedProfessional: PROFESSIONAL,
      isSubmitting: true,
    });
  });

  it('isValid needs service, date, time and professional', () => {
    const { result } = setup();

    act(() => {
      result.current.setService(SERVICE);
      result.current.setDate('2030-03-04');
      result.current.setTime('11:00');
    });
    expect(result.current.isValid()).toBe(false);

    act(() => result.current.setProfessional(PROFESSIONAL));
    expect(result.current.isValid()).toBe(true);

    act(() => result.current.setTime(null));
    expect(result.current.isValid()).toBe(false);
  });

  it('reset brings back the initial state', () => {
    const { result } = setup();
    act(() => {
      result.current.setService(SERVICE);
      result.current.setStep(3);
      result.current.setSubmitting(true);
    });

    act(() => result.current.reset());

    expect(result.current.state).toEqual(initialBookingState);
  });

  it('drops a professional that the newly chosen service does not offer', () => {
    const { result } = setup();
    act(() => {
      result.current.setService(SERVICE);
      result.current.setProfessional({ id: 'maria-lopez', name: 'María López' });
    });

    act(() => result.current.setService({ ...SERVICE, id: 'other', professionals: ['alex-garcia'] }));
    expect(result.current.state.selectedProfessional).toBeNull();

    act(() => result.current.setProfessional(PROFESSIONAL));
    act(() => result.current.setService({ ...SERVICE, id: 'another', professionals: ['alex-garcia', 'maria-lopez'] }));
    expect(result.current.state.selectedProfessional).toEqual(PROFESSIONAL);
  });

  it('throws a helpful error outside the provider', () => {
    expect(() => renderHook(() => useBooking())).toThrow('useBooking must be used inside <BookingProvider>');
  });
});
