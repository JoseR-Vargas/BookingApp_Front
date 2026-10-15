// ===== FORMATEO =====
// Ported from legacy booking-app.js, booking-table.js and the confirmation/service-info views.

import { APP_CONFIG } from '../config/appConfig.js';

const parseParts = (dateString) => dateString.split('-').map((p) => parseInt(p));

export function formatPrice(price) {
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(price);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// Admin table date ('YYYY-MM-DD'). Built as a LOCAL date, exactly like the legacy table.
export function formatBookingDate(dateString) {
  const [y, m, d] = parseParts(dateString);
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Confirmation / service-info date ('YYYY-MM-DD'). Built and formatted in UTC, like the legacy views.
export function formatLongDateUTC(dateString) {
  const [y, m, d] = parseParts(dateString);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

export function canCancelBooking(bookingDateTime) {
  const now = new Date();
  const bookingTime = new Date(bookingDateTime);
  const hoursDifference = (bookingTime - now) / (1000 * 60 * 60);
  return hoursDifference >= APP_CONFIG.CANCELLATION_HOURS;
}

// Legacy displayed amounts as '$' + value.toLocaleString().
export function formatMoney(amount) {
  return '$' + (amount || 0).toLocaleString();
}
