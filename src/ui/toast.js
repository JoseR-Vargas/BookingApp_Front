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

function show(message, type, duration) {
  const t = type || 'info';
  Toastify({
    text: message,
    duration: duration || APP_CONFIG.TOAST_DURATION || 3000,
    gravity: 'top',
    position: 'right',
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
