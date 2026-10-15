import Button from '../ui/Button.jsx';
import { getProfessionalName } from '../../utils/adminStats.js';
import { formatBookingDate } from '../../utils/format.js';
import { decodeEntities } from '../../utils/sanitize.js';
import { EMPTY_CELL, TABLE, TD, TH, TR } from './tableStyles.js';

const COLUMNS = ['Cliente', 'Teléfono', 'Servicio', 'Fecha', 'Hora', 'Barbero', 'Notas', 'Acciones'];

// Long notes are truncated to one line; on hover the full text floats over the row (legacy `.notes-cell`).
const NOTES_CELL = 'group/notes relative max-w-[200px]';
const NOTES_TEXT =
  'block overflow-hidden text-[0.9rem] text-ellipsis whitespace-nowrap text-text-primary group-hover/notes:absolute group-hover/notes:z-1000 group-hover/notes:max-w-[300px] group-hover/notes:min-w-[200px] group-hover/notes:rounded-md group-hover/notes:border group-hover/notes:border-border group-hover/notes:bg-bg-secondary group-hover/notes:p-2 group-hover/notes:break-words group-hover/notes:whitespace-normal group-hover/notes:shadow-md';

/**
 * Full bookings table. `onDelete` receives the booking OBJECT: the id never travels through
 * string-built HTML. Every user-provided string is decoded and rendered as text.
 */
export default function BookingsTable({ bookings, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table aria-label="Reservas" className={TABLE}>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} className={TH}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 && (
            <tr>
              <td colSpan={8} className={EMPTY_CELL}>No hay reservas registradas</td>
            </tr>
          )}
          {bookings.map((booking) => {
            const notes = decodeEntities(booking.notes);
            return (
              <tr key={booking._id} className={TR}>
                <td className={TD}>
                  <div>
                    <strong className="font-bold">{decodeEntities(booking.client.name)}</strong>
                    <br />
                    <small className="text-[0.875em] text-text-secondary">{decodeEntities(booking.client.email)}</small>
                  </div>
                </td>
                <td className={TD}>
                  <strong className="font-bold">{decodeEntities(booking.client.phone) || 'N/A'}</strong>
                </td>
                <td className={TD}>
                  <div>
                    <strong className="font-bold">{booking.service.name}</strong>
                    <br />
                    <small className="text-[0.875em] text-text-secondary">${booking.service.price}</small>
                  </div>
                </td>
                <td className={TD}>{formatBookingDate(booking.date)}</td>
                <td className={TD}>{booking.time}</td>
                <td className={TD}>{getProfessionalName(booking)}</td>
                <td className={TD}>
                  {notes ? (
                    <div className={NOTES_CELL}>
                      <span className={NOTES_TEXT} title={notes}>{notes}</span>
                    </div>
                  ) : (
                    <span className="text-text-secondary">Sin notas</span>
                  )}
                </td>
                <td className={TD}>
                  <Button
                    variant="danger"
                    size="xs"
                    title="Eliminar reserva"
                    aria-label="Eliminar reserva"
                    onClick={() => onDelete(booking)}
                    className="mx-auto size-8 p-0 hover:scale-105 hover:shadow-[0_2px_8px_rgba(224,82,82,0.3)]"
                  >
                    <i aria-hidden="true" className="fas fa-trash text-sm" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
