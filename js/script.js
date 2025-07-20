
// ===== CONFIGURACIÓN GLOBAL =====
const CONFIG = {
    BUSINESS_HOURS: {
        start: 9,
        end: 17,
        interval: 60 // minutos
    },
    CANCELLATION_HOURS: 5,
    TOAST_DURATION: 3000
};

// ===== BARBEROS DISPONIBLES =====
const BARBERS = [
    {
        id: 'carlos-rodriguez',
        name: 'Carlos Rodríguez',
        specialty: 'Cortes modernos y barbas',
        experience: '8 años',
        rating: 4.9,
        avatar: 'fas fa-user-tie',
        available: true
    },
    {
        id: 'miguel-silva',
        name: 'Miguel Silva',
        specialty: 'Cortes clásicos y diseño',
        experience: '5 años',
        rating: 4.8,
        avatar: 'fas fa-user-tie',
        available: true
    },
    {
        id: 'alejandro-martinez',
        name: 'Alejandro Martínez',
        specialty: 'Cortes de moda y coloración',
        experience: '6 años',
        rating: 4.7,
        avatar: 'fas fa-user-tie',
        available: true
    }
];

// ===== SERVICIOS DISPONIBLES =====
const SERVICES = [
    {
        id: 'corte-cabello',
        name: 'Corte de Cabello',
        description: 'Corte profesional adaptado a tu estilo personal',
        price: 450,
        duration: 45,
        barbers: ['carlos-rodriguez', 'miguel-silva', 'alejandro-martinez'],
        icon: 'fas fa-cut'
    },
    {
        id: 'barba',
        name: 'Arreglo de Barba',
        description: 'Diseño y arreglo completo de barba',
        price: 250,
        duration: 30,
        barbers: ['carlos-rodriguez', 'miguel-silva', 'alejandro-martinez'], // Agregar Alejandro
        icon: 'fas fa-user-tie'
    },
    {
        id: 'corte-barba',
        name: 'Corte + Barba',
        description: 'Corte de cabello y arreglo de barba completo',
        price: 650,
        duration: 60,
        barbers: ['carlos-rodriguez', 'miguel-silva', 'alejandro-martinez'], // Agregar Alejandro
        icon: 'fas fa-cut'
    }
];

// ===== ESTADO GLOBAL =====
let currentStep = 1;
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let selectedBarber = null;

