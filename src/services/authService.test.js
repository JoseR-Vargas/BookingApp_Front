import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from './authService.js';

const bad = () => authService.login('admin', 'wrong');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2030-01-07T10:00:00Z'));
  sessionStorage.clear();
  authService._reset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('authService', () => {
  it('stores the session on valid credentials', async () => {
    const result = await authService.login('admin', 'admin123');
    expect(result).toEqual({ username: 'admin' });
    expect(sessionStorage.getItem('isAdmin')).toBe('true');
    expect(sessionStorage.getItem('adminUser')).toBe('admin');
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getUser()).toBe('admin');
  });

  it('rejects empty fields', async () => {
    await expect(authService.login('', 'x')).rejects.toThrow('Por favor completa todos los campos');
    await expect(authService.login('admin', '')).rejects.toThrow('Por favor completa todos los campos');
  });

  it('reports the remaining attempts on wrong credentials (4, 3, 2, 1)', async () => {
    for (const remaining of [4, 3, 2, 1]) {
      await expect(bad()).rejects.toThrow(`Usuario o contraseña incorrectos. Intentos restantes: ${remaining}`);
    }
    expect(sessionStorage.getItem('isAdmin')).toBeNull();
  });

  it('locks the account on the 5th failure and reports the countdown', async () => {
    for (let i = 0; i < 4; i++) await expect(bad()).rejects.toThrow();
    await expect(bad()).rejects.toThrow('Cuenta bloqueada por demasiados intentos. Intenta en 60 segundos.');

    await expect(bad()).rejects.toThrow('Demasiados intentos fallidos. Intenta de nuevo en 60 segundos.');

    vi.advanceTimersByTime(10_500);
    await expect(authService.login('admin', 'admin123')).rejects.toThrow(
      'Demasiados intentos fallidos. Intenta de nuevo en 50 segundos.'
    );
  });

  it('works again once the 60s lockout expires', async () => {
    for (let i = 0; i < 5; i++) await expect(bad()).rejects.toThrow();

    vi.advanceTimersByTime(59_999);
    await expect(authService.login('admin', 'admin123')).rejects.toThrow(/Demasiados intentos fallidos/);

    vi.advanceTimersByTime(1);
    await expect(authService.login('admin', 'admin123')).resolves.toEqual({ username: 'admin' });
  });

  it('resets the attempt counter after a successful login', async () => {
    await expect(bad()).rejects.toThrow();
    await expect(bad()).rejects.toThrow();
    await authService.login('admin', 'admin123');
    await expect(bad()).rejects.toThrow('Intentos restantes: 4');
  });

  it('logout clears the session', async () => {
    await authService.login('admin', 'admin123');
    authService.logout();
    expect(sessionStorage.getItem('isAdmin')).toBeNull();
    expect(sessionStorage.getItem('adminUser')).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getUser()).toBeNull();
  });
});
