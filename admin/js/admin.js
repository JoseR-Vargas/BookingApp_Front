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

// ===== SISTEMA DE LOGGING (solo en desarrollo) =====
const IS_DEVELOPMENT = BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1');
const logger = {
    log: IS_DEVELOPMENT ? (...args) => console.log(...args) : () => {},
    warn: IS_DEVELOPMENT ? (...args) => console.warn(...args) : () => {},
    error: (...args) => console.error(...args) // Los errores siempre se muestran
};

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
    audioContext: null,

    // Inicializar la aplicación
    async init() {
        this.setupEventListeners();
        this.initAudioContext();
        this.initWebSocket();
        await this.loadDashboard();
        await this.loadBookings();
        this.setupCharts();
    },

    // Inicializar contexto de audio al primer click del usuario
    initAudioContext() {
        // Intentar inicializar inmediatamente (algunos navegadores lo permiten)
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                logger.log('Contexto de audio inicializado:', this.audioContext.state);
                
                // Verificar si está suspendido y mostrar botón si es necesario
                if (this.audioContext.state === 'suspended') {
                    this.showEnableSoundButton();
                }
            }
        } catch (error) {
            // Si falla, esperar a la interacción del usuario
            logger.log('Esperando interacción del usuario para inicializar audio...');
            this.showEnableSoundButton();
        }
    },

    // Activar contexto de audio (llamado desde interacción del usuario)
    activateAudioContext() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    logger.log('✅ Contexto de audio activado correctamente');
                    this.hideEnableSoundButton();
                    // Reproducir un sonido de prueba para confirmar
                    this.playSound();
                }).catch(err => {
                    logger.warn('No se pudo activar el contexto de audio:', err);
                    this.showEnableSoundButton();
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

    // Habilitar sonido manualmente (botón)
    enableNotificationSound() {
        this.activateAudioContext();
        this.showToast('🔔 Sonido de notificaciones activado', 'success');
    },

    // Mostrar botón para activar sonido
    showEnableSoundButton() {
        const btn = document.getElementById('enableSoundBtn');
        if (btn) {
            btn.classList.remove('enable-sound-btn-hidden');
        }
    },

    // Ocultar botón para activar sonido
    hideEnableSoundButton() {
        const btn = document.getElementById('enableSoundBtn');
        if (btn) {
            btn.classList.add('enable-sound-btn-hidden');
        }
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

        // Botón para activar sonido
        const enableSoundBtn = document.getElementById('enableSoundBtn');
        if (enableSoundBtn) {
            enableSoundBtn.addEventListener('click', () => this.enableNotificationSound());
        }

        // Activar audio al hacer click en cualquier parte (una vez)
        const activateAudio = () => {
            this.activateAudioContext();
            document.removeEventListener('click', activateAudio);
            document.removeEventListener('keydown', activateAudio);
        };
        document.addEventListener('click', activateAudio, { once: true });
        document.addEventListener('keydown', activateAudio, { once: true });
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
                logger.log('WebSocket conectado');
            });

            this.socket.on('disconnect', () => {
                logger.log('WebSocket desconectado');
            });

            this.socket.on('newBooking', async (booking) => {
                logger.log('Nueva reserva recibida:', booking);
                
                // Incrementar contador de notificaciones
                this.notificationCount++;
                this.updateNotificationBadge();
                
                // Reproducir sonido de notificación (con pequeño delay para asegurar contexto)
                setTimeout(() => {
                    this.playNotificationSound();
                }, 100);
                
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
                logger.error('Error de conexión WebSocket:', error);
            });

        } catch (error) {
            logger.error('Error inicializando WebSocket:', error);
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
    },

    // Reproducir sonido de notificación
    playNotificationSound() {
        try {
            // Crear contexto de audio si no existe
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Función auxiliar para reproducir el sonido
            const doPlaySound = () => {
                try {
                    this.playSound();
                } catch (error) {
                    logger.error('Error al reproducir el sonido:', error);
                }
            };

            // Si el contexto está suspendido, intentar reanudarlo
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    logger.log('Contexto de audio reanudado, reproduciendo sonido...');
                    doPlaySound();
                }).catch(err => {
                    logger.warn('No se pudo reanudar el contexto de audio:', err);
                    // Intentar crear un nuevo contexto si falla
                    try {
                        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        doPlaySound();
                    } catch (newErr) {
                        logger.error('Error al crear nuevo contexto de audio:', newErr);
                    }
                });
                return;
            }

            // Si el contexto está activo, reproducir directamente
            if (this.audioContext.state === 'running') {
                doPlaySound();
            } else {
                // Si está en otro estado, intentar reanudar
                this.audioContext.resume().then(() => {
                    doPlaySound();
                }).catch(err => {
                    logger.warn('Error al reanudar contexto:', err);
                });
            }

        } catch (error) {
            logger.error('Error en playNotificationSound:', error);
        }
    },

    // Función auxiliar para reproducir el sonido
    playSound() {
        try {
            // Verificar que el contexto esté activo
            if (!this.audioContext || this.audioContext.state !== 'running') {
                logger.warn('Contexto de audio no está activo, intentando método alternativo...');
                this.playSoundFallback();
                return;
            }

            // Crear un oscilador para generar el sonido
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // Conectar los nodos
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Configurar el sonido (notificación tipo "ding" - más audible)
            const currentTime = this.audioContext.currentTime;
            
            // Crear dos tonos para un sonido más distintivo
            oscillator.frequency.setValueAtTime(880, currentTime); // Frecuencia inicial (LA)
            oscillator.frequency.exponentialRampToValueAtTime(1320, currentTime + 0.15); // Subir (MI)
            oscillator.frequency.exponentialRampToValueAtTime(1100, currentTime + 0.3); // Bajar (DO sostenido)
            
            // Configurar el volumen (gain) - más audible
            gainNode.gain.setValueAtTime(0.4, currentTime); // Volumen inicial
            gainNode.gain.exponentialRampToValueAtTime(0.2, currentTime + 0.2); // Mantener volumen
            gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5); // Desvanecer

            // Tipo de onda (sine es más suave)
            oscillator.type = 'sine';

            // Reproducir el sonido
            oscillator.start(currentTime);
            oscillator.stop(currentTime + 0.9); // Duración de 900ms


        } catch (error) {
            logger.warn('Error al reproducir el sonido con Web Audio API:', error);
            // Intentar método alternativo
            this.playSoundFallback();
        }
    },

    // Método alternativo usando HTML Audio (más compatible)
    playSoundFallback() {
        try {
            // Usar el API de Audio HTML5 como fallback
            // Crear un sonido simple usando data URI con un beep corto
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
            
            // Intentar reanudar el contexto si está suspendido
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
        } catch (error) {
            logger.error('No se pudo reproducir el sonido ni con el método alternativo:', error);
        }
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
