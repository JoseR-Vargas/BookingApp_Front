import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { loadPreline } = vi.hoisted(() => ({ loadPreline: vi.fn() }));
vi.mock('../../lib/preline.js', () => ({ loadPreline }));

import Sidebar from './Sidebar.jsx';

const instances = [];
class FakeOverlay {
  constructor(element, options) {
    this.el = element;
    this.options = options;
    this.handlers = {};
    this.destroy = vi.fn();
    this.open = vi.fn();
    this.close = vi.fn();
    instances.push(this);
  }

  on(name, handler) {
    this.handlers[name] = handler;
  }
}

// matchMedia stub whose `matches` can flip, notifying subscribers like a real viewport change.
function stubViewport(initiallyMobile) {
  let mobile = initiallyMobile;
  const listeners = new Set();
  window.matchMedia = vi.fn(() => ({
    get matches() { return mobile; },
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
  }));
  return (next) => {
    mobile = next;
    act(() => listeners.forEach((fn) => fn()));
  };
}

const props = { collapsed: false, show: false, section: 'dashboard', onNavigate: vi.fn(), onShowChange: vi.fn() };

beforeEach(() => {
  instances.length = 0;
  loadPreline.mockReset();
  loadPreline.mockResolvedValue(FakeOverlay);
  props.onShowChange.mockClear();
});

afterEach(() => {
  delete window.matchMedia;
});

describe('Sidebar markup', () => {
  it('keeps the aside, its state attributes and the navigation inside the Preline overlay wrapper', () => {
    stubViewport(false);
    const { container } = render(<Sidebar {...props} show collapsed />);

    const overlay = container.querySelector('.hs-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.id).toBeTruthy();
    const aside = screen.getByTestId('sidebar');
    expect(overlay).toContainElement(aside);
    expect(aside).toHaveAttribute('data-collapsed', 'true');
    expect(aside).toHaveAttribute('data-show', 'true');
    expect(screen.getByRole('navigation', { name: 'Navegación del panel' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reservas' })).toBeInTheDocument();
  });

  it('ignores the collapsed state on a mobile viewport so the drawer is always full width', () => {
    stubViewport(true);
    const mobile = render(<Sidebar {...props} show collapsed />);
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');
    expect(screen.getByText('BookingApp')).not.toHaveClass('hidden');
    mobile.unmount();

    stubViewport(false);
    render(<Sidebar {...props} show collapsed />);
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true');
  });

  it('is rendered open at desktop width and hidden by default only below it (static wrapper classes)', () => {
    stubViewport(false);
    const { container } = render(<Sidebar {...props} />);

    const classes = container.querySelector('.hs-overlay').className;
    expect(classes).toContain('hidden');
    expect(classes).toContain('[@media(width>768px)]:block!');
  });

  it('never rewrites the overlay wrapper className when the sidebar state changes', () => {
    stubViewport(false);
    const { container, rerender } = render(<Sidebar {...props} />);
    const before = container.querySelector('.hs-overlay').className;

    rerender(<Sidebar {...props} collapsed show />);

    expect(container.querySelector('.hs-overlay').className).toBe(before);
  });
});

describe('Sidebar overlay wiring (mobile drawer)', () => {
  it('builds the overlay plugin on the wrapper only on a mobile viewport', async () => {
    stubViewport(false);
    const { container, unmount } = render(<Sidebar {...props} />);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(instances).toHaveLength(0);
    unmount();

    stubViewport(true);
    const mobile = render(<Sidebar {...props} />);
    await waitFor(() => expect(instances).toHaveLength(1));
    expect(loadPreline).toHaveBeenCalledWith('overlay');
    expect(instances[0].el).toBe(mobile.container.querySelector('.hs-overlay'));
    expect(container).not.toBe(mobile.container);
  });

  it('opens and closes the drawer when `show` changes', async () => {
    stubViewport(true);
    const { rerender } = render(<Sidebar {...props} />);
    await waitFor(() => expect(instances).toHaveLength(1));
    expect(instances[0].open).not.toHaveBeenCalled();

    rerender(<Sidebar {...props} show />);
    expect(instances[0].open).toHaveBeenCalledTimes(1);

    rerender(<Sidebar {...props} show={false} />);
    expect(instances[0].close).toHaveBeenCalledTimes(1);
  });

  it('opens right away when it is built already shown', async () => {
    stubViewport(true);
    render(<Sidebar {...props} show />);

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(instances[0].open).toHaveBeenCalledTimes(1);
  });

  it('reports a close made by the plugin (Escape, backdrop click) so React state follows', async () => {
    stubViewport(true);
    render(<Sidebar {...props} show />);
    await waitFor(() => expect(instances).toHaveLength(1));

    act(() => instances[0].handlers.close());

    expect(props.onShowChange).toHaveBeenCalledWith(false);
  });

  it('closes the drawer state and destroys the plugin when the viewport grows to desktop', async () => {
    const setViewport = stubViewport(true);
    render(<Sidebar {...props} show />);
    await waitFor(() => expect(instances).toHaveLength(1));

    setViewport(false);

    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
    expect(props.onShowChange).toHaveBeenCalledWith(false);
  });

  it('keeps the wrapper hidden when the plugin is rebuilt while the drawer is closed', async () => {
    const setViewport = stubViewport(true);
    const { container } = render(<Sidebar {...props} />);
    await waitFor(() => expect(instances).toHaveLength(1));
    const wrapper = container.querySelector('.hs-overlay');
    // Preline's destroy() strips the hidden class.
    instances[0].destroy.mockImplementation(() => wrapper.classList.remove('hidden'));

    setViewport(false);
    setViewport(true);

    await waitFor(() => expect(instances).toHaveLength(2));
    expect(wrapper).toHaveClass('hidden');
  });

  it('gives back the body scroll lock when the plugin goes away while the drawer is open', async () => {
    const setViewport = stubViewport(true);
    render(<Sidebar {...props} show />);
    await waitFor(() => expect(instances).toHaveLength(1));
    document.body.style.overflow = 'hidden';

    setViewport(false);

    expect(document.body.style.overflow).toBe('');
  });

  it('lets Enter activate a nav link without Preline\'s global handler seeing the keydown', async () => {
    stubViewport(true);
    const onNavigate = vi.fn();
    render(<Sidebar {...props} onNavigate={onNavigate} />);
    const outer = vi.fn();
    document.addEventListener('keydown', outer);
    const link = screen.getByRole('link', { name: 'Reservas' });

    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(outer).not.toHaveBeenCalled();

    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(outer).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', outer);
  });

  it('destroys the plugin on unmount', async () => {
    stubViewport(true);
    const { unmount } = render(<Sidebar {...props} />);
    await waitFor(() => expect(instances).toHaveLength(1));

    unmount();

    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  });
});
