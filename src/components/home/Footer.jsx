import Container from '../layout/Container.jsx';
import { NAV_LINKS } from '../layout/navLinks.js';
import Ornament from '../ui/Ornament.jsx';

const SOCIAL_LINKS = [
  { label: 'Facebook', icon: 'fa-facebook-f' },
  { label: 'Instagram', icon: 'fa-instagram' },
  { label: 'WhatsApp', icon: 'fa-whatsapp' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-primary">
      <div className="pt-12 pb-8">
        <Container>
          <Ornament size="footer" />

          <div className="grid items-center gap-6 md:grid-cols-3">
            <div>
              <div className="mb-2 flex items-center">
                <i aria-hidden="true" className="fas fa-calendar-alt mr-2 text-accent" />
                <span className="font-display text-lg font-bold tracking-wide text-text-primary">
                  BookingApp
                </span>
              </div>
              <p className="text-sm leading-loose text-text-muted">Tu tiempo, nuestra prioridad.</p>
            </div>

            <nav
              aria-label="Navegación del pie de página"
              className="flex flex-wrap justify-center gap-6 lte-md:gap-4 lte-sm:flex-col lte-sm:items-center lte-sm:gap-3"
            >
              {NAV_LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-xs font-semibold tracking-wider text-text-secondary uppercase transition-colors duration-150 ease-[ease] hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="mb-2 flex justify-end gap-3 lte-md:justify-center">
              {SOCIAL_LINKS.map(({ label, icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="inline-flex size-[38px] items-center justify-center rounded-full border border-border bg-accent-muted text-[0.85rem] text-accent transition-all duration-300 ease-[ease] hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-text-inverse hover:shadow-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <i aria-hidden="true" className={`fab ${icon}`} />
                </a>
              ))}
            </div>
          </div>
        </Container>
      </div>

      <div className="border-t border-border-subtle py-4">
        <Container className="text-center">
          <p className="text-xs leading-loose tracking-wide text-text-muted">
            &copy; 2024 BookingApp. Todos los derechos reservados.
          </p>
        </Container>
      </div>
    </footer>
  );
}
