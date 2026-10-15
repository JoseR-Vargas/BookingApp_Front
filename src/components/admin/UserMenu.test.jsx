import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadPreline } = vi.hoisted(() => ({ loadPreline: vi.fn() }));
vi.mock('../../lib/preline.js', () => ({ loadPreline }));

import UserMenu from './UserMenu.jsx';

const instances = [];
class FakeDropdown {
  constructor(element) {
    this.element = element;
    this.destroy = vi.fn();
    instances.push(this);
  }
}

beforeEach(() => {
  instances.length = 0;
  loadPreline.mockReset();
  loadPreline.mockResolvedValue(FakeDropdown);
});

describe('UserMenu', () => {
  it('renders the Preline dropdown structure: container, toggle and menu', () => {
    const { container } = render(<UserMenu userName="Carlos" onLogout={vi.fn()} />);

    const root = container.querySelector('.hs-dropdown');
    expect(root).not.toBeNull();
    const toggle = root.querySelector(':scope > .hs-dropdown-toggle');
    const menu = root.querySelector(':scope > .hs-dropdown-menu');
    expect(toggle).toHaveAttribute('aria-haspopup', 'menu');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveAttribute('role', 'menu');
    expect(menu).toHaveClass('hidden');
    expect(menu).toHaveAttribute('aria-labelledby', toggle.id);
  });

  it('shows the admin name and keeps it in the toggle accessible name', () => {
    render(<UserMenu userName="Carlos" onLogout={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Carlos/ })).toHaveTextContent('Carlos');
  });

  it('offers a "Cerrar sesión" menu item that calls onLogout', async () => {
    const onLogout = vi.fn();
    render(<UserMenu userName="Carlos" onLogout={onLogout} />);

    await userEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('keeps the menu item free of child elements (Preline only clicks such items on Enter)', () => {
    render(<UserMenu userName="Carlos" onLogout={vi.fn()} />);

    expect(screen.getByRole('menuitem', { name: 'Cerrar sesión' }).children).toHaveLength(0);
  });

  it('attaches the dropdown plugin to its container and destroys it on unmount', async () => {
    const { container, unmount } = render(<UserMenu userName="Carlos" onLogout={vi.fn()} />);

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(loadPreline).toHaveBeenCalledWith('dropdown');
    expect(instances[0].element).toBe(container.querySelector('.hs-dropdown'));

    unmount();
    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  });
});