// ===== APLICACIÓN PRINCIPAL =====
const bookingApp = {
    // Inicializar la aplicación
    init() {
        this.loadServices();
        this.setupEventListeners();
        this.setupDateValidation();
        console.log('✅ Barbería Premium inicializada');
    },

    // Cargar servicios en la página principal
    loadServices() {
        const container = document.getElementById('serviciosContainer');
        if (!container) return;

        const servicesHTML = SERVICES.map(service => `
            <div class="col-lg-4 col-md-6">
                <div class="service-card p-4 text-center h-100">
                    <div class="service-icon">
                        <i class="${service.icon}"></i>
                    </div>
                    <h5>${service.name}</h5>
                    <p class="text-muted">${service.description}</p>
                    <div class="price">$${service.price.toLocaleString()}</div>
                    <div class="duration">
                        <i class="fas fa-clock me-1"></i>${service.duration} minutos
                    </div>
                    <div class="mt-3">
                        <small class="text-muted">Barbero: ${service.barbers.map(barberId => BARBERS.find(b => b.id === barberId)?.name).join(', ')}</small>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = servicesHTML;
    },

    // Configurar event listeners
    setupEventListeners() {
        // Botones de navegación del modal
        const btnNext = document.getElementById('btnNext');
        const btnBack = document.getElementById('btnBack');

        if (btnNext) {
            btnNext.addEventListener('click', () => this.nextStep());
        }

        if (btnBack) {
            btnBack.addEventListener('click', () => this.previousStep());
        }

        // Event listener para selección de fecha
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            dateInput.addEventListener('change', (e) => this.onDateChange(e.target.value));
        }

        // Event listener para selección de hora
        const timeSelect = document.getElementById('appointmentTime');
        if (timeSelect) {
            timeSelect.addEventListener('change', (e) => this.onTimeChange(e.target.value));
        }
    },

    // Configurar validación de fechas
    setupDateValidation() {
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.min = tomorrow.toISOString().split('T')[0];
        }
    },

    // Abrir modal de reserva
    openModal() {
        // Limpia cualquier backdrop antes de abrir
        document.querySelectorAll('.modal-backdrop').forEach(e => e.remove());
        console.log('🟢 bookingApp.openModal() fue llamado desde el botón Reservar');
        this.resetState();
        this.loadServicesInModal();
        this.updateStep();
        
        const modal = document.getElementById('bookingModal');
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            // Refuerzo: limpia overlays después de mostrar el modal
            setTimeout(() => {
                document.querySelectorAll('.modal-backdrop').forEach(e => {
                    e.remove();
                    console.log('🧹 Overlay .modal-backdrop eliminado tras abrir el modal');
                });
            }, 200);
        }
    },

    // Cargar servicios en el modal
    loadServicesInModal() {
        const container = document.getElementById('serviciosModal');
        if (!container) return;

        const servicesHTML = SERVICES.map(service => `
            <div class="col-md-6">
                <div class="service-selection-card" 
                     data-service-id="${service.id}" 
                     data-service-name="${service.name}" 
                     data-service-price="${service.price}"
                     data-service-duration="${service.duration}"
                     data-service-barbers="${service.barbers.join(',')}">
                    <i class="${service.icon}"></i>
                    <h5>${service.name}</h5>
                    <p>${service.description}</p>
                    <div class="price">$${service.price.toLocaleString()}</div>
                    <div class="duration">
                        <i class="fas fa-clock me-1"></i>${service.duration} minutos
                    </div>
                    <small class="text-muted">Barberos: ${service.barbers.map(barberId => BARBERS.find(b => b.id === barberId)?.name).join(', ')}</small>
                </div>
            </div>
        `).join('');

        container.innerHTML = servicesHTML;
        this.setupServiceSelection();
    },

    // Configurar selección de servicios
    setupServiceSelection() {
        const cards = document.querySelectorAll('.service-selection-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                // Remover selección anterior
                cards.forEach(c => c.classList.remove('selected'));
                
                // Seleccionar nueva tarjeta
                card.classList.add('selected');
                
                // Guardar servicio seleccionado
                selectedService = {
                    id: card.dataset.serviceId,
                    name: card.dataset.serviceName,
                    price: parseInt(card.dataset.servicePrice),
                    duration: parseInt(card.dataset.serviceDuration),
                    barbers: card.dataset.serviceBarbers.split(',')
                };

                this.showToast(`✅ Servicio seleccionado: ${selectedService.name}`, 'success');
                
                // Avanzar automáticamente después de 1 segundo
                setTimeout(() => this.nextStep(), 1000);
            });
        });
    },

    // Manejar cambio de fecha
    onDateChange(date) {
        selectedDate = date;
        this.loadAvailableTimes(date);
        this.updateServiceInfo();
    },

    // Manejar cambio de hora
    onTimeChange(time) {
        selectedTime = time;
        this.updateServiceInfo();
    },

    // Cargar barberos disponibles para el servicio seleccionado
    loadAvailableBarbers() {
        const container = document.getElementById('barbersContainer');
        if (!container || !selectedService) return;

        const availableBarbers = BARBERS.filter(barber => 
            selectedService.barbers.includes(barber.id)
        );

        const barbersHTML = availableBarbers.map(barber => `
            <div class="col-md-6 col-lg-4">
                <div class="barber-selection-card" 
                     data-barber-id="${barber.id}" 
                     data-barber-name="${barber.name}">
                    <div class="barber-avatar">
                        <i class="${barber.avatar}"></i>
                    </div>
                    <h6 class="barber-name">${barber.name}</h6>
                    <p class="barber-specialty">${barber.specialty}</p>
                    <div class="barber-info">
                        <small class="text-muted">
                            <i class="fas fa-star text-warning"></i> ${barber.rating}
                        </small>
                        <small class="text-muted ms-2">
                            <i class="fas fa-clock"></i> ${barber.experience}
                        </small>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = barbersHTML;
        this.setupBarberSelection();
    },

    // Configurar selección de barberos
    setupBarberSelection() {
        const cards = document.querySelectorAll('.barber-selection-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                // Remover selección anterior
                cards.forEach(c => c.classList.remove('selected'));
                
                // Seleccionar nueva tarjeta
                card.classList.add('selected');
                
                // Guardar barbero seleccionado
                selectedBarber = {
                    id: card.dataset.barberId,
                    name: card.dataset.barberName
                };

                this.showToast(`✅ Barbero seleccionado: ${selectedBarber.name}`, 'success');
                
                // NUEVO: Actualizar horarios disponibles para este barbero
                this.updateAvailableTimesForBarber();
                
                this.updateServiceInfo();
            });
        });
    },

    // Cargar horarios disponibles
    loadAvailableTimes(date) {
        const timeSelect = document.getElementById('appointmentTime');
        if (!timeSelect) return;

        // SIMPLIFICAR: Usar la fecha directamente sin conversiones complejas
        const [year, month, day] = date.split('-');
        // Crear fecha en zona horaria local para evitar problemas
        const selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const isWeekend = selectedDate.getDay() === 0; // Domingo
        
        console.log(` Fecha seleccionada: ${date}, Día de la semana: ${selectedDate.getDay()}, Es domingo: ${isWeekend}`);
        console.log(`📅 Fecha creada: ${selectedDate.toDateString()}`);
        
        if (isWeekend) {
            timeSelect.innerHTML = '<option value="">Domingo cerrado</option>';
            return;
        }

        const times = [];
        for (let hour = CONFIG.BUSINESS_HOURS.start; hour < CONFIG.BUSINESS_HOURS.end; hour++) {
            const timeString = hour.toString().padStart(2, '0') + ':00';
            times.push(`<option value="${timeString}">${timeString}</option>`);
        }

        timeSelect.innerHTML = '<option value="">Selecciona una hora</option>' + times.join('');
    },

    // NUEVA FUNCIÓN: Verificar disponibilidad antes de permitir la reserva
    async checkBookingAvailability() {
        if (!selectedDate || !selectedTime || !selectedBarber) {
            return true; // Si no hay datos completos, no verificar
        }

        try {
            const isAvailable = await bookingAPI.checkAvailability(selectedDate, selectedTime, selectedBarber.id);
            
            if (!isAvailable) {
                this.showToast(`❌ Lo sentimos, ${selectedBarber.name} ya tiene una reserva para ${selectedDate} a las ${selectedTime}. Por favor selecciona otra hora o barbero.`, 'error');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error verificando disponibilidad:', error);
            this.showToast('Error verificando disponibilidad. Por favor intenta de nuevo.', 'error');
            return false;
        }
    },

    // NUEVA FUNCIÓN: Actualizar horarios disponibles según barbero seleccionado
    async updateAvailableTimesForBarber() {
        if (!selectedDate || !selectedBarber) return;

        const timeSelect = document.getElementById('appointmentTime');
        if (!timeSelect) return;

        // Mostrar loading
        timeSelect.innerHTML = '<option value="">Verificando disponibilidad...</option>';

        try {
            // Obtener todas las reservas para la fecha y barbero
            const bookings = await bookingAPI.getBookings();
            const bookedTimes = bookings
                .filter(booking => 
                    booking.date === selectedDate && 
                    booking.barber.id === selectedBarber.id &&
                    booking.status !== 'cancelled'
                )
                .map(booking => booking.time);

            console.log('📅 Horas reservadas para este barbero:', bookedTimes);

            // Generar todas las horas disponibles
            const [year, month, day] = selectedDate.split('-');
            const selectedDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const isWeekend = selectedDateObj.getDay() === 0;

            if (isWeekend) {
                timeSelect.innerHTML = '<option value="">Domingo cerrado</option>';
                return;
            }

            const times = [];
            for (let hour = CONFIG.BUSINESS_HOURS.start; hour < CONFIG.BUSINESS_HOURS.end; hour++) {
                const timeString = hour.toString().padStart(2, '0') + ':00';
                
                // Verificar si la hora está disponible
                const isAvailable = !bookedTimes.includes(timeString);
                
                if (isAvailable) {
                    times.push(`<option value="${timeString}">${timeString}</option>`);
                } else {
                    times.push(`<option value="${timeString}" disabled>${timeString} - Ocupado</option>`);
                }
            }

            timeSelect.innerHTML = '<option value="">Selecciona una hora</option>' + times.join('');
            
        } catch (error) {
            console.error('❌ Error actualizando horarios:', error);
            timeSelect.innerHTML = '<option value="">Error cargando horarios</option>';
        }
    },

    // Actualizar información del servicio seleccionado
    updateServiceInfo() {
        const container = document.getElementById('selectedServiceInfo');
        if (!container || !selectedService) return;

        // CORREGIR: Usar la fecha directamente sin restar 1 al mes
        const dateText = selectedDate ? (() => {
            const [year, month, day] = selectedDate.split('-');
            // Crear la fecha usando UTC para evitar problemas de zona horaria
            const date = new Date(Date.UTC(year, month - 1, day));
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC' // Usar UTC para evitar problemas de zona horaria
            });
        })() : 'No seleccionada';

        const barberText = selectedBarber ? selectedBarber.name : 'No seleccionado';

        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <strong>Servicio:</strong> ${selectedService.name}<br>
                    <strong>Barbero:</strong> ${barberText}<br>
                    <strong>Precio:</strong> $${selectedService.price.toLocaleString()}
                </div>
                <div class="col-md-6">
                    <strong>Fecha:</strong> ${dateText}<br>
                    <strong>Hora:</strong> ${selectedTime || 'No seleccionada'}<br>
                    <strong>Duración:</strong> ${selectedService.duration} minutos
                </div>
            </div>
        `;
    },

    // Avanzar al siguiente paso
    nextStep() {
        if (this.validateCurrentStep()) {
            if (currentStep < 3) {
                currentStep++;
                this.updateStep();
            } else {
                this.submitBooking();
            }
        }
    },

    // Retroceder al paso anterior
    previousStep() {
        if (currentStep > 1) {
            currentStep--;
            this.updateStep();
        }
    },

    // Validar el paso actual
    validateCurrentStep() {
        switch (currentStep) {
            case 1:
                if (!selectedService) {
                    this.showToast('Por favor selecciona un servicio', 'error');
                    return false;
                }
                break;
                
            case 2:
                if (!selectedDate) {
                    this.showToast('Por favor selecciona una fecha', 'error');
                    return false;
                }
                if (!selectedTime) {
                    this.showToast('Por favor selecciona una hora', 'error');
                    return false;
                }
                if (!selectedBarber) {
                    this.showToast('Por favor selecciona un barbero', 'error');
                    return false;
                }
                break;
                
            case 3:
                const form = document.getElementById('clientForm');
                if (form && !form.checkValidity()) {
                    form.classList.add('was-validated');
                    this.showToast('Por favor completa todos los campos requeridos', 'error');
                    return false;
                }
                break;
        }
        
        return true;
    },

    // Actualizar la UI del paso actual
    updateStep() {
        // Ocultar todos los pasos
        document.querySelectorAll('.step-content').forEach(step => {
            step.classList.add('d-none');
        });

        // Mostrar paso actual
        const currentStepElement = document.getElementById(`step${currentStep}`);
        if (currentStepElement) {
            currentStepElement.classList.remove('d-none');
        }

        // Actualizar indicadores
        this.updateStepIndicators();
        
        // Actualizar botones
        this.updateButtons();
        
        // Cargar datos según el paso
        this.loadStepData();
    },

    // Actualizar indicadores de pasos
    updateStepIndicators() {
        const indicators = document.querySelectorAll('.step-number');
        indicators.forEach((indicator, index) => {
            indicator.classList.remove('active', 'completed');
            
            if (index + 1 < currentStep) {
                indicator.classList.add('completed');
            } else if (index + 1 === currentStep) {
                indicator.classList.add('active');
            }
        });
    },

    // Actualizar botones de navegación
    updateButtons() {
        const btnBack = document.getElementById('btnBack');
        const btnNext = document.getElementById('btnNext');

        if (btnBack) {
            btnBack.style.display = currentStep > 1 ? 'inline-block' : 'none';
        }

        if (btnNext) {
            if (currentStep === 3) {
                btnNext.innerHTML = '<i class="fas fa-check me-2"></i>Confirmar Reserva';
            } else {
                btnNext.innerHTML = 'Siguiente <i class="fas fa-arrow-right ms-2"></i>';
            }
        }
    },

    // Cargar datos según el paso
    loadStepData() {
        if (currentStep === 2) {
            this.loadAvailableBarbers();
            this.updateServiceInfo();
        }
    },

    // Enviar reserva al backend
    async submitBooking() {
        const formData = this.getFormData();
        
        if (!formData) {
            this.showToast('Por favor completa todos los campos', 'error');
            return;
        }

        // NUEVA VALIDACIÓN: Verificar disponibilidad antes de enviar
        const isAvailable = await this.checkBookingAvailability();
        if (!isAvailable) {
            return; // No continuar si no está disponible
        }

        this.showLoadingModal('Procesando tu reserva...');
        
        try {
            // SIMPLIFICAR: Usar la fecha directamente sin conversiones complejas
            const [year, month, day] = selectedDate.split('-');
            const bookingDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            
            // Preparar datos de la reserva
            const bookingData = {
                client: {
                    name: formData.name,
                    id: formData.id,
                    email: formData.email,
                    phone: formData.phone
                },
                service: {
                    id: selectedService.id,
                    name: selectedService.name,
                    price: selectedService.price,
                    duration: selectedService.duration
                },
                barber: {
                    id: selectedBarber.id,
                    name: selectedBarber.name
                },
                date: selectedDate, // Enviar la fecha original en formato YYYY-MM-DD
                time: selectedTime,
                notes: formData.notes,
                status: 'confirmed'
            };

            console.log('📅 Fecha original seleccionada:', selectedDate);
            console.log(' Fecha procesada:', bookingDate.toDateString());
            console.log('📅 Fecha que se enviará al backend:', selectedDate);

            // Enviar al backend
            const result = await bookingAPI.createBooking(bookingData);
            
            this.hideLoadingModal();
            this.showToast('✅ ¡Reserva confirmada! Te enviaremos un email con los detalles.', 'success');
            this.closeModal();
            
            console.log(' Reserva enviada al backend:', bookingData);
            console.log('✅ Respuesta del backend:', result);
            
        } catch (error) {
            this.hideLoadingModal();
            console.error('❌ Error enviando reserva:', error);
            this.showToast(`Error al procesar la reserva: ${error.message}`, 'error');
        }
    },

    // Obtener datos del formulario
    getFormData() {
        const form = document.getElementById('clientForm');
        if (!form || !form.checkValidity()) {
            return null;
        }

        return {
            name: document.getElementById('clientName').value,
            id: document.getElementById('clientId').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            notes: document.getElementById('notes').value
        };
    },

    // Mostrar modal de carga
    showLoadingModal(message = 'Procesando...') {
        const modal = document.getElementById('loadingModal');
        const text = document.getElementById('loadingText');
        
        if (text) text.textContent = message;
        
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    },

    // Ocultar modal de carga
    hideLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            // Forzar cierre del modal
            modal.style.display = 'none';
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            modal.removeAttribute('aria-modal');
            modal.removeAttribute('role');
            
            // Remover clases del body
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = '';
            document.body.style.overflow = '';
            
            // Remover backdrop
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            
            // Intentar con Bootstrap si está disponible
            if (typeof bootstrap !== 'undefined') {
                try {
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    if (bsModal) {
                        bsModal.dispose();
                    }
                } catch (error) {
                    console.log('Modal ya cerrado');
                }
            }
            
            console.log('✅ Modal de carga cerrado');
        }
    },

    // Cerrar modal de reserva
    closeModal() {
        const modal = document.getElementById('bookingModal');
        if (modal) {
            // Intentar con Bootstrap 5
            if (typeof bootstrap !== 'undefined') {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                } else {
                    // Si no hay instancia, crear una nueva y ocultarla
                    const newModal = new bootstrap.Modal(modal);
                    newModal.hide();
                }
            }
            
            // Fallback: ocultar directamente
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            
            // Remover backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            
            // Remover padding del body
            document.body.style.paddingRight = '';
        }
    },

    // Resetear estado
    resetState() {
        currentStep = 1;
        selectedService = null;
        selectedDate = null;
        selectedTime = null;
        selectedBarber = null;
        
        // Limpiar formulario
        const form = document.getElementById('clientForm');
        if (form) {
            form.reset();
            form.classList.remove('was-validated');
        }
    },

    // Mostrar notificación toast
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
                duration: CONFIG.TOAST_DURATION,
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

// Limpia cualquier backdrop de Bootstrap al cerrar cualquier modal
if (typeof bootstrap !== 'undefined') {
  document.addEventListener('hidden.bs.modal', function () {
    document.querySelectorAll('.modal-backdrop').forEach(e => e.remove());
  });
}

// ===== CONFIGURACIÓN DEL BACKEND (LOCAL Y PRODUCCIÓN) =====
const BACKEND_URL = (() => {
    // Detectar si estamos en producción (Netlify) o desarrollo local
    const isProduction = window.location.hostname === 'booking-app-d3v.netlify.app';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    console.log(' Hostname actual:', window.location.hostname);
    console.log('🏭 Es producción:', isProduction);
    console.log(' Es localhost:', isLocalhost);
    
    if (isProduction) {
        return 'https://bookingapp-back-iul0.onrender.com';
    } else if (isLocalhost) {
        return 'http://localhost:3000';
    } else {
        // Fallback para otros dominios
        return 'https://bookingapp-back-iul0.onrender.com';
    }
})();

console.log('🚀 URL del backend configurada:', BACKEND_URL);

// ===== FUNCIONES DE FETCH PARA BACKEND =====
const bookingAPI = {
    // Crear nueva reserva
    async createBooking(bookingData) {
        try {
            console.log('📤 Enviando reserva al backend:', bookingData);
            console.log(' URL del backend:', BACKEND_URL);
            
            const response = await fetch(`${BACKEND_URL}/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Reserva creada exitosamente:', result);
            return result;
        } catch (error) {
            console.error('❌ Error creando reserva:', error);
            throw error;
        }
    },

    // Obtener todas las reservas
    async getBookings() {
        try {
            console.log('📥 Obteniendo reservas del backend...');
            console.log(' URL del backend:', BACKEND_URL);
            
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

    // NUEVA FUNCIÓN: Verificar disponibilidad
    async checkAvailability(date, time, barberId) {
        try {
            console.log(' Verificando disponibilidad...');
            console.log(' Fecha:', date);
            console.log(' Hora:', time);
            console.log(' Barbero:', barberId);
            
            const response = await fetch(`${BACKEND_URL}/api/bookings/availability?date=${date}&time=${time}&barberId=${barberId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Resultado de disponibilidad:', result);
            return result.available;
        } catch (error) {
            console.error('❌ Error verificando disponibilidad:', error);
            // En caso de error, asumir que no está disponible por seguridad
            return false;
        }
    }
};

// ===== FUNCIONES DE UTILIDAD =====

// Validar que se puede cancelar (5 horas antes)
function canCancelBooking(bookingDateTime) {
    const now = new Date();
    const bookingTime = new Date(bookingDateTime);
    const hoursDifference = (bookingTime - now) / (1000 * 60 * 60);
    
    return hoursDifference >= CONFIG.CANCELLATION_HOURS;
}

// Formatear precio
function formatPrice(price) {
    return new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: 'UYU'
    }).format(price);
}

// Formatear fecha
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    bookingApp.init();
    // Event delegation para todos los botones de reserva
    document.querySelectorAll('[data-action="open-modal"]').forEach(btn => {
        btn.addEventListener('click', () => bookingApp.openModal());
    });
});

// ===== EXPORTAR PARA USO EXTERNO =====
window.bookingApp = bookingApp;
window.bookingAPI = bookingAPI;
