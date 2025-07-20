// ===== CONFIGURACIÓN GLOBAL =====
const ADMIN_CONFIG = {
    TOAST_DURATION: 3000,
    ITEMS_PER_PAGE: 10
};

// ===== CONFIGURACIÓN DEL BACKEND LOCAL =====
const BACKEND_URL = 'http://localhost:3000';

// ===== FUNCIONES DE FETCH PARA BACKEND LOCAL =====
const adminAPI = {
    // Obtener todas las reservas
    async getBookings() {
        try {
            console.log('📥 Obteniendo reservas del backend...');
            
            const response = await fetch(`${BACKEND_URL}/api/bookings`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const bookings = await response.json();
            console.log('✅ Reservas obtenidas:', bookings);
            return bookings;
        } catch (error) {
            console.error('❌ Error obteniendo reservas:', error);
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
            console.error('❌ Error obteniendo estadísticas:', error);
            throw error;
        }
    }
};

// ===== APLICACIÓN DE ADMINISTRACIÓN =====
const adminApp = {
    // Inicializar la aplicación
    async init() {
        this.setupEventListeners();
        await this.loadDashboard();
        await this.loadBookings();
        this.setupCharts();
        console.log('✅ Dashboard Admin inicializado');
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

        // Filters
        const dateFilter = document.getElementById('dateFilter');
        const barberFilter = document.getElementById('barberFilter');

        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterBookings());
        }
        if (barberFilter) {
            barberFilter.addEventListener('change', () => this.filterBookings());
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
            console.error('❌ Error cargando dashboard:', error);
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
            console.error('❌ Error obteniendo estadísticas:', error);
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
            console.error('❌ Error obteniendo reservas recientes:', error);
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
                    <td colspan="4" class="text-center text-muted">
                        No hay reservas recientes
                    </td>
                </tr>
            `;
            return;
        }

        const html = bookings.map(booking => `
            <tr>
                <td>${booking.client.name}</td>
                <td>${booking.service.name}</td>
                <td>${this.formatDate(booking.date)}</td>
                <td>${booking.barber.name}</td>
            </tr>
        `).join('');

        tableBody.innerHTML = html;
    },

    // Cargar reservas
    async loadBookings() {
        try {
            // Obtener reservas del backend
            const bookings = await adminAPI.getBookings();
            this.renderBookingsTable(bookings);
            this.populateBarberFilter(bookings);
            this.updateFilteredTotalRevenue(bookings);
            
        } catch (error) {
            console.error('❌ Error obteniendo reservas:', error);
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
                    <td colspan="6" class="text-center text-muted">
                        No hay reservas registradas
                    </td>
                </tr>
            `;
            return;
        }

        const html = bookings.map(booking => `
            <tr>
                <td>#${booking._id.slice(-6)}</td>
                <td>
                    <div>
                        <strong>${booking.client.name}</strong><br>
                        <small class="text-muted">${booking.client.email}</small>
                    </div>
                </td>
                <td>
                    <div>
                        <strong>${booking.service.name}</strong><br>
                        <small class="text-muted">$${booking.service.price}</small>
                    </div>
                </td>
                <td>${this.formatDate(booking.date)}</td>
                <td>${booking.time}</td>
                <td>${booking.barber.name}</td>
            </tr>
        `).join('');

        tableBody.innerHTML = html;
    },

    // Filtrar reservas
    filterBookings() {
        const dateFilter = document.getElementById('dateFilter').value;
        const barberFilter = document.getElementById('barberFilter').value;

        // Por ahora, recargar todas las reservas
        // En el futuro se puede implementar filtrado en el backend
        this.loadBookings();
    },

    // Limpiar filtros
    clearFilters() {
        document.getElementById('dateFilter').value = '';
        document.getElementById('barberFilter').value = '';
        this.loadBookings();
    },

    // Poblar filtro de barberos
    populateBarberFilter(bookings) {
        const barberFilter = document.getElementById('barberFilter');
        if (!barberFilter) return;

        const barbers = [...new Set(bookings.map(b => b.barber.id))];
        const barberOptions = barbers.map(barberId => {
            const barber = bookings.find(b => b.barber.id === barberId).barber;
            return `<option value="${barberId}">${barber.name}</option>`;
        }).join('');

        barberFilter.innerHTML = '<option value="">Todos los barberos</option>' + barberOptions;
    },

    // Actualizar total de ingresos filtrados
    updateFilteredTotalRevenue(bookings) {
        const totalRevenueElement = document.getElementById('filteredTotalRevenue');
        if (!totalRevenueElement) return;

        const totalRevenue = bookings.reduce((sum, booking) => sum + booking.service.price, 0);
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

    logout() {
        if (confirm('¿Estás seguro de que quieres salir?')) {
            this.showToast('Sesión cerrada', 'info');
            // Aquí se redirigiría al login
        }
    },

    // Utilidades
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', {
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
                backgroundColor: colors[type] || colors.info,
                stopOnFocus: true
            }).showToast();
        } else {
            alert(message);
        }
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    adminApp.init();
});

// ===== EXPORTAR PARA USO EXTERNO =====
window.adminApp = adminApp;
window.adminAPI = adminAPI;
