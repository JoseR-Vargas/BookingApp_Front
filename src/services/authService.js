// ===== SERVICIO DE AUTENTICACIÓN =====
// Centraliza el login con protección contra fuerza bruta.
// TODO: Reemplazar la validación frontend con POST /api/auth/login
//       cuando el backend implemente el endpoint de autenticación.

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60000; // 1 minuto en ms

let attempts = 0;
let lockoutUntil = null;

export const authService = {
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Por favor completa todos los campos');
    }

    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      throw new Error('Demasiados intentos fallidos. Intenta de nuevo en ' + remaining + ' segundos.');
    }

    // Validación provisional en frontend.
    // Las credenciales deberían venir del backend en producción.
    const isValid = username === 'admin' && password === 'admin123';

    if (!isValid) {
      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        lockoutUntil = Date.now() + LOCKOUT_DURATION;
        attempts = 0;
        throw new Error('Cuenta bloqueada por demasiados intentos. Intenta en 60 segundos.');
      }
      const remaining = MAX_ATTEMPTS - attempts;
      throw new Error('Usuario o contraseña incorrectos. Intentos restantes: ' + remaining);
    }

    attempts = 0;
    lockoutUntil = null;
    sessionStorage.setItem('isAdmin', 'true');
    sessionStorage.setItem('adminUser', username);
    return { username };
  },

  logout() {
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminUser');
  },

  isAuthenticated() {
    return sessionStorage.getItem('isAdmin') === 'true';
  },

  getUser() {
    return sessionStorage.getItem('adminUser');
  },

  // Test-only: clears the in-memory brute-force counters.
  _reset() {
    attempts = 0;
    lockoutUntil = null;
  },
};
