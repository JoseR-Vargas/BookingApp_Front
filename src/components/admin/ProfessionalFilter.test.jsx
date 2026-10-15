import { StrictMode, useState } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadPreline } = vi.hoisted(() => ({ loadPreline: vi.fn() }));
vi.mock('../../lib/preline.js', () => ({ loadPreline }));

import ProfessionalFilter from './ProfessionalFilter.jsx';

const instances = [];
class FakeComboBox {
  constructor(element, options) {
    this.el = element;
    this.options = options;
    this.handlers = {};
    this.destroy = vi.fn();
    instances.push(this);
  }

  on(name, handler) {
    this.handlers[name] = handler;
  }
}

function Harness({ professionals = ['Alex García', 'María López'], initial = '' }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <ProfessionalFilter professionals={professionals} value={value} onChange={setValue} />
      <output data-testid="state">{value}</output>
      <button type="button" onClick={() => setValue('')}>reset</button>
    </>
  );
}

const input = () => screen.getByRole('combobox', { name: 'Filtrar por profesional' });

beforeEach(() => {
  instances.length = 0;
  loadPreline.mockReset();
  loadPreline.mockResolvedValue(FakeComboBox);
});

describe('ProfessionalFilter markup', () => {
  it('renders the Preline combobox structure with a "Todos" option first', () => {
    const { container } = render(<Harness />);

    const root = container.querySelector('[data-hs-combo-box]');
    expect(root).not.toBeNull();
    expect(input()).toHaveAttribute('data-hs-combo-box-input');
    expect(input()).toHaveAttribute('placeholder', 'Todos los profesionales');
    expect(input()).toHaveValue('');
    expect(root.querySelector('[data-hs-combo-box-toggle]')).not.toBeNull();
    const listbox = root.querySelector('[data-hs-combo-box-output]');
    expect(listbox).toHaveAttribute('role', 'listbox');
    expect(within(listbox).getAllByRole('option', { hidden: true }).map((o) => o.textContent))
      .toEqual(['Todos', 'Alex García', 'María López']);
  });

  it('stores the selection payload in each option, empty for "Todos"', () => {
    const { container } = render(<Harness />);

    const payloads = [...container.querySelectorAll('[data-hs-combo-box-output-item]')]
      .map((item) => JSON.parse(item.getAttribute('data-hs-combo-box-item-stored-data')));
    expect(payloads).toEqual([
      { professional: '' },
      { professional: 'Alex García' },
      { professional: 'María López' },
    ]);
  });

  it('renders names as text, never as markup', () => {
    const { container } = render(<Harness professionals={['<img src=x onerror=alert(1)>']} />);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror=alert(1)>', { selector: 'span' })).toBeInTheDocument();
  });
});

describe('ProfessionalFilter plugin wiring', () => {
  it('builds the plugin keeping the given option order and a Spanish empty message', async () => {
    const { container } = render(<Harness />);

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(loadPreline).toHaveBeenCalledWith('combobox');
    expect(instances[0].el).toBe(container.querySelector('[data-hs-combo-box]'));
    expect(instances[0].options.keepOriginalOrder).toBe(true);
    expect(instances[0].options.outputEmptyTemplate).toContain('Sin resultados');
  });

  it('reports the picked professional, and "" for "Todos"', async () => {
    render(<Harness />);
    await waitFor(() => expect(instances).toHaveLength(1));

    act(() => instances[0].handlers.select({ professional: 'María López' }));
    expect(screen.getByTestId('state')).toHaveTextContent('María López');

    act(() => instances[0].handlers.select({ professional: '' }));
    expect(screen.getByTestId('state')).toHaveTextContent('');
  });

  it('clears the filter when the typed text is emptied', async () => {
    render(<Harness initial="Alex García" />);
    await waitFor(() => expect(instances).toHaveLength(1));

    fireEvent.input(input(), { target: { value: '' } });

    expect(screen.getByTestId('state')).toHaveTextContent('');
  });

  it('keeps the filter while the user is still typing a partial name', async () => {
    render(<Harness initial="Alex García" />);
    await waitFor(() => expect(instances).toHaveLength(1));

    fireEvent.input(input(), { target: { value: 'Ma' } });

    expect(screen.getByTestId('state')).toHaveTextContent('Alex García');
  });

  it('rebuilds on a fresh DOM when the filter is reset from outside ("Actualizar")', async () => {
    const { container } = render(<Harness initial="Alex García" />);
    await waitFor(() => expect(instances).toHaveLength(1));
    const firstRoot = container.querySelector('[data-hs-combo-box]');

    await userEvent.click(screen.getByRole('button', { name: 'reset' }));

    await waitFor(() => expect(instances).toHaveLength(2));
    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-hs-combo-box]')).not.toBe(firstRoot);
    expect(input()).toHaveValue('');
  });

  it('rebuilds when the list of professionals changes', async () => {
    const { rerender } = render(<Harness professionals={['Alex García']} />);
    await waitFor(() => expect(instances).toHaveLength(1));

    rerender(<Harness professionals={['Alex García', 'María López']} />);

    await waitFor(() => expect(instances).toHaveLength(2));
    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('option', { hidden: true })).toHaveLength(3);
  });

  it('does NOT rebuild when a pick from inside the plugin updates the value', async () => {
    render(<Harness />);
    await waitFor(() => expect(instances).toHaveLength(1));

    act(() => instances[0].handlers.select({ professional: 'Alex García' }));
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(instances).toHaveLength(1);
    expect(instances[0].destroy).not.toHaveBeenCalled();
  });

  it('destroys the plugin on unmount, with one live plugin under StrictMode', async () => {
    const strict = render(<StrictMode><Harness /></StrictMode>);
    await waitFor(() => expect(instances.length).toBeGreaterThan(0));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(instances.filter((i) => i.destroy.mock.calls.length === 0)).toHaveLength(1);

    strict.unmount();
    expect(instances.every((i) => i.destroy.mock.calls.length === 1)).toBe(true);
  });
});
