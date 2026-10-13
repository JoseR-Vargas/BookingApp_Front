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
            end: 14,
        },
    },

    CANCELLATION_HOURS: 5,
    TOAST_DURATION: 3000,
    ITEMS_PER_PAGE: 10,

    // ===== DATOS DE NEGOCIO =====
    // Fuente de verdad única — no duplicar en booking-app.js ni en ningún otro módulo.
    PROFESSIONALS: [
        {
            id: 'alex-garcia',
            name: 'Alex García',
            specialty: 'Especialista',
            experience: '8 años',
            rating: 4.9,
            avatar: 'fas fa-user-tie',
            available: true,
        },
        {
            id: 'maria-lopez',
            name: 'María López',
            specialty: 'Consultora',
            experience: '6 años',
            rating: 4.8,
            avatar: 'fas fa-user',
            available: true,
        },
    ],

    SERVICES: [
        {
            id: 'consulta-inicial',
            name: 'Consulta Inicial',
            description: 'Sesión introductoria para evaluar tus necesidades',
            price: 500,
            duration: 30,
            professionals: ['alex-garcia', 'maria-lopez'],
            icon: 'fas fa-clipboard-list',
        },
        {
            id: 'servicio-basico',
            name: 'Servicio Básico',
            description: 'Atención estándar completa con seguimiento profesional',
            price: 1200,
            duration: 60,
            professionals: ['alex-garcia', 'maria-lopez'],
            icon: 'fas fa-star',
        },
        {
            id: 'servicio-premium',
            name: 'Servicio Premium',
            description: 'Experiencia premium con atención prioritaria y resultados garantizados',
            price: 2500,
            duration: 90,
            professionals: ['alex-garcia', 'maria-lopez'],
            icon: 'fas fa-gem',
        },
        {
            id: 'sesion-expres',
            name: 'Sesión Exprés',
            description: 'Atención rápida y efectiva para ajustarse a tu agenda',
            price: 700,
            duration: 20,
            professionals: ['alex-garcia', 'maria-lopez'],
            icon: 'fas fa-bolt',
        },
    ],
};

// Exportar para uso global
window.APP_CONFIG = APP_CONFIG;
