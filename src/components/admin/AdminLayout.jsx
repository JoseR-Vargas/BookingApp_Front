/**
 * Page frame: fixed sidebar + main column (top bar and content area).
 * The main column keeps a left margin equal to the sidebar width (legacy `.main-content`):
 *  - 260px expanded, 70px collapsed;
 *  - 0 at <= 768px, where the sidebar is an off-canvas drawer... unless it is collapsed: the legacy
 *    rule `.sidebar.collapsed + .main-content` is more specific than the mobile reset, so the content
 *    keeps the 70px offset (it is visible when the drawer is open in its collapsed form).
 */
export default function AdminLayout({ collapsed, sidebar, topbar, children }) {
  const margin = collapsed ? 'ml-sidebar-collapsed' : 'ml-sidebar lte-md:ml-0';

  return (
    <>
      {sidebar}
      <div className={`${margin} transition-[margin-left] duration-300 ease-[ease]`}>
        {topbar}
        <main className="min-h-[calc(100vh-var(--spacing-top-nav))] bg-bg-primary p-8 lte-md:p-4">
          {children}
        </main>
      </div>
    </>
  );
}
