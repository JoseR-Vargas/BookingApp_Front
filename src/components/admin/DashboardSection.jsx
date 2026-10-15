import { formatMoney } from '../../utils/format.js';
import Card from './Card.jsx';
import RecentBookingsTable from './RecentBookingsTable.jsx';
import StatCard from './StatCard.jsx';

export default function DashboardSection({ stats, recentBookings }) {
  return (
    <section aria-label="Dashboard">
      <div className="mb-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="fas fa-calendar-check" tone="accent" value={stats.totalBookings} label="Reservas Totales" />
        <StatCard icon="fas fa-dollar-sign" tone="warning" value={formatMoney(stats.totalRevenue)} label="Ingresos del Mes" />
        <StatCard icon="fas fa-clock" tone="info" value={stats.todayBookings} label="Reservas Hoy" />
      </div>

      <Card title="Reservas Recientes">
        <RecentBookingsTable bookings={recentBookings} />
      </Card>
    </section>
  );
}
