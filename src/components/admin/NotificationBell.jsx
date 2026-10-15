/**
 * Bell with an unread badge. The badge exists only while there is something unread
 * (legacy toggled `.show`); with unread items the icon turns gold and rings.
 */
export default function NotificationBell({ count, onClick }) {
  const hasNotifications = count > 0;

  return (
    <button
      type="button"
      title="Nuevas reservas"
      aria-label="Nuevas reservas"
      onClick={onClick}
      className="group relative flex size-10 cursor-pointer items-center justify-center rounded-full p-2 transition-all duration-150 ease-[ease] hover:bg-accent-muted lte-md:size-9 lte-md:p-[0.4rem] lte-sm:size-8 lte-sm:p-[0.3rem]"
    >
      <i
        aria-hidden="true"
        className={`fas fa-bell text-[1.3rem] transition-colors duration-150 ease-[ease] group-hover:text-accent lte-md:text-[1.1rem] lte-sm:text-base ${hasNotifications ? 'animate-ring text-accent' : 'text-text-secondary'}`}
      />
      {hasNotifications && (
        <span className="absolute top-[2px] right-[2px] block min-w-[18px] animate-scale-pulse rounded-[10px] bg-error px-1.5 py-[2px] text-center text-[0.7rem] font-bold text-text-primary">
          {count}
        </span>
      )}
    </button>
  );
}
