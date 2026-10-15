import Button from '../ui/Button.jsx';
import NotificationBell from './NotificationBell.jsx';
import UserMenu from './UserMenu.jsx';

// Legacy buttons were inline-block with an inline icon + a text span separated by a space, so the
// content flows inline instead of flexing. Below 768px they become square icon-only buttons
// (legacy #enableSoundBtn / #logoutBtn rules).
const INLINE = 'inline-block! text-center lte-md:inline-flex!';
const SQUARE = 'lte-md:size-10 lte-md:min-w-10 lte-md:p-2 lte-sm:size-9 lte-sm:min-w-9 lte-sm:p-[0.4rem] lte-sm:text-[0.9rem]';
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
    <header className="sticky top-0 z-999 flex h-top-nav items-center justify-between border-b border-border-subtle bg-bg-secondary px-6 shadow-sm lte-md:h-auto lte-md:min-h-top-nav lte-md:flex-wrap lte-md:px-3 lte-sm:gap-1 lte-sm:px-2">
      <div className="flex items-center gap-4 lte-md:shrink-0 lte-md:gap-2 lte-sm:gap-1">
        <button
          type="button"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="cursor-pointer rounded-md p-2 text-[1.2rem] text-text-secondary transition-all duration-150 ease-[ease] hover:bg-accent-muted hover:text-accent lte-sm:p-[0.4rem] lte-sm:text-base"
        >
          <i aria-hidden="true" className="fas fa-bars" />
        </button>
        <h1 className="m-0 font-display text-xl font-semibold text-text-primary lte-lg:text-[1.3rem] lte-md:text-[1.1rem] lte-sm:max-w-[120px] lte-sm:overflow-hidden lte-sm:text-base lte-sm:text-ellipsis lte-sm:whitespace-nowrap">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4 lte-lg:gap-3 lte-md:gap-2 lte-sm:ml-auto lte-sm:gap-1">
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
