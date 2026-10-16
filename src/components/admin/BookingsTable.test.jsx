import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import BookingsTable from './BookingsTable.jsx';
import RecentBookingsTable from './RecentBookingsTable.jsx';

const XSS = '<img src=x onerror=alert(1)>';

function booking(overrides = {}) {
  return {
    _id: 'b1',
    client: { name: 'Ana', email: 'ana@example.com', phone: '099123456' },
    service: { name: 'Servicio Básico', price: 1200 },
    professional: { name: 'Alex García' },
    date: '2026-03-10',
    time: '10:00',
    notes: '',
    status: 'confirmed',
    ...overrides,
  };
}

describe('BookingsTable', () => {
  it('renders the 8 legacy columns', () => {
    render(<BookingsTable bookings={[booking()]} onDelete={vi.fn()} />);

    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent);
    expect(headers).toEqual([
      'Cliente', 'Teléfono', 'Servicio', 'Fecha', 'Hora', 'Barbero', 'Notas', 'Acciones',
    ]);
  });

  it('renders one row per booking with client email, service price, local date and time', () => {
    render(<BookingsTable bookings={[booking()]} onDelete={vi.fn()} />);

    const row = screen.getAllByRole('row')[1];
    const cells = within(row).getAllByRole('cell');
    expect(cells).toHaveLength(8);
    expect(cells[0]).toHaveTextContent('Ana');
    expect(cells[0]).toHaveTextContent('ana@example.com');
    expect(cells[1]).toHaveTextContent('099123456');
    expect(cells[2]).toHaveTextContent('Servicio Básico');
    expect(cells[2]).toHaveTextContent('$1200');
    expect(cells[3]).toHaveTextContent(/mar/i);
    expect(cells[3]).toHaveTextContent('10');
    expect(cells[4]).toHaveTextContent('10:00');
    expect(cells[5]).toHaveTextContent('Alex García');
  });

  it('shows the empty-state row spanning all 8 columns', () => {
    render(<BookingsTable bookings={[]} onDelete={vi.fn()} />);

    const cell = screen.getByText('No hay reservas registradas');
    expect(cell).toHaveAttribute('colspan', '8');
  });

  it('decodes the stored HTML entities of user-provided text', () => {
    render(
      <BookingsTable
        bookings={[booking({
          client: { name: 'Ana &amp; Co', email: 'a&amp;b@example.com', phone: '1' },
          notes: 'Trae &lt;gorro&gt; &quot;por favor&quot; &#x27;ok&#x27;',
        })]}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Ana & Co')).toBeInTheDocument();
    expect(screen.getByText('a&b@example.com')).toBeInTheDocument();
    expect(screen.getByText('Trae <gorro> "por favor" \'ok\'')).toBeInTheDocument();
    expect(screen.queryByText(/&amp;/)).not.toBeInTheDocument();
  });

  it('shows the notes text (with a title tooltip) or the muted "Sin notas"', () => {
    render(
      <BookingsTable
        bookings={[booking({ _id: 'a', notes: 'Llegaré tarde' }), booking({ _id: 'b', notes: '' })]}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Llegaré tarde')).toHaveAttribute('title', 'Llegaré tarde');
    expect(screen.getByText('Sin notas')).toBeInTheDocument();
  });

  it('falls back to "N/A" for a missing phone and uses the legacy `barber` when there is no professional', () => {
    render(
      <BookingsTable
        bookings={[booking({
          client: { name: 'Luis', email: 'l@x.com' },
          professional: undefined,
          barber: { name: 'Barbero Viejo' },
        })]}
        onDelete={vi.fn()}
      />,
    );

    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
    expect(cells[1]).toHaveTextContent('N/A');
    expect(cells[5]).toHaveTextContent('Barbero Viejo');
  });

  it('calls onDelete with the booking object (never string-built HTML)', async () => {
    const onDelete = vi.fn();
    const target = booking({ _id: 'zzz', client: { name: "O'Brien", email: 'o@b.com' } });
    render(<BookingsTable bookings={[booking(), target]} onDelete={onDelete} />);

    await userEvent.click(screen.getAllByRole('button', { name: 'Eliminar reserva' })[1]);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(target);
  });

  it('renders markup-looking client data as plain text and creates no elements from it', () => {
    const { container } = render(
      <BookingsTable
        bookings={[booking({
          client: { name: XSS, email: XSS, phone: XSS },
          notes: XSS,
        })]}
        onDelete={vi.fn()}
      />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByText(XSS).length).toBeGreaterThanOrEqual(3);
  });

  it('also renders the escaped form of an XSS payload as literal text', () => {
    const { container } = render(
      <BookingsTable
        bookings={[booking({ client: { name: '&lt;img src=x onerror=alert(1)&gt;', email: 'e@x.com' } })]}
        onDelete={vi.fn()}
      />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText(XSS)).toBeInTheDocument();
  });
});

describe('Preline table markup', () => {
  const scroller = (table) => table.parentElement;

  it('RecentBookingsTable wraps the table in the Preline scroll container', () => {
    render(<RecentBookingsTable bookings={[booking()]} />);

    const table = screen.getByRole('table', { name: 'Reservas recientes' });
    expect(table).toHaveClass('min-w-full', 'divide-y', 'divide-table-line');
    expect(scroller(table)).toHaveClass(
      'overflow-x-auto',
      '[&::-webkit-scrollbar]:h-2',
      '[&::-webkit-scrollbar-thumb]:rounded-none',
      '[&::-webkit-scrollbar-track]:bg-scrollbar-track',
      '[&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb',
    );
    expect(scroller(table).parentElement).toHaveClass('min-w-full');
    expect(table.querySelector('tbody')).toHaveClass('divide-y', 'divide-table-line');
  });

  it('RecentBookingsTable uses the Preline header and cell classes (last column aligned to the end)', () => {
    render(<RecentBookingsTable bookings={[booking()]} />);

    const headers = screen.getAllByRole('columnheader');
    headers.forEach((th) => {
      expect(th).toHaveAttribute('scope', 'col');
      expect(th).toHaveClass('px-6', 'py-3', 'text-xs', 'font-medium', 'text-muted-foreground-1', 'uppercase');
    });
    expect(headers[0]).toHaveClass('text-start');
    expect(headers[4]).toHaveClass('text-end');

    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
    expect(cells[0]).toHaveClass('px-6', 'py-4', 'text-sm', 'font-medium', 'text-foreground');
    expect(cells[0]).not.toHaveClass('whitespace-nowrap');
    expect(cells[1]).toHaveClass('px-6', 'py-4', 'whitespace-nowrap', 'text-sm', 'text-foreground');
    expect(cells[1]).not.toHaveClass('font-medium');
    expect(cells[4]).toHaveClass('text-end');
  });

  it('BookingsTable shares the scroll container, dividers, header and cell classes (compact px-3 padding for 8 columns)', () => {
    render(<BookingsTable bookings={[booking()]} onDelete={vi.fn()} />);

    const table = screen.getByRole('table', { name: 'Reservas' });
    expect(table).toHaveClass('min-w-full', 'divide-y', 'divide-table-line');
    expect(scroller(table)).toHaveClass('overflow-x-auto', '[&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb');
    expect(table.querySelector('tbody')).toHaveClass('divide-y', 'divide-table-line');
    screen.getAllByRole('columnheader').forEach((th) => {
      expect(th).toHaveClass('px-3', 'py-3', 'text-xs', 'font-medium', 'text-muted-foreground-1', 'uppercase');
    });
    expect(within(screen.getAllByRole('row')[1]).getAllByRole('cell')[0]).toHaveClass('px-3', 'py-4', 'text-foreground');
  });

  it('BookingsTable delete is a text-link style button: accessible name, 44px touch target, destructive color', () => {
    render(<BookingsTable bookings={[booking()]} onDelete={vi.fn()} />);

    const button = screen.getByRole('button', { name: 'Eliminar reserva' });
    expect(button).toHaveClass('inline-flex', 'items-center', 'gap-x-2', 'text-sm', 'font-semibold', 'rounded-lg', 'touch:min-h-11', 'touch:min-w-11');
    expect(button).toHaveClass('text-error');
    expect(button).toHaveClass('focus:outline-hidden', 'disabled:opacity-50', 'disabled:pointer-events-none');
    expect(button.closest('td')).toHaveClass('px-3', 'py-4', 'whitespace-nowrap', 'text-end', 'text-sm', 'font-medium');
  });
});

describe('RecentBookingsTable', () => {
  it('renders the 5 legacy columns', () => {
    render(<RecentBookingsTable bookings={[booking()]} />);

    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Cliente', 'Teléfono', 'Servicio', 'Fecha', 'Profesional',
    ]);
  });

  it('shows the empty-state row spanning 5 columns', () => {
    render(<RecentBookingsTable bookings={[]} />);

    expect(screen.getByText('No hay reservas recientes')).toHaveAttribute('colspan', '5');
  });

  it('renders rows with "N/A" phone fallback and decoded entities', () => {
    render(
      <RecentBookingsTable
        bookings={[booking({ client: { name: 'Ana &amp; Co', email: 'a@x.com' } })]}
      />,
    );

    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Ana & Co');
    expect(cells[1]).toHaveTextContent('N/A');
    expect(cells[2]).toHaveTextContent('Servicio Básico');
    expect(cells[4]).toHaveTextContent('Alex García');
  });

  it('renders markup-looking client data as plain text', () => {
    const { container } = render(
      <RecentBookingsTable bookings={[booking({ client: { name: XSS, email: 'e@x.com', phone: XSS } })]} />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByText(XSS)).toHaveLength(2);
  });
});
