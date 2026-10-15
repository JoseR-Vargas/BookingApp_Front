// ===== DATOS DEL PANEL ADMIN =====
// Data + actions of the admin panel (port of the loading/filter/delete logic of legacy admin-app.js).
// There is ONE bookings list (the latest fetch); the "recent" table, the filtered table, the filtered
// revenue and the charts are all derived from it, so every view always shows the same data.

import { useCallback, useMemo, useState } from 'react';
import {
  deleteBooking as deleteBookingRequest,
  getBookings,
  getStatistics,
} from '../services/adminService.js';
import { toast } from '../ui/toast.js';
import { filterByDate, getRecentBookings, sumConfirmedRevenue } from '../utils/adminStats.js';
import { decodeEntities } from '../utils/sanitize.js';

const EMPTY_STATS = { totalBookings: 0, totalRevenue: 0, todayBookings: 0 };

export function useAdminData() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [bookings, setBookings] = useState([]);
  const [filterDate, setFilterDate] = useState('');

  const updateStatistics = useCallback(async () => {
    try {
      const data = await getStatistics();
      setStats({
        totalBookings: data.totalBookings || 0,
        totalRevenue: data.totalRevenue || 0,
        todayBookings: data.todayBookings || 0,
      });
    } catch (error) {
      toast.error('Error cargando estadísticas');
    }
  }, []);

  const loadRecentBookings = useCallback(async () => {
    try {
      setBookings(await getBookings());
    } catch (error) {
      toast.error('Error cargando reservas recientes');
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      await updateStatistics();
      await loadRecentBookings();
    } catch (error) {
      toast.error('Error cargando datos del dashboard');
    }
  }, [updateStatistics, loadRecentBookings]);

  const loadBookings = useCallback(async () => {
    try {
      setBookings(await getBookings());
    } catch (error) {
      toast.error('Error cargando reservas');
    }
  }, []);

  // Legacy refetched on every date change and filtered the fresh result.
  const applyFilter = useCallback(async (date) => {
    setFilterDate(date);
    try {
      const all = await getBookings();
      setBookings(all);
      const count = filterByDate(all, date).length;
      toast.info('Mostrando ' + count + ' reserva' + (count !== 1 ? 's' : ''));
    } catch (error) {
      toast.error('Error aplicando filtros');
    }
  }, []);

  const clearFilters = useCallback(async () => {
    setFilterDate('');
    await loadBookings();
    toast.info('Filtros limpiados');
  }, [loadBookings]);

  // Receives the booking object (never HTML strings): the id comes straight from the data.
  const deleteBooking = useCallback(async (booking) => {
    // Stored names are HTML-escaped by the legacy sender; show the readable text.
    const name = decodeEntities(booking.client && booking.client.name);
    if (!window.confirm('¿Estás seguro de que quieres eliminar la reserva de ' + name + '?\n\nEsta acción no se puede deshacer.')) {
      return;
    }
    try {
      toast.info('Eliminando reserva...');
      await deleteBookingRequest(booking._id);
      await loadDashboard();
      await loadBookings();
      toast.success('Reserva de ' + name + ' eliminada exitosamente');
    } catch (error) {
      toast.error('Error eliminando reserva: ' + error.message);
    }
  }, [loadDashboard, loadBookings]);

  const recentBookings = useMemo(() => getRecentBookings(bookings, 5), [bookings]);
  const visibleBookings = useMemo(() => filterByDate(bookings, filterDate), [bookings, filterDate]);
  const filteredRevenue = useMemo(() => sumConfirmedRevenue(visibleBookings), [visibleBookings]);

  return {
    stats,
    bookings,
    recentBookings,
    visibleBookings,
    filteredRevenue,
    filterDate,
    loadDashboard,
    loadBookings,
    applyFilter,
    clearFilters,
    deleteBooking,
  };
}
