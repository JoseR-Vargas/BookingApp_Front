// ===== CONFIGURACIÓN GLOBAL =====
const CONFIG = window.APP_CONFIG || {
  BUSINESS_HOURS: {
    start: 9,
    end: 20,
    interval: 60,
    lunchBreak: {
      start: 13,
      end: 14,
    },
  },
  CANCELLATION_HOURS: 5,
  TOAST_DURATION: 3000,
};

const BACKEND_URL = window.APP_CONFIG?.BACKEND_URL || "http://localhost:3000";

// ===== PROFESIONALES DISPONIBLES =====
const PROFESSIONALS = [
  {
    id: "alex-garcia",
    name: "Alex García",
    specialty: "Especialista",
    experience: "8 años",
    rating: 4.9,
    avatar: "fas fa-user-tie",
    available: true,
  },
  {
    id: "maria-lopez",
    name: "María López",
    specialty: "Consultora",
    experience: "6 años",
    rating: 4.8,
    avatar: "fas fa-user",
    available: true,
  },
];

// ===== SERVICIOS DISPONIBLES =====

const SERVICES = [
  {
    id: "consulta-inicial",
    name: "Consulta Inicial",
    description: "Sesión introductoria para evaluar tus necesidades",
    price: 500,
    duration: 30,
    professionals: ["alex-garcia", "maria-lopez"],
    icon: "fas fa-clipboard-list",
  },
  {
    id: "servicio-basico",
    name: "Servicio Básico",
    description: "Atención estándar completa con seguimiento profesional",
    price: 1200,
    duration: 60,
    professionals: ["alex-garcia", "maria-lopez"],
    icon: "fas fa-star",
  },
  {
    id: "servicio-premium",
    name: "Servicio Premium",
    description: "Experiencia premium con atención prioritaria y resultados garantizados",
    price: 2500,
    duration: 90,
    professionals: ["alex-garcia", "maria-lopez"],
    icon: "fas fa-gem",
  },
  {
    id: "sesion-expres",
    name: "Sesión Exprés",
    description: "Atención rápida y efectiva para ajustarse a tu agenda",
    price: 700,
    duration: 20,
    professionals: ["alex-garcia", "maria-lopez"],
    icon: "fas fa-bolt",
  },
];

// ===== ESTADO GLOBAL =====
let currentStep = 1;
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let selectedProfessional = null;

// Agregar variable para controlar estado de envío
let isSubmitting = false;

// Flag para controlar que los event listeners solo se registren una vez
let eventListenersRegistered = false;

