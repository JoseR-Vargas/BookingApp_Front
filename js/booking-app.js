// ===== ORQUESTADOR DEL FLUJO DE RESERVA =====
// Depende de (cargar antes en el HTML):
//   js/core/api-client.js
//   js/services/booking-service.js
//   js/state/booking-state.js
//   js/ui/toast.js
//   js/ui/components/service-card.js
//   js/ui/components/professional-card.js
//   js/ui/components/time-slot.js

// ===== CONFIGURACIÓN =====
const CONFIG = window.APP_CONFIG || {
  BUSINESS_HOURS: {
    start: 9,
    end: 20,
    interval: 60,
    lunchBreak: { start: 13, end: 14 },
  },
  CANCELLATION_HOURS: 5,
  TOAST_DURATION: 3000,
};

// ===== PROFESIONALES DISPONIBLES =====
const PROFESSIONALS = [
  {
    id: 'alex-garcia',
    name: 'Alex García',
    specialty: 'Especialista',
    experience: '8 años',
    rating: 4.9,
    avatar: 'fas fa-user-tie',
    available: true,
  },
  {
    id: 'maria-lopez',
    name: 'María López',
    specialty: 'Consultora',
    experience: '6 años',
    rating: 4.8,
    avatar: 'fas fa-user',
    available: true,
  },
];

// ===== SERVICIOS DISPONIBLES =====
const SERVICES = [
  {
    id: 'consulta-inicial',
    name: 'Consulta Inicial',
    description: 'Sesión introductoria para evaluar tus necesidades',
    price: 500,
    duration: 30,
    professionals: ['alex-garcia', 'maria-lopez'],
    icon: 'fas fa-clipboard-list',
  },
  {
    id: 'servicio-basico',
    name: 'Servicio Básico',
    description: 'Atención estándar completa con seguimiento profesional',
    price: 1200,
    duration: 60,
    professionals: ['alex-garcia', 'maria-lopez'],
    icon: 'fas fa-star',
  },
  {
    id: 'servicio-premium',
    name: 'Servicio Premium',
    description: 'Experiencia premium con atención prioritaria y resultados garantizados',
    price: 2500,
    duration: 90,
    professionals: ['alex-garcia', 'maria-lopez'],
    icon: 'fas fa-gem',
  },
  {
    id: 'sesion-expres',
    name: 'Sesión Exprés',
    description: 'Atención rápida y efectiva para ajustarse a tu agenda',
    price: 700,
    duration: 20,
    professionals: ['alex-garcia', 'maria-lopez'],
    icon: 'fas fa-bolt',
  },
];

