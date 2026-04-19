// ===== VERIFICACIÓN DE AUTENTICACIÓN =====
(function checkAuth() {
  if (!window.authService || !window.authService.isAuthenticated()) {
    window.location.href = '../login.html';
  }
})();

// ===== ORQUESTADOR DEL PANEL ADMIN =====
// Depende de (cargar antes en el HTML):
//   js/config.js
//   js/core/api-client.js
//   js/services/admin-service.js
//   js/services/auth-service.js
//   js/services/audio-service.js
//   js/services/notification-service.js
//   js/ui/toast.js
//   js/ui/components/booking-table.js

const _adminBackendUrl = window.APP_CONFIG ? window.APP_CONFIG.BACKEND_URL : 'http://localhost:3000';

// ===== APLICACIÓN DE ADMINISTRACIÓN =====
const adminApp = {
  init: async function() {
    this.setupEventListeners();

    window.audioService.init();

    const self = this;
    window.notificationService.init(_adminBackendUrl, async function(booking) {
      window.toast.show('Nueva reserva recibida!', 'success');
      await self.loadDashboard();
      const activeSection = document.querySelector('.content-section.active');
      if (activeSection && activeSection.id === 'bookings') {
        await self.loadBookings();
      }
    });

    await this.loadDashboard();
    await this.loadBookings();
    this.setupCharts();
  },

  setupEventListeners: function() {
    const self = this;

    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', function() { self.toggleSidebar(); });
    }

    document.querySelectorAll('.nav-link').forEach(function(link) {
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
      enableSoundBtn.addEventListener('click', function() {
        window.audioService.activate();
        window.toast.show('Sonido de notificaciones activado', 'success');
      });
    }

    document.addEventListener('click', function activateOnInteraction() {
      window.audioService.activate();
      document.removeEventListener('click', activateOnInteraction);
    }, { once: true });
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
    const targetLink = document.querySelector('[data-section="' + section + '"]');
    if (targetLink) targetLink.classList.add('active');

    document.querySelectorAll('.content-section').forEach(function(sectionEl) {
      sectionEl.classList.remove('active');
    });
    const targetSection = document.getElementById(section);
    if (targetSection) targetSection.classList.add('active');

    const pageTitle = document.getElementById('pageTitle');
    const titles = { dashboard: 'Dashboard', bookings: 'Gestión de Reservas', reports: 'Reportes y Estadísticas' };
    if (pageTitle) pageTitle.textContent = titles[section] || 'Dashboard';
  },

  loadDashboard: async function() {
    try {
      await this.updateStatistics();
      await this.loadRecentBookings();
    } catch (error) {
      window.toast.error('Error cargando datos del dashboard');
    }
  },

  updateStatistics: async function() {
    try {
      const stats = await window.adminService.getStatistics();
      document.getElementById('totalBookings').textContent = stats.totalBookings || 0;
      document.getElementById('totalRevenue').textContent = '$' + ((stats.totalRevenue || 0).toLocaleString());
      document.getElementById('todayBookings').textContent = stats.todayBookings || 0;
    } catch (error) {
      window.toast.error('Error cargando estadísticas');
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
      window.toast.error('Error cargando reservas recientes');
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
    tableBody.innerHTML = bookings.map(function(booking) {
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
  },

  loadBookings: async function() {
    try {
      const bookings = await window.adminService.getBookings();
      this.renderBookingsTable(bookings);
      this.updateFilteredTotalRevenue(bookings);
    } catch (error) {
      window.toast.error('Error cargando reservas');
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
      const filteredBookings = dateFilter
        ? allBookings.filter(function(b) { return b.date === dateFilter; })
        : allBookings;

      this.renderBookingsTable(filteredBookings);
      this.updateFilteredTotalRevenue(filteredBookings);
      window.toast.info('Mostrando ' + filteredBookings.length + ' reserva' + (filteredBookings.length !== 1 ? 's' : ''));
    } catch (error) {
      window.toast.error('Error aplicando filtros');
    }
  },

  clearFilters: async function() {
    document.getElementById('dateFilter').value = '';
    try {
      await this.loadBookings();
      window.toast.info('Filtros limpiados');
    } catch (error) {
      window.toast.error('Error limpiando filtros');
    }
  },

  updateFilteredTotalRevenue: function(bookings) {
    const el = document.getElementById('filteredTotalRevenue');
    if (!el) return;
    const total = bookings
      .filter(function(b) { return b.status === 'confirmed'; })
      .reduce(function(sum, b) { return sum + b.service.price; }, 0);
    el.textContent = '$' + total.toLocaleString();
  },

  setupCharts: async function() {
    try {
      const bookings = await window.adminService.getBookings();
      this.setupBookingsChart(bookings);
      this.setupServicesChart(bookings);
    } catch (error) {
      this.setupBookingsChart([]);
      this.setupServicesChart([]);
    }
  },

  setupBookingsChart: function(bookings) {
    const ctx = document.getElementById('bookingsChart');
    if (!ctx) return;

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    const counts = Array(12).fill(0);

    (bookings || []).forEach(function(booking) {
      const parts = booking.date ? booking.date.split('-') : [];
      if (parts.length === 3 && parseInt(parts[0]) === currentYear) {
        counts[parseInt(parts[1]) - 1]++;
      }
    });

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Reservas ' + currentYear,
          data: counts,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
  },

  setupServicesChart: function(bookings) {
    const ctx = document.getElementById('servicesChart');
    if (!ctx) return;

    const serviceCounts = {};
    (bookings || []).forEach(function(booking) {
      const name = booking.service && booking.service.name;
      if (name) serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });

    const labels = Object.keys(serviceCounts);
    const data = Object.values(serviceCounts);
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Sin datos'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: colors.slice(0, Math.max(labels.length, 1)),
        }],
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
    window.toast.show(message, type || 'info');
  },

  deleteBooking: async function(bookingId, clientName) {
    if (!confirm('¿Estás seguro de que quieres eliminar la reserva de ' + clientName + '?\n\nEsta acción no se puede deshacer.')) return;
    try {
      window.toast.info('Eliminando reserva...');
      await window.adminService.deleteBooking(bookingId);
      await this.loadDashboard();
      await this.loadBookings();
      window.toast.success('Reserva de ' + clientName + ' eliminada exitosamente');
    } catch (error) {
      window.toast.error('Error eliminando reserva: ' + error.message);
    }
  },

  handleNotificationClick: async function() {
    window.notificationService.clearCount();
    this.navigateToSection('bookings');
    await this.loadBookings();
  },
};

// ===== BACKWARDS COMPAT: adminAPI =====
const adminAPI = {
  getBookings:   function() { return window.adminService.getBookings(); },
  getStatistics: function() { return window.adminService.getStatistics(); },
  deleteBooking: function(id) { return window.adminService.deleteBooking(id); },
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
  adminApp.init();

  const adminUser = window.authService.getUser();
  if (adminUser) {
    const adminUserNameEl = document.getElementById('adminUserName');
    if (adminUserNameEl) adminUserNameEl.textContent = adminUser;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        window.authService.logout();
        window.location.href = '../login.html';
      }
    });
  }
});

// ===== EXPORTAR =====
window.adminApp = adminApp;
window.adminAPI = adminAPI;
