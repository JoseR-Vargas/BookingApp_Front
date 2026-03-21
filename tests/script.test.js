const { loadScript, createMockBooking } = require('./helpers');

// Cargar el script bajo test
beforeAll(() => {
  // Crear DOM mínimo necesario para que el script cargue sin errores
  document.body.innerHTML = `
    <div id="serviciosContainer"></div>
    <div id="serviciosModal"></div>
    <div id="barbersContainer"></div>
    <select id="appointmentTime"></select>
    <input id="appointmentDate" type="date" />
    <div id="selectedServiceInfo"></div>
    <div class="step-content" id="step1"></div>
    <div class="step-content d-none" id="step2"></div>
    <div class="step-content d-none" id="step3"></div>
    <div class="step-number"></div>
    <div class="step-number"></div>
    <div class="step-number"></div>
    <button id="btnNext">Siguiente</button>
    <button id="btnBack" style="display:none">Atrás</button>
    <div id="bookingModal"></div>
    <div id="loadingModal"><span id="loadingText"></span></div>
    <form id="clientForm">
      <input id="clientName" required value="Juan Pérez" />
      <input id="clientId" value="12345678" />
      <input id="email" type="email" required value="juan@test.com" />
      <input id="phone" required value="099123456" />
      <textarea id="notes"></textarea>
    </form>
  `;

  loadScript('js/script.js');
});

// =============================================
// GRUPO 1: Funciones utilitarias puras
// =============================================
describe('Funciones utilitarias', () => {
  test('formatPrice formatea precio en UYU', () => {
    const result = formatPrice(450);
    // Debe contener el número 450 en algún formato local
    expect(result).toMatch(/450/);
  });

  test('formatPrice maneja cero', () => {
    const result = formatPrice(0);
    expect(result).toMatch(/0/);
  });

  test('formatDate retorna fecha en español', () => {
    // Usar fecha que no tenga problemas de timezone
    const result = formatDate('2026-06-15T12:00:00');
    expect(result.toLowerCase()).toMatch(/junio|jun/);
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/15/);
  });

  test('canCancelBooking retorna true cuando faltan más de 5 horas', () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 10);
    expect(canCancelBooking(futureDate.toISOString())).toBe(true);
  });

  test('canCancelBooking retorna false cuando faltan menos de 5 horas', () => {
    const soonDate = new Date();
    soonDate.setHours(soonDate.getHours() + 2);
    expect(canCancelBooking(soonDate.toISOString())).toBe(false);
  });

  test('canCancelBooking retorna false cuando la cita ya pasó', () => {
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    expect(canCancelBooking(pastDate.toISOString())).toBe(false);
  });

  test('isMobileDevice detecta desktop con ancho > 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    // navigator.userAgent en jsdom no tiene patrones móviles
    expect(isMobileDevice()).toBe(false);
  });

  test('isSlowConnection retorna false sin navigator.connection', () => {
    // jsdom no tiene navigator.connection por defecto
    expect(isSlowConnection()).toBe(false);
  });
});

// =============================================
// GRUPO 2: Datos de servicios y profesionales
// =============================================
describe('Datos de servicios y profesionales', () => {
  test('SERVICES es un array con servicios activos', () => {
    expect(Array.isArray(SERVICES)).toBe(true);
    expect(SERVICES.length).toBeGreaterThan(5);
  });

  test('cada servicio tiene las propiedades requeridas', () => {
    const requiredKeys = ['id', 'name', 'description', 'price', 'duration', 'professionals', 'icon'];
    SERVICES.forEach(service => {
      requiredKeys.forEach(key => {
        expect(service).toHaveProperty(key);
      });
    });
  });

  test('todos los precios son números positivos', () => {
    SERVICES.forEach(service => {
      expect(typeof service.price).toBe('number');
      expect(service.price).toBeGreaterThan(0);
    });
  });

  test('todas las duraciones son números positivos', () => {
    SERVICES.forEach(service => {
      expect(typeof service.duration).toBe('number');
      expect(service.duration).toBeGreaterThan(0);
    });
  });

  test('PROFESSIONALS tiene 2 profesionales activos', () => {
    expect(PROFESSIONALS).toHaveLength(2);
  });

  test('cada profesional tiene las propiedades requeridas', () => {
    const requiredKeys = ['id', 'name', 'specialty', 'experience', 'rating', 'avatar', 'available'];
    PROFESSIONALS.forEach(prof => {
      requiredKeys.forEach(key => {
        expect(prof).toHaveProperty(key);
      });
    });
  });

  test('cada servicio referencia profesionales válidos', () => {
    const profIds = PROFESSIONALS.map(p => p.id);
    SERVICES.forEach(service => {
      service.professionals.forEach(profId => {
        expect(profIds).toContain(profId);
      });
    });
  });
});

