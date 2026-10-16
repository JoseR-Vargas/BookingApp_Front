// Admin login page. Port of legacy login.html (markup + inline script).

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { CONTROL_CLASSES, LABEL_CLASSES } from '../components/ui/controls.js';
import Spinner from '../components/ui/Spinner.jsx';
import { authService } from '../services/authService.js';
import { toast } from '../ui/toast.js';

const REDIRECT_DELAY_MS = 1000;

// Legacy `.input-group-text`: tertiary surface, gold glyph, same height as the input it prefixes.
const ADDON =
  'flex items-center rounded-l-md border border-border-subtle bg-bg-tertiary px-3 py-1.5 text-base leading-normal text-accent';
// The input is glued to the addon: no left border, flat left corners, overlapping the addon's right border by 1px.
const INPUT = `${CONTROL_CLASSES} -ml-px min-w-0 flex-1 rounded-l-none border-l-0`;

function Field({ id, label, icon, spacing, ...inputProps }) {
  return (
    <div className={spacing}>
      <label htmlFor={id} className={LABEL_CLASSES}>{label}</label>
      <div className="flex">
        <span aria-hidden="true" className={ADDON}>
          <i className={icon} />
        </span>
        <input id={id} name={id} required className={INPUT} {...inputProps} />
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const redirectTimer = useRef(null);
  const [pending, setPending] = useState(false);

  // A redirect scheduled by a successful login must not fire after the page is gone.
  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const username = form.elements.username.value.trim();
    const password = form.elements.password.value;

    setPending(true);
    try {
      await authService.login(username, password);
      toast.success('✅ Inicio de sesión exitoso');
      // The button stays disabled on success: the redirect follows (legacy behavior).
      redirectTimer.current = setTimeout(() => navigate('/admin'), REDIRECT_DELAY_MS);
    } catch (error) {
      toast.error('❌ ' + error.message);
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen-dvh items-center justify-center bg-linear-[135deg,var(--color-bg-primary)_0%,var(--color-bg-tertiary)_100%] px-3">
      {/* Legacy grid: the row is as wide as the container and its single column is 100% / 50% / 33%. */}
      <div className="-mx-3 flex w-full flex-wrap justify-center">
        <div className="w-full px-3 md:w-1/2 lg:w-1/3">
          <div className="rounded-lg border border-border bg-bg-secondary shadow-lg">
            <div className="p-12 lte-sm:p-8">
              <div className="mb-6 text-center">
                <i aria-hidden="true" className="fas fa-cut mb-4 text-[3em] text-accent" />
                <h1 className="mb-2 font-display text-[calc(1.325rem+0.9vw)] font-bold [overflow-wrap:anywhere] xl:text-[2rem]">
                  BookingApp
                </h1>
                <p className="mb-4 leading-loose text-text-secondary">Panel de Administración</p>
              </div>

              <form onSubmit={handleSubmit}>
                <Field
                  id="username"
                  spacing="mb-4"
                  label="Usuario"
                  icon="fas fa-user"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                />
                <Field
                  id="password"
                  spacing="mb-6"
                  label="Contraseña"
                  icon="fas fa-lock"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={pending}
                  className="w-full py-2! font-bold!"
                >
                  {pending ? (
                    <>
                      <Spinner className="-my-0.5" barClassName="bg-primary-foreground" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <i aria-hidden="true" className="fas fa-sign-in-alt mr-2" />
                      Iniciar Sesión
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/"
                  className="text-text-secondary no-underline transition-colors duration-150 ease-[ease] hover:text-accent touch:inline-flex touch:min-h-11 touch:items-center"
                >
                  <i aria-hidden="true" className="fas fa-arrow-left mr-1" /> Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
