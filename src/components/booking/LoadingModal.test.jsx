import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LoadingModal from './LoadingModal.jsx';

describe('LoadingModal (Preline loading toast card)', () => {
  it('stays labelled by its title and shows the helper text', () => {
    render(<LoadingModal open onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: 'Procesando tu reserva...' });
    expect(within(dialog).getByText('Por favor espera un momento')).toBeInTheDocument();
  });

  it('renders the Preline card with an alert role and a circular loading status', () => {
    render(<LoadingModal open onClose={vi.fn()} />);

    const card = screen.getByRole('alert');
    expect(card).toHaveClass('max-w-xs', 'w-full', 'bg-layer', 'border', 'border-layer-line', 'rounded-xl', 'shadow-lg');
    const spinner = within(card).getByRole('status', { name: 'loading' });
    expect(spinner).toHaveClass(
      'animate-spin', 'inline-block', 'size-4', 'border-3', 'border-current', 'border-t-transparent', 'rounded-[999px]', 'text-primary',
    );
    expect(within(spinner).getByText('Loading...')).toHaveClass('sr-only');
    expect(within(card).getByText('Procesando tu reserva...')).toHaveClass('text-sm', 'text-layer-foreground');
    expect(spinner.parentElement).toHaveClass('flex', 'items-center', 'gap-x-3', 'p-4');
  });

  it('accepts a custom message and still closes through "Cerrar" only', async () => {
    const onClose = vi.fn();
    render(<LoadingModal open onClose={onClose} message="Guardando..." />);

    expect(screen.getByRole('dialog', { name: 'Guardando...' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