// =============================================
// GRUPO 3: Lógica de negocio — bookingApp
// =============================================
describe('bookingApp — horarios', () => {
  beforeEach(() => {
    // Resetear el select de horas
    document.getElementById('appointmentTime').innerHTML = '';
  });

  test('domingo muestra "Domingo cerrado"', () => {
    // 2026-03-22 es domingo
    bookingApp.loadAvailableTimes('2026-03-22');
    const timeSelect = document.getElementById('appointmentTime');
    expect(timeSelect.innerHTML).toMatch(/Domingo cerrado/i);
  });

  test('sábado genera slots de 9:00 a 17:00 sin hora de almuerzo', () => {
    // 2026-03-21 es sábado
    bookingApp.loadAvailableTimes('2026-03-21');
    const timeSelect = document.getElementById('appointmentTime');
    const options = timeSelect.querySelectorAll('option');

    // Horarios esperados: 09,10,11,12,14,15,16,17 (sin 13, header = primer option)
    const values = Array.from(options).map(o => o.value).filter(v => v);
    expect(values).toContain('09:00');
    expect(values).toContain('12:00');
    expect(values).not.toContain('13:00'); // Almuerzo
    expect(values).toContain('17:00');
    expect(values).not.toContain('18:00'); // Cierre sábado
  });

  test('día de semana genera slots de 9:00 a 19:00 sin hora de almuerzo', () => {
    // 2026-03-23 es lunes
    bookingApp.loadAvailableTimes('2026-03-23');
    const timeSelect = document.getElementById('appointmentTime');
    const values = Array.from(timeSelect.querySelectorAll('option'))
      .map(o => o.value)
      .filter(v => v);

    expect(values).toContain('09:00');
    expect(values).toContain('12:00');
    expect(values).not.toContain('13:00'); // Almuerzo
    expect(values).toContain('14:00');
    expect(values).toContain('19:00');
    expect(values).not.toContain('20:00'); // Cierre
  });
});

describe('bookingApp — renderTimeSlots', () => {
  beforeEach(() => {
    document.getElementById('appointmentTime').innerHTML = '';
    // Necesita selectedDate seteada para parsear fecha
    selectedDate = '2026-03-23'; // Lunes
  });

  afterEach(() => {
    selectedDate = null;
  });

  test('sin reservas todos los slots muestran ✅', () => {
    bookingApp.renderTimeSlots([]);
    const timeSelect = document.getElementById('appointmentTime');
    const options = Array.from(timeSelect.querySelectorAll('option'));
    const availableOptions = options.filter(o => o.value && !o.disabled);
    expect(availableOptions.length).toBeGreaterThan(0);
    availableOptions.forEach(opt => {
      expect(opt.textContent).toMatch(/✅/);
    });
  });

  test('slots reservados aparecen como disabled con ❌', () => {
    bookingApp.renderTimeSlots(['10:00', '14:00']);
    const timeSelect = document.getElementById('appointmentTime');
    const options = Array.from(timeSelect.querySelectorAll('option'));

    const bookedSlot10 = options.find(o => o.value === '10:00');
    const bookedSlot14 = options.find(o => o.value === '14:00');
    const freeSlot09 = options.find(o => o.value === '09:00');

    expect(bookedSlot10.disabled).toBe(true);
    expect(bookedSlot10.textContent).toMatch(/❌/);
    expect(bookedSlot14.disabled).toBe(true);
    expect(bookedSlot14.textContent).toMatch(/❌/);
    expect(freeSlot09.disabled).toBe(false);
    expect(freeSlot09.textContent).toMatch(/✅/);
  });

  test('header muestra cantidad de slots disponibles', () => {
    bookingApp.renderTimeSlots(['10:00']);
    const timeSelect = document.getElementById('appointmentTime');
    const header = timeSelect.querySelector('option[value=""]');
    expect(header.textContent).toMatch(/disponible/i);
  });
});

