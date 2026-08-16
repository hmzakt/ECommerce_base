"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useEffect } from "react";
import { Container } from "@/components/ui/Container";

const navLinks = [
  { label: "Dashboard", href: "/account" },
  { label: "My Orders", href: "/account/orders" },
  { label: "Profile", href: "/account/profile" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/account");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="section-padding min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading account...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="section-padding bg-muted/20 min-h-screen">
      <Container size="default">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-border">
          <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">My Account</p>
          <h1 className="font-display text-3xl font-light">
            {user?.firstName} {user?.lastName}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Nav */}
          <nav className="lg:col-span-2">
            <ul className="space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`block px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "text-foreground font-medium border-l-2 border-foreground pl-[calc(0.75rem-2px)]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Main Content */}
          <main className="lg:col-span-10">{children}</main>
        </div>
      </Container>
    </div>
  );
}