// ===== APLICACIÓN PRINCIPAL =====
const bookingApp = {
  // Inicializar la aplicación
  init: function() {
    this.loadServices();
    this.setupEventListeners();
    this.setupDateValidation();
  },

  // Cargar servicios en la página principal
  loadServices: function() {
    const container = document.getElementById('serviciosContainer');
    if (!container) return;
    container.innerHTML = SERVICES.map(function(service) {
      return window.renderServiceCard(service, PROFESSIONALS);
    }).join('');
  },

  // Configurar event listeners
  setupEventListeners: function() {
    if (window.bookingState.get('eventListenersRegistered')) return;

    const self = this;
    const btnNext = document.getElementById('btnNext');
    const btnBack = document.getElementById('btnBack');

    if (btnNext) {
      btnNext.addEventListener('click', function(e) {
        if (btnNext.disabled || window.bookingState.get('isSubmitting')) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        self.nextStep();
      });
    }

    if (btnBack) {
      btnBack.addEventListener('click', function() { self.previousStep(); });
    }

    window.bookingState.set('eventListenersRegistered', true);

    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
      dateInput.addEventListener('change', function(e) { self.onDateChange(e.target.value); });
    }

    const timeSelect = document.getElementById('appointmentTime');
    if (timeSelect) {
      timeSelect.addEventListener('change', function(e) { self.onTimeChange(e.target.value); });
    }
  },

  // Configurar validación de fechas
  setupDateValidation: function() {
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
      const today = new Date();
      dateInput.min = today.toISOString().split('T')[0];
    }
  },

  // Abrir modal de reserva
  openModal: function() {
    document.querySelectorAll('.modal-backdrop').forEach(function(e) { e.remove(); });
    this.resetState();
    this.loadServicesInModal();
    this.updateStep();

    const modal = document.getElementById('bookingModal');
    if (modal && typeof bootstrap !== 'undefined') {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
      setTimeout(function() {
        document.querySelectorAll('.modal-backdrop').forEach(function(e) { e.remove(); });
      }, 200);
    }
  },

  // Cargar servicios en el modal
  loadServicesInModal: function() {
    const container = document.getElementById('serviciosModal');
    if (!container) return;
    container.innerHTML = SERVICES.map(function(service) {
      return window.renderServiceSelectionCard(service, PROFESSIONALS);
    }).join('');
    this.setupServiceSelection();
  },

  // Configurar selección de servicios
  setupServiceSelection: function() {
    const self = this;
    const cards = document.querySelectorAll('.service-selection-card');
    cards.forEach(function(card) {
      card.addEventListener('click', function() {
        cards.forEach(function(c) { c.classList.remove('selected'); });
        card.classList.add('selected');

        window.bookingState.set('selectedService', {
          id: card.dataset.serviceId,
          name: card.dataset.serviceName,
          price: parseInt(card.dataset.servicePrice),
          duration: parseInt(card.dataset.serviceDuration),
          professionals: card.dataset.serviceProfessionals.split(','),
        });

        setTimeout(function() { self.nextStep(); }, 400);
      });
    });
  },

  // Manejar cambio de fecha
  onDateChange: function(date) {
    window.bookingState.set('selectedDate', date);
    this.loadAvailableTimes(date);
    this.updateServiceInfo();
  },

  // Manejar cambio de hora
  onTimeChange: function(time) {
    window.bookingState.set('selectedTime', time);
    this.updateServiceInfo();
  },

  // Cargar profesionales disponibles
  loadAvailableProfessionals: function() {
    const container = document.getElementById('barbersContainer');
    const selectedService = window.bookingState.get('selectedService');
    if (!container || !selectedService) return;

    const self = this;
    const availableProfessionals = PROFESSIONALS.filter(function(professional) {
      return selectedService.professionals.includes(professional.id);
    });

    container.innerHTML = availableProfessionals.map(function(professional) {
      return window.renderProfessionalCard(professional);
    }).join('');
    this.setupProfessionalSelection();
  },

  // Configurar selección de profesionales
  setupProfessionalSelection: function() {
    const self = this;
    const cards = document.querySelectorAll('.barber-selection-card');
    cards.forEach(function(card) {
      card.addEventListener('click', function() {
        cards.forEach(function(c) { c.classList.remove('selected'); });
        card.classList.add('selected');

        window.bookingState.set('selectedProfessional', {
          id: card.dataset.professionalId,
          name: card.dataset.professionalName,
        });

        const selectedProfessional = window.bookingState.get('selectedProfessional');
        self.updateAvailableTimesForProfessional();
        self.updateServiceInfo();
      });
    });
  },

  // Cargar horarios disponibles (solo estructura, sin verificar backend)
  loadAvailableTimes: function(date) {
    const timeSelect = document.getElementById('appointmentTime');
    if (!timeSelect) return;

    const parts = date.split('-');
    const selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayOfWeek = selectedDate.getDay();
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;

    if (isSunday) {
      timeSelect.innerHTML = '<option value="">Domingo cerrado</option>';
      return;
    }

    const closingHour = isSaturday ? 18 : CONFIG.BUSINESS_HOURS.end;
    const times = [];
    for (let hour = CONFIG.BUSINESS_HOURS.start; hour < closingHour; hour++) {
      if (hour >= CONFIG.BUSINESS_HOURS.lunchBreak.start && hour < CONFIG.BUSINESS_HOURS.lunchBreak.end) continue;
      const timeString = hour.toString().padStart(2, '0') + ':00';
      times.push('<option value="' + timeString + '">' + timeString + '</option>');
    }

    timeSelect.innerHTML = '<option value="">Selecciona una hora</option>' + times.join('');
  },

  // Verificar disponibilidad antes de permitir la reserva
  checkBookingAvailability: async function() {
    const selectedDate = window.bookingState.get('selectedDate');
    const selectedTime = window.bookingState.get('selectedTime');
    const selectedProfessional = window.bookingState.get('selectedProfessional');

    if (!selectedDate || !selectedTime || !selectedProfessional) return true;

    try {
      const isAvailable = await window.bookingService.checkAvailability(selectedDate, selectedTime, selectedProfessional.id);
      if (!isAvailable) {
        this.showToast(
          '❌ Lo sentimos, ' + selectedProfessional.name + ' ya tiene una reserva para ' + selectedDate + ' a las ' + selectedTime + '. Por favor selecciona otra hora o profesional.',
          'error'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      return true;
    }
  },

  // Actualizar horarios disponibles según profesional seleccionado
  updateAvailableTimesForProfessional: async function(retryCount) {
    const count = retryCount || 0;
    const selectedDate = window.bookingState.get('selectedDate');
    const selectedProfessional = window.bookingState.get('selectedProfessional');

    if (!selectedDate || !selectedProfessional) return;

    const timeSelect = document.getElementById('appointmentTime');
    if (!timeSelect) return;

    const isMobile = isMobileDevice();
    const isSlowConn = isSlowConnection();
    const timeout = (isMobile || isSlowConn) ? 15000 : 10000;

    const loadingText = isMobile ? 'Cargando horarios...' : 'Verificando horarios disponibles';
    timeSelect.innerHTML = '<option value="">' + loadingText + '</option>';

    const self = this;

    try {
      const bookings = await window.bookingService.getBookings({ timeout: timeout });

      const bookedTimes = bookings
        .filter(function(booking) {
          return (
            booking.date === selectedDate &&
            booking.professional.id === selectedProfessional.id &&
            booking.status !== 'cancelled'
          );
        })
        .map(function(booking) { return booking.time; });

      this.renderTimeSlots(bookedTimes);
    } catch (error) {
      console.error('Error loading bookings:', error);

      if (count < 2 && (error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message.includes('Timeout'))) {
        const retryText = isMobile
          ? '📱 Reintentando conexión... (' + (count + 1) + '/2)'
          : '🔄 Reintentando... (' + (count + 1) + '/2)';
        timeSelect.innerHTML = '<option value="">' + retryText + '</option>';
        const retryDelay = isMobile ? 2500 : 1500;
        setTimeout(function() { self.updateAvailableTimesForProfessional(count + 1); }, retryDelay);
        return;
      }

      const fallbackMessage = isMobile
        ? 'No se pueden verificar las reservas. Se muestran todos los horarios. Te recomendamos llamar para confirmar.'
        : 'No se pudieron verificar las reservas existentes. Se muestran todos los horarios disponibles. Te recomendamos confirmar por teléfono.';

      this.showToast(fallbackMessage, 'warning', 10000);
      this.renderTimeSlots([]);
    }
  },

  // Renderizar slots de tiempo (usa window.renderTimeSlot del componente)
  renderTimeSlots: function(bookedTimes) {
    const bookedList = bookedTimes || [];
    const timeSelect = document.getElementById('appointmentTime');
    if (!timeSelect) return;

    const selectedDate = window.bookingState.get('selectedDate');
    if (!selectedDate) return;

    const parts = selectedDate.split('-');
    const selectedDateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayOfWeek = selectedDateObj.getDay();
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;

    if (isSunday) {
      timeSelect.innerHTML = '<option value="">Domingo cerrado</option>';
      return;
    }

    const closingHour = isSaturday ? 18 : CONFIG.BUSINESS_HOURS.end;
    const timeSlots = [];

    for (let hour = CONFIG.BUSINESS_HOURS.start; hour < closingHour; hour++) {
      if (hour >= CONFIG.BUSINESS_HOURS.lunchBreak.start && hour < CONFIG.BUSINESS_HOURS.lunchBreak.end) continue;
      const timeString = hour.toString().padStart(2, '0') + ':00';
      const isBooked = bookedList.includes(timeString);
      timeSlots.push(window.renderTimeSlot(timeString, isBooked));
    }

    const availableCount = timeSlots.filter(function(t) { return !t.includes('disabled'); }).length;
    const headerText = availableCount > 0
      ? 'Selecciona una hora (' + availableCount + ' disponibles)'
      : 'No hay horarios disponibles';

    timeSelect.innerHTML = '<option value="">' + headerText + '</option>' + timeSlots.join('');
  },

  // Actualizar información del servicio seleccionado
  updateServiceInfo: function() {
    const container = document.getElementById('selectedServiceInfo');
    const selectedService = window.bookingState.get('selectedService');
    const selectedDate = window.bookingState.get('selectedDate');
    const selectedTime = window.bookingState.get('selectedTime');
    const selectedProfessional = window.bookingState.get('selectedProfessional');

    if (!container || !selectedService) return;

    let dateText = 'No seleccionada';
    if (selectedDate) {
      const parts = selectedDate.split('-');
      const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      dateText = date.toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
      });
    }

    const professionalText = selectedProfessional ? selectedProfessional.name : 'No seleccionado';

    container.innerHTML = (
      '<div class="row">' +
        '<div class="col-md-6">' +
          '<strong>Servicio:</strong> ' + selectedService.name + '<br>' +
          '<strong>Profesional:</strong> ' + professionalText + '<br>' +
          '<strong>Precio:</strong> $' + selectedService.price.toLocaleString() +
        '</div>' +
        '<div class="col-md-6">' +
          '<strong>Fecha:</strong> ' + dateText + '<br>' +
          '<strong>Hora:</strong> ' + (selectedTime || 'No seleccionada') + '<br>' +
          '<strong>Duración:</strong> ' + selectedService.duration + ' minutos' +
        '</div>' +
      '</div>'
    );
  },

  // Avanzar al siguiente paso
  nextStep: function() {
    const currentStep = window.bookingState.get('currentStep');
    if (currentStep === 3 && window.bookingState.get('isSubmitting')) return;

    if (this.validateCurrentStep()) {
      if (currentStep < 3) {
        window.bookingState.set('currentStep', currentStep + 1);
        this.updateStep();
      } else {
        const btnNext = document.getElementById('btnNext');
        if (btnNext) {
          btnNext.disabled = true;
          btnNext.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';
        }
        this.submitBooking();
      }
    }
  },

  // Retroceder al paso anterior
  previousStep: function() {
    const currentStep = window.bookingState.get('currentStep');
    if (currentStep > 1) {
      window.bookingState.set('currentStep', currentStep - 1);
      this.updateStep();
    }
  },

  // Validar el paso actual
  validateCurrentStep: function() {
    const currentStep = window.bookingState.get('currentStep');
    switch (currentStep) {
      case 1:
        if (!window.bookingState.get('selectedService')) {
          this.showToast('Por favor selecciona un servicio', 'error');
          return false;
        }
        break;
      case 2:
        if (!window.bookingState.get('selectedDate')) {
          this.showToast('Por favor selecciona una fecha', 'error');
          return false;
        }
        if (!window.bookingState.get('selectedTime')) {
          this.showToast('Por favor selecciona una hora', 'error');
          return false;
        }
        if (!window.bookingState.get('selectedProfessional')) {
          this.showToast('Por favor selecciona un profesional', 'error');
          return false;
        }
        break;
      case 3: {
        const form = document.getElementById('clientForm');
        if (form && !form.checkValidity()) {
          form.classList.add('was-validated');
          this.showToast('Por favor completa todos los campos requeridos', 'error');
          return false;
        }
        break;
      }
    }
    return true;
  },

  // Actualizar la UI del paso actual
  updateStep: function() {
    document.querySelectorAll('.step-content').forEach(function(step) {
      step.classList.add('d-none');
    });
    const currentStep = window.bookingState.get('currentStep');
    const currentStepElement = document.getElementById('step' + currentStep);
    if (currentStepElement) currentStepElement.classList.remove('d-none');

    this.updateButtons();
    this.loadStepData();
  },

  // Actualizar botones de navegación
  updateButtons: function() {
    const currentStep = window.bookingState.get('currentStep');
    const isSubmitting = window.bookingState.get('isSubmitting');
    const btnBack = document.getElementById('btnBack');
    const btnNext = document.getElementById('btnNext');

    if (btnBack) {
      btnBack.style.display = currentStep > 1 ? 'inline-block' : 'none';
    }

    if (btnNext) {
      if (currentStep === 3) {
        if (!isSubmitting) {
          btnNext.innerHTML = '<i class="fas fa-check me-2"></i>Confirmar Reserva';
          btnNext.disabled = false;
          btnNext.style.opacity = '1';
          btnNext.style.cursor = 'pointer';
        } else {
          btnNext.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';
          btnNext.disabled = true;
          btnNext.style.opacity = '0.6';
          btnNext.style.cursor = 'not-allowed';
        }
      } else {
        btnNext.innerHTML = 'Siguiente <i class="fas fa-arrow-right ms-2"></i>';
        btnNext.disabled = false;
        btnNext.style.opacity = '1';
        btnNext.style.cursor = 'pointer';
      }
    }
  },

  // Cargar datos según el paso
  loadStepData: function() {
    if (window.bookingState.get('currentStep') === 2) {
      this.loadAvailableProfessionals();
      this.updateServiceInfo();
    }
  },

  // Enviar reserva al backend
  submitBooking: async function() {
    if (window.bookingState.get('isSubmitting')) return;

    const formData = this.getFormData();
    if (!formData) {
      this.showToast('Por favor completa todos los campos', 'error');
      this.resetSubmitButton();
      return;
    }

    const isAvailable = await this.checkBookingAvailability();
    if (!isAvailable) {
      this.resetSubmitButton();
      return;
    }

    window.bookingState.set('isSubmitting', true);
    this.showLoadingModal('Procesando tu reserva...');

    try {
      const selectedDate = window.bookingState.get('selectedDate');
      const selectedTime = window.bookingState.get('selectedTime');
      const selectedService = window.bookingState.get('selectedService');
      const selectedProfessional = window.bookingState.get('selectedProfessional');

      const bookingData = {
        client: {
          name: formData.name,
          id: formData.id,
          email: formData.email,
          phone: formData.phone,
        },
        service: {
          id: selectedService.id,
          name: selectedService.name,
          price: selectedService.price,
          duration: selectedService.duration,
        },
        professional: {
          id: selectedProfessional.id,
          name: selectedProfessional.name,
        },
        date: selectedDate,
        time: selectedTime,
        notes: formData.notes,
        status: 'confirmed',
      };

      await window.bookingService.createBooking(bookingData);
      this.hideLoadingModal();

      await new Promise(function(resolve) { setTimeout(resolve, 150); });

      const displayParts = bookingData.date.split('-');
      const dateForDisplay = new Date(Date.UTC(parseInt(displayParts[0]), parseInt(displayParts[1]) - 1, parseInt(displayParts[2])));
      const formattedDate = dateForDisplay.toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
      });

      this.showConfirmationModal(bookingData, formattedDate);
    } catch (error) {
      this.hideLoadingModal();
      this.showToast('Error al procesar la reserva: ' + error.message, 'error', 5000);
      this.resetSubmitButton();
    } finally {
      window.bookingState.set('isSubmitting', false);
    }
  },

  // Resetear el botón de envío
  resetSubmitButton: function() {
    window.bookingState.set('isSubmitting', false);
    const btnNext = document.getElementById('btnNext');
    const currentStep = window.bookingState.get('currentStep');
    if (btnNext && currentStep === 3) {
      btnNext.disabled = false;
      btnNext.innerHTML = '<i class="fas fa-check me-2"></i>Confirmar Reserva';
      btnNext.style.opacity = '1';
      btnNext.style.cursor = 'pointer';
    }
  },

  // Obtener datos del formulario
  getFormData: function() {
    const form = document.getElementById('clientForm');
    if (!form || !form.checkValidity()) return null;

    return {
      name: document.getElementById('clientName').value,
      id: document.getElementById('clientId').value || '',
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      notes: document.getElementById('notes').value,
    };
  },

  // Mostrar modal de carga
  showLoadingModal: function(message) {
    const msg = message || 'Procesando...';
    const modal = document.getElementById('loadingModal');
    const text = document.getElementById('loadingText');

    if (!modal) { console.warn('Modal de carga no encontrado en el DOM'); return; }
    if (text) text.textContent = msg;

    if (typeof bootstrap !== 'undefined') {
      try {
        let bsModal = bootstrap.Modal.getInstance(modal);
        if (!bsModal) bsModal = new bootstrap.Modal(modal);
        if (modal.isConnected) bsModal.show();
      } catch (error) {
        console.error('Error al mostrar modal de carga:', error);
        if (modal.isConnected) {
          modal.style.display = 'block';
          modal.classList.add('show');
          document.body.classList.add('modal-open');
        }
      }
    }
  },

  // Ocultar modal de carga
  hideLoadingModal: function() {
    const modal = document.getElementById('loadingModal');

    document.querySelectorAll('.modal-backdrop').forEach(function(backdrop) { backdrop.remove(); });
    document.body.classList.remove('modal-open');
    document.body.style.paddingRight = '';
    document.body.style.overflow = '';

    if (!modal || !modal.isConnected) return;

    try {
      if (typeof bootstrap !== 'undefined') {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
          setTimeout(function() {
            try { bsModal.dispose(); } catch (e) {}
          }, 150);
        }
      }
    } catch (error) {
      console.warn('Error al cerrar modal con Bootstrap, usando método manual:', error);
    }

    modal.style.display = 'none';
    modal.classList.remove('show', 'fade');
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    modal.removeAttribute('role');

    setTimeout(function() {
      if (modal) modal.style.display = 'none';
    }, 50);
  },

  // Cerrar modal de reserva
  closeModal: function() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
      if (typeof bootstrap !== 'undefined') {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
        } else {
          new bootstrap.Modal(modal).hide();
        }
      }
      modal.style.display = 'none';
      modal.classList.remove('show');
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
      document.body.style.paddingRight = '';
    }
  },

  // Mostrar modal de confirmación
  showConfirmationModal: function(bookingData, formattedDate) {
    document.getElementById('conf-service-name').textContent = bookingData.service.name;
    document.getElementById('conf-professional').textContent = bookingData.professional.name;
    document.getElementById('conf-date').textContent = formattedDate;
    document.getElementById('conf-time').textContent = bookingData.time;
    document.getElementById('conf-price').textContent = '$' + bookingData.service.price.toLocaleString();
    document.getElementById('conf-client-email').textContent = bookingData.client.email;

    const self = this;
    const bookingModalEl = document.getElementById('bookingModal');
    const confirmationModalEl = document.getElementById('confirmationModal');

    const showConfirmation = function() {
      setTimeout(function() {
        new bootstrap.Modal(confirmationModalEl).show();
        self.resetSubmitButton();
      }, 0);
    };

    const bsBooking = bootstrap.Modal.getInstance(bookingModalEl);
    if (bsBooking) {
      bookingModalEl.addEventListener('hidden.bs.modal', showConfirmation, { once: true });
      bsBooking.hide();
    } else {
      document.querySelectorAll('.modal-backdrop').forEach(function(e) { e.remove(); });
      document.body.classList.remove('modal-open');
      document.body.style.paddingRight = '';
      new bootstrap.Modal(confirmationModalEl).show();
      this.resetSubmitButton();
    }
  },

  // Resetear estado
  resetState: function() {
    window.bookingState.reset();
    const form = document.getElementById('clientForm');
    if (form) {
      form.reset();
      form.classList.remove('was-validated');
    }
  },

  // Mostrar notificación toast (mantiene compatibilidad con tests que mockean este método)
  showToast: function(message, type, duration) {
    if (window.toast) {
      window.toast.show(message, type || 'info', duration || null);
    } else if (typeof Toastify !== 'undefined') {
      const colors = { success: '#28a745', error: '#dc3545', warning: '#ffc107', info: '#17a2b8' };
      Toastify({
        text: message,
        duration: duration || CONFIG.TOAST_DURATION,
        gravity: 'top', position: 'right',
        style: { background: colors[type] || colors.info },
        stopOnFocus: true,
      }).showToast();
    } else {
      alert(message);
    }
  },
};

