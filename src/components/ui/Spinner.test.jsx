import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Spinner from './Spinner.jsx';

describe('Spinner (Preline wave)', () => {
  it('exposes a status landmark labelled "loading" with an sr-only "Loading..." text', () => {
    render(<Spinner />);

    const status = screen.getByRole('status', { name: 'loading' });
    expect(status).toHaveClass('inline-flex');
    expect(screen.getByText('Loading...')).toHaveClass('sr-only');
  });

  it('renders 5 decorative bars with the wave heights and staggered delays', () => {
    const { container } = render(<Spinner />);

    const wrapper = container.querySelector('[aria-hidden="true"]');
    expect(wrapper).toHaveClass('flex', 'h-6', 'items-center', 'justify-center', 'gap-0.5');
    const bars = [...wrapper.children];
    expect(bars).toHaveLength(5);
    expect(bars.map((bar) => bar.className.match(/\bh-[\d.]+\b/)[0])).toEqual([
      'h-2.5', 'h-3.5', 'h-4.5', 'h-3.5', 'h-2.5',
    ]);
    ['0', '0.12', '0.24', '0.36', '0.48'].forEach((delay, index) => {
      expect(bars[index]).toHaveClass(
        'w-1', 'rounded-full', 'origin-center', `[animation:spinner-wave_0.9s_ease-in-out_infinite_${delay}s]`,
      );
    });
  });

  it('uses bg-surface-4 by default and lets the caller swap the bar color', () => {
    const { container, rerender } = render(<Spinner />);
    expect([...container.querySelectorAll('[aria-hidden] > span')].every((b) => b.classList.contains('bg-surface-4'))).toBe(true);

    rerender(<Spinner barClassName="bg-primary-foreground" />);
    const bars = [...container.querySelectorAll('[aria-hidden] > span')];
    expect(bars.every((b) => b.classList.contains('bg-primary-foreground'))).toBe(true);
    expect(bars.some((b) => b.classList.contains('bg-surface-4'))).toBe(false);
  });

  it('accepts extra classes for the root', () => {
    render(<Spinner className="-my-0.5" />);
    expect(screen.getByRole('status')).toHaveClass('-my-0.5');
  });
});
