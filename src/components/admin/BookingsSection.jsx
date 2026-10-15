import Button from '../ui/Button.jsx';
import { CONTROL_CLASSES } from '../ui/controls.js';
import { formatMoney } from '../../utils/format.js';
import BookingsTable from './BookingsTable.jsx';
import Card from './Card.jsx';
import SectionHeader from './SectionHeader.jsx';

// Chrome adds 1-2px around the editable segments of a date input; the legacy reboot removed them.
const DATE_INPUT_RESET =
  '[&::-webkit-datetime-edit]:block [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0 [&::-webkit-datetime-edit-text]:p-0 [&::-webkit-datetime-edit-month-field]:p-0 [&::-webkit-datetime-edit-day-field]:p-0 [&::-webkit-datetime-edit-year-field]:p-0';

export default function BookingsSection({
  bookings,
  filterDate,
  totalRevenue,
  onFilterChange,
  onClearFilters,
  onDelete,
}) {
  return (
    <section aria-label="Reservas">
      <SectionHeader title="Gestión de Reservas" />

      {/* At <= 576px the legacy row lost its negative margins, so the two columns keep their own 8px inset. */}
      <div className="mb-6 rounded-lg border border-border-subtle bg-bg-secondary p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lte-sm:px-2 lte-sm:pt-4">
          <input
            type="date"
            aria-label="Filtrar por fecha"
            value={filterDate}
            onChange={(event) => onFilterChange(event.target.value)}
            className={`${CONTROL_CLASSES} ${DATE_INPUT_RESET}`}
          />
          <div className="flex items-center justify-between">
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
