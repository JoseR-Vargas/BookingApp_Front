// ===== SERVICIO DE RESERVAS =====
// Lógica de negocio pura — sin referencias al DOM.
// Depende de: window.apiClient (js/core/api-client.js)

const bookingService = {
  createBooking: function(bookingData) {
    return window.apiClient.post('/api/bookings', bookingData, { timeout: 30000 });
  },

  getBookings: function(options) {
    return window.apiClient.get('/api/bookings', options || {});
  },

  checkAvailability: async function(date, time, professionalId) {
    const bookings = await this.getBookings();
    const conflict = bookings.find(function(booking) {
      return (
        booking.date === date &&
        booking.time === time &&
        booking.professional &&
        booking.professional.id &&
        String(booking.professional.id) === String(professionalId) &&
        booking.status !== 'cancelled'
      );
    });
    return !conflict;
  },
};

window.bookingService = bookingService;
