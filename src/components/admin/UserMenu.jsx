import { useId, useRef } from 'react';
import { usePrelineInstance } from '../../lib/usePrelineInstance.js';

// Preline's dropdown only toggles `hidden`, `open` and the opacity/margin classes; every class
// string below is static on purpose: React must never rewrite `className` once Preline mutated it.
const TOGGLE =
  'hs-dropdown-toggle inline-flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm font-medium text-text-primary transition-colors duration-150 ease-[ease] hover:bg-accent-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent touch:min-h-11 lte-md:size-11 lte-md:justify-center lte-md:p-2';
const MENU =
  'hs-dropdown-menu z-10 mt-2 hidden min-w-48 rounded-lg border border-dropdown-line bg-dropdown p-1 opacity-0 shadow-lg transition-[opacity,margin] duration-150 hs-dropdown-open:opacity-100';
const ITEM =
  'block w-full cursor-pointer rounded-md px-3 py-2 touch:min-h-11 text-left text-sm font-medium text-error transition-colors duration-150 ease-[ease] hover:bg-error/15 focus:bg-error/15 focus:outline-hidden';

/**
 * Admin account menu (Preline dropdown): the admin name opens a menu with the logout action.
 * `onLogout` owns the confirmation and navigation; the menu only closes itself on click.
 */
export default function UserMenu({ userName, onLogout }) {
  const rootRef = useRef(null);
  const toggleId = useId();

  usePrelineInstance('dropdown', rootRef);

  return (
    <div ref={rootRef} className="hs-dropdown relative inline-flex [--placement:bottom-right]">
      <button
        id={toggleId}
        type="button"
        className={TOGGLE}
        aria-haspopup="menu"
        aria-expanded="false"
        aria-label={`Menú de ${userName}`}
      >
        <i aria-hidden="true" className="fas fa-user-circle text-[1.2rem] text-accent" />
        <span className="font-medium whitespace-nowrap lte-md:hidden">{userName}</span>
        <i aria-hidden="true" className="fas fa-chevron-down text-xs text-text-secondary lte-md:hidden" />
      </button>

      <div className={MENU} role="menu" aria-orientation="vertical" aria-labelledby={toggleId}>
        {/* Text only on purpose: Preline's Enter handler clicks a focused item only when it has no
            child ELEMENTS (an element child makes it look for a nested checkbox/radio instead). */}
        <button type="button" role="menuitem" className={ITEM} onClick={onLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
}
