"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useEffect, useState } from "react";

const navSections = [
  {
    label: "Overview",
    links: [
      { href: "/admin", label: "Dashboard", icon: "⊞" },
    ],
  },
  {
    label: "Catalog",
    links: [
      { href: "/admin/products", label: "Products", icon: "📦" },
      { href: "/admin/categories", label: "Categories", icon: "🗂" },
    ],
  },
  {
    label: "Sales",
    links: [
      { href: "/admin/orders", label: "Orders", icon: "🧾" },
      { href: "/admin/shipping", label: "Shipping", icon: "🚚" },
    ],
  },
  {
    label: "Customers",
    links: [
      { href: "/admin/users", label: "Users", icon: "👥" },
    ],
  },
  {
    label: "Account",
    links: [
      { href: "/admin/settings", label: "Settings", icon: "⚙" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login?redirect=/admin");
      } else if (user?.role === "CUSTOMER") {
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated || user?.role === "CUSTOMER") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/40">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <span className="text-sm">Loading admin console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#161616] border-r border-white/8 z-30 flex flex-col transition-transform duration-300 
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/8 flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="font-display text-xl tracking-wide text-white">Maison</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40 bg-white/8 px-1.5 py-0.5 rounded">Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="text-[10px] uppercase tracking-widest text-white/30 px-3 mb-2">
                {section.label}
              </p>
              {section.links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors mb-0.5
                      ${isActive
                        ? "bg-white text-[#0f0f0f] font-medium"
                        : "text-white/60 hover:text-white hover:bg-white/6"
                      }`}
                  >
                    <span className="text-base leading-none">{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="border-t border-white/8 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              View Store
            </Link>
            <span className="text-white/20">·</span>
            <button
              onClick={logout}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-[#161616] border-b border-white/8 flex items-center px-4 md:px-6 flex-shrink-0 gap-4">
          <button
            className="lg:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumb from pathname */}
          <div className="text-sm text-white/40">
            {pathname.split("/").filter(Boolean).map((segment, i, arr) => (
              <span key={i}>
                <span className={i === arr.length - 1 ? "text-white" : ""}>
                  {segment.charAt(0).toUpperCase() + segment.slice(1)}
                </span>
                {i < arr.length - 1 && <span className="mx-1.5">/</span>}
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-white/30 hidden md:block">
              {user?.role}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
