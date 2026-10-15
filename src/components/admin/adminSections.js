// Sections of the admin panel (state-driven, no sub-routes). Titles are the legacy `titles` map.

export const NAV_ITEMS = [
  { section: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { section: 'bookings', label: 'Reservas', icon: 'fas fa-calendar-check' },
  { section: 'reports', label: 'Reportes', icon: 'fas fa-chart-bar' },
];

export const SECTION_TITLES = {
  dashboard: 'Dashboard',
  bookings: 'Gestión de Reservas',
  reports: 'Reportes y Estadísticas',
};
