import { NAV_ITEMS } from './adminSections.js';

// Legacy `.sidebar .nav-link` in its three presentations. Kept as whole strings (see the
// mobile/collapsed precedence note in the legacy admin.css): when collapsed, the collapsed
// look wins over the mobile one, so the two never combine.
const LINK_BASE =
  'flex items-center justify-center border-l-[3px] border-transparent text-center font-medium no-underline transition-all duration-300 ease-[ease] hover:translate-x-[5px] hover:border-l-accent hover:bg-accent-muted hover:text-accent';
const LINK_EXPANDED =
  'w-[90%] gap-3 rounded-lg px-4 py-3 lte-md:w-[85%] lte-md:p-4 lte-sm:w-4/5 lte-sm:p-[1.2rem]';
const LINK_COLLAPSED = 'size-10 gap-3 rounded-full p-0';
// Idle and active never combine: both set the text color, so the winner would depend on sort order.
const LINK_IDLE = 'text-text-secondary';
const LINK_ACTIVE = 'border-l-accent bg-accent-muted text-accent';

const LABEL_EXPANDED = 'text-[0.95rem] lte-md:text-base lte-sm:text-[1.1rem]';
const ICON_EXPANDED = 'text-[1.1rem] lte-md:text-[1.2rem] lte-sm:text-[1.3rem]';

/**
 * Left navigation. `data-collapsed` / `data-show` expose the two independent states of the
 * legacy `.collapsed` / `.show` classes: collapsed narrows it to 70px (icons only), show slides the
 * drawer in at <= 768px.
 */
export default function Sidebar({ collapsed, show, section, onNavigate }) {
  const width = collapsed ? 'w-sidebar-collapsed' : 'w-sidebar';
  const drawer = show ? 'lte-md:translate-x-0' : 'lte-md:-translate-x-full';

  return (
    <aside
      data-testid="sidebar"
      data-collapsed={collapsed}
      data-show={show}
      className={`fixed top-0 left-0 z-1000 h-screen ${width} ${drawer} overflow-y-auto border-r border-border-subtle bg-bg-secondary shadow-md transition-all duration-300 ease-[ease]`}
    >
      <div className="flex items-center gap-3 border-b border-border-subtle p-6">
        <i aria-hidden="true" className="fas fa-calendar-alt text-[1.2rem] text-accent" />
        <span
          className={`font-display text-[1.1rem] font-bold text-text-primary ${collapsed ? 'hidden' : ''}`}
        >
          BookingApp
        </span>
      </div>

      <nav
        aria-label="Navegación del panel"
        className="flex flex-col items-center py-4 lte-md:py-6 lte-sm:py-8"
      >
        <ul className="mb-4 flex w-full list-none flex-col items-center pl-8">
          {NAV_ITEMS.map(({ section: key, label, icon }) => {
            const active = key === section;
            return (
              <li
                key={key}
                className="mb-2 flex w-full justify-center lte-md:mb-4 lte-sm:mb-6"
              >
                <a
                  href={`#${key}`}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(key);
                  }}
                  className={`${LINK_BASE} ${collapsed ? LINK_COLLAPSED : LINK_EXPANDED} ${active ? LINK_ACTIVE : LINK_IDLE}`}
                >
                  <i
                    aria-hidden="true"
                    className={`${icon} w-5 text-center ${collapsed ? 'text-[1.2rem]' : ICON_EXPANDED}`}
                  />
                  <span className={`${LABEL_EXPANDED} ${collapsed ? 'hidden' : ''}`}>{label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
