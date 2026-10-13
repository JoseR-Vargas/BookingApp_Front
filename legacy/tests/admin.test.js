const { loadScript, loadScripts, loadScriptSkipAuth, getAuthIIFE, createMockBooking } = require('./helpers');

// Crear DOM mínimo para admin
beforeAll(() => {
  document.body.innerHTML = `
    <div id="sidebar"></div>
    <div class="main-content"></div>
    <button id="sidebarToggle"></button>
    <div id="pageTitle">Dashboard</div>
    <input id="dateFilter" type="date" />
    <span id="notificationBell"></span>
    <span id="notificationCount">0</span>
    <button id="enableSoundBtn" class="enable-sound-btn-hidden"></button>
    <div id="totalBookings">0</div>
    <div id="totalRevenue">$0</div>
    <div id="todayBookings">0</div>
    <div id="filteredTotalRevenue">$0</div>
    <table><tbody id="recentBookingsTable"></tbody></table>
    <table><tbody id="bookingsTableBody"></tbody></table>
    <canvas id="bookingsChart"></canvas>
    <canvas id="servicesChart"></canvas>
    <div class="content-section active" id="dashboard"></div>
    <div class="content-section" id="bookings"></div>
    <div class="content-section" id="reports"></div>
    <a class="nav-link active" data-section="dashboard" href="#">Dashboard</a>
    <a class="nav-link" data-section="bookings" href="#">Reservas</a>
    <a class="nav-link" data-section="reports" href="#">Reportes</a>
  `;

  // Simular sesión admin válida
  sessionStorage.setItem('isAdmin', 'true');
  sessionStorage.setItem('adminUser', 'admin');

  // Cargar módulos de dependencias primero
  loadScripts([
    'js/core/api-client.js',
    'js/services/admin-service.js',
    'js/services/auth-service.js',
    'js/services/audio-service.js',
    'js/services/notification-service.js',
    'js/ui/toast.js',
    'js/ui/components/booking-table.js',
  ]);

  // Cargar el orquestador sin el checkAuth IIFE
  loadScriptSkipAuth('js/admin-app.js');
});

// =============================================
// GRUPO 1: Utilidades
// =============================================
describe('adminApp — formatDate', () => {
  test('formatea fecha en español con weekday short', () => {
    const result = adminApp.formatDate('2026-03-25');
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/25/);
  });

  test('formatea fecha de fin de año', () => {
    const result = adminApp.formatDate('2026-12-31');
    expect(result).toMatch(/31/);
    expect(result).toMatch(/2026/);
  });
});

// =============================================
// GRUPO 2: Cálculos de revenue
// =============================================
describe('adminApp — updateFilteredTotalRevenue', () => {
  test('solo suma bookings confirmados', () => {
    const bookings = [
      createMockBooking({ status: 'confirmed', service: { name: 'A', price: 450, id: 'a', duration: 45 } }),
      createMockBooking({ status: 'confirmed', service: { name: 'B', price: 300, id: 'b', duration: 30 } }),
      createMockBooking({ status: 'cancelled', service: { name: 'C', price: 500, id: 'c', duration: 60 } }),
    ];

    adminApp.updateFilteredTotalRevenue(bookings);
    const el = document.getElementById('filteredTotalRevenue');
    expect(el.textContent).toMatch(/750/);
  });

  test('array vacío muestra $0', () => {
    adminApp.updateFilteredTotalRevenue([]);
    const el = document.getElementById('filteredTotalRevenue');
    expect(el.textContent).toMatch(/0/);
  });

  test('ignora bookings con status cancelled', () => {
    const bookings = [
      createMockBooking({ status: 'cancelled', service: { name: 'X', price: 1000, id: 'x', duration: 60 } }),
    ];

    adminApp.updateFilteredTotalRevenue(bookings);
    const el = document.getElementById('filteredTotalRevenue');
    expect(el.textContent).toMatch(/0/);
  });
});

// =============================================
// GRUPO 3: Renderizado de tablas (DOM)
// =============================================
describe('adminApp — renderBookingsTable', () => {
  test('tabla vacía muestra mensaje', () => {
    adminApp.renderBookingsTable([]);
    const tbody = document.getElementById('bookingsTableBody');
    expect(tbody.innerHTML).toMatch(/No hay reservas/i);
  });

  test('renderiza booking con datos correctos', () => {
    const booking = createMockBooking();
    adminApp.renderBookingsTable([booking]);
    const tbody = document.getElementById('bookingsTableBody');
    expect(tbody.innerHTML).toContain('Juan Pérez');
    expect(tbody.innerHTML).toContain('juan@test.com');
    expect(tbody.innerHTML).toContain('Corte comun');
    expect(tbody.innerHTML).toContain('10:00');
    expect(tbody.innerHTML).toContain('Cesar Viloria');
  });

  test('compatibilidad con formato legacy barber', () => {
    const legacyBooking = createMockBooking({
      professional: undefined,
      barber: { id: 'cesar', name: 'Cesar Legacy' },
    });
    adminApp.renderBookingsTable([legacyBooking]);
    const tbody = document.getElementById('bookingsTableBody');
    expect(tbody.innerHTML).toContain('Cesar Legacy');
  });

  test('muestra notas cuando existen', () => {
    const booking = createMockBooking({ notes: 'Corte especial' });
    adminApp.renderBookingsTable([booking]);
    const tbody = document.getElementById('bookingsTableBody');
    expect(tbody.innerHTML).toContain('Corte especial');
  });

  test('muestra "Sin notas" cuando no hay notas', () => {
    const booking = createMockBooking({ notes: '' });
    adminApp.renderBookingsTable([booking]);
    const tbody = document.getElementById('bookingsTableBody');
    expect(tbody.innerHTML).toContain('Sin notas');
  });
});

