// ===== WRAPPER DE TOASTIFY =====
// Centraliza tipos, colores y duración por defecto.

import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import { APP_CONFIG } from '../config/appConfig.js';

const COLORS = {
  success: '#28a745',
  error: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
};

// Phones (<= 576px, the `lte-sm` breakpoint, or a touch device in landscape): a top-right toast covers the booking modal's Close
// button and its first fields, so it goes to the bottom center instead. index.css makes it
// click-through there.
const PHONE_QUERY = '(max-width: 576px), (pointer: coarse) and (max-height: 500px)';
const isPhone = () => typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia(PHONE_QUERY).matches;

function show(message, type, duration) {
  const t = type || 'info';
  const phone = isPhone();
  Toastify({
    text: message,
    duration: duration || APP_CONFIG.TOAST_DURATION || 3000,
    gravity: phone ? 'bottom' : 'top',
    position: phone ? 'center' : 'right',
    style: {
      background: COLORS[t] || COLORS.info,
    },
    stopOnFocus: true,
  }).showToast();
}

export const toast = {
  show,
  success: (message, duration) => show(message, 'success', duration),
  error: (message, duration) => show(message, 'error', duration),
  warning: (message, duration) => show(message, 'warning', duration),
  info: (message, duration) => show(message, 'info', duration),
};
