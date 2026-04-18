// ===== SERVICIO DE ADMINISTRACIÓN =====
// Lógica del panel admin — sin referencias al DOM.
// Depende de: window.apiClient (js/core/api-client.js)

const adminService = {
  getBookings: function() {
    return window.apiClient.get('/api/bookings');
  },

  getStatistics: function() {
    return window.apiClient.get('/api/bookings/statistics');
  },

  deleteBooking: function(id) {
    return window.apiClient.delete('/api/bookings/' + id);
  },
};

window.adminService = adminService;
