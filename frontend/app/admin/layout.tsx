"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import NotificationBell from "./components/NotificationBell";
import AuthGuard from "../components/AuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'People (Tree)', href: '/admin/members' },
    { name: 'People (Social)', href: '/admin/platform-members' },
    { name: 'Media', href: '/admin/media' },
    { name: 'Family Tree', href: '/admin/family-tree' },
    { name: 'Settings', href: '/admin/settings' },
  ];

  return (
    <AuthGuard requireAdmin={true}>
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
        {/* Sidebar - Hidden on small screens, visible on md+ */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-800">Admin Menu</h2>
            <nav className="mt-6 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between">
              <h1 className="text-xl font-semibold text-gray-800">We Bhuiyans – Admin</h1>
              <div className="flex items-center gap-4">
                  <NotificationBell />
                  <button 
                      onClick={async () => {
                          await supabase.auth.signOut();
                          router.push('/auth');
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                  >
                      Sign Out
                  </button>
              </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
