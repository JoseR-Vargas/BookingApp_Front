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
    id: "cesar-viloria",
    name: "Cesar Viloria",
    specialty: "Barbero",
    experience: "11 años",
    rating: 4.9,
    avatar: "fas fa-user-tie",
    available: true,
  },
  {
    id: "andrea-velasquez",
    name: "Andrea Velasquez",
    specialty: "Especialista en Cejas, Pestañas y Depilación",
    experience: "6 años",
    rating: 5.0,
    avatar: "fas fa-user",
    available: true,
  },
  {
    id: "random",
    name: "Random",
    specialty: "General",
    experience: "5 años",
    rating: 4.9,
    avatar: "fas fa-user-tie",
    available: true,
  },
];

// ===== SERVICIOS DISPONIBLES =====
const SERVICES = [
  {
    id: "corte-cabello",
    name: "Corte comun (Barbería)",
    description: "Corte profesional adaptado a tu estilo personal",
    price: 450,
    duration: 45,
    professionals: ["cesar-viloria", "random"],
    icon: "fas fa-cut",
  },
  {
    id: "barba",
    name: "Arreglo de Barba (Barbería)",
    description: "Diseño y arreglo completo de barba",
    price: 250,
    duration: 30,
    professionals: ["cesar-viloria", "random"],
    icon: "fas fa-user-tie",
  },
  {
    id: "corte-comun-barba",
    name: "Corte común + Barba (Barbería)",
    description: "Corte profesional con arreglo de barba",
    price: 650,
    duration: 45,
    professionals: ["cesar-viloria", "random"],
    icon: "fas fa-cut",
  },
  {
    id: "corte-degrade",
    name: "Corte degrade (Barbería)",
    description: "Corte degrade afeitado rasurado completo",
    price: 500,
    duration: 45,
    professionals: ["cesar-viloria", "random"],
    icon: "fas fa-cut",
  },
  {
    id: "corte-degrade-barba",
    name: "Corte degrade + Barba (Barbería)",
    description: "Corte degradado con arreglo completo de barba",
    price: 700,
    duration: 45,
    professionals: ["cesar-viloria", "random"],
    icon: "fas fa-cut",
  },
  {
    id: "cejas-barberia",
    name: "Cejas (Barbería)",
    description: "Diseño y arreglo de cejas masculinas",
    price: 100,
    duration: 30,
    professionals: ["cesar-viloria", "random"],
    icon: "fas fa-eye",
  },
  {
    id: "mascarilla-facial",
    name: "Mascarilla Facial (Barbería)",
    description: "Tratamiento facial profesional para el cuidado y limpieza de la piel",
    price: 150,
    duration: 30,
    professionals: ["cesar-viloria", "random"],
    icon: "fas fa-spa",
  },
  {
    id: "mechas-corte-barberia",
    name: "Mechas + Corte (Barbería)",
    description: "Mechas o platinado profesional para hombre",
    price: 2000,
    duration: 90,
    professionals: ["cesar-viloria", "random"],
    icon: "fas fa-spray-can",
  },
  {
    id: "platinado-corte-barberia",
    name: "Platinado + Corte (Barbería)",
    description: "Platinado profesional para hombre",
    price: 3000,
    duration: 90,
    professionals: ["cesar-viloria", "random"],
    icon: "fas fa-spray-can",
  },

  {
    id: "cejas",
    name: "Perfilado de Cejas (Estética)",
    description: "Diseño y arreglo profesional de cejas",
    price: 500,
    duration: 50,
    professionals: ["andrea-velasquez"],
    icon: "fas fa-eye",
  },
  {
    id: "pestanas",
    name: "Lifting de Pestañas (Estética)",
    description: "Tratamiento profesional de pestañas",
    price: 1100,
    duration: 50,
    professionals: ["andrea-velasquez"],
    icon: "fas fa-eye-dropper",
  },

  {
    id: "perfilado-henna",
    name: "Perfilado con Henna (Estética)",
    description: "Perfilado de cejas con tinte de henna natural",
    price: 550,
    duration: 50,
    professionals: ["andrea-velasquez"],
    icon: "fas fa-paint-brush",
  },

  {
    id: "laminado-cejas",
    name: "Laminado de Cejas (Estética)",
    description: "Tratamiento de laminado para cejas perfectas",
    price: 850,
    duration: 50,
    professionals: ["andrea-velasquez"],
    icon: "fas fa-magic",
  },
  {
    id: "pestanas-express",
    name: "Pestañas Express (Estética)",
    description: "Tratamiento rápido de pestañas",
    price: 850,
    duration: 45,
    professionals: ["andrea-velasquez"],
    icon: "fas fa-bolt",
  },
  {
    id: "hydrogloss",
    name: "Hydrogloss (Estética)",
    description: "Tratamiento de brillo e hidratación labial",
    price: 1200,
    duration: 50,
    professionals: ["andrea-velasquez"],
    icon: "fas fa-kiss",
  },

  {
    id: "corte-cabello-peluqueria",
    name: "Corte de Cabello (Peluquería)",
    description: "Corte de cabello femenino profesional. Precio sujeto a cambios según largo y abundancia del cabello",
    price: 500,
    duration: 50,
    professionals: ["random"],
    icon: "fas fa-cut",
  },
  {
    id: "secado-cabello",
    name: "Secado de Cabello (Peluquería)",
    description: "Secado y peinado profesional. Precio sujeto a cambios según largo y abundancia del cabello",
    price: 500,
    duration: 50,
    professionals: ["random"],
    icon: "fas fa-wind",
  },
  {
    id: "mechas-gorro-peluqueria",
    name: "Mechas con gorro (Peluquería)",
    description: "Aplicación de mechas para resaltar tu cabello. Precio sujeto a cambios según largo y abundancia del cabello",
    price: 2000,
    duration: 120,
    professionals: ["random"],
    icon: "fas fa-paint-brush",
  },

  {
    id: "mechas-papel-peluqueria",
    name: "Mechas con papel (Peluquería)",
    description: "Aplicación de mechas para resaltar tu cabello. Precio sujeto a cambios según largo y abundancia del cabello",
    price: 3000,
    duration: 120,
    professionals: ["random"],
    icon: "fas fa-paint-brush",
  },

  {
    id: "balayage",
    name: "Balayage (Peluquería)",
    description: "Técnica de coloración degradada natural. Precio sujeto a cambios según largo y abundancia del cabello",
    price: 3000,
    duration: 150,
    professionals: ["random"],
    icon: "fas fa-palette",
  },
  {
    id: "progresivo-alisado",
    name: "Progresivo o Alisado (Peluquería)",
    description: "Tratamiento de alisado permanente. Precio sujeto a cambios según largo y abundancia del cabello",
    price: 1500,
    duration: 180,
    professionals: ["random"],
    icon: "fas fa-grip-lines",
  },
  {
    id: "hidrataciones",
    name: "Hidrataciones (Peluquería)",
    description: "Tratamiento profundo de hidratación capilar. Precio sujeto a cambios según largo y abundancia del cabello",
    price: 500,
    duration: 50,
    professionals: ["random"],
    icon: "fas fa-droplet",
  },
  {
    id: "mascarilla-cabello",
    name: "Mascarilla de Cabello (Peluquería)",
    description: "Tratamiento capilar intensivo con mascarilla. Precio sujeto a cambios según largo y abundancia del cabello",
    price: 800,
    duration: 50,
    professionals: ["random"],
    icon: "fas fa-spa",
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

        this.showToast(
          `✅ Profesional seleccionado: ${selectedProfessional.name}`,
          "success"
        );

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

      // Verificar si ya existe una reserva para esta fecha, hora y profesional
      const existingBooking = bookings.find(
        (booking) =>
          booking.date === selectedDate &&
          booking.time === selectedTime &&
          booking.professional.id === selectedProfessional.id &&
          booking.status === "confirmed"
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
      this.showToast(
        "Error verificando disponibilidad. Por favor intenta de nuevo.",
        "error"
      );
      return false;
    }
  },

  // Actualizar horarios disponibles según profesional seleccionado
  async updateAvailableTimesForProfessional() {
    if (!selectedDate || !selectedProfessional) return;

    const timeSelect = document.getElementById("appointmentTime");
    if (!timeSelect) return;

    timeSelect.innerHTML =
      '<option value="">Verificando disponibilidad...</option>';

    try {
      const bookings = await bookingAPI.getBookings();
      const bookedTimes = bookings
        .filter(
          (booking) =>
            booking.date === selectedDate &&
            booking.professional.id === selectedProfessional.id &&
            booking.status !== "cancelled"
        )
        .map((booking) => booking.time);

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
        const isAvailable = !bookedTimes.includes(timeString);

        if (isAvailable) {
          times.push(`<option value="${timeString}">${timeString}</option>`);
        } else {
          times.push(
            `<option value="${timeString}" disabled>${timeString} - Ocupado</option>`
          );
        }
      }

      timeSelect.innerHTML =
        '<option value="">Selecciona una hora</option>' + times.join("");
    } catch (error) {
      timeSelect.innerHTML =
        '<option value="">Error cargando horarios</option>';
    }
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

      this.hideLoadingModal();
      
      // Formatear la fecha correctamente para evitar problemas de zona horaria
      const [displayYear, displayMonth, displayDay] = bookingData.date.split("-");
      const dateForDisplay = new Date(Date.UTC(displayYear, displayMonth - 1, displayDay));
      const formattedDate = dateForDisplay.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC", // Usar UTC para evitar problemas de zona horaria
      });
      
      // Crear mensaje detallado con los datos de la reserva
      const bookingDetails = `
                ✅ ¡Reserva Confirmada has un ScreenShot a tu Reserva!
                
                📋 Detalles:
                👤 Cliente: ${bookingData.client.name}
                💇 Servicio: ${bookingData.service.name}
                💰 Precio: $${bookingData.service.price.toLocaleString()}
                👨‍💼 Profesional: ${bookingData.professional.name}
                📅 Fecha: ${formattedDate}
                🕐 Hora: ${bookingData.time}
                ⏱️ Duración: ${bookingData.service.duration} minutos
            `;

      // Mostrar toast por 2 minutos (120000 ms)
      this.showToast(bookingDetails, "success", 120000);

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        this.closeModal();
        this.resetSubmitButton();
      }, 2000);
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

    return {
      name: document.getElementById("clientName").value,
      id: document.getElementById("clientId").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      notes: document.getElementById("notes").value,
    };
  },

  // Mostrar modal de carga
  showLoadingModal(message = "Procesando...") {
    const modal = document.getElementById("loadingModal");
    const text = document.getElementById("loadingText");

    if (text) text.textContent = message;

    if (modal && typeof bootstrap !== "undefined") {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  },

  // Ocultar modal de carga
  hideLoadingModal() {
    const modal = document.getElementById("loadingModal");
    if (modal) {
      // Forzar cierre del modal
      modal.style.display = "none";
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      modal.removeAttribute("aria-modal");
      modal.removeAttribute("role");

      // Remover clases del body
      document.body.classList.remove("modal-open");
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";

      // Remover backdrop
      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach((backdrop) => backdrop.remove());

      // Intentar con Bootstrap si está disponible
      if (typeof bootstrap !== "undefined") {
        try {
          const bsModal = bootstrap.Modal.getInstance(modal);
          if (bsModal) {
            bsModal.dispose();
          }
        } catch (error) {
          // Modal ya cerrado
        }
      }
    }
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
    if (typeof Toastify !== "undefined") {
      const colors = {
        success: "#28a745",
        error: "#dc3545",
        warning: "#ffc107",
        info: "#17a2b8",
      };

      Toastify({
        text: message,
        duration: duration || CONFIG.TOAST_DURATION,
        gravity: "top",
        position: "right",
        style: {
          background: colors[type] || colors.info,
        },
        stopOnFocus: true,
      }).showToast();
    } else {
      alert(message);
    }
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
        const errorText = await response.text();
        throw new Error(errorText || `Error del servidor: ${response.status}`);
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
