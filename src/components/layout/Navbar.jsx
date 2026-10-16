import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Container from './Container.jsx';
import { NAV_LINKS } from './navLinks.js';

const MENU_ID = 'main-menu';

/**
 * Fixed top bar. Below the `lg` breakpoint (992px) the links live in a collapsible
 * panel driven by the hamburger button; from `lg` up they are always visible.
 *
 * Legacy parity notes:
 *  - The brand sits AFTER the links on desktop (legacy gave it `order: 1` while the
 *    collapse kept `order: 0`). Visible in the baseline screenshots, so it is kept.
 *  - The navbar "Reservar Cita" button is hidden from 1000px up (the hero already has
 *    one), so it is still shown for 992-999px, exactly like the legacy page.
 */
export default function Navbar({ onReserve }) {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-[1030] border-b border-border-subtle bg-bg-secondary py-3 shadow-md max-lg:max-h-dvh max-lg:overflow-y-auto max-lg:py-1.5">
      <nav aria-label="Navegación principal">
        <Container className="flex items-center justify-between max-lg:flex-wrap lg:flex-nowrap">
          <a
            href="#"
            className="order-1 mr-4 flex-1 py-[5px] font-display text-[1.1rem] font-bold whitespace-nowrap text-text-primary transition-colors duration-150 ease-[ease] hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-lg:min-h-11 max-lg:min-w-0 max-lg:overflow-hidden max-lg:py-0 max-lg:text-ellipsis max-lg:leading-[44px] lte-lg:text-[1.2rem] lte-md:text-base lte-sm:text-[0.9rem] lte-400:text-[0.8rem]"
          >
            <span aria-hidden="true" className="mr-2 text-accent lte-sm:hidden">
              <i className="fas fa-calendar-alt" />
            </span>
            BookingApp
          </a>

          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            aria-controls={MENU_ID}
            onClick={() => setOpen((value) => !value)}
            className="order-2 ml-4 flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-md px-2 py-1 text-accent/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
          >
            <svg viewBox="0 0 30 30" aria-hidden="true" className="block size-[30px]">
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeWidth="2"
                d="M4 7h22M4 15h22M4 23h22"
              />
            </svg>
          </button>

          <div
            id={MENU_ID}
            className={`${open ? 'block' : 'hidden'} grow basis-full items-center lg:flex lg:basis-auto max-lg:order-3 max-lg:mt-2 max-lg:rounded-lg max-lg:border max-lg:border-border-subtle max-lg:p-1`}
          >
            <ul className="flex list-none flex-col lg:ml-auto lg:flex-row">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href} className="max-lg:text-center">
                  <a
                    href={href}
                    onClick={closeMenu}
                    className="block py-2 font-medium text-text-secondary max-lg:flex max-lg:min-h-11 max-lg:items-center max-lg:justify-center max-lg:py-0 transition-colors duration-150 ease-[ease] hover:text-accent focus:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:px-2"
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li className="max-lg:text-center">
                <Button
                  size="sm"
                  onClick={onReserve}
                  className="min-[1000px]:hidden lg:ml-2 lte-md:mt-1 lte-md:w-full"
                >
                  <span aria-hidden="true" className="mr-2">
                    <i className="fas fa-calendar-alt" />
                  </span>
                  Reservar Cita
                </Button>
              </li>
            </ul>
          </div>
        </Container>
      </nav>
    </header>
  );
}
