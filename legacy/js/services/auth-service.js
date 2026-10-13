// ===== SERVICIO DE AUTENTICACIÓN =====
// Centraliza el login con protección contra fuerza bruta.
// TODO: Reemplazar la validación frontend con POST /api/auth/login
//       cuando el backend implemente el endpoint de autenticación.

const authService = {
  _attempts: 0,
  _maxAttempts: 5,
  _lockoutUntil: null,
  _lockoutDuration: 60000, // 1 minuto en ms

  async login(username, password) {
    if (!username || !password) {
      throw new Error('Por favor completa todos los campos');
    }

    if (this._lockoutUntil && Date.now() < this._lockoutUntil) {
      const remaining = Math.ceil((this._lockoutUntil - Date.now()) / 1000);
      throw new Error('Demasiados intentos fallidos. Intenta de nuevo en ' + remaining + ' segundos.');
    }

    // Validación provisional en frontend.
    // Las credenciales deberían venir del backend en producción.
    const isValid = username === 'admin' && password === 'admin123';

    if (!isValid) {
      this._attempts++;
      if (this._attempts >= this._maxAttempts) {
        this._lockoutUntil = Date.now() + this._lockoutDuration;
        this._attempts = 0;
        throw new Error('Cuenta bloqueada por demasiados intentos. Intenta en 60 segundos.');
      }
      const remaining = this._maxAttempts - this._attempts;
      throw new Error('Usuario o contraseña incorrectos. Intentos restantes: ' + remaining);
    }

    this._attempts = 0;
    this._lockoutUntil = null;
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
};

window.authService = authService;
