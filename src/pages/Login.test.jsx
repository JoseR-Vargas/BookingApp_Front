import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../ui/toast.js', () => ({
  toast: { show: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import { authService } from '../services/authService.js';
import { toast } from '../ui/toast.js';
import Login from './Login.jsx';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<p>admin page</p>} />
        <Route path="/" element={<p>home page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

// Fake timers also freeze Date, which the lockout window relies on; user-event needs the
// timer advance hook, otherwise its internal delays would hang.
function setup() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  renderLogin();
  return user;
}

async function submit(user, username, password) {
  const userInput = screen.getByLabelText('Usuario');
  const passInput = screen.getByLabelText('Contraseña');
  await user.clear(userInput);
  await user.clear(passInput);
  if (username) await user.type(userInput, username);
  if (password) await user.type(passInput, password);
  await user.click(screen.getByRole('button', { name: /Iniciar Sesión/ }));
}

beforeEach(() => {
  vi.useFakeTimers();
  // Testing Library only advances fake timers inside its async helpers when it detects a `jest`
  // global; without this shim every waitFor/findBy hangs under vitest fake timers.
  globalThis.jest = { advanceTimersByTime: (ms) => vi.advanceTimersByTime(ms) };
  sessionStorage.clear();
  authService._reset();
  Object.values(toast).forEach((fn) => fn.mockClear());
});

afterEach(() => {
  delete globalThis.jest;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Login page markup', () => {
  it('renders the branding, both fields, the submit button and the way back home', () => {
    setup();

    expect(screen.getByRole('heading', { name: 'BookingApp' })).toBeInTheDocument();
    expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByRole('button', { name: /Iniciar Sesión/ })).toBeEnabled();
    expect(screen.getByRole('link', { name: /Volver al inicio/ })).toHaveAttribute('href', '/');
  });

  it('keeps the legacy behaviour of NOT redirecting an already authenticated visitor', () => {
    sessionStorage.setItem('isAdmin', 'true');

    setup();

    expect(screen.getByRole('heading', { name: 'BookingApp' })).toBeInTheDocument();
    expect(screen.queryByText('admin page')).not.toBeInTheDocument();
  });
});

describe('Login success flow', () => {
  it('toasts success, stores the session and navigates to /admin after exactly 1000ms', async () => {
    const user = setup();

    await submit(user, 'admin', 'admin123');

    expect(toast.success).toHaveBeenCalledWith('✅ Inicio de sesión exitoso');
    expect(sessionStorage.getItem('isAdmin')).toBe('true');
    expect(screen.queryByText('admin page')).not.toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(999); });
    expect(screen.queryByText('admin page')).not.toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByText('admin page')).toBeInTheDocument();
  });

  it('trims the username before authenticating', async () => {
    const login = vi.spyOn(authService, 'login');
    const user = setup();

    await submit(user, '  admin  ', 'admin123');

    expect(login).toHaveBeenCalledWith('admin', 'admin123');
    expect(toast.success).toHaveBeenCalledWith('✅ Inicio de sesión exitoso');
  });

  it('shows the spinner label and disables the button while the request is pending', async () => {
    let resolveLogin;
    vi.spyOn(authService, 'login').mockImplementation(
      () => new Promise((resolve) => { resolveLogin = resolve; }),
    );
    const user = setup();

    await submit(user, 'admin', 'admin123');

    const button = screen.getByRole('button', { name: /Iniciando sesión\.\.\./ });
    expect(button).toBeDisabled();
    expect(screen.queryByRole('button', { name: /^Iniciar Sesión/ })).not.toBeInTheDocument();

    await act(async () => { resolveLogin({ username: 'admin' }); });

    // Legacy never re-enabled the button after a successful login: the redirect follows.
    expect(screen.getByRole('button', { name: /Iniciando sesión\.\.\./ })).toBeDisabled();
  });

  it('does not navigate if the page unmounts before the redirect fires', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { unmount } = renderLogin();

    await submit(user, 'admin', 'admin123');
    unmount();

    expect(() => act(() => { vi.advanceTimersByTime(1000); })).not.toThrow();
  });
});

describe('Login failure flow', () => {
  it('toasts the error with the cross prefix and restores the button', async () => {
    const user = setup();

    await submit(user, 'admin', 'wrong');

    expect(toast.error).toHaveBeenCalledWith('❌ Usuario o contraseña incorrectos. Intentos restantes: 4');
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/ })).toBeEnabled();
    expect(sessionStorage.getItem('isAdmin')).toBeNull();
    expect(screen.queryByText('admin page')).not.toBeInTheDocument();
  });

  it('counts down the remaining attempts, then locks out and keeps rejecting valid credentials', async () => {
    const user = setup();

    for (let i = 0; i < 4; i += 1) await submit(user, 'admin', 'nope');
    expect(toast.error).toHaveBeenLastCalledWith('❌ Usuario o contraseña incorrectos. Intentos restantes: 1');

    await submit(user, 'admin', 'nope');
    expect(toast.error).toHaveBeenLastCalledWith('❌ Cuenta bloqueada por demasiados intentos. Intenta en 60 segundos.');

    await submit(user, 'admin', 'admin123');
    expect(toast.error).toHaveBeenLastCalledWith(
      '❌ Demasiados intentos fallidos. Intenta de nuevo en 60 segundos.',
    );
    expect(sessionStorage.getItem('isAdmin')).toBeNull();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/ })).toBeEnabled();
  });

  it('accepts valid credentials again once the lockout window has elapsed', async () => {
    const user = setup();
    for (let i = 0; i < 5; i += 1) await submit(user, 'admin', 'nope');

    act(() => { vi.advanceTimersByTime(60000); });
    await submit(user, 'admin', 'admin123');

    expect(toast.success).toHaveBeenCalledWith('✅ Inicio de sesión exitoso');
  });

  it('rejects an empty submission with the service message', async () => {
    const user = setup();
    // `required` would block a native submit; the legacy script relied on it too, so submit through
    // whitespace-only input, which passes `required` but trims to empty.
    await submit(user, '   ', 'something');

    expect(toast.error).toHaveBeenCalledWith('❌ Por favor completa todos los campos');
    expect(screen.getByRole('button', { name: /Iniciar Sesión/ })).toBeEnabled();
  });
});
