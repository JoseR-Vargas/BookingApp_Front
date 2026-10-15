// ===== SERVICIO DE RESERVAS =====
// Lógica de negocio pura — sin referencias al DOM.

import { apiClient } from '../core/apiClient.js';
import { sanitizeInput } from '../utils/sanitize.js';

export function createBooking(bookingData) {
  return apiClient.post('/api/bookings', bookingData, { timeout: 30000 });
}

export function getBookings(options) {
  return apiClient.get('/api/bookings', options || {});
}

export async function checkAvailability(date, time, professionalId) {
  const bookings = await getBookings();
  const conflict = bookings.find((booking) => (
    booking.date === date &&
    booking.time === time &&
    booking.professional &&
    booking.professional.id &&
    String(booking.professional.id) === String(professionalId) &&
    booking.status !== 'cancelled'
  ));
  return !conflict;
}

// Builds the exact wire shape the legacy app sent to POST /api/bookings.
// User-provided text is escaped here (same escaping as legacy getFormData) for data compatibility.
export function buildBookingPayload({ formData, service, professional, date, time }) {
  return {
    client: {
      name: sanitizeInput(formData.name),
      id: sanitizeInput(formData.id || ''),
      email: sanitizeInput(formData.email),
      phone: sanitizeInput(formData.phone),
    },
    service: {
      id: service.id,
      name: service.name,
      price: service.price,
      duration: service.duration,
    },
    professional: {
      id: professional.id,
      name: professional.name,
    },
    date,
    time,
    notes: sanitizeInput(formData.notes),
    status: 'confirmed',
  };
}