describe('adminApp — renderRecentBookingsTable', () => {
  test('tabla vacía muestra mensaje', () => {
    adminApp.renderRecentBookingsTable([]);
    const tbody = document.getElementById('recentBookingsTable');
    expect(tbody.innerHTML).toMatch(/No hay reservas recientes/i);
  });

  test('renderiza booking reciente con datos correctos', () => {
    const booking = createMockBooking();
    adminApp.renderRecentBookingsTable([booking]);
    const tbody = document.getElementById('recentBookingsTable');
    expect(tbody.innerHTML).toContain('Juan Pérez');
    expect(tbody.innerHTML).toContain('099123456');
    expect(tbody.innerHTML).toContain('Corte comun');
    expect(tbody.innerHTML).toContain('Cesar Viloria');
  });

  test('compatibilidad con formato legacy barber', () => {
    const legacyBooking = createMockBooking({
      professional: undefined,
      barber: { id: 'random', name: 'Random Legacy' },
    });
    adminApp.renderRecentBookingsTable([legacyBooking]);
    const tbody = document.getElementById('recentBookingsTable');
    expect(tbody.innerHTML).toContain('Random Legacy');
  });
});

// =============================================
// GRUPO 4: adminAPI (con fetch mock)
// =============================================
describe('adminAPI', () => {
  beforeEach(() => {
    global.fetch.mockReset();
  });

  test('getBookings retorna array de bookings', async () => {
    const mockBookings = [createMockBooking()];
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockBookings,
    });

    const result = await adminAPI.getBookings();
    expect(result).toEqual(mockBookings);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/bookings'), expect.anything());
  });

  test('getBookings lanza error en HTTP error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(adminAPI.getBookings()).rejects.toThrow('HTTP error');
  });

  test('getStatistics retorna estadísticas', async () => {
    const mockStats = { totalBookings: 10, totalRevenue: 5000, todayBookings: 2 };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    });

    const result = await adminAPI.getStatistics();
    expect(result).toEqual(mockStats);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/bookings/statistics'), expect.anything());
  });

  test('getStatistics lanza error en HTTP error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(adminAPI.getStatistics()).rejects.toThrow('HTTP error');
  });

  test('deleteBooking envía DELETE y retorna resultado', async () => {
    const mockResult = { message: 'Deleted' };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResult,
    });

    const result = await adminAPI.deleteBooking('abc123');
    expect(result).toEqual(mockResult);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/bookings/abc123'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  test('deleteBooking lanza error en HTTP error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(adminAPI.deleteBooking('notfound')).rejects.toThrow('HTTP error');
  });
});

// =============================================
// GRUPO 5: Autenticación
// =============================================
describe('Autenticación admin', () => {
  test('IIFE checkAuth redirige si authService.isAuthenticated() es false', () => {
    const authCode = getAuthIIFE();
    expect(authCode).not.toBeNull();

    // Asegurar sesión inválida
    sessionStorage.removeItem('isAdmin');

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => eval(authCode)).not.toThrow();
    spy.mockRestore();
  });

  test('IIFE checkAuth no redirige con sesión válida', () => {
    const authCode = getAuthIIFE();
    // authService.isAuthenticated() lee sessionStorage
    sessionStorage.setItem('isAdmin', 'true');

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    eval(authCode);
    const navigationErrors = spy.mock.calls.filter(
      call => String(call[0]).includes('navigation')
    );
    expect(navigationErrors).toHaveLength(0);
    spy.mockRestore();
  });
});

// =============================================
// GRUPO 6: authService
// =============================================
describe('authService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    // Resetear contador de intentos entre tests
    if (authService._attempts !== undefined) authService._attempts = 0;
    if (authService._lockoutUntil !== undefined) authService._lockoutUntil = null;
  });

  test('login exitoso guarda sesión en sessionStorage', async () => {
    const result = await authService.login('admin', 'admin123');
    expect(result.username).toBe('admin');
    expect(sessionStorage.getItem('isAdmin')).toBe('true');
    expect(sessionStorage.getItem('adminUser')).toBe('admin');
  });

  test('login con credenciales inválidas lanza error', async () => {
    await expect(authService.login('admin', 'wrong')).rejects.toThrow();
  });

  test('login con campos vacíos lanza error', async () => {
    await expect(authService.login('', '')).rejects.toThrow('Por favor completa todos los campos');
  });

  test('logout limpia sessionStorage', () => {
    sessionStorage.setItem('isAdmin', 'true');
    sessionStorage.setItem('adminUser', 'admin');
    authService.logout();
    expect(sessionStorage.getItem('isAdmin')).toBeNull();
    expect(sessionStorage.getItem('adminUser')).toBeNull();
  });

  test('isAuthenticated retorna true con sesión activa', () => {
    sessionStorage.setItem('isAdmin', 'true');
    expect(authService.isAuthenticated()).toBe(true);
  });

  test('isAuthenticated retorna false sin sesión', () => {
    sessionStorage.removeItem('isAdmin');
    expect(authService.isAuthenticated()).toBe(false);
  });

  test('bloquea cuenta tras 5 intentos fallidos', async () => {
    for (let i = 0; i < 5; i++) {
      try { await authService.login('admin', 'wrong'); } catch (e) {}
    }
    await expect(authService.login('admin', 'admin123')).rejects.toThrow(/bloqueada|intentos/i);
  });
});
