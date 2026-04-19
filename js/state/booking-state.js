// ===== ESTADO CENTRALIZADO DEL FLUJO DE RESERVA =====
// Reemplaza las 9 variables globales sueltas de script.js.
// Interfaz: get(key), set(key, value), reset(), isValid()

const bookingState = {
  _state: {
    currentStep: 1,
    selectedService: null,
    selectedDate: null,
    selectedTime: null,
    selectedProfessional: null,
    isSubmitting: false,
    eventListenersRegistered: false,
  },

  get: function(key) {
    return this._state[key];
  },

  set: function(key, value) {
    this._state[key] = value;
  },

  reset: function() {
    this._state = {
      currentStep: 1,
      selectedService: null,
      selectedDate: null,
      selectedTime: null,
      selectedProfessional: null,
      isSubmitting: false,
      eventListenersRegistered: false,
    };
  },

  isValid: function() {
    return !!(
      this._state.selectedService &&
      this._state.selectedDate &&
      this._state.selectedTime &&
      this._state.selectedProfessional
    );
  },
};

window.bookingState = bookingState;
