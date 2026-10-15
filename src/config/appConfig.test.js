import { describe, it, expect, afterEach, vi } from 'vitest';

// APP_CONFIG resolves BACKEND_URL at module evaluation time, so each case
// stubs the location and re-imports a fresh copy of the module.
async function loadConfigFor(hostname) {
  vi.stubGlobal('location', { hostname });
  vi.resetModules();
  const mod = await import('./appConfig.js');
  return mod.APP_CONFIG;
}

describe('APP_CONFIG.BACKEND_URL', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the local backend for localhost', async () => {
    const config = await loadConfigFor('localhost');
    expect(config.BACKEND_URL).toBe('http://localhost:3000');
  });

  it('uses the local backend for 127.0.0.1', async () => {
    const config = await loadConfigFor('127.0.0.1');
    expect(config.BACKEND_URL).toBe('http://localhost:3000');
  });

  it('uses the Vercel backend for the production hostname', async () => {
    const config = await loadConfigFor('booking-app-front-peach.vercel.app');
    expect(config.BACKEND_URL).toBe('https://booking-app-back.vercel.app');
  });

  it('uses the Vercel backend for any other hostname', async () => {
    const config = await loadConfigFor('192.168.1.20');
    expect(config.BACKEND_URL).toBe('https://booking-app-back.vercel.app');
  });
});

describe('APP_CONFIG business data (frozen from the pre-migration config)', () => {
  it('keeps scalar settings identical to legacy', async () => {
    const config = await loadConfigFor('localhost');
    expect(config.BUSINESS_HOURS).toEqual({
      start: 9,
      end: 20,
      interval: 60,
      lunchBreak: { start: 13, end: 14 },
    });
    expect(config.CANCELLATION_HOURS).toBe(5);
    expect(config.TOAST_DURATION).toBe(3000);
    expect(config.ITEMS_PER_PAGE).toBe(10);
  });

  it('keeps PROFESSIONALS identical to legacy', async () => {
    const config = await loadConfigFor('localhost');
    expect(config.PROFESSIONALS).toEqual([
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
    ]);
  });

  it('keeps SERVICES identical to legacy', async () => {
    const config = await loadConfigFor('localhost');
    const professionals = ['alex-garcia', 'maria-lopez'];
    expect(config.SERVICES).toEqual([
      {
        id: 'consulta-inicial',
        name: 'Consulta Inicial',
        description: 'Sesión introductoria para evaluar tus necesidades',
        price: 500,
        duration: 30,
        professionals,
        icon: 'fas fa-clipboard-list',
      },
      {
        id: 'servicio-basico',
        name: 'Servicio Básico',
        description: 'Atención estándar completa con seguimiento profesional',
        price: 1200,
        duration: 60,
        professionals,
        icon: 'fas fa-star',
      },
      {
        id: 'servicio-premium',
        name: 'Servicio Premium',
        description: 'Experiencia premium con atención prioritaria y resultados garantizados',
        price: 2500,
        duration: 90,
        professionals,
        icon: 'fas fa-gem',
      },
      {
        id: 'sesion-expres',
        name: 'Sesión Exprés',
        description: 'Atención rápida y efectiva para ajustarse a tu agenda',
        price: 700,
        duration: 20,
        professionals,
        icon: 'fas fa-bolt',
      },
    ]);
  });
});
