import { StrictMode, useState } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadPreline } = vi.hoisted(() => ({ loadPreline: vi.fn() }));
vi.mock('../../lib/preline.js', () => ({ loadPreline }));

import Select from './Select.jsx';

const instances = [];
class FakeSelect {
  constructor(element, options) {
    this.el = element;
    this.options = options;
    this.handlers = {};
    this.destroy = vi.fn();
    this.setValue = vi.fn();
    instances.push(this);
  }

  on(name, handler) {
    this.handlers[name] = handler;
  }
}

const SLOTS = [
  { value: '09:00', label: '09:00' },
  { value: '10:00', label: '10:00 — Ocupado', disabled: true },
  { value: '11:00', label: '11:00' },
];

function Harness({ options = SLOTS, placeholder = 'Selecciona una hora', initial = '' }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <Select
        ariaLabel="Hora de prueba"
        describedBy="help"
        required
        placeholder={placeholder}
        options={options}
        value={value}
        onChange={setValue}
      />
      <output data-testid="state">{value}</output>
      <button type="button" onClick={() => setValue('')}>reset</button>
    </>
  );
}

const select = () => screen.getByLabelText('Hora de prueba');

beforeEach(() => {
  instances.length = 0;
  loadPreline.mockReset();
  loadPreline.mockResolvedValue(FakeSelect);
});

describe('Select markup', () => {
  it('keeps a native select with the placeholder first, booked slots disabled and the legacy labels', () => {
    render(<Harness />);

    const options = within(select()).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['Selecciona una hora', '09:00', '10:00 — Ocupado', '11:00']);
    expect(options[0]).toHaveValue('');
    expect(options[2]).toBeDisabled();
    expect(select()).toBeRequired();
    expect(select()).toHaveAttribute('aria-describedby', 'help');
  });

  it('reports the picked value', async () => {
    render(<Harness />);

    await userEvent.selectOptions(select(), '11:00');

    expect(screen.getByTestId('state')).toHaveTextContent('11:00');
    expect(select()).toHaveValue('11:00');
  });

  it('renders the current value as selected', () => {
    render(<Harness initial="09:00" />);
    expect(select()).toHaveValue('09:00');
  });
});

describe('Select plugin wiring', () => {
  it('builds the plugin on the select with an accessible toggle and the placeholder', async () => {
    render(<Harness initial="09:00" />);

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(loadPreline).toHaveBeenCalledWith('select');
    expect(instances[0].el).toBe(select());
    expect(instances[0].options).toEqual({ value: '09:00' });
    const config = JSON.parse(select().getAttribute('data-hs-select'));
    expect(config.placeholder).toBe('Selecciona una hora');
    expect(config.toggleTag).toContain('aria-label="Hora de prueba"');
    expect(config.toggleTag).toContain('aria-describedby="help"');
    expect(config.optionTag).toBe('<div role="option"></div>');
  });

  it('tags every option with its look: booked slots red, free slots green', () => {
    render(<Harness />);

    const [, free, booked] = within(select()).getAllByRole('option');
    expect(JSON.parse(free.getAttribute('data-hs-select-option')).additionalClasses[0][1]).toContain('text-success');
    expect(JSON.parse(booked.getAttribute('data-hs-select-option')).additionalClasses[0][1]).toContain('text-error');
  });

  it('forwards a selection made inside the plugin', async () => {
    render(<Harness />);
    await waitFor(() => expect(instances).toHaveLength(1));

    act(() => instances[0].handlers.change('11:00'));

    expect(screen.getByTestId('state')).toHaveTextContent('11:00');
  });

  it('rebuilds the plugin when the options or the placeholder change (availability refresh)', async () => {
    const { rerender } = render(<Harness placeholder="Verificando horarios disponibles" options={[]} />);
    await waitFor(() => expect(instances).toHaveLength(1));
    const firstSelect = select();

    rerender(<Harness placeholder="Selecciona una hora (2 disponibles)" options={SLOTS} />);

    await waitFor(() => expect(instances).toHaveLength(2));
    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
    // React keeps the very same <select>; only the plugin is rebuilt on top of it.
    expect(instances[1].el).toBe(select());
    expect(select()).toBe(firstSelect);
    expect(within(select()).getAllByRole('option')).toHaveLength(4);
  });

  it('does NOT rebuild when only the selected value changes', async () => {
    render(<Harness />);
    await waitFor(() => expect(instances).toHaveLength(1));

    await userEvent.selectOptions(select(), '09:00');

    expect(instances).toHaveLength(1);
    expect(instances[0].destroy).not.toHaveBeenCalled();
    expect(instances[0].setValue).not.toHaveBeenCalled();
  });

  it('pushes an external value change (reset) into the plugin', async () => {
    render(<Harness initial="09:00" />);
    await waitFor(() => expect(instances).toHaveLength(1));

    await userEvent.click(screen.getByRole('button', { name: 'reset' }));

    expect(instances[0].setValue).toHaveBeenCalledWith('');
    expect(select()).toHaveValue('');
  });

  it('starts the plugin from the latest value when it changed while the chunk was still loading', async () => {
    let resolve;
    loadPreline.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<Harness initial="09:00" />);

    await userEvent.click(screen.getByRole('button', { name: 'reset' }));
    resolve(FakeSelect);

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(instances[0].options).toEqual({ value: '' });
  });

  it('destroys the plugin on unmount', async () => {
    const { unmount } = render(<Harness />);
    await waitFor(() => expect(instances).toHaveLength(1));

    unmount();

    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  });

  it('keeps one live plugin under StrictMode', async () => {
    render(<StrictMode><Harness /></StrictMode>);

    await waitFor(() => expect(instances.length).toBeGreaterThan(0));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(instances.filter((i) => i.destroy.mock.calls.length === 0)).toHaveLength(1);
  });
});
