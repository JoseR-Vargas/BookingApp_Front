/**
 * Page frame: fixed sidebar + main column (top bar and content area).
 * The main column keeps a left margin equal to the sidebar width (legacy `.main-content`):
 *  - 260px expanded, 70px collapsed;
 *  - always 0 at <= 768px, where the sidebar is an off-canvas drawer overlay (the legacy rule kept
 *    the 70px offset when collapsed, which left a permanent dark gutter after closing the drawer).
 */
export default function AdminLayout({ collapsed, sidebar, topbar, children }) {
  const margin = collapsed ? 'ml-sidebar-collapsed lte-md:ml-0' : 'ml-sidebar lte-md:ml-0';

  return (
    <>
      {sidebar}
      <div className={`${margin} transition-[margin-left] duration-300 ease-[ease]`}>
        {topbar}
        <main className="min-h-admin-main bg-bg-primary p-8 lte-md:p-4">
          {children}
        </main>
      </div>
    </>
  );
}
