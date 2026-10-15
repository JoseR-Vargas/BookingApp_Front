import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The routing contract is under test, not the pages themselves.
vi.mock('./pages/Home.jsx', () => ({ default: () => <p>home page</p> }));
vi.mock('./pages/Login.jsx', () => ({ default: () => <p>login page</p> }));
vi.mock('./pages/Admin.jsx', () => ({ default: () => <p>admin page</p> }));

import App from './App.jsx';

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <App />
  </MemoryRouter>,
);

beforeEach(() => {
  sessionStorage.clear();
});

describe('App routing', () => {
  it('redirects an unauthenticated /admin visit to the login page', () => {
    renderAt('/admin');

    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('admin page')).not.toBeInTheDocument();
  });

  it('shows the admin panel to an authenticated session', async () => {
    sessionStorage.setItem('isAdmin', 'true');

    renderAt('/admin');

    expect(await screen.findByText('admin page')).toBeInTheDocument();
  });

  it('keeps /login and / public', () => {
    renderAt('/login');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('serves the home page at /', () => {
    renderAt('/');
    expect(screen.getByText('home page')).toBeInTheDocument();
  });

  it.each([
    ['/admin.html', 'login page'],
    ['/login.html', 'login page'],
    ['/index.html', 'home page'],
  ])('legacy URL %s still resolves (unauthenticated)', (path, expected) => {
    renderAt(path);

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('legacy /admin.html reaches the panel when authenticated', async () => {
    sessionStorage.setItem('isAdmin', 'true');

    renderAt('/admin.html');

    expect(await screen.findByText('admin page')).toBeInTheDocument();
  });
});
