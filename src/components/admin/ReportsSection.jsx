import BookingsChart from './BookingsChart.jsx';
import Card from './Card.jsx';
import SectionHeader from './SectionHeader.jsx';
import ServicesChart from './ServicesChart.jsx';

export default function ReportsSection({ bookings }) {
  return (
    <section aria-label="Reportes">
      <SectionHeader title="Reportes y Estadísticas" />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card title="Reservas por Mes">
          <BookingsChart bookings={bookings} />
        </Card>
        <Card title="Servicios Más Populares">
          <ServicesChart bookings={bookings} />
        </Card>
      </div>
    </section>
  );
}
