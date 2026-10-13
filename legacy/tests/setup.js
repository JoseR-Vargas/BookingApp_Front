// ===== MOCKS GLOBALES PARA JSDOM =====

// Mock de APP_CONFIG (replica la estructura completa de config.js)
window.APP_CONFIG = {
  BACKEND_URL: 'http://localhost:3000',
  BUSINESS_HOURS: {
    start: 9,
    end: 20,
    interval: 60,
    lunchBreak: { start: 13, end: 14 },
  },
  CANCELLATION_HOURS: 5,
  TOAST_DURATION: 3000,
  ITEMS_PER_PAGE: 10,
  PROFESSIONALS: [
    { id: 'alex-garcia', name: 'Alex García', specialty: 'Especialista', experience: '8 años', rating: 4.9, avatar: 'fas fa-user-tie', available: true },
    { id: 'maria-lopez', name: 'María López', specialty: 'Consultora', experience: '6 años', rating: 4.8, avatar: 'fas fa-user', available: true },
  ],
  SERVICES: [
    { id: 'consulta-inicial', name: 'Consulta Inicial', description: 'Sesión introductoria', price: 500, duration: 30, professionals: ['alex-garcia', 'maria-lopez'], icon: 'fas fa-clipboard-list' },
    { id: 'servicio-basico', name: 'Servicio Básico', description: 'Atención estándar', price: 1200, duration: 60, professionals: ['alex-garcia', 'maria-lopez'], icon: 'fas fa-star' },
    { id: 'servicio-premium', name: 'Servicio Premium', description: 'Experiencia premium', price: 2500, duration: 90, professionals: ['alex-garcia', 'maria-lopez'], icon: 'fas fa-gem' },
    { id: 'sesion-expres', name: 'Sesión Exprés', description: 'Atención rápida', price: 700, duration: 20, professionals: ['alex-garcia', 'maria-lopez'], icon: 'fas fa-bolt' },
  ],
};

// Mock del sistema custom de toasts
document.body.innerHTML += '<div id="lux-toast-container"></div>';

// Mock de window.toast (centralizado — evita llamadas a Toastify en tests)
window.toast = {
  show: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};

// Mock de bootstrap.Modal
const mockModalInstance = {
  show: jest.fn(),
  hide: jest.fn(),
  dispose: jest.fn(),
};

window.bootstrap = {
  Modal: jest.fn(() => mockModalInstance),
};
window.bootstrap.Modal.getInstance = jest.fn(() => mockModalInstance);

// Mock de Chart.js
window.Chart = jest.fn(() => ({
  destroy: jest.fn(),
  update: jest.fn(),
}));

// Mock de Socket.IO
window.io = jest.fn(() => ({
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock de AudioContext
window.AudioContext = jest.fn(() => ({
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
  createOscillator: jest.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
    connect: jest.fn(),
  })),
  destination: {},
  currentTime: 0,
}));
window.webkitAudioContext = window.AudioContext;

// Mock de audioService
window.audioService = {
  init: jest.fn(),
  activate: jest.fn(),
  play: jest.fn(),
  playNotification: jest.fn(),
};

// Mock de notificationService
window.notificationService = {
  init: jest.fn(),
  getCount: jest.fn().mockReturnValue(0),
  clearCount: jest.fn(),
};

// Mock de fetch global
global.fetch = jest.fn();

// Mock de confirm/alert
window.confirm = jest.fn(() => true);
window.alert = jest.fn();
