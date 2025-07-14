# Barbería Premium - Sistema de Reserva de Citas

## 📋 Descripción

Sistema de reserva de citas para barbería desarrollado con HTML, CSS y JavaScript puro. Diseñado para ser escalable y reutilizable para diferentes tipos de negocios.

## 🎯 Características

### ✅ Funcionalidades Implementadas
- **Reserva de Citas**: Proceso de 3 pasos (servicio, fecha/hora, datos cliente)
- **Selección de Servicios**: 3 servicios de barbería con precios y duración
- **Calendario Inteligente**: Horarios de 9:00 AM a 6:00 PM, domingos cerrados
- **Validaciones**: Formularios con validación HTML5 y JavaScript
- **Notificaciones**: Toastify para confirmaciones y errores
- **Responsive**: Diseño adaptativo para móviles y desktop
- **Accesibilidad**: ARIA labels y navegación por teclado

### 🔧 Configuración
- **Horarios de Negocio**: 9:00 AM - 6:00 PM (Lun-Sáb)
- **Cancelación**: 5 horas de anticipación requeridas
- **Servicios**: 3 servicios configurables
- **Barberos**: Asignación específica por servicio

## 📁 Estructura del Proyecto

```
Booking_front/
├── pages/
│   └── index.html          # Página principal
├── css/
│   └── styles.css          # Estilos CSS
├── js/
│   └── script.js           # Lógica JavaScript
├── img/                    # Imágenes (futuro)
└── README.md              # Documentación
```

## 🚀 Instalación y Uso

### Requisitos
- Navegador web moderno
- Servidor local (opcional, para desarrollo)

### Instalación
1. Clona o descarga el proyecto
2. Abre `pages/index.html` en tu navegador
3. ¡Listo para usar!

### Desarrollo Local
```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx serve .

# Con PHP
php -S localhost:8000
```

## 🎨 Diseño y UX

### Principios Aplicados
- **DRY**: Don't Repeat Yourself - Código reutilizable
- **SOLID**: Principios de diseño orientado a objetos
- **YAGNI**: You Aren't Gonna Need It - Solo funcionalidades necesarias

### Características de Diseño
- **Moderno**: Gradientes y sombras sutiles
- **Responsive**: Bootstrap 5 + CSS personalizado
- **Accesible**: Navegación por teclado y lectores de pantalla
- **Performance**: Carga rápida, sin dependencias pesadas

## 📊 Servicios Configurados

| Servicio | Precio | Duración | Barbero |
|----------|--------|----------|---------|
| Corte de Cabello | $25.000 | 45 min | Carlos Rodríguez |
| Arreglo de Barba | $20.000 | 30 min | Miguel Silva |
| Corte + Barba | $40.000 | 75 min | Carlos Rodríguez |

## 🔧 Configuración

### Modificar Servicios
Edita el array `SERVICES` en `js/script.js`:

```javascript
const SERVICES = [
    {
        id: 'nuevo-servicio',
        name: 'Nuevo Servicio',
        description: 'Descripción del servicio',
        price: 30000,
        duration: 60,
        barber: 'Nombre del Barbero',
        icon: 'fas fa-icon-name'
    }
];
```

### Cambiar Horarios
Modifica `CONFIG.BUSINESS_HOURS` en `js/script.js`:

```javascript
const CONFIG = {
    BUSINESS_HOURS: {
        start: 9,    // Hora de inicio
        end: 17,     // Hora de cierre
        interval: 60 // Intervalo en minutos
    }
};
```

### Personalizar Colores
Edita las variables CSS en `css/styles.css`:

```css
:root {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    /* ... más variables */
}
```

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 992px
- **Tablet**: 768px - 991px
- **Mobile**: < 768px

### Características Mobile
- Navegación hamburguesa
- Modal optimizado para touch
- Botones grandes para dedos
- Texto legible en pantallas pequeñas

## 🔒 Validaciones

### Frontend
- ✅ Campos requeridos
- ✅ Formato de email
- ✅ Fecha futura obligatoria
- ✅ Horarios de negocio
- ✅ Términos y condiciones

### Backend (Futuro)
- 🔄 Validación de disponibilidad
- 🔄 Verificación de datos
- 🔄 Confirmación por email
- 🔄 Base de datos de reservas

## 🎯 Funcionalidades Futuras

### Próximas Implementaciones
- [ ] Panel de administración
- [ ] Gestión de barberos
- [ ] Sistema de pagos
- [ ] Notificaciones SMS
- [ ] Calendario de disponibilidad
- [ ] Historial de reservas
- [ ] Sistema de fidelización

### Integración Backend
- [ ] API REST
- [ ] Base de datos
- [ ] Autenticación
- [ ] Email automático
- [ ] SMS confirmación

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: Variables CSS, Flexbox, Grid
- **JavaScript ES6+**: Módulos, async/await
- **Bootstrap 5**: Componentes UI
- **Font Awesome**: Iconos
- **Toastify**: Notificaciones

### Principios de Código
- **Modular**: Funciones reutilizables
- **Escalable**: Fácil agregar funcionalidades
- **Mantenible**: Código limpio y documentado
- **Performance**: Carga rápida y eficiente

## 📞 Soporte

### Contacto
- **Email**: jrvn.dev@gmail.com
- **Teléfono**: +598 98 115 693

### Reportar Issues
1. Revisa la documentación
2. Verifica la consola del navegador
3. Contacta al desarrollador

## 📄 Licencia

Este proyecto está bajo licencia MIT. Puedes usarlo libremente para proyectos comerciales y personales.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

---

**Desarrollado con ❤️ por JRVN Dev** 