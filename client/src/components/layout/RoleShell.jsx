import Navbar from './Navbar'
import Sidebar from './Sidebar'

/**
 * Wraps every authenticated, role-based page: Navbar at top,
 * a role-specific Sidebar on the left, and the page content in a
 * consistent padded container. Used by Student/Vendor/College/
 * SuperAdmin/Recycler/CSR/Parent dashboards alike.
 */
export default function RoleShell({ sidebarItems = [], sidebarTitle, children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar items={sidebarItems} title={sidebarTitle} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
