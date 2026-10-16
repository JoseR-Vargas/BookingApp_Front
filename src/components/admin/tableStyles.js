// Shared look of the admin tables: the Preline table (semantic tokens, mapped to the gold palette in
// index.css). Complete class literals so Tailwind can detect every one of them.

// Outer wrapper + the scroll container: the table scrolls inside it, never the page.
export const TABLE_WRAPPER = 'min-w-full';
export const TABLE_SCROLL =
  'overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb';
export const TABLE = 'min-w-full divide-y divide-table-line';
export const TBODY = 'divide-y divide-table-line';
// Header cell = TH + one alignment (never both: `text-start`/`text-end` would depend on CSS order).
export const TH = 'px-6 py-3 text-xs font-medium text-muted-foreground-1 uppercase';
export const TH_START = 'text-start';
export const TH_END = 'text-end';
export const TR = 'transition-colors hover:bg-accent/5';
export const TD = 'px-6 py-4 whitespace-nowrap text-sm text-foreground';
// The first column (client name) is user text of any length: it wraps at a readable width instead of
// pushing the other columns (and the row actions) out of view.
export const TD_FIRST = 'px-6 py-4 max-w-64 text-sm font-medium break-words text-foreground';
export const TD_END = 'px-6 py-4 whitespace-nowrap text-end text-sm text-foreground';
// Cell holding row actions (Preline: text-end + medium weight).
export const TD_ACTIONS = 'px-6 py-4 whitespace-nowrap text-end text-sm font-medium';
export const EMPTY_CELL = 'px-6 py-4 text-center text-sm text-muted-foreground-1';
// Preline text-link button used inside action cells.
export const LINK_BUTTON =
  'inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none touch:min-h-11 touch:min-w-11 touch:justify-center touch:px-2';

// The 8-column bookings table is denser than the Preline 3-5 column examples: horizontal padding goes
// from px-6 to px-3 so the row actions stay in view at 1440px instead of behind a scroll.
export const compact = (classes) => classes.replace('px-6', 'px-3');
