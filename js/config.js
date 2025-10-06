// ===== CONFIGURACIÓN CENTRALIZADA =====
const APP_CONFIG = {
    BACKEND_URL: (() => {
        const isProduction = window.location.hostname === 'bookingappservice.netlify.app';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        console.log('🌍 Hostname actual:', window.location.hostname);
        console.log('� Es producción:', isProduction);
        console.log('💻 Es localhost:', isLocalhost);

        if (isProduction) {
            // Actualizado para coincidir con la URL de Render desplegada
            return 'https://bookingapp-back-um0l.onrender.com';
        } else if (isLocalhost) {
            return 'http://localhost:3000';
        }
        // Fallback: si no coincide producción ni localhost, usar localhost
        return 'http://localhost:3000';
    })(),
    
    BUSINESS_HOURS: {
        start: 9,
        end: 17,
        interval: 60
    },
    
    CANCELLATION_HOURS: 5,
    TOAST_DURATION: 3000,
    ITEMS_PER_PAGE: 10
};

console.log('🚀 URL del backend configurada:', APP_CONFIG.BACKEND_URL);

// Exportar para uso global
window.APP_CONFIG = APP_CONFIG;
