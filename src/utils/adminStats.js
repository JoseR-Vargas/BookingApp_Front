// ===== ESTADÍSTICAS DEL PANEL ADMIN =====
// Pure helpers extracted from legacy admin-app.js (recent list, filter, revenue, charts data).

// Newest first by createdAt. Works on a copy (legacy sorted the fetched array in place).
export function getRecentBookings(bookings, n = 5) {
  return [...(bookings || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, n);
}

// Exact-date filter; an empty date means "no filter".
export function filterByDate(bookings, date) {
  const list = bookings || [];
  return date ? list.filter((b) => b.date === date) : list;
}

export function sumConfirmedRevenue(bookings) {
  return (bookings || [])
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + ((b.service && b.service.price) || 0), 0);
}

// Bookings per month (Jan..Dec) for one year; `date` is 'YYYY-MM-DD'.
export function getMonthlyCounts(bookings, year = new Date().getFullYear()) {
  const counts = Array(12).fill(0);
  (bookings || []).forEach((booking) => {
    const parts = booking.date ? booking.date.split('-') : [];
    if (parts.length === 3 && parseInt(parts[0]) === year) {
      const monthIndex = parseInt(parts[1]) - 1;
      if (monthIndex >= 0 && monthIndex < 12) counts[monthIndex]++;
    }
  });
  return counts;
}

export function getServiceCounts(bookings) {
  const serviceCounts = {};
  (bookings || []).forEach((booking) => {
    const name = booking.service && booking.service.name;
    if (name) serviceCounts[name] = (serviceCounts[name] || 0) + 1;
  });
  return { labels: Object.keys(serviceCounts), data: Object.values(serviceCounts) };
}

// Legacy records may carry `barber` instead of `professional`.
export function getProfessionalName(booking) {
  return (booking.professional && booking.professional.name)
    || (booking.barber && booking.barber.name)
    || 'N/A';
}
