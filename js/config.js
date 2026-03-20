// ===== CONFIGURACIÓN CENTRALIZADA =====
const APP_CONFIG = {
    BACKEND_URL: (() => {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

        if (isLocalhost) {
            return 'http://localhost:3000';
        }
        // Producción: cualquier dominio que no sea localhost usa el backend de Vercel
        return 'https://booking-app-back.vercel.app';
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
