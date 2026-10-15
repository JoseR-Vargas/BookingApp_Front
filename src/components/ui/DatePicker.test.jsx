import { StrictMode, useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadPreline } = vi.hoisted(() => ({ loadPreline: vi.fn() }));
vi.mock('../../lib/preline.js', () => ({ loadPreline }));

import DatePicker from './DatePicker.jsx';

const instances = [];
class FakeDatepicker {
  constructor(element, options) {
    this.el = element;
    this.options = options;
    this.handlers = {};
    this.destroy = vi.fn();
    this.vanillaCalendar = {
      set: vi.fn(),
      hide: vi.fn(),
      context: { isShowInInputMode: false, mainElement: document.createElement('div') },
    };
    instances.push(this);
  }

  on(name, handler) {
    this.handlers[name] = handler;
  }
}

function Controlled({ initial = '', ...props }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <DatePicker ariaLabel="Fecha de prueba" value={value} onChange={setValue} {...props} />
      <output data-testid="state">{value}</output>
      <button type="button" onClick={() => setValue('')}>clear</button>
    </>
  );
}

const input = () => screen.getByLabelText('Fecha de prueba');

beforeEach(() => {
  instances.length = 0;
  loadPreline.mockReset();
  loadPreline.mockResolvedValue(FakeDatepicker);
});

describe('DatePicker markup', () => {
  it('renders a read-only Preline text input carrying the accessible name, min and required', () => {
    render(<Controlled min="2030-05-01" required placeholder="Selecciona una fecha" />);

    expect(input()).toHaveAttribute('type', 'text');
    expect(input()).toHaveAttribute('readonly');
    expect(input()).toHaveClass('hs-datepicker');
    expect(input()).toHaveAttribute('min', '2030-05-01');
    expect(input()).toBeRequired();
    expect(input()).toHaveAttribute('placeholder', 'Selecciona una fecha');
    expect(input()).toHaveValue('');
  });

  it('shows the controlled value as-is (ISO YYYY-MM-DD)', () => {
    render(<Controlled initial="2030-05-06" />);
    expect(input()).toHaveValue('2030-05-06');
  });

  it('reports a change event on the input as the new ISO value', () => {
    render(<Controlled />);

    fireEvent.change(input(), { target: { value: '2030-05-06' } });

    expect(screen.getByTestId('state')).toHaveTextContent('2030-05-06');
  });
});

describe('DatePicker plugin wiring', () => {
  it('builds the plugin on the input with ISO separators, the min date and the Spanish locale', async () => {
    render(<Controlled min="2030-05-01" />);

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(loadPreline).toHaveBeenCalledWith('datepicker');
    expect(instances[0].el).toBe(input());
    const config = JSON.parse(input().getAttribute('data-hs-datepicker'));
    expect(config).toMatchObject({
      dateMin: '2030-05-01',
      locale: 'es',
      selectionDatesMode: 'single',
      inputModeOptions: { dateSeparator: '-' },
    });
  });

  it('opens the calendar from the full history when no min is given (admin filter)', async () => {
    render(<Controlled />);

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(JSON.parse(input().getAttribute('data-hs-datepicker')).dateMin).toBe('1970-01-01');
  });

  it('maps the plugin change event to an ISO string, and an emptied selection to ""', async () => {
    render(<Controlled initial="2030-05-06" />);
    await waitFor(() => expect(instances).toHaveLength(1));

    act(() => instances[0].handlers.change({ selectedDates: ['2030-06-10'], selectedTime: '' }));
    expect(screen.getByTestId('state')).toHaveTextContent('2030-06-10');

    act(() => instances[0].handlers.change({ selectedDates: [], selectedTime: '' }));
    expect(screen.getByTestId('state')).toHaveTextContent('');
  });

  it('closes the calendar once a date is picked, but not when the selection is emptied', async () => {
    render(<Controlled initial="2030-05-06" />);
    await waitFor(() => expect(instances).toHaveLength(1));

    act(() => instances[0].handlers.change({ selectedDates: [], selectedTime: '' }));
    expect(instances[0].vanillaCalendar.hide).not.toHaveBeenCalled();

    act(() => instances[0].handlers.change({ selectedDates: ['2030-06-10'], selectedTime: '' }));
    expect(instances[0].vanillaCalendar.hide).toHaveBeenCalledTimes(1);
  });

  it('pushes an external reset into the plugin (clears the calendar selection and the text)', async () => {
    render(<Controlled initial="2030-05-06" />);
    await waitFor(() => expect(instances).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: 'clear' }));

    expect(input()).toHaveValue('');
    expect(instances[0].vanillaCalendar.set).toHaveBeenCalledWith({ selectedDates: [] });
  });

  it('pre-selects the controlled value in the calendar', async () => {
    render(<Controlled initial="2030-05-06" />);
    await waitFor(() => expect(instances).toHaveLength(1));

    expect(instances[0].options.selectedDates).toEqual(['2030-05-06']);
  });

  it('pre-selects the latest value when it changed while the chunk was still loading', async () => {
    let resolve;
    loadPreline.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<Controlled initial="2030-05-06" />);

    fireEvent.click(screen.getByRole('button', { name: 'clear' }));
    resolve(FakeDatepicker);

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(instances[0].options.selectedDates).toEqual([]);
  });

  it('moves the popup calendar inside the component, so a Headless UI dialog sees it as inside', async () => {
    const { container } = render(<Controlled />);
    await waitFor(() => expect(instances).toHaveLength(1));
    const { mainElement } = instances[0].vanillaCalendar.context;
    expect(mainElement.parentElement).toBeNull();

    instances[0].options.onShow(instances[0].vanillaCalendar);

    expect(container.contains(mainElement)).toBe(true);
  });

  it('Escape closes only the calendar while it is open (never the dialog around it)', async () => {
    render(<Controlled />);
    await waitFor(() => expect(instances).toHaveLength(1));
    const outer = vi.fn();
    document.addEventListener('keydown', outer);

    instances[0].vanillaCalendar.context.isShowInInputMode = true;
    fireEvent.keyDown(input(), { key: 'Escape' });

    expect(instances[0].vanillaCalendar.hide).toHaveBeenCalled();
    expect(outer).not.toHaveBeenCalled();

    instances[0].vanillaCalendar.context.isShowInInputMode = false;
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(outer).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', outer);
  });

  it('destroys the plugin on unmount and leaves no input behind', async () => {
    const { container, unmount } = render(<Controlled />);
    await waitFor(() => expect(instances).toHaveLength(1));

    unmount();

    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
    expect(container.querySelector('input')).toBeNull();
  });

  it('keeps exactly one input and one live plugin under StrictMode', async () => {
    const { container } = render(<StrictMode><Controlled /></StrictMode>);

    await waitFor(() => expect(instances.length).toBeGreaterThan(0));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container.querySelectorAll('input')).toHaveLength(1);
    expect(instances.filter((i) => i.destroy.mock.calls.length === 0)).toHaveLength(1);
  });
});
