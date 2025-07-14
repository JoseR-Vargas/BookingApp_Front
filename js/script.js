/**
 * Barbería Premium - Sistema de Reserva de Citas
 * Principios: DRY, SOLID, YAGNI
 * Autor: JRVN Dev
 */

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

// ===== SERVICIOS DISPONIBLES =====
const SERVICES = [
    {
        id: 'corte-cabello',
        name: 'Corte de Cabello',
        description: 'Corte profesional adaptado a tu estilo personal',
        price: 450,
        duration: 45,
        barber: 'Carlos Rodríguez',
        icon: 'fas fa-cut'
    },
    {
        id: 'barba',
        name: 'Arreglo de Barba',
        description: 'Diseño y arreglo completo de barba',
        price: 250,
        duration: 30,
        barber: 'Miguel Silva',
        icon: 'fas fa-user-tie'
    },
    {
        id: 'corte-barba',
        name: 'Corte + Barba',
        description: 'Corte de cabello y arreglo de barba completo',
        price: 650,
        duration: 60,
        barber: 'Carlos Rodríguez',
        icon: 'fas fa-cut'
    }
];

// ===== ESTADO GLOBAL =====
let currentStep = 1;
let selectedService = null;
let selectedDate = null;
let selectedTime = null;

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
                        <small class="text-muted">Barbero: ${service.barber}</small>
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
                     data-service-barber="${service.barber}">
                    <i class="${service.icon}"></i>
                    <h5>${service.name}</h5>
                    <p>${service.description}</p>
                    <div class="price">$${service.price.toLocaleString()}</div>
                    <div class="duration">
                        <i class="fas fa-clock me-1"></i>${service.duration} minutos
                    </div>
                    <small class="text-muted">Barbero: ${service.barber}</small>
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
                    barber: card.dataset.serviceBarber
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

    // Cargar horarios disponibles
    loadAvailableTimes(date) {
        const timeSelect = document.getElementById('appointmentTime');
        if (!timeSelect) return;

        const selectedDate = new Date(date);
        const isWeekend = selectedDate.getDay() === 0; // Domingo
        
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

    // Actualizar información del servicio seleccionado
    updateServiceInfo() {
        const container = document.getElementById('selectedServiceInfo');
        if (!container || !selectedService) return;

        const dateText = selectedDate ? new Date(selectedDate).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'No seleccionada';

        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <strong>Servicio:</strong> ${selectedService.name}<br>
                    <strong>Barbero:</strong> ${selectedService.barber}<br>
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
            this.updateServiceInfo();
        }
    },

    // Enviar reserva
    submitBooking() {
        const formData = this.getFormData();
        
        if (!formData) {
            this.showToast('Por favor completa todos los campos', 'error');
            return;
        }

        this.showLoadingModal('Procesando tu reserva...');
        
        // Simular envío al backend
        setTimeout(() => {
            this.hideLoadingModal();
            this.showToast('✅ ¡Reserva confirmada! Te enviaremos un email con los detalles.', 'success');
            this.closeModal();
            
            // Aquí se enviarían los datos al backend
            console.log('📤 Datos de reserva:', {
                service: selectedService,
                date: selectedDate,
                time: selectedTime,
                client: formData
            });
        }, 2000);
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
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
    },

    // Cerrar modal de reserva
    closeModal() {
        const modal = document.getElementById('bookingModal');
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
    },

    // Resetear estado
    resetState() {
        currentStep = 1;
        selectedService = null;
        selectedDate = null;
        selectedTime = null;
        
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