// ===== APLICACIÓN PRINCIPAL =====
const bookingApp = {
  // Inicializar la aplicación
  init() {
    this.loadServices();
    this.setupEventListeners();
    this.setupDateValidation();
  },

  // Cargar servicios en la página principal
  loadServices() {
    const container = document.getElementById("serviciosContainer");
    if (!container) return;

    const servicesHTML = SERVICES.map(
      (service) => `
            <div class="col-lg-4 col-md-6">
                <div class="service-card p-4 text-center h-100">
                    <div class="service-icon">
                        <i class="${service.icon}"></i>
                    </div>
                    <h5>${service.name}</h5>
                    <p class="text-muted">${service.description}</p>
                    <div class="price">$${service.price.toLocaleString()}</div>
                    <div class="duration">
                        <i class="fas fa-clock me-1"></i>${
                          service.duration
                        } minutos
                    </div>
                    <div class="mt-3">
                        <small class="text-muted">Profesional: ${service.professionals
                          .map(
                            (profId) =>
                              PROFESSIONALS.find((p) => p.id === profId)?.name
                          )
                          .join(", ")}</small>
                    </div>
                </div>
            </div>
        `
    ).join("");

    container.innerHTML = servicesHTML;
  },

  // Configurar event listeners
  setupEventListeners() {
    // Prevenir múltiples registros de event listeners
    if (eventListenersRegistered) {
      return;
    }
    
    // Botones de navegación del modal
    const btnNext = document.getElementById("btnNext");
    const btnBack = document.getElementById("btnBack");

    if (btnNext) {
      // Usar una sola función para manejar el click
      btnNext.addEventListener("click", (e) => {
        // Prevenir múltiples clics
        if (btnNext.disabled || isSubmitting) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        this.nextStep();
      }, { once: false });
    }

    if (btnBack) {
      btnBack.addEventListener("click", () => this.previousStep());
    }
    
    eventListenersRegistered = true;

    // Event listener para selección de fecha
    const dateInput = document.getElementById("appointmentDate");
    if (dateInput) {
      dateInput.addEventListener("change", (e) =>
        this.onDateChange(e.target.value)
      );
    }

    // Event listener para selección de hora
    const timeSelect = document.getElementById("appointmentTime");
    if (timeSelect) {
      timeSelect.addEventListener("change", (e) =>
        this.onTimeChange(e.target.value)
      );
    }
  },

  // Configurar validación de fechas
  setupDateValidation() {
    const dateInput = document.getElementById("appointmentDate");
    if (dateInput) {
      const today = new Date();
      // Permitir reservas desde hoy mismo
      dateInput.min = today.toISOString().split("T")[0];
    }
  },

  // Abrir modal de reserva
  openModal() {
    // Limpia cualquier backdrop antes de abrir
    document.querySelectorAll(".modal-backdrop").forEach((e) => e.remove());
    this.resetState();
    this.loadServicesInModal();
    this.updateStep();

    const modal = document.getElementById("bookingModal");
    if (modal && typeof bootstrap !== "undefined") {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
      // Refuerzo: limpia overlays después de mostrar el modal
      setTimeout(() => {
        document.querySelectorAll(".modal-backdrop").forEach((e) => {
          e.remove();
        });
      }, 200);
    }
  },

  // Cargar servicios en el modal
  loadServicesInModal() {
    const container = document.getElementById("serviciosModal");
    if (!container) return;

    const servicesHTML = SERVICES.map(
      (service) => `
            <div class="col-md-6">
                <div class="service-selection-card" 
                     data-service-id="${service.id}" 
                     data-service-name="${service.name}" 
                     data-service-price="${service.price}"
                     data-service-duration="${service.duration}"
                     data-service-professionals="${service.professionals.join(
                       ","
                     )}">
                    <i class="${service.icon}"></i>
                    <h5>${service.name}</h5>
                    <p>${service.description}</p>
                    <div class="price">$${service.price.toLocaleString()}</div>
                    <div class="duration">
                        <i class="fas fa-clock me-1"></i>${
                          service.duration
                        } minutos
                    </div>
                    <small class="text-muted">Profesionales: ${service.professionals
                      .map(
                        (profId) =>
                          PROFESSIONALS.find((p) => p.id === profId)?.name
                      )
                      .join(", ")}</small>
                </div>
            </div>
        `
    ).join("");

    container.innerHTML = servicesHTML;
    this.setupServiceSelection();
  },

  // Configurar selección de servicios
  setupServiceSelection() {
    const cards = document.querySelectorAll(".service-selection-card");
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        // Remover selección anterior
        cards.forEach((c) => c.classList.remove("selected"));

        // Seleccionar nueva tarjeta
        card.classList.add("selected");

        // Guardar servicio seleccionado
        selectedService = {
          id: card.dataset.serviceId,
          name: card.dataset.serviceName,
          price: parseInt(card.dataset.servicePrice),
          duration: parseInt(card.dataset.serviceDuration),
          professionals: card.dataset.serviceProfessionals.split(","),
        };

        this.showToast(
          `✅ Servicio seleccionado: ${selectedService.name}`,
          "success"
        );

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

  // Cargar profesionales disponibles para el servicio seleccionado
  loadAvailableProfessionals() {
    const container = document.getElementById("barbersContainer");
    if (!container || !selectedService) return;

    const availableProfessionals = PROFESSIONALS.filter((professional) =>
      selectedService.professionals.includes(professional.id)
    );

    const professionalsHTML = availableProfessionals
      .map(
        (professional) => `
            <div class="col-md-6 col-lg-4">
                <div class="barber-selection-card" 
                     data-professional-id="${professional.id}" 
                     data-professional-name="${professional.name}">
                    <div class="barber-avatar">
                        <i class="${professional.avatar}"></i>
                    </div>
                    <h6 class="barber-name">${professional.name}</h6>
                    <p class="barber-specialty">${professional.specialty}</p>
                    <div class="barber-info">
                        <small class="text-muted">
                            <i class="fas fa-star text-warning"></i> ${professional.rating}
                        </small>
                        <small class="text-muted ms-2">
                            <i class="fas fa-clock"></i> ${professional.experience}
                        </small>
                    </div>
                </div>
            </div>
        `
      )
      .join("");

    container.innerHTML = professionalsHTML;
    this.setupProfessionalSelection();
  },

  // Configurar selección de profesionales
  setupProfessionalSelection() {
    const cards = document.querySelectorAll(".barber-selection-card");
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        // Remover selección anterior
        cards.forEach((c) => c.classList.remove("selected"));

        // Seleccionar nueva tarjeta
        card.classList.add("selected");

        // Guardar profesional seleccionado
        selectedProfessional = {
          id: card.dataset.professionalId,
          name: card.dataset.professionalName,
        };

        // Mostrar toast específico para móviles
        const message = isMobileDevice() ? 
          `✅ ${selectedProfessional.name} seleccionado. Cargando horarios...` :
          `✅ Profesional seleccionado: ${selectedProfessional.name}`;
        
        this.showToast(message, "success");

        // Actualizar horarios disponibles para este profesional
        this.updateAvailableTimesForProfessional();

        this.updateServiceInfo();
      });
    });
  },

  // Cargar horarios disponibles
  loadAvailableTimes(date) {
    const timeSelect = document.getElementById("appointmentTime");
    if (!timeSelect) return;

    // SIMPLIFICAR: Usar la fecha directamente sin conversiones complejas
    const [year, month, day] = date.split("-");
    // Crear fecha en zona horaria local para evitar problemas
    const selectedDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );
    const dayOfWeek = selectedDate.getDay();
    const isSunday = dayOfWeek === 0; // Domingo
    const isSaturday = dayOfWeek === 6; // Sábado

    if (isSunday) {
      timeSelect.innerHTML = '<option value="">Domingo cerrado</option>';
      return;
    }

    // Determinar hora de cierre según el día
    const closingHour = isSaturday ? 18 : CONFIG.BUSINESS_HOURS.end; // Sábados hasta las 18:00

    const times = [];
    for (let hour = CONFIG.BUSINESS_HOURS.start; hour < closingHour; hour++) {
      // Saltar hora de almuerzo
      if (
        hour >= CONFIG.BUSINESS_HOURS.lunchBreak.start &&
        hour < CONFIG.BUSINESS_HOURS.lunchBreak.end
      ) {
        continue;
      }
      const timeString = hour.toString().padStart(2, "0") + ":00";
      times.push(`<option value="${timeString}">${timeString}</option>`);
    }

    timeSelect.innerHTML =
      '<option value="">Selecciona una hora</option>' + times.join("");
  },

  // Verificar disponibilidad antes de permitir la reserva
  async checkBookingAvailability() {
    if (!selectedDate || !selectedTime || !selectedProfessional) {
      return true; // Si no hay datos completos, no verificar
    }

    try {
      const bookings = await bookingAPI.getBookings();

      // Verificar si ya existe una reserva para esta fecha, hora y profesional ESPECÍFICO
      // Solo bloqueamos si el MISMO profesional ya tiene una reserva en ese horario
      const existingBooking = bookings.find(
        (booking) => {
          // Comparar fecha y hora
          const sameDateTime = booking.date === selectedDate && booking.time === selectedTime;
          
          // Comparar que sea el MISMO profesional (importante: diferentes profesionales pueden reservar el mismo horario)
          const sameProfessional = booking.professional && 
                                   booking.professional.id && 
                                   selectedProfessional.id &&
                                   String(booking.professional.id) === String(selectedProfessional.id);
          
          // Solo bloquear si el estado no es "cancelled"
          const isNotCancelled = booking.status && booking.status !== "cancelled";
          
          return sameDateTime && sameProfessional && isNotCancelled;
        }
      );

      if (existingBooking) {
        this.showToast(
          `❌ Lo sentimos, ${selectedProfessional.name} ya tiene una reserva para ${selectedDate} a las ${selectedTime}. Por favor selecciona otra hora o profesional.`,
          "error"
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error verificando disponibilidad:", error);
      // Si hay un error, permitir que el backend haga la validación final
      // El backend también valida correctamente por profesional
      return true;
    }
  },

  // Actualizar horarios disponibles según profesional seleccionado
  async updateAvailableTimesForProfessional(retryCount = 0) {
    if (!selectedDate || !selectedProfessional) return;

    const timeSelect = document.getElementById("appointmentTime");
    if (!timeSelect) return;

    // Detectar dispositivo móvil y conexión lenta para ajustar timeouts
    const isMobile = isMobileDevice();
    const isSlowConn = isSlowConnection();
    const timeout = (isMobile || isSlowConn) ? 15000 : 10000; // Más tiempo para móviles

    // Mostrar indicador de carga más claro
    const loadingText = isMobile ? '📱 Cargando horarios...' : '🔄 Verificando horarios disponibles...';
    timeSelect.innerHTML = `<option value="">${loadingText}</option>`;

    try {
      // Crear timeout específico para esta función
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const bookings = await fetch(`${BACKEND_URL}/api/bookings`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }).then(async response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
      });

      clearTimeout(timeoutId);

      const bookedTimes = bookings
        .filter(
          (booking) =>
            booking.date === selectedDate &&
            booking.professional.id === selectedProfessional.id &&
            booking.status !== "cancelled"
        )
        .map((booking) => booking.time);

      this.renderTimeSlots(bookedTimes);

    } catch (error) {
      console.error('Error loading bookings:', error);
      
      // Retry automático para dispositivos móviles (máximo 2 intentos)
      if (retryCount < 2 && (error.name === 'AbortError' || error.message.includes('Failed to fetch'))) {
        console.log(`Reintentando carga de horarios... Intento ${retryCount + 1}`);
        
        // Mostrar mensaje de reintento específico para móviles
        const retryText = isMobile ? 
          `📱 Reintentando conexión... (${retryCount + 1}/2)` : 
          `🔄 Reintentando... (${retryCount + 1}/2)`;
        timeSelect.innerHTML = `<option value="">${retryText}</option>`;
        
        // Esperar más tiempo en móviles antes de reintentar
        const retryDelay = isMobile ? 2500 : 1500;
        setTimeout(() => {
          this.updateAvailableTimesForProfessional(retryCount + 1);
        }, retryDelay);
        return;
      }

      // Si falló después de los reintentos, mostrar horarios básicos como fallback
      console.log('Usando fallback offline para horarios');
      const fallbackMessage = isMobile ? 
        'No se pueden verificar las reservas. Se muestran todos los horarios. Te recomendamos llamar para confirmar.' :
        'No se pudieron verificar las reservas existentes. Se muestran todos los horarios disponibles. Te recomendamos confirmar por teléfono.';
      
      this.showToast(fallbackMessage, 'warning', 10000);
      
      // Mostrar todos los horarios como disponibles (fallback offline)
      this.renderTimeSlots([]);
    }
  },

  // Nueva función para renderizar horarios (separada para reutilización)
  renderTimeSlots(bookedTimes = []) {
    const timeSelect = document.getElementById("appointmentTime");
    if (!timeSelect || !selectedDate) return;

    const [year, month, day] = selectedDate.split("-");
    const selectedDateObj = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );
    const dayOfWeek = selectedDateObj.getDay();
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;

    if (isSunday) {
      timeSelect.innerHTML = '<option value="">🚫 Domingo cerrado</option>';
      return;
    }

    // Determinar hora de cierre según el día
    const closingHour = isSaturday ? 18 : CONFIG.BUSINESS_HOURS.end;

    const times = [];
    for (let hour = CONFIG.BUSINESS_HOURS.start; hour < closingHour; hour++) {
      // Saltar hora de almuerzo
      if (
        hour >= CONFIG.BUSINESS_HOURS.lunchBreak.start &&
        hour < CONFIG.BUSINESS_HOURS.lunchBreak.end
      ) {
        continue;
      }

      const timeString = hour.toString().padStart(2, "0") + ":00";
      const isBooked = bookedTimes.includes(timeString);

      if (!isBooked) {
        times.push(`<option value="${timeString}">${timeString}</option>`);
      } else {
        times.push(
          `<option value="${timeString}" disabled>${timeString} — Ocupado</option>`
        );
      }
    }

    const availableCount = times.filter(time => !time.includes('disabled')).length;
    const headerText = availableCount > 0 
      ? `Selecciona una hora (${availableCount} disponibles)` 
      : 'No hay horarios disponibles';

    timeSelect.innerHTML =
      `<option value="">${headerText}</option>` + times.join("");
  },

  // Actualizar información del servicio seleccionado
  updateServiceInfo() {
    const container = document.getElementById("selectedServiceInfo");
    if (!container || !selectedService) return;

    // CORREGIR: Usar la fecha directamente sin restar 1 al mes
    const dateText = selectedDate
      ? (() => {
          const [year, month, day] = selectedDate.split("-");
          // Crear la fecha usando UTC para evitar problemas de zona horaria
          const date = new Date(Date.UTC(year, month - 1, day));
          return date.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC", // Usar UTC para evitar problemas de zona horaria
          });
        })()
      : "No seleccionada";

    const professionalText = selectedProfessional
      ? selectedProfessional.name
      : "No seleccionado";

    container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <strong>Servicio:</strong> ${selectedService.name}<br>
                    <strong>Profesional:</strong> ${professionalText}<br>
                    <strong>Precio:</strong> $${selectedService.price.toLocaleString()}
                </div>
                <div class="col-md-6">
                    <strong>Fecha:</strong> ${dateText}<br>
                    <strong>Hora:</strong> ${
                      selectedTime || "No seleccionada"
                    }<br>
                    <strong>Duración:</strong> ${
                      selectedService.duration
                    } minutos
                </div>
            </div>
        `;
  },

  // Avanzar al siguiente paso
  nextStep() {
    // Si estamos en el paso 3 y ya se está enviando, no hacer nada
    if (currentStep === 3 && isSubmitting) {
      return;
    }
    
    if (this.validateCurrentStep()) {
      if (currentStep < 3) {
        currentStep++;
        this.updateStep();
      } else {
        // Deshabilitar botón INMEDIATAMENTE
        const btnNext = document.getElementById("btnNext");
        if (btnNext) {
          btnNext.disabled = true;
          btnNext.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';
        }
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
          this.showToast("Por favor selecciona un servicio", "error");
          return false;
        }
        break;

      case 2:
        if (!selectedDate) {
          this.showToast("Por favor selecciona una fecha", "error");
          return false;
        }
        if (!selectedTime) {
          this.showToast("Por favor selecciona una hora", "error");
          return false;
        }
        if (!selectedProfessional) {
          this.showToast("Por favor selecciona un profesional", "error");
          return false;
        }
        break;

      case 3:
        const form = document.getElementById("clientForm");
        if (form && !form.checkValidity()) {
          form.classList.add("was-validated");
          this.showToast(
            "Por favor completa todos los campos requeridos",
            "error"
          );
          return false;
        }
        break;
    }

    return true;
  },

  // Actualizar la UI del paso actual
  updateStep() {
    // Ocultar todos los pasos
    document.querySelectorAll(".step-content").forEach((step) => {
      step.classList.add("d-none");
    });

    // Mostrar paso actual
    const currentStepElement = document.getElementById(`step${currentStep}`);
    if (currentStepElement) {
      currentStepElement.classList.remove("d-none");
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
    const indicators = document.querySelectorAll(".step-number");
    indicators.forEach((indicator, index) => {
      indicator.classList.remove("active", "completed");

      if (index + 1 < currentStep) {
        indicator.classList.add("completed");
      } else if (index + 1 === currentStep) {
        indicator.classList.add("active");
      }
    });
  },

  // Actualizar botones de navegación
  updateButtons() {
    const btnBack = document.getElementById("btnBack");
    const btnNext = document.getElementById("btnNext");

    if (btnBack) {
      btnBack.style.display = currentStep > 1 ? "inline-block" : "none";
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
  loadStepData() {
    if (currentStep === 2) {
      this.loadAvailableProfessionals();
      this.updateServiceInfo();
    }
  },

  // Enviar reserva al backend
  async submitBooking() {
    // PREVENIR MÚLTIPLES ENVÍOS
    if (isSubmitting) {
      return;
    }

    const formData = this.getFormData();

    if (!formData) {
      this.showToast("Por favor completa todos los campos", "error");
      this.resetSubmitButton();
      return;
    }

    // NUEVA VALIDACIÓN: Verificar disponibilidad antes de enviar
    const isAvailable = await this.checkBookingAvailability();
    if (!isAvailable) {
      this.resetSubmitButton();
      return; // No continuar si no está disponible
    }

    // MARCAR COMO ENVIANDO
    isSubmitting = true;
    this.showLoadingModal("Procesando tu reserva...");

    try {
      // SIMPLIFICAR: Usar la fecha directamente sin conversiones complejas
      const [year, month, day] = selectedDate.split("-");
      const bookingDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );

      // Preparar datos de la reserva
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
        date: selectedDate, // Enviar la fecha original en formato YYYY-MM-DD
        time: selectedTime,
        notes: formData.notes,
        status: "confirmed",
      };

      // Enviar al backend
      const result = await bookingAPI.createBooking(bookingData);

      // Cerrar modal de carga INMEDIATAMENTE después del éxito
      this.hideLoadingModal();

      // Delay para asegurar que el modal de carga se cierre completamente
      await new Promise(resolve => setTimeout(resolve, 150));

      // Formatear la fecha correctamente para evitar problemas de zona horaria
      const [displayYear, displayMonth, displayDay] = bookingData.date.split("-");
      const dateForDisplay = new Date(Date.UTC(displayYear, displayMonth - 1, displayDay));
      const formattedDate = dateForDisplay.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });

      this.showConfirmationModal(bookingData, formattedDate);
    } catch (error) {
      this.hideLoadingModal();
      this.showToast(`Error al procesar la reserva: ${error.message}`, "error", 5000);
      this.resetSubmitButton();
    } finally {
      // RESETEAR ESTADO DE ENVÍO
      isSubmitting = false;
    }
  },

  // Resetear el botón de envío a su estado original
  resetSubmitButton() {
    isSubmitting = false;
    const btnNext = document.getElementById("btnNext");
    if (btnNext && currentStep === 3) {
      btnNext.disabled = false;
      btnNext.innerHTML = '<i class="fas fa-check me-2"></i>Confirmar Reserva';
      btnNext.style.opacity = '1';
      btnNext.style.cursor = 'pointer';
    }
  },

  // Obtener datos del formulario
  getFormData() {
    const form = document.getElementById("clientForm");
    if (!form || !form.checkValidity()) {
      return null;
    }

    const clientId = document.getElementById("clientId").value || '';

    return {
      name: document.getElementById("clientName").value,
      id: clientId,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      notes: document.getElementById("notes").value,
    };
  },

  // Mostrar modal de carga
  showLoadingModal(message = "Procesando...") {
    const modal = document.getElementById("loadingModal");
    const text = document.getElementById("loadingText");

    if (!modal) {
      console.warn("Modal de carga no encontrado en el DOM");
      return;
    }

    if (text) text.textContent = message;

    if (typeof bootstrap !== "undefined") {
      try {
        // Verificar si ya existe una instancia del modal
        let bsModal = bootstrap.Modal.getInstance(modal);
        if (!bsModal) {
          bsModal = new bootstrap.Modal(modal);
        }
        // Verificar que el elemento esté en el DOM antes de mostrarlo
        if (modal.isConnected) {
          bsModal.show();
        }
      } catch (error) {
        console.error("Error al mostrar modal de carga:", error);
        // Fallback: mostrar directamente
        if (modal.isConnected) {
          modal.style.display = "block";
          modal.classList.add("show");
          document.body.classList.add("modal-open");
        }
      }
    }
  },

  // Ocultar modal de carga
  hideLoadingModal() {
    const modal = document.getElementById("loadingModal");
    
    // Remover backdrops primero (siempre, incluso si el modal no existe)
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => backdrop.remove());
    
    // Limpiar clases del body
    document.body.classList.remove("modal-open");
    document.body.style.paddingRight = "";
    document.body.style.overflow = "";

    if (!modal || !modal.isConnected) {
      return;
    }

    try {
      // Intentar con Bootstrap primero si está disponible
      if (typeof bootstrap !== "undefined") {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
          // Forzar cierre inmediato sin animación
          bsModal.hide();
          // También dispose para limpiar completamente
          setTimeout(() => {
            try {
              bsModal.dispose();
            } catch (e) {
              // Ignorar errores en dispose
            }
          }, 150);
        }
      }
    } catch (error) {
      // Si falla Bootstrap, continuar con método manual
      console.warn("Error al cerrar modal con Bootstrap, usando método manual:", error);
    }

    // Forzar cierre del modal de manera agresiva
    modal.style.display = "none";
    modal.classList.remove("show", "fade");
    modal.setAttribute("aria-hidden", "true");
    modal.removeAttribute("aria-modal");
    modal.removeAttribute("role");
    
    // Asegurar que no queden estilos inline que bloqueen el cierre
    setTimeout(() => {
      if (modal) {
        modal.style.display = "none";
      }
    }, 50);
  },

  // Cerrar modal de reserva
  closeModal() {
    const modal = document.getElementById("bookingModal");
    if (modal) {
      // Intentar con Bootstrap 5
      if (typeof bootstrap !== "undefined") {
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
      modal.style.display = "none";
      modal.classList.remove("show");
      document.body.classList.remove("modal-open");

      // Remover backdrop
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) {
        backdrop.remove();
      }

      // Remover padding del body
      document.body.style.paddingRight = "";
    }
  },

  // Mostrar modal de confirmación con los detalles de la reserva
  showConfirmationModal(bookingData, formattedDate) {
    document.getElementById("conf-service-name").textContent = bookingData.service.name;
    document.getElementById("conf-professional").textContent = bookingData.professional.name;
    document.getElementById("conf-date").textContent = formattedDate;
    document.getElementById("conf-time").textContent = bookingData.time;
    document.getElementById("conf-price").textContent = "$" + bookingData.service.price.toLocaleString();
    document.getElementById("conf-client-email").textContent = bookingData.client.email;

    const bookingModalEl = document.getElementById("bookingModal");
    const confirmationModalEl = document.getElementById("confirmationModal");

    const showConfirmation = () => {
      // Diferir hasta que todos los handlers de hidden.bs.modal hayan corrido
      setTimeout(() => {
        new bootstrap.Modal(confirmationModalEl).show();
        this.resetSubmitButton();
      }, 0);
    };

    const bsBooking = bootstrap.Modal.getInstance(bookingModalEl);
    if (bsBooking) {
      bookingModalEl.addEventListener("hidden.bs.modal", showConfirmation, { once: true });
      bsBooking.hide();
    } else {
      document.querySelectorAll(".modal-backdrop").forEach((e) => e.remove());
      document.body.classList.remove("modal-open");
      document.body.style.paddingRight = "";
      new bootstrap.Modal(confirmationModalEl).show();
      this.resetSubmitButton();
    }
  },

  // Resetear estado
  resetState() {
    currentStep = 1;
    selectedService = null;
    selectedDate = null;
    selectedTime = null;
    selectedProfessional = null;
    isSubmitting = false;

    // Limpiar formulario
    const form = document.getElementById("clientForm");
    if (form) {
      form.reset();
      form.classList.remove("was-validated");
    }
  },

  // Mostrar notificación toast
  showToast(message, type = "info", duration = null) {
    const dur = duration || CONFIG.TOAST_DURATION || 4000;

    let container = document.getElementById("lux-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "lux-toast-container";
      document.body.appendChild(container);
    }

    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-times-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    };

    const toast = document.createElement("div");
    toast.className = `lux-toast lux-toast--${type}`;
    toast.innerHTML = `
      <i class="lux-toast__icon ${icons[type] || icons.info}"></i>
      <div class="lux-toast__body">
        <span class="lux-toast__msg"></span>
      </div>
      <button class="lux-toast__close" aria-label="Cerrar">
        <i class="fas fa-times"></i>
      </button>
      <div class="lux-toast__progress" style="animation-duration:${dur}ms"></div>
    `;
    toast.querySelector(".lux-toast__msg").textContent = message;

    const dismiss = () => {
      if (toast.classList.contains("toast-exit")) return;
      toast.classList.add("toast-exit");
      toast.addEventListener("animationend", () => toast.remove(), { once: true });
    };

    toast.querySelector(".lux-toast__close").addEventListener("click", dismiss);
    container.appendChild(toast);
    setTimeout(dismiss, dur);
  },
};

// Limpia cualquier backdrop de Bootstrap al cerrar cualquier modal
if (typeof bootstrap !== "undefined") {
  document.addEventListener("hidden.bs.modal", function () {
    document.querySelectorAll(".modal-backdrop").forEach((e) => e.remove());
  });
}

// ===== FUNCIONES DE FETCH PARA BACKEND =====
const bookingAPI = {
  // Crear nueva reserva con timeout
  async createBooking(bookingData) {
    try {
      // Crear un AbortController para manejar timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

      const response = await fetch(`${BACKEND_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Error del servidor: ${response.status}`;
        try {
          // Leer el cuerpo de la respuesta como texto primero
          const responseText = await response.text();
          
          // Intentar parsear como JSON
          try {
            const errorData = JSON.parse(responseText);
            // NestJS devuelve errores en formato { statusCode, message }
            if (errorData.message) {
              errorMessage = typeof errorData.message === 'string' 
                ? errorData.message 
                : JSON.stringify(errorData.message);
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (jsonError) {
            // Si no es JSON válido, usar el texto directamente
            if (responseText) {
              errorMessage = responseText;
            }
          }
        } catch (parseError) {
          // Si todo falla, usar el mensaje por defecto
          console.error('Error al parsear respuesta de error:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado tiempo. Por favor verifica tu conexión e intenta nuevamente.');
      }
      throw error;
    }
  },

  // Obtener todas las reservas con timeout mejorado
  async getBookings(timeout = 8000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${BACKEND_URL}/api/bookings`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const bookings = await response.json();
      return bookings;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout: La conexión tardó demasiado tiempo');
      }
      throw error;
    }
  },
};

// ===== FUNCIONES DE UTILIDAD =====

// Detectar dispositivo móvil y problemas de conectividad
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

// Validar que se puede cancelar (5 horas antes)
function canCancelBooking(bookingDateTime) {
  const now = new Date();
  const bookingTime = new Date(bookingDateTime);
  const hoursDifference = (bookingTime - now) / (1000 * 60 * 60);

  return hoursDifference >= CONFIG.CANCELLATION_HOURS;
}

// Formatear precio
function formatPrice(price) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
  }).format(price);
}

// Formatear fecha
function formatDate(date) {
  return new Date(date).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", function () {
  bookingApp.init();
  // Event delegation para todos los botones de reserva
  document.querySelectorAll('[data-action="open-modal"]').forEach((btn) => {
    btn.addEventListener("click", () => bookingApp.openModal());
  });
});

// ===== EXPORTAR PARA USO EXTERNO =====
window.bookingApp = bookingApp;
window.bookingAPI = bookingAPI;
