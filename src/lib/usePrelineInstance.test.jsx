import { StrictMode, useRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadPreline } = vi.hoisted(() => ({ loadPreline: vi.fn() }));
vi.mock('./preline.js', () => ({ loadPreline }));

import { usePrelineInstance } from './usePrelineInstance.js';

const instances = [];
class FakePlugin {
  constructor(element, options) {
    this.element = element;
    this.options = options;
    this.destroy = vi.fn();
    instances.push(this);
  }
}

function Probe({ name = 'dropdown', options, setup, enabled, dep = 0 }) {
  const ref = useRef(null);
  usePrelineInstance(name, ref, { options, setup, enabled }, [dep]);
  return <div ref={ref} data-testid="host" />;
}

beforeEach(() => {
  instances.length = 0;
  loadPreline.mockReset();
  loadPreline.mockResolvedValue(FakePlugin);
});

describe('usePrelineInstance', () => {
  it('constructs the plugin on the rendered element with the given options', async () => {
    const { getByTestId } = render(<Probe options={{ a: 1 }} />);

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(loadPreline).toHaveBeenCalledWith('dropdown');
    expect(instances[0].element).toBe(getByTestId('host'));
    expect(instances[0].options).toEqual({ a: 1 });
  });

  it('destroys the instance and runs the setup cleanup on unmount', async () => {
    const teardown = vi.fn();
    const setup = vi.fn(() => teardown);
    const { unmount } = render(<Probe setup={setup} />);
    await waitFor(() => expect(setup).toHaveBeenCalledWith(instances[0]));

    unmount();

    expect(teardown).toHaveBeenCalledTimes(1);
    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  });

  it('never builds an instance when it unmounts while the chunk is still loading', async () => {
    let resolve;
    loadPreline.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { unmount } = render(<Probe />);
    unmount();

    resolve(FakePlugin);
    await new Promise((r) => setTimeout(r, 10));

    expect(instances).toHaveLength(0);
  });

  it('rebuilds the instance when a dependency changes (old one destroyed first)', async () => {
    const { rerender } = render(<Probe dep={1} />);
    await waitFor(() => expect(instances).toHaveLength(1));

    rerender(<Probe dep={2} />);

    await waitFor(() => expect(instances).toHaveLength(2));
    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
    expect(instances[1].destroy).not.toHaveBeenCalled();
  });

  it('does nothing while disabled', async () => {
    render(<Probe enabled={false} />);

    await new Promise((r) => setTimeout(r, 10));
    expect(loadPreline).not.toHaveBeenCalled();
    expect(instances).toHaveLength(0);
  });

  it('survives React StrictMode double-mounting with exactly one live instance', async () => {
    render(<StrictMode><Probe /></StrictMode>);

    await waitFor(() => expect(instances.length).toBeGreaterThan(0));
    await new Promise((r) => setTimeout(r, 10));
    const live = instances.filter((instance) => instance.destroy.mock.calls.length === 0);
    expect(live).toHaveLength(1);
  });

  it('evaluates function options only when the instance is actually built', async () => {
    const options = vi.fn(() => ({ late: true }));
    render(<Probe options={options} />);

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(options).toHaveBeenCalledTimes(1);
    expect(instances[0].options).toEqual({ late: true });
  });

  it('removes the keyboard registration Preline leaves behind after destroy()', async () => {
    const unregisterComponent = vi.fn();
    window.HSAccessibilityObserver = { unregisterComponent };
    const component = { name: 'registered' };
    class Registered extends FakePlugin {
      constructor(...args) {
        super(...args);
        this.accessibilityComponent = component;
      }
    }
    loadPreline.mockResolvedValue(Registered);
    const { unmount } = render(<Probe />);
    await waitFor(() => expect(instances).toHaveLength(1));

    unmount();

    expect(unregisterComponent).toHaveBeenCalledWith(component);
    expect(instances[0].destroy.mock.invocationCallOrder[0])
      .toBeLessThan(unregisterComponent.mock.invocationCallOrder[0]);
    delete window.HSAccessibilityObserver;
  });

  it('reports a failed chunk load without throwing', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    loadPreline.mockRejectedValue(new Error('offline'));

    render(<Probe />);

    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(instances).toHaveLength(0);
    error.mockRestore();
  });

  it('keeps going when destroy() throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    class Broken extends FakePlugin {
      constructor(...args) {
        super(...args);
        this.destroy = vi.fn(() => { throw new Error('boom'); });
      }
    }
    loadPreline.mockResolvedValue(Broken);
    const { unmount } = render(<Probe />);
    await waitFor(() => expect(instances).toHaveLength(1));

    expect(() => unmount()).not.toThrow();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