// Limpia backdrops de Bootstrap al cerrar cualquier modal
if (typeof bootstrap !== 'undefined') {
  document.addEventListener('hidden.bs.modal', function() {
    document.querySelectorAll('.modal-backdrop').forEach(function(e) { e.remove(); });
  });
}

// ===== BACKWARDS COMPAT: bookingAPI =====
// Mantiene la interfaz original de bookingAPI para tests y código externo.
const bookingAPI = {
  createBooking: function(bookingData) {
    return window.bookingService.createBooking(bookingData);
  },
  getBookings: function(timeout) {
    return window.bookingService.getBookings({ timeout: timeout });
  },
};

// ===== FUNCIONES DE UTILIDAD =====
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
}

function isSlowConnection() {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  }
  return false;
}

function canCancelBooking(bookingDateTime) {
  const now = new Date();
  const bookingTime = new Date(bookingDateTime);
  const hoursDifference = (bookingTime - now) / (1000 * 60 * 60);
  return hoursDifference >= CONFIG.CANCELLATION_HOURS;
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(price);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
  bookingApp.init();
  document.querySelectorAll('[data-action="open-modal"]').forEach(function(btn) {
    btn.addEventListener('click', function() { bookingApp.openModal(); });
  });
});

// ===== EXPORTAR =====
window.bookingApp = bookingApp;
window.bookingAPI = bookingAPI;
window.SERVICES = SERVICES;
window.PROFESSIONALS = PROFESSIONALS;
window.isMobileDevice = isMobileDevice;
window.isSlowConnection = isSlowConnection;
window.canCancelBooking = canCancelBooking;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
