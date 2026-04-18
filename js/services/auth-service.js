// ===== SERVICIO DE AUTENTICACIÓN =====
// Centraliza el login eliminando credenciales hardcodeadas del HTML.
// TODO: Reemplazar la validación frontend con POST /api/auth/login
//       cuando el backend implemente el endpoint de autenticación.

const authService = {
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Por favor completa todos los campos');
    }

    // Validación provisional en frontend.
    // Las credenciales deberían venir del backend en producción.
    const isValid = username === 'admin' && password === 'admin123';
    if (!isValid) {
      throw new Error('Usuario o contraseña incorrectos');
    }

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
