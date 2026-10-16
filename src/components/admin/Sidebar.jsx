import { useEffect, useRef, useSyncExternalStore } from 'react';
import { usePrelineInstance } from '../../lib/usePrelineInstance.js';
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

// Legacy toggleSidebar: at <= 768px the sidebar is an off-canvas drawer.
const MOBILE_QUERY = '(max-width: 768px)';
const subscribeToViewport = (onChange) => {
  if (typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
const isMobileViewport = () => typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_QUERY).matches;

// Preline overlay (offcanvas) wrapper. STATIC class string on purpose: Preline toggles `hidden`,
// `open` and `opened` on this element, and React would wipe them if it ever rewrote `className`.
//  - below the breakpoint it is a drawer: `hidden` until Preline opens it, slid in by `hs-overlay-open:`;
//  - above it, the media-query utilities force it visible and in place, whatever Preline did;
//  - [--auto-close:769] closes it when the viewport grows past the drawer range.
const DRAWER =
  'hs-overlay [--auto-close:769] fixed top-0 left-0 z-1000 hidden h-screen-dvh -translate-x-full transition-transform duration-300 ease-[ease] hs-overlay-open:translate-x-0 [@media(width>768px)]:block! [@media(width>768px)]:translate-x-0!';

/**
 * Left navigation. `data-collapsed` / `data-show` expose the two independent states of the
 * legacy `.collapsed` / `.show` classes: collapsed narrows it to 70px (icons only), show slides the
 * drawer in at <= 768px.
 *
 * The mobile drawer is a Preline overlay (offcanvas): it adds the backdrop, Escape / backdrop-click to
 * close, a focus trap, and takes the hidden drawer out of the tab order. React's `show` stays the
 * source of truth (it drives `open()` / `close()`); a close made by the plugin is reported through
 * `onShowChange`. The plugin only exists on mobile viewports: at desktop width the sidebar is a
 * permanent part of the layout and must not carry overlay key handling (Preline would intercept
 * Enter on its links).
 */
export default function Sidebar({ collapsed: collapsedProp, show, section, onNavigate, onShowChange }) {
  const wrapperRef = useRef(null);
  const pluginRef = useRef(null);
  const isMobile = useSyncExternalStore(subscribeToViewport, isMobileViewport, () => false);
  // The icon-only rail is a desktop state: the mobile drawer is always full width.
  const collapsed = collapsedProp && !isMobile;
  const width = collapsed ? 'w-sidebar-collapsed' : 'w-sidebar';
  const wasMobile = useRef(isMobile);
  const latest = useRef({ show, onShowChange });
  latest.current = { show, onShowChange };

  usePrelineInstance(
    'overlay',
    wrapperRef,
    {
      enabled: isMobile,
      setup: (instance) => {
        pluginRef.current = instance;
        instance.on('close', () => {
          if (latest.current.onShowChange) latest.current.onShowChange(false);
        });
        if (latest.current.show) {
          instance.open();
        } else {
          // A previous destroy() strips the hidden class; a closed drawer must be out of the tab order.
          wrapperRef.current.classList.add('hidden');
        }
        return () => {
          pluginRef.current = null;
          // destroy() does not give back the scroll lock of a drawer that was still open.
          document.body.style.overflow = '';
        };
      },
    },
    [],
  );

  useEffect(() => {
    if (!pluginRef.current) return;
    if (show) pluginRef.current.open();
    else pluginRef.current.close();
  }, [show]);

  // Growing past the drawer range destroys the plugin: React's state must not stay "open".
  useEffect(() => {
    if (wasMobile.current && !isMobile && latest.current.show && latest.current.onShowChange) {
      latest.current.onShowChange(false);
    }
    wasMobile.current = isMobile;
  }, [isMobile]);

  return (
    <div ref={wrapperRef} id="admin-sidebar" className={DRAWER}>
      <aside
        data-testid="sidebar"
        data-collapsed={collapsed}
        data-show={show}
        className={`h-screen-dvh ${width} overflow-y-auto border-r border-border-subtle bg-bg-secondary shadow-md transition-[width] duration-300 ease-[ease]`}
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
                    // Preline's document-level Enter handler (registered for the overlay) calls
                    // preventDefault, which would stop the browser from activating the link.
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.stopPropagation();
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
    </div>
  );
}
