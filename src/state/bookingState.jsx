// ===== ESTADO CENTRALIZADO DEL FLUJO DE RESERVA =====
// React replacement for the legacy `bookingState` singleton (js/state/booking-state.js).
// Legacy interface get/set/reset/isValid maps to: `state` + `setX` actions + `reset` + `isValid`.
// `eventListenersRegistered` is gone: React owns event wiring, so there is nothing to register.

import { createContext, useContext, useMemo, useReducer } from 'react';

export const initialBookingState = {
  currentStep: 1,
  selectedService: null,
  selectedDate: null,
  selectedTime: null,
  selectedProfessional: null,
  isSubmitting: false,
};

export function bookingReducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_SERVICE': {
      // A professional that the new service does not offer must not stay selected.
      const stillOffered = state.selectedProfessional
        && action.service.professionals.includes(state.selectedProfessional.id);
      return {
        ...state,
        selectedService: action.service,
        selectedProfessional: stillOffered ? state.selectedProfessional : null,
      };
    }
    case 'SET_DATE':
      return { ...state, selectedDate: action.date };
    case 'SET_TIME':
      return { ...state, selectedTime: action.time };
    case 'SET_PROFESSIONAL':
      return { ...state, selectedProfessional: action.professional };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'RESET':
      return initialBookingState;
    default:
      return state;
  }
}

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState);

  // `dispatch` is stable, so the action creators are too: safe to use in effect dependency lists.
  const actions = useMemo(() => ({
    setStep: (step) => dispatch({ type: 'SET_STEP', step }),
    setService: (service) => dispatch({ type: 'SET_SERVICE', service }),
    setDate: (date) => dispatch({ type: 'SET_DATE', date }),
    setTime: (time) => dispatch({ type: 'SET_TIME', time }),
    setProfessional: (professional) => dispatch({ type: 'SET_PROFESSIONAL', professional }),
    setSubmitting: (isSubmitting) => dispatch({ type: 'SET_SUBMITTING', isSubmitting }),
    reset: () => dispatch({ type: 'RESET' }),
  }), []);

  const value = useMemo(() => ({
    state,
    ...actions,
    // Legacy isValid(): the four selections are all present.
    isValid: () => !!(
      state.selectedService
      && state.selectedDate
      && state.selectedTime
      && state.selectedProfessional
    ),
  }), [state, actions]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used inside <BookingProvider>');
  }
  return context;
}
