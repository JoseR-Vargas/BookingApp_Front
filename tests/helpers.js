const fs = require('fs');
const path = require('path');

/**
 * Carga un archivo JS en el contexto global (simula <script src="...">)
 * Convierte const/let a var para que las declaraciones escapen al scope del test.
 * @param {string} relativePath - Ruta relativa desde la raíz del proyecto
 */
function loadScript(relativePath) {
  const filePath = path.resolve(__dirname, '..', relativePath);
  const content = fs.readFileSync(filePath, 'utf8');
  var cleaned = removeDOMContentLoaded(content);
  // Convertir const/let a var para que escapen del eval al scope del llamante
  cleaned = cleaned.replace(/\b(const|let)\s/g, 'var ');

  // Agregar bridge de variables de estado mutables al scope global
  // Esto permite que los tests lean/escriban las variables del eval scope
  cleaned += `
;(function() {
  var _stateVars = ['currentStep','selectedService','selectedDate','selectedTime','selectedProfessional','isSubmitting','eventListenersRegistered'];
  _stateVars.forEach(function(name) {
    try {
      Object.defineProperty(globalThis, name, {
        get: function() { return eval(name); },
        set: function(v) { eval(name + ' = v'); },
        configurable: true
      });
    } catch(e) {}
  });
})();
`;

  eval(cleaned);
  // Exportar funciones y constantes a global para acceso en tests
  if (typeof CONFIG !== 'undefined') global.CONFIG = CONFIG;
  if (typeof BACKEND_URL !== 'undefined') global.BACKEND_URL = BACKEND_URL;
  if (typeof SERVICES !== 'undefined') global.SERVICES = SERVICES;
  if (typeof PROFESSIONALS !== 'undefined') global.PROFESSIONALS = PROFESSIONALS;
  if (typeof bookingApp !== 'undefined') global.bookingApp = bookingApp;
  if (typeof bookingAPI !== 'undefined') global.bookingAPI = bookingAPI;
  if (typeof formatPrice !== 'undefined') global.formatPrice = formatPrice;
  if (typeof formatDate !== 'undefined') global.formatDate = formatDate;
  if (typeof canCancelBooking !== 'undefined') global.canCancelBooking = canCancelBooking;
  if (typeof isMobileDevice !== 'undefined') global.isMobileDevice = isMobileDevice;
  if (typeof isSlowConnection !== 'undefined') global.isSlowConnection = isSlowConnection;
  // Admin globals
  if (typeof adminApp !== 'undefined') global.adminApp = adminApp;
  if (typeof adminAPI !== 'undefined') global.adminAPI = adminAPI;
  if (typeof ADMIN_CONFIG !== 'undefined') global.ADMIN_CONFIG = ADMIN_CONFIG;
}

/**
 * Remueve bloques document.addEventListener("DOMContentLoaded", ...) 
 * balanceando llaves para no romper el JS
 */
function removeDOMContentLoaded(code) {
  const marker = 'document.addEventListener("DOMContentLoaded"';
  const markerAlt = "document.addEventListener('DOMContentLoaded'";
  let result = code;

  for (const m of [marker, markerAlt]) {
    let idx = result.indexOf(m);
    while (idx !== -1) {
      // Buscar el primer '{' después del marker
      let braceStart = result.indexOf('{', idx);
      if (braceStart === -1) break;

      // Balancear llaves
      let depth = 0;
      let i = braceStart;
      for (; i < result.length; i++) {
        if (result[i] === '{') depth++;
        else if (result[i] === '}') depth--;
        if (depth === 0) break;
      }

      // Encontrar el final: });
      let end = result.indexOf(';', i);
      if (end === -1) end = i + 2;
      else end = end + 1;

      result = result.slice(0, idx) + '// [TEST] DOMContentLoaded removido' + result.slice(end);
      idx = result.indexOf(m);
    }
  }

  return result;
}

/**
 * Carga un archivo JS filtrando el IIFE de autenticación
 * (para admin.js que redirige si no hay sessionStorage)
 * @param {string} relativePath - Ruta relativa desde la raíz del proyecto
 */
function loadScriptSkipAuth(relativePath) {
  const filePath = path.resolve(__dirname, '..', relativePath);
  const content = fs.readFileSync(filePath, 'utf8');
  // Remover IIFE de checkAuth
  var cleaned = content.replace(
    /\(function\s+checkAuth\s*\(\)\s*\{[\s\S]*?\}\)\(\)\s*;/,
    '// [TEST] checkAuth IIFE removido'
  );
  // Remover DOMContentLoaded
  cleaned = removeDOMContentLoaded(cleaned);
  // Convertir const/let a var
  cleaned = cleaned.replace(/\b(const|let)\s/g, 'var ');
  eval(cleaned);
  // Exportar a global
  if (typeof adminApp !== 'undefined') global.adminApp = adminApp;
  if (typeof adminAPI !== 'undefined') global.adminAPI = adminAPI;
  if (typeof ADMIN_CONFIG !== 'undefined') global.ADMIN_CONFIG = ADMIN_CONFIG;
  if (typeof BACKEND_URL !== 'undefined') global.BACKEND_URL = BACKEND_URL;
  if (typeof logger !== 'undefined') global.logger = logger;
}

/**
 * Carga solo el IIFE de autenticación de admin.js para testear el redirect
 * @returns {string} - El contenido del IIFE
 */
function getAuthIIFE() {
  const filePath = path.resolve(__dirname, '..', 'admin/js/admin.js');
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(
    /\(function\s+checkAuth\s*\(\)\s*\{[\s\S]*?\}\)\(\)\s*;/
  );
  return match ? match[0] : null;
}

/**
 * Crea un mock de booking para tests
 */
function createMockBooking(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439011',
    client: {
      name: 'Juan Pérez',
      email: 'juan@test.com',
      phone: '099123456',
      id: '12345678',
    },
    service: {
      id: 'corte-cabello',
      name: 'Corte comun (Barbería)',
      price: 450,
      duration: 45,
    },
    professional: {
      id: 'cesar-viloria',
      name: 'Cesar Viloria',
    },
    date: '2026-03-25',
    time: '10:00',
    notes: '',
    status: 'confirmed',
    ...overrides,
  };
}

module.exports = { loadScript, loadScriptSkipAuth, getAuthIIFE, createMockBooking };
