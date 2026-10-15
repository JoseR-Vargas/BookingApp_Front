import { StrictMode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadPreline } = vi.hoisted(() => ({ loadPreline: vi.fn() }));
vi.mock('../../lib/preline.js', () => ({ loadPreline }));

import BookingsTable from './BookingsTable.jsx';

const XSS = '<img src=x onerror=alert(1)>';

function booking(n, overrides = {}) {
  return {
    _id: `b${n}`,
    client: { name: `Cliente ${n}`, email: `c${n}@example.com`, phone: `0991100${n}` },
    service: { name: 'Servicio Básico', price: 1200 },
    professional: { name: 'Alex García' },
    date: `2026-03-1${n}`,
    time: '10:00',
    notes: '',
    status: 'confirmed',
    ...overrides,
  };
}

const instances = [];
class FakeDataTable {
  constructor(element, options) {
    this.el = element;
    this.options = options;
    this.destroy = vi.fn();
    this.dataTable = {
      search: vi.fn(() => ''),
      order: vi.fn(() => []),
      page: vi.fn(() => 0),
    };
    instances.push(this);
  }
}

beforeEach(() => {
  instances.length = 0;
  loadPreline.mockReset();
  loadPreline.mockResolvedValue(FakeDataTable);
});

describe('BookingsTable as a Preline datatable', () => {
  it('wraps the table in the Preline datatable markup: search, paging and info controls', () => {
    const { container } = render(<BookingsTable bookings={[booking(1), booking(2)]} onDelete={vi.fn()} />);

    const root = container.querySelector('[data-hs-datatable]');
    expect(root).not.toBeNull();
    expect(root.querySelector('table')).toBe(screen.getByRole('table', { name: 'Reservas' }));
    const search = root.querySelector('input[data-hs-datatable-search]');
    expect(search).toHaveAttribute('placeholder', 'Buscar...');
    expect(screen.getByLabelText('Buscar reservas')).toBe(search);
    expect(root.querySelector('[data-hs-datatable-paging]')).not.toBeNull();
    expect(root.querySelector('[data-hs-datatable-paging-prev]')).toHaveTextContent('Anterior');
    expect(root.querySelector('[data-hs-datatable-paging-next]')).toHaveTextContent('Siguiente');
    expect(root.querySelector('[data-hs-datatable-paging-pages]')).toBeEmptyDOMElement();
    expect(root.querySelector('[data-hs-datatable-info]')).toHaveTextContent('Mostrando');
  });

  it('keeps the 8 legacy columns and excludes only "Acciones" from ordering', () => {
    render(<BookingsTable bookings={[booking(1)]} onDelete={vi.fn()} />);

    const headers = screen.getAllByRole('columnheader');
    expect(headers.map((th) => th.textContent)).toEqual([
      'Cliente', 'Teléfono', 'Servicio', 'Fecha', 'Hora', 'Barbero', 'Notas', 'Acciones',
    ]);
    expect(headers.filter((th) => th.classList.contains('--exclude-from-ordering')))
      .toEqual([headers[7]]);
  });

  it('sorts the date column by the ISO date, not by the localized text', () => {
    render(<BookingsTable bookings={[booking(1)]} onDelete={vi.fn()} />);

    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
    expect(cells[3]).toHaveAttribute('data-order', '2026-03-11');
  });

  it('builds the plugin on the root with Spanish labels and DOM-sourced rows only', async () => {
    const { container } = render(<BookingsTable bookings={[booking(1)]} onDelete={vi.fn()} />);

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(loadPreline).toHaveBeenCalledWith('datatable');
    expect(instances[0].el).toBe(container.querySelector('[data-hs-datatable]'));
    const { options } = instances[0];
    expect(options.language).toMatchObject({
      emptyTable: 'No hay reservas registradas',
      zeroRecords: 'No se encontraron reservas',
    });
    expect(options.pageLength).toBe(10);
    // Text safety: rows come from React's DOM text, never from data/render callbacks that build HTML.
    expect(options.data).toBeUndefined();
    expect(options.columns).toBeUndefined();
    expect(options.columnDefs).toBeUndefined();
  });

  it('renders markup-looking client data as text and creates no elements from it', () => {
    const { container } = render(
      <BookingsTable
        bookings={[booking(1, { client: { name: XSS, email: XSS, phone: XSS }, notes: XSS })]}
        onDelete={vi.fn()}
      />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByText(XSS).length).toBeGreaterThanOrEqual(3);
  });

  it('still hands the booking object to onDelete', async () => {
    const onDelete = vi.fn();
    const target = booking(2);
    render(<BookingsTable bookings={[booking(1), target]} onDelete={onDelete} />);

    await userEvent.click(screen.getAllByRole('button', { name: 'Eliminar reserva' })[1]);

    expect(onDelete).toHaveBeenCalledWith(target);
  });

  it('shows the legacy empty state WITHOUT a datatable when there are no bookings', async () => {
    const { container } = render(<BookingsTable bookings={[]} onDelete={vi.fn()} />);

    expect(screen.getByText('No hay reservas registradas')).toHaveAttribute('colspan', '8');
    expect(container.querySelector('[data-hs-datatable]')).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(instances).toHaveLength(0);
  });

  it('destroys the plugin on unmount', async () => {
    const { unmount } = render(<BookingsTable bookings={[booking(1)]} onDelete={vi.fn()} />);
    await waitFor(() => expect(instances).toHaveLength(1));

    unmount();

    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  });

  it('does not rebuild when a refresh brings the same bookings in a new array', async () => {
    const { rerender } = render(<BookingsTable bookings={[booking(1), booking(2)]} onDelete={vi.fn()} />);
    await waitFor(() => expect(instances).toHaveLength(1));

    rerender(<BookingsTable bookings={[booking(1), booking(2)]} onDelete={vi.fn()} />);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(instances).toHaveLength(1);
    expect(instances[0].destroy).not.toHaveBeenCalled();
  });

  it('remounts on changed data (DataTables owns the rows) and restores search + order', async () => {
    const { rerender, container } = render(<BookingsTable bookings={[booking(1), booking(2)]} onDelete={vi.fn()} />);
    await waitFor(() => expect(instances).toHaveLength(1));
    const firstRoot = container.querySelector('[data-hs-datatable]');
    instances[0].dataTable.search.mockReturnValue('Cliente');
    instances[0].dataTable.order.mockReturnValue([[3, 'desc']]);

    rerender(<BookingsTable bookings={[booking(1)]} onDelete={vi.fn()} />);

    await waitFor(() => expect(instances).toHaveLength(2));
    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-hs-datatable]')).not.toBe(firstRoot);
    expect(instances[1].options.order).toEqual([[3, 'desc']]);
    expect(instances[1].options.search).toEqual({ search: 'Cliente' });
    expect(container.querySelector('[data-hs-datatable-search]')).toHaveValue('Cliente');
  });

  it('keeps one live plugin under StrictMode', async () => {
    render(<StrictMode><BookingsTable bookings={[booking(1)]} onDelete={vi.fn()} /></StrictMode>);

    await waitFor(() => expect(instances.length).toBeGreaterThan(0));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(instances.filter((i) => i.destroy.mock.calls.length === 0)).toHaveLength(1);
  });
});
