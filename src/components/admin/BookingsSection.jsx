import Button from '../ui/Button.jsx';
import { CONTROL_CLASSES } from '../ui/controls.js';
import DatePicker from '../ui/DatePicker.jsx';
import { formatMoney } from '../../utils/format.js';
import BookingsTable from './BookingsTable.jsx';
import Card from './Card.jsx';
import ProfessionalFilter from './ProfessionalFilter.jsx';
import SectionHeader from './SectionHeader.jsx';

export default function BookingsSection({
  bookings,
  filterDate,
  professionals,
  professional,
  totalRevenue,
  onFilterChange,
  onProfessionalChange,
  onClearFilters,
  onDelete,
}) {
  return (
    <section aria-label="Reservas">
      <SectionHeader title="Gestión de Reservas" />

      {/* At <= 576px the legacy row lost its negative margins, so the two columns keep their own 8px inset. */}
      <div className="mb-6 rounded-lg border border-border-subtle bg-bg-secondary p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lte-sm:px-2 lte-sm:pt-4">
          <DatePicker
            ariaLabel="Filtrar por fecha"
            className={`${CONTROL_CLASSES} cursor-pointer`}
            placeholder="Filtrar por fecha"
            value={filterDate}
            onChange={onFilterChange}
          />
          <ProfessionalFilter
            professionals={professionals}
            value={professional}
            onChange={onProfessionalChange}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 md:col-span-2">
            <div>
              <span className="text-text-secondary">Total: </span>
              <span
                data-testid="filtered-total-revenue"
                className="text-lg leading-normal font-bold text-success"
              >
                {formatMoney(totalRevenue)}
              </span>
            </div>
            <Button variant="outlineSecondary" size="sm" onClick={onClearFilters} className="inline-block! text-center">
              <i aria-hidden="true" className="fas fa-sync-alt" /> Actualizar
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <BookingsTable bookings={bookings} onDelete={onDelete} />
      </Card>
    </section>
  );
}
