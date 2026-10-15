// ===== DETECCIÓN DE DISPOSITIVO / CONEXIÓN =====
// Ported from legacy booking-app.js. Same logic, read through globalThis.

export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(globalThis.navigator.userAgent) ||
    (globalThis.innerWidth <= 768);
}

export function isSlowConnection() {
  const nav = globalThis.navigator;
  if ('connection' in nav) {
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    return !!connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  }
  return false;
}
