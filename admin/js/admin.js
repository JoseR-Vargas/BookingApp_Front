// ===== VERIFICACIÓN DE AUTENTICACIÓN =====
(function checkAuth() {
    const isAdmin = sessionStorage.getItem('isAdmin');
    if (!isAdmin || isAdmin !== 'true') {
        window.location.href = '../login.html';
    }
})();

// ===== CONFIGURACIÓN GLOBAL =====
const ADMIN_CONFIG = window.APP_CONFIG || {
    TOAST_DURATION: 3000,
    ITEMS_PER_PAGE: 10
};

const BACKEND_URL = window.APP_CONFIG?.BACKEND_URL || 'http://localhost:3000';

// ===== FUNCIONES DE FETCH PARA BACKEND =====
const adminAPI = {
    // Obtener todas las reservas
    async getBookings() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/bookings`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const bookings = await response.json();
            return bookings;
        } catch (error) {
            throw error;
        }
    },

    // Obtener estadísticas
    async getStatistics() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/bookings/statistics`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const stats = await response.json();
            return stats;
        } catch (error) {
            throw error;
        }
    },

    // NUEVA FUNCIÓN: Eliminar reserva
    async deleteBooking(bookingId) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            throw error;
        }
    }
};

// ===== APLICACIÓN DE ADMINISTRACIÓN =====
const adminApp = {
    // Variables para el sistema de notificaciones
    lastBookingCount: 0,
    notificationCount: 0,
    isFirstLoad: true,
    socket: null,

    // Inicializar la aplicación
    async init() {
        this.setupEventListeners();
        this.initWebSocket();
        await this.loadDashboard();
        await this.loadBookings();
        this.setupCharts();
    },

    // Configurar event listeners
    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Filtro por fecha
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterBookings());
        }

        // Click en la campana de notificaciones
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => this.handleNotificationClick());
        }
    },

    // Toggle sidebar
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        
        sidebar.classList.toggle('collapsed');
        
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('show');
        }
    },

    // Navegar a sección
    navigateToSection(section) {
        // Actualizar navegación activa
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Mostrar sección correspondiente
        document.querySelectorAll('.content-section').forEach(sectionEl => {
            sectionEl.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        // Actualizar título de página
        const pageTitle = document.getElementById('pageTitle');
        const titles = {
            dashboard: 'Dashboard',
            bookings: 'Gestión de Reservas',
            reports: 'Reportes y Estadísticas'
        };
        pageTitle.textContent = titles[section] || 'Dashboard';
    },

    // Cargar dashboard
    async loadDashboard() {
        try {
            await this.updateStatistics();
            await this.loadRecentBookings();
        } catch (error) {
            this.showToast('Error cargando datos del dashboard', 'error');
        }
    },

    // Actualizar estadísticas
    async updateStatistics() {
        try {
            // Obtener estadísticas del backend
            const stats = await adminAPI.getStatistics();
            
            document.getElementById('totalBookings').textContent = stats.totalBookings || 0;
            document.getElementById('totalRevenue').textContent = `$${(stats.totalRevenue || 0).toLocaleString()}`;
            document.getElementById('todayBookings').textContent = stats.todayBookings || 0;
            
        } catch (error) {
            this.showToast('Error cargando estadísticas', 'error');
        }
    },

    // Cargar reservas recientes
    async loadRecentBookings() {
        try {
            // Obtener reservas del backend
            const bookings = await adminAPI.getBookings();
            const recentBookings = bookings
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5);
            
            this.renderRecentBookingsTable(recentBookings);
            
        } catch (error) {
            this.showToast('Error cargando reservas recientes', 'error');
        }
    },

    // Renderizar tabla de reservas recientes
    renderRecentBookingsTable(bookings) {
        const tableBody = document.getElementById('recentBookingsTable');
        if (!tableBody) return;

        if (bookings.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No hay reservas recientes
                    </td>
                </tr>
            `;
            return;
        }

        const html = bookings.map(booking => {
            // Compatibilidad con formato antiguo (barber) y nuevo (professional)
            const professionalName = booking.professional?.name || booking.barber?.name || 'N/A';
            return `
                <tr>
                    <td>${booking.client.name}</td>
                    <td>${booking.client.phone || 'N/A'}</td>
                    <td>${booking.service.name}</td>
                    <td>${this.formatDate(booking.date)}</td>
                    <td>${professionalName}</td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = html;
    },

    // Cargar reservas
    async loadBookings() {
        try {
            // Obtener reservas del backend
            const bookings = await adminAPI.getBookings();
            this.renderBookingsTable(bookings);
            this.updateFilteredTotalRevenue(bookings);
            
        } catch (error) {
            this.showToast('Error cargando reservas', 'error');
        }
    },

    // Renderizar tabla de reservas
    renderBookingsTable(bookings) {
        const tableBody = document.getElementById('bookingsTableBody');
        if (!tableBody) return;

        if (bookings.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        No hay reservas registradas
                    </td>
                </tr>
            `;
            return;
        }

        const html = bookings.map(booking => {
            // Compatibilidad con formato antiguo (barber) y nuevo (professional)
            const professionalName = booking.professional?.name || booking.barber?.name || 'N/A';
            return `
                <tr>
                    <td>#${booking._id.slice(-6)}</td>
                    <td>
                        <div>
                            <strong>${booking.client.name}</strong><br>
                            <small class="text-muted">${booking.client.email}</small>
                        </div>
                    </td>
                    <td>
                        <strong>${booking.client.phone || 'N/A'}</strong>
                    </td>
                    <td>
                        <div>
                            <strong>${booking.service.name}</strong><br>
                            <small class="text-muted">$${booking.service.price}</small>
                        </div>
                    </td>
                    <td>${this.formatDate(booking.date)}</td>
                    <td>${booking.time}</td>
                    <td>${professionalName}</td>
                    <td>
                        ${booking.notes ? 
                            `<div class="notes-cell" title="${booking.notes}">
                                <span class="notes-text">${booking.notes}</span>
                            </div>` : 
                            '<span class="text-muted">Sin notas</span>'
                        }
                    </td>
                    <td>
                        <button class="btn btn-danger btn-sm" 
                                onclick="adminApp.deleteBooking('${booking._id}', '${booking.client.name}')"
                                title="Eliminar reserva">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = html;
    },

    // Filtrar reservas
    async filterBookings() {
        const dateFilter = document.getElementById('dateFilter').value;

        try {
            // Obtener todas las reservas del backend
            const allBookings = await adminAPI.getBookings();
            
            // Aplicar filtro por fecha
            let filteredBookings = allBookings;

            if (dateFilter) {
                filteredBookings = filteredBookings.filter(booking => 
                    booking.date === dateFilter
                );
            }

            // Renderizar tabla con reservas filtradas
            this.renderBookingsTable(filteredBookings);
            this.updateFilteredTotalRevenue(filteredBookings);
            
            // Mostrar mensaje de resultados
            const resultsMessage = `Mostrando ${filteredBookings.length} reserva${filteredBookings.length !== 1 ? 's' : ''}`;
            this.showToast(resultsMessage, 'info');
            
        } catch (error) {
            this.showToast('Error aplicando filtros', 'error');
        }
    },

    // Limpiar filtros
    async clearFilters() {
        document.getElementById('dateFilter').value = '';
        
        try {
            // Recargar todas las reservas
            await this.loadBookings();
            this.showToast('Filtros limpiados', 'info');
        } catch (error) {
            this.showToast('Error limpiando filtros', 'error');
        }
    },

    // Eliminar función populateBarberFilter ya que no se necesita
    // populateBarberFilter(bookings) {
    //     // Esta función ya no se necesita
    // },

    // Actualizar total de ingresos filtrados
    updateFilteredTotalRevenue(bookings) {
        const totalRevenueElement = document.getElementById('filteredTotalRevenue');
        if (!totalRevenueElement) return;

        // Calcular total solo de reservas confirmadas
        const totalRevenue = bookings
            .filter(booking => booking.status === 'confirmed')
            .reduce((sum, booking) => sum + booking.service.price, 0);
            
        totalRevenueElement.textContent = `$${totalRevenue.toLocaleString()}`;
    },

    // Configurar gráficos
    setupCharts() {
        this.setupBookingsChart();
        this.setupServicesChart();
    },

    // Configurar gráfico de reservas
    setupBookingsChart() {
        const ctx = document.getElementById('bookingsChart');
        if (!ctx) return;

        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const bookingsData = [12, 19, 15, 25, 22, 30];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Reservas',
                    data: bookingsData,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    // Configurar gráfico de servicios
    setupServicesChart() {
        const ctx = document.getElementById('servicesChart');
        if (!ctx) return;

        const services = ['Corte', 'Barba', 'Corte+Barba'];
        const data = [45, 25, 30];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: services,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#007bff',
                        '#28a745',
                        '#ffc107'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    // Utilidades
    formatDate(dateString) {
        // CORREGIR: Crear la fecha correctamente para evitar problemas de zona horaria
        const [year, month, day] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        return date.toLocaleDateString('es-ES', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    showToast(message, type = 'info') {
        if (typeof Toastify !== 'undefined') {
            const colors = {
                success: '#28a745',
                error: '#dc3545',
                warning: '#ffc107',
                info: '#17a2b8'
            };
            
            Toastify({
                text: message,
                duration: ADMIN_CONFIG.TOAST_DURATION,
                gravity: "top",
                position: "right",
                style: {
                    background: colors[type] || colors.info
                },
                stopOnFocus: true
            }).showToast();
        } else {
            alert(message);
        }
    },

    // NUEVA FUNCIÓN: Eliminar reserva
    async deleteBooking(bookingId, clientName) {
        // Confirmar eliminación
        const confirmMessage = `¿Estás seguro de que quieres eliminar la reserva de ${clientName}?\n\nEsta acción no se puede deshacer.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            this.showToast('Eliminando reserva...', 'info');
            
            // Eliminar del backend
            await adminAPI.deleteBooking(bookingId);
            
            // Recargar datos
            await this.loadDashboard();
            await this.loadBookings();
            
            this.showToast(`✅ Reserva de ${clientName} eliminada exitosamente`, 'success');
            
        } catch (error) {
            this.showToast(`Error eliminando reserva: ${error.message}`, 'error');
        }
    },

    // ===== SISTEMA DE NOTIFICACIONES CON WEBSOCKET =====
    
    // Inicializar conexión WebSocket
    initWebSocket() {
        try {
            this.socket = io(BACKEND_URL);

            this.socket.on('connect', () => {
                console.log('WebSocket conectado');
            });

            this.socket.on('disconnect', () => {
                console.log('WebSocket desconectado');
            });

            this.socket.on('newBooking', async (booking) => {
                console.log('Nueva reserva recibida:', booking);
                
                // Incrementar contador de notificaciones
                this.notificationCount++;
                this.updateNotificationBadge();
                
                // Mostrar toast de nueva reserva
                this.showToast('🔔 Nueva reserva recibida!', 'success');
                
                // Actualizar dashboard automáticamente
                await this.loadDashboard();
                
                // Si estamos en la sección de reservas, actualizar la lista
                const activeSection = document.querySelector('.content-section.active');
                if (activeSection && activeSection.id === 'bookings') {
                    await this.loadBookings();
                }
            });

            this.socket.on('connect_error', (error) => {
                console.error('Error de conexión WebSocket:', error);
            });

        } catch (error) {
            console.error('Error inicializando WebSocket:', error);
        }
    },

    // Actualizar el badge de notificaciones
    updateNotificationBadge() {
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

    // Manejar click en la campana
    async handleNotificationClick() {
        // Resetear el contador de notificaciones
        this.notificationCount = 0;
        this.updateNotificationBadge();

        // Navegar a la sección de reservas
        this.navigateToSection('bookings');

        // Recargar las reservas para mostrar las más recientes
        await this.loadBookings();
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    adminApp.init();
    
    // Mostrar nombre de usuario
    const adminUser = sessionStorage.getItem('adminUser');
    if (adminUser) {
        const adminUserNameEl = document.getElementById('adminUserName');
        if (adminUserNameEl) {
            adminUserNameEl.textContent = adminUser;
        }
    }
    
    // Manejar logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                sessionStorage.removeItem('isAdmin');
                sessionStorage.removeItem('adminUser');
                window.location.href = '../login.html';
            }
        });
    }
});

// ===== EXPORTAR PARA USO EXTERNO =====
window.adminApp = adminApp;
window.adminAPI = adminAPI;
