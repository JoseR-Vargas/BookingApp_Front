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
  let cleaned = removeDOMContentLoaded(content);
  // Convertir const/let a var para que escapen del eval al scope del llamante
  cleaned = cleaned.replace(/\b(const|let)\s/g, 'var ');

  // Bridge de variables de estado: si bookingState está disponible, delegar a él.
  // Esto permite que los tests lean/escriban las variables del flujo de reserva
  // tanto con la API antigua (currentStep = 1) como con la nueva (bookingState).
  cleaned += `
;(function() {
  var _stateVars = ['currentStep','selectedService','selectedDate','selectedTime','selectedProfessional','isSubmitting','eventListenersRegistered'];
  _stateVars.forEach(function(name) {
    try {
      Object.defineProperty(globalThis, name, {
        get: function() {
          if (typeof window !== 'undefined' && window.bookingState) {
            return window.bookingState.get(name);
          }
          try { return eval(name); } catch(e) { return undefined; }
        },
        set: function(v) {
          if (typeof window !== 'undefined' && window.bookingState) {
            window.bookingState.set(name, v);
            return;
          }
          try { eval(name + ' = v'); } catch(e) {}
        },
        configurable: true
      });
    } catch(e) {}
  });
})();
`;

  eval(cleaned);

  // Exportar módulos y funciones a global para acceso en tests
  // Módulos core
  if (typeof apiClient !== 'undefined') global.apiClient = apiClient;
  // Servicios
  if (typeof bookingService !== 'undefined') global.bookingService = bookingService;
  if (typeof adminService !== 'undefined') global.adminService = adminService;
  if (typeof authService !== 'undefined') global.authService = authService;
  // Estado
  if (typeof bookingState !== 'undefined') global.bookingState = bookingState;
  // UI
  if (typeof toast !== 'undefined') global.toast = toast;
  if (typeof renderServiceCard !== 'undefined') global.renderServiceCard = renderServiceCard;
  if (typeof renderServiceSelectionCard !== 'undefined') global.renderServiceSelectionCard = renderServiceSelectionCard;
  if (typeof renderProfessionalCard !== 'undefined') global.renderProfessionalCard = renderProfessionalCard;
  if (typeof renderTimeSlot !== 'undefined') global.renderTimeSlot = renderTimeSlot;
  if (typeof renderBookingRow !== 'undefined') global.renderBookingRow = renderBookingRow;
  if (typeof formatBookingDate !== 'undefined') global.formatBookingDate = formatBookingDate;
  // Orquestadores y config
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
  // Admin
  if (typeof adminApp !== 'undefined') global.adminApp = adminApp;
  if (typeof adminAPI !== 'undefined') global.adminAPI = adminAPI;
  if (typeof sanitizeInput !== 'undefined') global.sanitizeInput = sanitizeInput;
}

/**
 * Carga múltiples scripts en orden (simula la carga de módulos en <script> tags)
 * @param {string[]} relativePaths - Rutas relativas desde la raíz del proyecto
 */
function loadScripts(relativePaths) {
  relativePaths.forEach(function(p) { loadScript(p); });
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
      let braceStart = result.indexOf('{', idx);
      if (braceStart === -1) break;

      let depth = 0;
      let i = braceStart;
      for (; i < result.length; i++) {
        if (result[i] === '{') depth++;
        else if (result[i] === '}') depth--;
        if (depth === 0) break;
      }

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
 * Carga un archivo JS filtrando el IIFE de autenticación checkAuth
 * @param {string} relativePath - Ruta relativa desde la raíz del proyecto
 */
function loadScriptSkipAuth(relativePath) {
  const filePath = path.resolve(__dirname, '..', relativePath);
  const content = fs.readFileSync(filePath, 'utf8');
  let cleaned = content.replace(
    /\(function\s+checkAuth\s*\(\)\s*\{[\s\S]*?\}\)\(\)\s*;/,
    '// [TEST] checkAuth IIFE removido'
  );
  cleaned = removeDOMContentLoaded(cleaned);
  cleaned = cleaned.replace(/\b(const|let)\s/g, 'var ');
  eval(cleaned);
  // Exportar a global
  if (typeof adminApp !== 'undefined') global.adminApp = adminApp;
  if (typeof adminAPI !== 'undefined') global.adminAPI = adminAPI;
  if (typeof authService !== 'undefined') global.authService = authService;
  if (typeof audioService !== 'undefined') global.audioService = audioService;
  if (typeof notificationService !== 'undefined') global.notificationService = notificationService;
}

/**
 * Carga solo el IIFE de autenticación de admin-app.js para testear el redirect
 * @returns {string|null} - El contenido del IIFE
 */
function getAuthIIFE() {
  const filePath = path.resolve(__dirname, '..', 'js/admin-app.js');
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(
    /\(function\s+checkAuth\s*\(\)\s*\{[\s\S]*?\}\)\(\)\s*;/
  );
  return match ? match[0] : null;
}

/**
 * Crea un mock de booking para tests
 */
function createMockBooking(overrides) {
  return Object.assign({
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
  }, overrides || {});
}

module.exports = { loadScript, loadScripts, loadScriptSkipAuth, getAuthIIFE, createMockBooking };