describe('bookingApp — validateCurrentStep', () => {
  let toastCalls;

  beforeEach(() => {
    toastCalls = [];
    bookingApp.showToast = jest.fn((msg) => toastCalls.push(msg));
    bookingApp.resetState();
  });

  test('paso 1 sin servicio retorna false', () => {
    currentStep = 1;
    selectedService = null;
    expect(bookingApp.validateCurrentStep()).toBe(false);
  });

  test('paso 1 con servicio retorna true', () => {
    currentStep = 1;
    selectedService = { id: 'corte-cabello', name: 'Corte', price: 450, duration: 45 };
    expect(bookingApp.validateCurrentStep()).toBe(true);
  });

  test('paso 2 sin fecha retorna false', () => {
    currentStep = 2;
    selectedService = { id: 'corte-cabello', name: 'Corte', price: 450, duration: 45 };
    selectedDate = null;
    selectedTime = '10:00';
    selectedProfessional = { id: 'cesar-viloria', name: 'Cesar' };
    expect(bookingApp.validateCurrentStep()).toBe(false);
  });

  test('paso 2 sin hora retorna false', () => {
    currentStep = 2;
    selectedDate = '2026-03-25';
    selectedTime = null;
    selectedProfessional = { id: 'cesar-viloria', name: 'Cesar' };
    expect(bookingApp.validateCurrentStep()).toBe(false);
  });

  test('paso 2 sin profesional retorna false', () => {
    currentStep = 2;
    selectedDate = '2026-03-25';
    selectedTime = '10:00';
    selectedProfessional = null;
    expect(bookingApp.validateCurrentStep()).toBe(false);
  });

  test('paso 2 con todos los datos retorna true', () => {
    currentStep = 2;
    selectedDate = '2026-03-25';
    selectedTime = '10:00';
    selectedProfessional = { id: 'cesar-viloria', name: 'Cesar' };
    expect(bookingApp.validateCurrentStep()).toBe(true);
  });
});

describe('bookingApp — resetState', () => {
  test('resetea todas las variables globales', () => {
    currentStep = 3;
    selectedService = { id: 'test' };
    selectedDate = '2026-03-25';
    selectedTime = '10:00';
    selectedProfessional = { id: 'cesar' };
    isSubmitting = true;

    bookingApp.resetState();

    expect(currentStep).toBe(1);
    expect(selectedService).toBeNull();
    expect(selectedDate).toBeNull();
    expect(selectedTime).toBeNull();
    expect(selectedProfessional).toBeNull();
    expect(isSubmitting).toBe(false);
  });
});

describe('bookingApp — navegación de pasos', () => {
  beforeEach(() => {
    bookingApp.resetState();
    bookingApp.showToast = jest.fn();
  });

  test('nextStep incrementa currentStep cuando la validación pasa', () => {
    currentStep = 1;
    selectedService = { id: 'corte', name: 'Corte', price: 450, duration: 45, professionals: ['cesar-viloria'] };
    bookingApp.nextStep();
    expect(currentStep).toBe(2);
  });

  test('nextStep no incrementa si la validación falla', () => {
    currentStep = 1;
    selectedService = null;
    bookingApp.nextStep();
    expect(currentStep).toBe(1);
  });

  test('previousStep decrementa currentStep', () => {
    currentStep = 2;
    bookingApp.previousStep();
    expect(currentStep).toBe(1);
  });

  test('previousStep no baja de 1', () => {
    currentStep = 1;
    bookingApp.previousStep();
    expect(currentStep).toBe(1);
  });
});

describe('bookingApp — getFormData', () => {
  test('extrae datos del formulario correctamente', () => {
    // Los inputs ya tienen valores del beforeAll
    const form = document.getElementById('clientForm');
    // checkValidity en jsdom retorna true si todos los required tienen valor
    const data = bookingApp.getFormData();
    expect(data).not.toBeNull();
    expect(data.name).toBe('Juan Pérez');
    expect(data.email).toBe('juan@test.com');
    expect(data.phone).toBe('099123456');
    expect(data.id).toBe('12345678');
  });

  test('retorna null si el formulario es inválido', () => {
    // Vaciar un campo requerido
    const nameInput = document.getElementById('clientName');
    const originalValue = nameInput.value;
    nameInput.value = '';

    const data = bookingApp.getFormData();
    expect(data).toBeNull();

    // Restaurar
    nameInput.value = originalValue;
  });
});

