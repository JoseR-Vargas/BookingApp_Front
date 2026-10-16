import { useRef } from 'react';
import { usePrelineInstance } from '../../lib/usePrelineInstance.js';
import { CONTROL_CLASSES } from '../ui/controls.js';
import { getProfessionalName } from '../../utils/adminStats.js';
import { formatBookingDate } from '../../utils/format.js';
import { decodeEntities } from '../../utils/sanitize.js';
import {
  EMPTY_CELL as EMPTY_CELL_BASE, LINK_BUTTON, TABLE, TABLE_SCROLL, TABLE_WRAPPER, TBODY, TD as TD_BASE,
  TD_ACTIONS as TD_ACTIONS_BASE, TD_FIRST as TD_FIRST_BASE, TH as TH_BASE, TH_END, TH_START, TR, compact,
} from './tableStyles.js';

const TH = compact(TH_BASE);
const TD = compact(TD_BASE);
const TD_FIRST = compact(TD_FIRST_BASE);
const TD_ACTIONS = compact(TD_ACTIONS_BASE);
const EMPTY_CELL = compact(EMPTY_CELL_BASE);

const COLUMNS = ['Cliente', 'Teléfono', 'Servicio', 'Fecha', 'Hora', 'Barbero', 'Notas', 'Acciones'];
const ACTIONS_COLUMN = COLUMNS.length - 1;
const PAGE_LENGTH = 10;

// Long notes are truncated to one line; on hover the full text floats over the row (legacy `.notes-cell`).
const NOTES_CELL = 'group/notes relative max-w-[160px]';
const NOTES_TEXT =
  'block overflow-hidden text-[0.9rem] text-ellipsis whitespace-nowrap text-foreground group-hover/notes:absolute group-hover/notes:z-1000 group-hover/notes:max-w-[300px] group-hover/notes:min-w-[200px] group-hover/notes:rounded-md group-hover/notes:border group-hover/notes:border-border group-hover/notes:bg-bg-secondary group-hover/notes:p-2 group-hover/notes:break-words group-hover/notes:whitespace-normal group-hover/notes:shadow-md';

// datatables.net strings. `info`/`search`/paging text live in the markup below (Preline's
// `data-hs-datatable-*` controls), only the table body messages and ARIA hints come from here.
const LANGUAGE = {
  emptyTable: 'No hay reservas registradas',
  zeroRecords: 'No se encontraron reservas',
  aria: {
    orderable: ': activar para ordenar',
    orderableReverse: ': activar para invertir el orden',
    orderableRemove: ': activar para quitar el orden',
  },
};

const PAGE_BUTTON = 'min-w-10 flex justify-center items-center rounded-full py-2.5 text-sm text-text-primary hover:bg-accent-muted focus:outline-hidden focus-visible:bg-accent-muted disabled:pointer-events-none disabled:opacity-50';
const PAGE_ARROW = 'inline-flex min-w-10 items-center justify-center gap-x-2 rounded-full p-2.5 text-sm text-text-primary hover:bg-accent-muted focus:outline-hidden focus-visible:bg-accent-muted disabled:pointer-events-none disabled:opacity-50';

// datatables puts an empty, focusable `.dt-column-order` button in every sortable header (the
// keyboard way to sort). Stretched over the header cell it becomes the click target and shows a
// visible focus ring.
const SORTABLE =
  `${TH_START} relative cursor-pointer select-none touch:h-11 [&_.dt-column-order]:absolute [&_.dt-column-order]:inset-x-0 [&_.dt-column-order]:top-0 [&_.dt-column-order]:-bottom-px [&_.dt-column-order]:focus-visible:outline-2 [&_.dt-column-order]:focus-visible:-outline-offset-2 [&_.dt-column-order]:focus-visible:outline-accent`;

function BookingRow({ booking, onDelete }) {
  const notes = decodeEntities(booking.notes);
  return (
    <tr className={TR}>
      <td className={TD_FIRST}>
        <div>
          <strong className="font-bold">{decodeEntities(booking.client.name)}</strong>
          <br />
          <small className="text-[0.875em] text-muted-foreground-1">{decodeEntities(booking.client.email)}</small>
        </div>
      </td>
      <td className={TD}>
        <strong className="font-bold">{decodeEntities(booking.client.phone) || 'N/A'}</strong>
      </td>
      <td className={TD}>
        <div>
          <strong className="font-bold">{booking.service.name}</strong>
          <br />
          <small className="text-[0.875em] text-muted-foreground-1">${booking.service.price}</small>
        </div>
      </td>
      {/* data-order: datatables sorts by the ISO date instead of the localized text. */}
      <td className={TD} data-order={booking.date}>{formatBookingDate(booking.date)}</td>
      <td className={TD}>{booking.time}</td>
      <td className={TD}>{getProfessionalName(booking)}</td>
      <td className={TD}>
        {notes ? (
          <div className={NOTES_CELL}>
            <span className={NOTES_TEXT} title={notes}>{notes}</span>
          </div>
        ) : (
          <span className="text-muted-foreground-1">Sin notas</span>
        )}
      </td>
      <td className={TD_ACTIONS}>
        {/* Preline text-link button (icon only: the column stays narrow). Destructive action, so it keeps the error color instead of the primary gold. */}
        <button
          type="button"
          title="Eliminar reserva"
          aria-label="Eliminar reserva"
          onClick={() => onDelete(booking)}
          className={`${LINK_BUTTON} text-error hover:text-destructive-hover focus:text-destructive-hover`}
        >
          <i aria-hidden="true" className="fas fa-trash text-sm" />
        </button>
      </td>
    </tr>
  );
}

function SortIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-3.5 shrink-0 text-text-muted"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path className="hs-datatable-ordering-desc:text-accent" d="m7 15 5 5 5-5" />
      <path className="hs-datatable-ordering-asc:text-accent" d="m7 9 5-5 5 5" />
    </svg>
  );
}

/** Everything the table renders, so an unchanged refresh can be told apart from a real change. */
function bookingsSignature(bookings) {
  return JSON.stringify(bookings.map((booking) => [
    booking._id,
    booking.client,
    booking.service,
    booking.date,
    booking.time,
    getProfessionalName(booking),
    booking.notes,
  ]));
}

/**
 * Bookings with Preline's datatable (search, column sorting, pagination).
 *
 * DOM ownership: datatables.net takes over the <table>: it keeps the original <tr> elements in
 * memory, re-appends the ones for the current page/sort/filter into <tbody> and restructures the
 * wrapper. React must therefore never reconcile these rows after the plugin started. The body is
 * keyed by the data signature: any real data change replaces the whole subtree (React drops it in
 * one piece, the plugin is destroyed and rebuilt on the fresh rows), while renders that bring the
 * same data change nothing. The search text and the sort order survive the rebuild via `viewState`.
 *
 * Cell text is read by datatables from the DOM (no `data`/`render` options), so booking fields are
 * never interpreted as HTML.
 */
function BookingsDataTable({ bookings, onDelete, viewState }) {
  const rootRef = useRef(null);

  usePrelineInstance(
    'datatable',
    rootRef,
    {
      // Evaluated when the plugin is built, after the previous table's cleanup saved its state.
      options: () => {
        const { search, order } = viewState.current;
        const searchInput = rootRef.current.querySelector('[data-hs-datatable-search]');
        if (searchInput) searchInput.value = search;
        return { language: LANGUAGE, pageLength: PAGE_LENGTH, order, search: { search } };
      },
      setup: (instance) => () => {
        const { dataTable } = instance;
        if (dataTable) viewState.current = { search: dataTable.search(), order: dataTable.order() };
      },
    },
    [],
  );

  return (
    <div
      ref={rootRef}
      data-hs-datatable={JSON.stringify({ pagingOptions: { pageBtnClasses: PAGE_BUTTON } })}
    >
      <div className="relative mb-4 max-w-xs">
        <label htmlFor="bookings-search" className="sr-only">Buscar reservas</label>
        <input
          id="bookings-search"
          type="text"
          placeholder="Buscar..."
          data-hs-datatable-search
          className={`${CONTROL_CLASSES} pl-9`}
        />
        <i
          aria-hidden="true"
          className="fas fa-search pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-text-muted"
        />
      </div>

      <div className={TABLE_WRAPPER}>
        <div className={TABLE_SCROLL}>
          <table aria-label="Reservas" className={TABLE}>
            <thead>
              <tr>
                {COLUMNS.map((column, index) => (
                  <th
                    key={column}
                    scope="col"
                    className={`${TH} ${index === ACTIONS_COLUMN ? `--exclude-from-ordering ${TH_END}` : SORTABLE}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {column}
                      {index !== ACTIONS_COLUMN && <SortIcon />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={TBODY}>
              {bookings.map((booking) => (
                <BookingRow key={booking._id} booking={booking} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm whitespace-nowrap text-text-secondary lte-sm:whitespace-normal" data-hs-datatable-info>
          Mostrando <span data-hs-datatable-info-from /> a <span data-hs-datatable-info-to /> de{' '}
          <span data-hs-datatable-info-length /> reservas
        </div>
        <div className="flex hidden items-center space-x-1 [&_.active]:bg-accent-muted [&_.active]:text-accent" data-hs-datatable-paging>
          <button type="button" className={PAGE_ARROW} data-hs-datatable-paging-prev>
            <span aria-hidden="true">«</span>
            <span>Anterior</span>
          </button>
          <div className="flex items-center space-x-1" data-hs-datatable-paging-pages />
          <button type="button" className={PAGE_ARROW} data-hs-datatable-paging-next>
            <span>Siguiente</span>
            <span aria-hidden="true">»</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Legacy empty state: a plain table (datatables does not support a colspan row as its only row). */
function EmptyBookingsTable() {
  return (
    <div className={TABLE_WRAPPER}>
      <div className={TABLE_SCROLL}>
        <table aria-label="Reservas" className={TABLE}>
          <thead>
            <tr>
              {COLUMNS.map((column, index) => (
                <th key={column} scope="col" className={`${TH} ${index === ACTIONS_COLUMN ? TH_END : TH_START}`}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={TBODY}>
            <tr>
              <td colSpan={8} className={EMPTY_CELL}>No hay reservas registradas</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Full bookings table. `onDelete` receives the booking OBJECT: the id never travels through
 * string-built HTML. Every user-provided string is decoded and rendered as text.
 */
export default function BookingsTable({ bookings, onDelete }) {
  // Search text / sort order to carry over when the table has to be rebuilt after a data change.
  const viewState = useRef({ search: '', order: [] });

  if (bookings.length === 0) {
    viewState.current = { search: '', order: [] };
    return <EmptyBookingsTable />;
  }

  return (
    <BookingsDataTable
      key={bookingsSignature(bookings)}
      bookings={bookings}
      onDelete={onDelete}
      viewState={viewState}
    />
  );
}
