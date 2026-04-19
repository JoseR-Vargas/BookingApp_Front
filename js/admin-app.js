// ===== VERIFICACIÓN DE AUTENTICACIÓN =====
(function checkAuth() {
  const isAdmin = sessionStorage.getItem('isAdmin');
  if (!isAdmin || isAdmin !== 'true') {
    window.location.href = '../login.html';
  }
})();

// ===== ORQUESTADOR DEL PANEL ADMIN =====
// Depende de (cargar antes en el HTML):
//   js/core/api-client.js
//   js/services/admin-service.js
//   js/ui/toast.js
//   js/ui/components/booking-table.js

// ===== CONFIGURACIÓN GLOBAL =====
const ADMIN_CONFIG = window.APP_CONFIG || {
  TOAST_DURATION: 3000,
  ITEMS_PER_PAGE: 10,
};

// ===== SISTEMA DE LOGGING (solo en desarrollo) =====
const _adminBackendUrl = window.APP_CONFIG ? window.APP_CONFIG.BACKEND_URL : 'http://localhost:3000';
const IS_DEVELOPMENT = _adminBackendUrl.includes('localhost') || _adminBackendUrl.includes('127.0.0.1');
const logger = {
  log: IS_DEVELOPMENT ? function() { console.log.apply(console, arguments); } : function() {},
  warn: IS_DEVELOPMENT ? function() { console.warn.apply(console, arguments); } : function() {},
  error: function() { console.error.apply(console, arguments); },
};

