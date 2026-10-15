// ===== SERVICIO DE ADMINISTRACIÓN =====
// Lógica del panel admin — sin referencias al DOM.

import { apiClient } from '../core/apiClient.js';

export function getBookings() {
  return apiClient.get('/api/bookings');
}

export function getStatistics() {
  return apiClient.get('/api/bookings/statistics');
}

export function deleteBooking(id) {
  return apiClient.delete('/api/bookings/' + id);
}
