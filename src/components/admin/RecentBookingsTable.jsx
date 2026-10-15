import { getProfessionalName } from '../../utils/adminStats.js';
import { formatBookingDate } from '../../utils/format.js';
import { decodeEntities } from '../../utils/sanitize.js';
import { EMPTY_CELL, TABLE, TD, TH, TR } from './tableStyles.js';

const COLUMNS = ['Cliente', 'Teléfono', 'Servicio', 'Fecha', 'Profesional'];

// User-provided strings are decoded and rendered as TEXT (React escapes them): never as markup.
export default function RecentBookingsTable({ bookings }) {
  return (
    <div className="overflow-x-auto">
      <table aria-label="Reservas recientes" className={TABLE}>
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
              <td colSpan={5} className={EMPTY_CELL}>No hay reservas recientes</td>
            </tr>
          )}
          {bookings.map((booking) => (
            <tr key={booking._id} className={TR}>
              <td className={TD}>{decodeEntities(booking.client.name)}</td>
              <td className={TD}>{decodeEntities(booking.client.phone) || 'N/A'}</td>
              <td className={TD}>{booking.service.name}</td>
              <td className={TD}>{formatBookingDate(booking.date)}</td>
              <td className={TD}>{getProfessionalName(booking)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
