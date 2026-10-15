// Admin panel (guarded by RequireAuth in App.jsx). Port of legacy admin.html + admin-app.js.
// Sections are state-driven (no sub-routes), like the legacy show/hide of `.content-section`.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import BookingsSection from '../components/admin/BookingsSection.jsx';
import DashboardSection from '../components/admin/DashboardSection.jsx';
import ReportsSection from '../components/admin/ReportsSection.jsx';
import Sidebar from '../components/admin/Sidebar.jsx';
import Topbar from '../components/admin/Topbar.jsx';
import { SECTION_TITLES } from '../components/admin/adminSections.js';
import { useAdminData } from '../hooks/useAdminData.js';
import { useBookingNotifications } from '../hooks/useBookingNotifications.js';
import { authService } from '../services/authService.js';
import { toast } from '../ui/toast.js';

// Legacy toggleSidebar: below this width the sidebar is an off-canvas drawer.
const MOBILE_MAX_WIDTH = 768;

export default function Admin() {
  const navigate = useNavigate();
  const data = useAdminData();
  const { loadDashboard, loadBookings } = data;

  const [section, setSection] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const notifications = useBookingNotifications(async () => {
    toast.success('Nueva reserva recibida!');
    await loadDashboard();
    if (section === 'bookings') await loadBookings();
  });

  // Legacy init(): dashboard first, then the bookings list (the charts read the same data).
  useEffect(() => {
    (async () => {
      await loadDashboard();
      await loadBookings();
    })();
  }, [loadDashboard, loadBookings]);

  const toggleSidebar = () => {
    setCollapsed((value) => !value);
    if (window.innerWidth <= MOBILE_MAX_WIDTH) setDrawerOpen((value) => !value);
  };

  // On mobile the sidebar is a modal drawer: picking a section must dismiss it, otherwise its
  // backdrop keeps blocking the page. Desktop sidebar state is left alone.
  const handleNavigate = (key) => {
    setSection(key);
    if (window.innerWidth <= MOBILE_MAX_WIDTH) setDrawerOpen(false);
  };

  const handleBellClick = () => {
    notifications.clearCount();
    setSection('bookings');
    loadBookings();
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      authService.logout();
      navigate('/login');
    }
  };

  return (
    <AdminLayout
      collapsed={collapsed}
      sidebar={(
        <Sidebar
          collapsed={collapsed}
          show={drawerOpen}
          section={section}
          onNavigate={handleNavigate}
          onShowChange={setDrawerOpen}
        />
      )}
      topbar={(
        <Topbar
          title={SECTION_TITLES[section] || SECTION_TITLES.dashboard}
          userName={authService.getUser() || 'Admin'}
          needsSoundActivation={notifications.needsSoundActivation}
          notificationCount={notifications.count}
          onToggleSidebar={toggleSidebar}
          onEnableSound={notifications.activateSound}
          onBellClick={handleBellClick}
          onLogout={handleLogout}
        />
      )}
    >
      {section === 'dashboard' && (
        <DashboardSection stats={data.stats} recentBookings={data.recentBookings} />
      )}
      {section === 'bookings' && (
        <BookingsSection
          bookings={data.visibleBookings}
          filterDate={data.filterDate}
          professionals={data.professionals}
          professional={data.professional}
          onProfessionalChange={data.setProfessional}
          totalRevenue={data.filteredRevenue}
          onFilterChange={data.applyFilter}
          onClearFilters={data.clearFilters}
          onDelete={data.deleteBooking}
        />
      )}
      {section === 'reports' && <ReportsSection bookings={data.bookings} />}
    </AdminLayout>
  );
}
