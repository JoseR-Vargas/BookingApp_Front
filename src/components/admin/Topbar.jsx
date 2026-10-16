import Button from '../ui/Button.jsx';
import NotificationBell from './NotificationBell.jsx';
import UserMenu from './UserMenu.jsx';

// Legacy buttons were inline-block with an inline icon + a text span separated by a space, so the
// content flows inline instead of flexing. Below 768px they become square icon-only buttons
// (legacy #enableSoundBtn / #logoutBtn rules).
const INLINE = 'inline-block! text-center lte-md:inline-flex!';
const SQUARE = 'touch:min-h-11 lte-md:size-11 lte-md:min-w-11 lte-md:p-2 lte-sm:text-[0.9rem]';
const LABEL = 'whitespace-nowrap max-md:hidden';

export default function Topbar({
  title,
  userName,
  needsSoundActivation,
  notificationCount,
  onToggleSidebar,
  onEnableSound,
  onBellClick,
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-999 flex h-top-nav items-center justify-between border-b border-border-subtle bg-bg-secondary px-6 shadow-sm lte-md:h-auto lte-md:min-h-top-nav lte-md:flex-wrap lte-md:px-3 lte-sm:gap-2 lte-sm:px-2">
      <div className="flex items-center gap-4 lte-md:shrink-0 lte-md:gap-2 lte-sm:gap-1">
        <button
          type="button"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="cursor-pointer rounded-md p-2 text-[1.2rem] text-text-secondary transition-all duration-150 ease-[ease] hover:bg-accent-muted hover:text-accent touch:flex touch:min-h-11 touch:min-w-11 touch:items-center touch:justify-center lte-sm:p-[0.4rem] lte-sm:text-base"
        >
          <i aria-hidden="true" className="fas fa-bars" />
        </button>
        <h1 className="m-0 font-display text-xl font-semibold text-text-primary lte-lg:text-[1.3rem] lte-md:text-[1.1rem] lte-sm:max-w-[100px] lte-sm:overflow-hidden lte-sm:text-base lte-sm:text-ellipsis lte-sm:whitespace-nowrap">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4 lte-lg:gap-3 lte-md:gap-2 lte-sm:ml-auto">
        {needsSoundActivation && (
          <Button
            variant="outlineSecondary"
            size="xs"
            title="Haz click para activar el sonido de notificaciones"
            aria-label="Activar sonido de notificaciones"
            onClick={onEnableSound}
            className={`mr-2 lte-md:mr-0 ${INLINE} ${SQUARE}`}
          >
            <i aria-hidden="true" className="fas fa-volume-mute" />{' '}
            <span className={`ml-1 ${LABEL}`}>Activar Sonido</span>
          </Button>
        )}

        <NotificationBell count={notificationCount} onClick={onBellClick} />

        <UserMenu userName={userName} onLogout={onLogout} />
      </div>
    </header>
  );
}
