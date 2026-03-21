// ===== MOCKS GLOBALES PARA JSDOM =====

// Mock de APP_CONFIG (replica la estructura de config.js)
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
};

// Mock de Toastify
window.Toastify = jest.fn(() => ({
  showToast: jest.fn(),
}));

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
    frequency: { setValueAtTime: jest.fn() },
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

// Mock de fetch global
global.fetch = jest.fn();

// Mock de confirm/alert
window.confirm = jest.fn(() => true);
window.alert = jest.fn();
