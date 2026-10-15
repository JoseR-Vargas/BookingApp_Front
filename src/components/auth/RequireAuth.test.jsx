import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import RequireAuth from './RequireAuth.jsx';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route
          path="/admin"
          element={(
            <RequireAuth>
              <p>secret panel</p>
            </RequireAuth>
          )}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
});

describe('RequireAuth', () => {
  it('redirects an unauthenticated visitor to /login without rendering the children', () => {
    renderAt('/admin');

    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret panel')).not.toBeInTheDocument();
  });

  it('renders the children when the session flag is set', () => {
    sessionStorage.setItem('isAdmin', 'true');

    renderAt('/admin');

    expect(screen.getByText('secret panel')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });

  it.each(['false', '1', 'TRUE', ''])('treats the stored value %j as unauthenticated', (value) => {
    sessionStorage.setItem('isAdmin', value);

    renderAt('/admin');

    expect(screen.getByText('login page')).toBeInTheDocument();
  });
});
