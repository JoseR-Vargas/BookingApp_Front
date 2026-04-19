// ===== SERVICIO DE NOTIFICACIONES =====
// Maneja WebSocket (Socket.IO) y el contador de notificaciones.
// SRP: aísla la comunicación en tiempo real del panel admin.
// Depende de: window.audioService (js/services/audio-service.js)

const notificationService = {
  _count: 0,
  _socket: null,
  _onNewBooking: null,

  init: function(backendUrl, onNewBooking) {
    this._onNewBooking = onNewBooking || null;
    this._initSocket(backendUrl);
  },

  getCount: function() {
    return this._count;
  },

  clearCount: function() {
    this._count = 0;
    this._updateBadge();
  },

  _initSocket: function(backendUrl) {
    const self = this;
    try {
      this._socket = io(backendUrl);

      this._socket.on('connect', function() {});
      this._socket.on('disconnect', function() {});

      this._socket.on('newBooking', async function(booking) {
        self._count++;
        self._updateBadge();
        setTimeout(function() {
          if (window.audioService) window.audioService.playNotification();
        }, 100);
        if (self._onNewBooking) await self._onNewBooking(booking);
      });

      this._socket.on('connect_error', function(error) {
        console.error('Error de conexión WebSocket:', error);
      });
    } catch (error) {
      console.error('Error inicializando WebSocket:', error);
    }
  },

  _updateBadge: function() {
    const badge = document.getElementById('notificationBadge');
    const bell = document.getElementById('notificationBell');
    if (!badge || !bell) return;

    if (this._count > 0) {
      badge.textContent = this._count;
      badge.classList.add('show');
      bell.classList.add('has-notifications');
    } else {
      badge.textContent = '0';
      badge.classList.remove('show');
      bell.classList.remove('has-notifications');
    }
  },
};

window.notificationService = notificationService;
