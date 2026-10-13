const { loadScript } = require('./helpers');

describe('config.js — APP_CONFIG', () => {
  beforeAll(() => {
    // Limpiar el APP_CONFIG del setup para cargar el real
    delete window.APP_CONFIG;
    // jsdom ya tiene window.location.hostname = 'localhost' por defecto
    loadScript('js/config.js');
  });

  test('APP_CONFIG existe y se asigna a window', () => {
    expect(window.APP_CONFIG).toBeDefined();
  });

  test('tiene todas las propiedades requeridas', () => {
    const config = window.APP_CONFIG;
    expect(config).toHaveProperty('BACKEND_URL');
    expect(config).toHaveProperty('BUSINESS_HOURS');
    expect(config).toHaveProperty('CANCELLATION_HOURS');
    expect(config).toHaveProperty('TOAST_DURATION');
    expect(config).toHaveProperty('ITEMS_PER_PAGE');
    expect(config).toHaveProperty('PROFESSIONALS');
    expect(config).toHaveProperty('SERVICES');
  });

  test('BUSINESS_HOURS tiene valores correctos', () => {
    const bh = window.APP_CONFIG.BUSINESS_HOURS;
    expect(bh.start).toBe(9);
    expect(bh.end).toBe(20);
    expect(bh.interval).toBe(60);
    expect(bh.lunchBreak).toEqual({ start: 13, end: 14 });
  });

  test('CANCELLATION_HOURS es 5', () => {
    expect(window.APP_CONFIG.CANCELLATION_HOURS).toBe(5);
  });

  test('BACKEND_URL es localhost:3000 cuando hostname es localhost', () => {
    expect(window.APP_CONFIG.BACKEND_URL).toBe('http://localhost:3000');
  });

  test('PROFESSIONALS tiene 2 profesionales con las propiedades requeridas', () => {
    const profs = window.APP_CONFIG.PROFESSIONALS;
    expect(Array.isArray(profs)).toBe(true);
    expect(profs).toHaveLength(2);
    const requiredKeys = ['id', 'name', 'specialty', 'experience', 'rating', 'avatar', 'available'];
    profs.forEach(prof => {
      requiredKeys.forEach(key => expect(prof).toHaveProperty(key));
      expect(typeof prof.rating).toBe('number');
      expect(prof.available).toBe(true);
    });
  });

  test('SERVICES tiene 4 servicios con las propiedades requeridas', () => {
    const services = window.APP_CONFIG.SERVICES;
    expect(Array.isArray(services)).toBe(true);
    expect(services.length).toBeGreaterThanOrEqual(4);
    const requiredKeys = ['id', 'name', 'description', 'price', 'duration', 'professionals', 'icon'];
    services.forEach(service => {
      requiredKeys.forEach(key => expect(service).toHaveProperty(key));
      expect(service.price).toBeGreaterThan(0);
      expect(service.duration).toBeGreaterThan(0);
    });
  });

  test('cada servicio referencia solo profesionales existentes', () => {
    const profIds = window.APP_CONFIG.PROFESSIONALS.map(p => p.id);
    window.APP_CONFIG.SERVICES.forEach(service => {
      service.professionals.forEach(profId => {
        expect(profIds).toContain(profId);
      });
    });
  });
});
