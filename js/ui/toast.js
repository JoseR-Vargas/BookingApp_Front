// ===== WRAPPER DE TOASTIFY =====
// Centraliza tipos, colores y duración por defecto.
// Elimina la definición de showToast duplicada en bookingApp y adminApp.

const toast = {
  _colors: {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
  },

  show: function(message, type, duration) {
    const t = type || 'info';
    if (typeof Toastify !== 'undefined') {
      Toastify({
        text: message,
        duration: duration || (window.APP_CONFIG && window.APP_CONFIG.TOAST_DURATION) || 3000,
        gravity: 'top',
        position: 'right',
        style: {
          background: this._colors[t] || this._colors.info,
        },
        stopOnFocus: true,
      }).showToast();
    } else {
      alert(message);
    }
  },

  success: function(message, duration) { this.show(message, 'success', duration); },
  error:   function(message, duration) { this.show(message, 'error',   duration); },
  warning: function(message, duration) { this.show(message, 'warning', duration); },
  info:    function(message, duration) { this.show(message, 'info',    duration); },
};

window.toast = toast;