// ===== APLICACIÓN DE ADMINISTRACIÓN =====
const adminApp = {
  lastBookingCount: 0,
  notificationCount: 0,
  isFirstLoad: true,
  socket: null,
  audioContext: null,

  init: async function() {
    this.setupEventListeners();
    this.initAudioContext();
    this.initWebSocket();
    await this.loadDashboard();
    await this.loadBookings();
    this.setupCharts();
  },

  initAudioContext: function() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        logger.log('Contexto de audio inicializado:', this.audioContext.state);
        if (this.audioContext.state === 'suspended') {
          this.showEnableSoundButton();
        }
      }
    } catch (error) {
      logger.log('Esperando interacción del usuario para inicializar audio...');
      this.showEnableSoundButton();
    }
  },

  activateAudioContext: function() {
    const self = this;
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(function() {
          logger.log('✅ Contexto de audio activado correctamente');
          self.hideEnableSoundButton();
          self.playSound();
        }).catch(function(err) {
          logger.warn('No se pudo activar el contexto de audio:', err);
          self.showEnableSoundButton();
        });
      } else {
        logger.log('✅ Contexto de audio ya está activo');
        this.hideEnableSoundButton();
      }
    } catch (error) {
      logger.error('Error al activar contexto de audio:', error);
      this.showEnableSoundButton();
    }
  },

  enableNotificationSound: function() {
    this.activateAudioContext();
    this.showToast('🔔 Sonido de notificaciones activado', 'success');
  },

  showEnableSoundButton: function() {
    const btn = document.getElementById('enableSoundBtn');
    if (btn) btn.classList.remove('enable-sound-btn-hidden');
  },

  hideEnableSoundButton: function() {
    const btn = document.getElementById('enableSoundBtn');
    if (btn) btn.classList.add('enable-sound-btn-hidden');
  },

  setupEventListeners: function() {
    const self = this;

    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', function() { self.toggleSidebar(); });
    }

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        self.navigateToSection(link.dataset.section);
      });
    });

    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
      dateFilter.addEventListener('change', function() { self.filterBookings(); });
    }

    const notificationBell = document.getElementById('notificationBell');
    if (notificationBell) {
      notificationBell.addEventListener('click', function() { self.handleNotificationClick(); });
    }

    const enableSoundBtn = document.getElementById('enableSoundBtn');
    if (enableSoundBtn) {
      enableSoundBtn.addEventListener('click', function() { self.enableNotificationSound(); });
    }

    const activateAudio = function() {
      self.activateAudioContext();
      document.removeEventListener('click', activateAudio);
      document.removeEventListener('keydown', activateAudio);
    };
    document.addEventListener('click', activateAudio, { once: true });
    document.addEventListener('keydown', activateAudio, { once: true });
  },

  toggleSidebar: function() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('show');
    }
  },

  navigateToSection: function(section) {
    document.querySelectorAll('.nav-link').forEach(function(link) {
      link.classList.remove('active');
    });
    document.querySelector('[data-section="' + section + '"]').classList.add('active');

    document.querySelectorAll('.content-section').forEach(function(sectionEl) {
      sectionEl.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');

    const pageTitle = document.getElementById('pageTitle');
    const titles = { dashboard: 'Dashboard', bookings: 'Gestión de Reservas', reports: 'Reportes y Estadísticas' };
    pageTitle.textContent = titles[section] || 'Dashboard';
  },

  loadDashboard: async function() {
    try {
      await this.updateStatistics();
      await this.loadRecentBookings();
    } catch (error) {
      this.showToast('Error cargando datos del dashboard', 'error');
    }
  },

  updateStatistics: async function() {
    try {
      const stats = await window.adminService.getStatistics();
      document.getElementById('totalBookings').textContent = stats.totalBookings || 0;
      document.getElementById('totalRevenue').textContent = '$' + ((stats.totalRevenue || 0).toLocaleString());
      document.getElementById('todayBookings').textContent = stats.todayBookings || 0;
    } catch (error) {
      this.showToast('Error cargando estadísticas', 'error');
    }
  },

  loadRecentBookings: async function() {
    try {
      const bookings = await window.adminService.getBookings();
      const recentBookings = bookings
        .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
        .slice(0, 5);
      this.renderRecentBookingsTable(recentBookings);
    } catch (error) {
      this.showToast('Error cargando reservas recientes', 'error');
    }
  },

  renderRecentBookingsTable: function(bookings) {
    const tableBody = document.getElementById('recentBookingsTable');
    if (!tableBody) return;

    if (bookings.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay reservas recientes</td></tr>';
      return;
    }

    const self = this;
    const html = bookings.map(function(booking) {
      const professionalName = (booking.professional && booking.professional.name) ||
        (booking.barber && booking.barber.name) || 'N/A';
      return (
        '<tr>' +
          '<td>' + booking.client.name + '</td>' +
          '<td>' + (booking.client.phone || 'N/A') + '</td>' +
          '<td>' + booking.service.name + '</td>' +
          '<td>' + self.formatDate(booking.date) + '</td>' +
          '<td>' + professionalName + '</td>' +
        '</tr>'
      );
    }).join('');

    tableBody.innerHTML = html;
  },

  loadBookings: async function() {
    try {
      const bookings = await window.adminService.getBookings();
      this.renderBookingsTable(bookings);
      this.updateFilteredTotalRevenue(bookings);
    } catch (error) {
      this.showToast('Error cargando reservas', 'error');
    }
  },

  renderBookingsTable: function(bookings) {
    const tableBody = document.getElementById('bookingsTableBody');
    if (!tableBody) return;

    if (bookings.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No hay reservas registradas</td></tr>';
      return;
    }

    tableBody.innerHTML = bookings.map(function(booking) {
      return window.renderBookingRow(booking);
    }).join('');
  },

  filterBookings: async function() {
    const dateFilter = document.getElementById('dateFilter').value;

    try {
      const allBookings = await window.adminService.getBookings();
      let filteredBookings = allBookings;

      if (dateFilter) {
        filteredBookings = filteredBookings.filter(function(booking) {
          return booking.date === dateFilter;
        });
      }

      this.renderBookingsTable(filteredBookings);
      this.updateFilteredTotalRevenue(filteredBookings);

      const resultsMessage = 'Mostrando ' + filteredBookings.length + ' reserva' + (filteredBookings.length !== 1 ? 's' : '');
      this.showToast(resultsMessage, 'info');
    } catch (error) {
      this.showToast('Error aplicando filtros', 'error');
    }
  },

  clearFilters: async function() {
    document.getElementById('dateFilter').value = '';
    try {
      await this.loadBookings();
      this.showToast('Filtros limpiados', 'info');
    } catch (error) {
      this.showToast('Error limpiando filtros', 'error');
    }
  },

  updateFilteredTotalRevenue: function(bookings) {
    const totalRevenueElement = document.getElementById('filteredTotalRevenue');
    if (!totalRevenueElement) return;

    const totalRevenue = bookings
      .filter(function(booking) { return booking.status === 'confirmed'; })
      .reduce(function(sum, booking) { return sum + booking.service.price; }, 0);

    totalRevenueElement.textContent = '$' + totalRevenue.toLocaleString();
  },

  setupCharts: function() {
    this.setupBookingsChart();
    this.setupServicesChart();
  },

  setupBookingsChart: function() {
    const ctx = document.getElementById('bookingsChart');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{
          label: 'Reservas',
          data: [12, 19, 15, 25, 22, 30],
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  },

  setupServicesChart: function() {
    const ctx = document.getElementById('servicesChart');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Corte', 'Barba', 'Corte+Barba'],
        datasets: [{ data: [45, 25, 30], backgroundColor: ['#007bff', '#28a745', '#ffc107'] }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  },

  formatDate: function(dateString) {
    return window.formatBookingDate(dateString);
  },

  showToast: function(message, type) {
    if (window.toast) {
      window.toast.show(message, type || 'info');
    } else if (typeof Toastify !== 'undefined') {
      const colors = { success: '#28a745', error: '#dc3545', warning: '#ffc107', info: '#17a2b8' };
      Toastify({
        text: message,
        duration: ADMIN_CONFIG.TOAST_DURATION,
        gravity: 'top', position: 'right',
        style: { background: colors[type] || colors.info },
        stopOnFocus: true,
      }).showToast();
    } else {
      alert(message);
    }
  },

  deleteBooking: async function(bookingId, clientName) {
    const confirmMessage = '¿Estás seguro de que quieres eliminar la reserva de ' + clientName + '?\n\nEsta acción no se puede deshacer.';
    if (!confirm(confirmMessage)) return;

    try {
      this.showToast('Eliminando reserva...', 'info');
      await window.adminService.deleteBooking(bookingId);
      await this.loadDashboard();
      await this.loadBookings();
      this.showToast('✅ Reserva de ' + clientName + ' eliminada exitosamente', 'success');
    } catch (error) {
      this.showToast('Error eliminando reserva: ' + error.message, 'error');
    }
  },

  // ===== WEBSOCKET =====
  initWebSocket: function() {
    const self = this;
    try {
      this.socket = io(_adminBackendUrl);

      this.socket.on('connect', function() { logger.log('WebSocket conectado'); });
      this.socket.on('disconnect', function() { logger.log('WebSocket desconectado'); });

      this.socket.on('newBooking', async function(booking) {
        logger.log('Nueva reserva recibida:', booking);
        self.notificationCount++;
        self.updateNotificationBadge();
        setTimeout(function() { self.playNotificationSound(); }, 100);
        self.showToast('🔔 Nueva reserva recibida!', 'success');
        await self.loadDashboard();
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection && activeSection.id === 'bookings') {
          await self.loadBookings();
        }
      });

      this.socket.on('connect_error', function(error) {
        logger.error('Error de conexión WebSocket:', error);
      });
    } catch (error) {
      logger.error('Error inicializando WebSocket:', error);
    }
  },

  updateNotificationBadge: function() {
    const badge = document.getElementById('notificationBadge');
    const bell = document.getElementById('notificationBell');

    if (badge && bell) {
      if (this.notificationCount > 0) {
        badge.textContent = this.notificationCount;
        badge.classList.add('show');
        bell.classList.add('has-notifications');
      } else {
        badge.textContent = '0';
        badge.classList.remove('show');
        bell.classList.remove('has-notifications');
      }
    }
  },

  handleNotificationClick: async function() {
    this.notificationCount = 0;
    this.updateNotificationBadge();
    this.navigateToSection('bookings');
    await this.loadBookings();
  },

  playNotificationSound: function() {
    const self = this;
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      const doPlaySound = function() {
        try { self.playSound(); } catch (error) { logger.error('Error al reproducir el sonido:', error); }
      };

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(function() {
          logger.log('Contexto de audio reanudado, reproduciendo sonido...');
          doPlaySound();
        }).catch(function(err) {
          logger.warn('No se pudo reanudar el contexto de audio:', err);
          try {
            self.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            doPlaySound();
          } catch (newErr) {
            logger.error('Error al crear nuevo contexto de audio:', newErr);
          }
        });
        return;
      }

      if (this.audioContext.state === 'running') {
        doPlaySound();
      } else {
        this.audioContext.resume().then(function() { doPlaySound(); }).catch(function(err) {
          logger.warn('Error al reanudar contexto:', err);
        });
      }
    } catch (error) {
      logger.error('Error en playNotificationSound:', error);
    }
  },

  playSound: function() {
    try {
      if (!this.audioContext || this.audioContext.state !== 'running') {
        logger.warn('Contexto de audio no está activo, intentando método alternativo...');
        this.playSoundFallback();
        return;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;
      oscillator.frequency.setValueAtTime(880, currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1320, currentTime + 0.15);
      oscillator.frequency.exponentialRampToValueAtTime(1100, currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.4, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.2, currentTime + 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);
      oscillator.type = 'sine';
      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.9);
    } catch (error) {
      logger.warn('Error al reproducir el sonido con Web Audio API:', error);
      this.playSoundFallback();
    }
  },

  playSoundFallback: function() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      const currentTime = audioContext.currentTime;
      oscillator.frequency.setValueAtTime(880, currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1320, currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.3, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.4);
      oscillator.type = 'sine';
      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.4);
      if (audioContext.state === 'suspended') audioContext.resume();
    } catch (error) {
      logger.error('No se pudo reproducir el sonido ni con el método alternativo:', error);
    }
  },
};

// ===== BACKWARDS COMPAT: adminAPI =====
const adminAPI = {
  getBookings:    function() { return window.adminService.getBookings(); },
  getStatistics:  function() { return window.adminService.getStatistics(); },
  deleteBooking:  function(id) { return window.adminService.deleteBooking(id); },
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
  adminApp.init();

  const adminUser = sessionStorage.getItem('adminUser');
  if (adminUser) {
    const adminUserNameEl = document.getElementById('adminUserName');
    if (adminUserNameEl) adminUserNameEl.textContent = adminUser;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        sessionStorage.removeItem('isAdmin');
        sessionStorage.removeItem('adminUser');
        window.location.href = '../login.html';
      }
    });
  }
});

// ===== EXPORTAR =====
window.adminApp = adminApp;
window.adminAPI = adminAPI;
