// ===== CONFIGURACIÓN CENTRALIZADA =====
const APP_CONFIG = {
    BACKEND_URL: (() => {
        const isProduction = window.location.hostname === 'bigligasbeautybarberstudio.netlify.app';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

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
        end: 20,
        interval: 60,
        lunchBreak: {
            start: 13,
            end: 14
        }
    },
    
    CANCELLATION_HOURS: 5,
    TOAST_DURATION: 3000,
    ITEMS_PER_PAGE: 10
};

// Exportar para uso global
window.APP_CONFIG = APP_CONFIG;