// =============================================
// GRUPO 4: bookingAPI (con fetch mock)
// =============================================
describe('bookingAPI', () => {
  beforeEach(() => {
    global.fetch.mockReset();
  });

  test('createBooking envía POST y retorna datos', async () => {
    const mockResponse = { _id: '123', status: 'confirmed' };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const bookingData = {
      client: { name: 'Test' },
      service: { id: 'corte' },
      professional: { id: 'cesar' },
      date: '2026-03-25',
      time: '10:00',
    };

    const result = await bookingAPI.createBooking(bookingData);
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/bookings'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('createBooking lanza error en respuesta HTTP error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 'Datos inválidos' }),
    });

    await expect(bookingAPI.createBooking({})).rejects.toThrow('Datos inválidos');
  });

  test('getBookings retorna array de bookings', async () => {
    const mockBookings = [createMockBooking()];
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockBookings,
    });

    const result = await bookingAPI.getBookings();
    expect(result).toEqual(mockBookings);
  });

  test('getBookings lanza error en HTTP error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(bookingAPI.getBookings()).rejects.toThrow('HTTP error');
  });

  test('getBookings lanza error de timeout cuando fetch es abortado', async () => {
    global.fetch.mockRejectedValue(Object.assign(new Error('Aborted'), { name: 'AbortError' }));

    await expect(bookingAPI.getBookings()).rejects.toThrow('Timeout');
  });
});

// =============================================
// GRUPO 5: checkBookingAvailability
// =============================================
describe('bookingApp — checkBookingAvailability', () => {
  beforeEach(() => {
    global.fetch.mockReset();
    bookingApp.showToast = jest.fn();
  });

  test('retorna true cuando no hay datos completos', async () => {
    selectedDate = null;
    selectedTime = null;
    selectedProfessional = null;
    const result = await bookingApp.checkBookingAvailability();
    expect(result).toBe(true);
  });

  test('retorna true cuando no hay conflicto', async () => {
    selectedDate = '2026-03-25';
    selectedTime = '10:00';
    selectedProfessional = { id: 'cesar-viloria', name: 'Cesar' };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [createMockBooking({ date: '2026-03-25', time: '11:00' })],
    });

    const result = await bookingApp.checkBookingAvailability();
    expect(result).toBe(true);
  });

  test('retorna false cuando mismo profesional+fecha+hora está ocupada', async () => {
    selectedDate = '2026-03-25';
    selectedTime = '10:00';
    selectedProfessional = { id: 'cesar-viloria', name: 'Cesar' };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        createMockBooking({
          date: '2026-03-25',
          time: '10:00',
          professional: { id: 'cesar-viloria', name: 'Cesar' },
          status: 'confirmed',
        }),
      ],
    });

    const result = await bookingApp.checkBookingAvailability();
    expect(result).toBe(false);
  });

  test('permite diferente profesional en el mismo horario', async () => {
    selectedDate = '2026-03-25';
    selectedTime = '10:00';
    selectedProfessional = { id: 'random', name: 'Random' };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        createMockBooking({
          date: '2026-03-25',
          time: '10:00',
          professional: { id: 'cesar-viloria', name: 'Cesar' },
          status: 'confirmed',
        }),
      ],
    });

    const result = await bookingApp.checkBookingAvailability();
    expect(result).toBe(true);
  });

  test('ignora reservas canceladas', async () => {
    selectedDate = '2026-03-25';
    selectedTime = '10:00';
    selectedProfessional = { id: 'cesar-viloria', name: 'Cesar' };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        createMockBooking({
          date: '2026-03-25',
          time: '10:00',
          professional: { id: 'cesar-viloria', name: 'Cesar' },
          status: 'cancelled',
        }),
      ],
    });

    const result = await bookingApp.checkBookingAvailability();
    expect(result).toBe(true);
  });
});
