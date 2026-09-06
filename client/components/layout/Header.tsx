"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/context/AuthContext";
import { useCart } from "@/lib/context/CartContext";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Home Decor", href: "/categories/home-decor" },
  { label: "Beauty", href: "/categories/beauty" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-colors duration-300",
          scrolled
            ? "border-border bg-background/95 backdrop-blur-sm"
            : "border-transparent bg-background",
        )}
      >
        <Container as="nav" aria-label="Main navigation">
          <div className="flex h-[var(--header-height)] items-center justify-between gap-6">
            <button
              type="button"
              className="flex flex-col gap-1.5 p-1 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span
                className={cn(
                  "block h-px w-5 bg-foreground transition-transform duration-200",
                  menuOpen && "translate-y-[3.5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "block h-px w-5 bg-foreground transition-opacity duration-200",
                  menuOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "block h-px w-5 bg-foreground transition-transform duration-200",
                  menuOpen && "-translate-y-[3.5px] -rotate-45",
                )}
              />
            </button>

            <Link
              href="/"
              className="font-display text-2xl font-light tracking-tight lg:absolute lg:left-1/2 lg:-translate-x-1/2"
            >
              Maison
            </Link>

            <ul className="hidden items-center gap-8 lg:flex">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-eyebrow text-foreground transition-opacity hover:opacity-60"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4 sm:gap-5">
              <Link
                href="/search"
                className="text-eyebrow hidden sm:inline text-foreground transition-opacity hover:opacity-60"
              >
                Search
              </Link>
              {isAuthenticated ? (
                <>
                  {user?.role === "SUPER_ADMIN" && (
                    <Link
                      href="/admin"
                      className="text-eyebrow hidden sm:inline text-foreground transition-opacity hover:opacity-60"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/account"
                    className="text-eyebrow hidden sm:inline text-foreground transition-opacity hover:opacity-60"
                  >
                    Account
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="text-eyebrow hidden sm:inline text-foreground transition-opacity hover:opacity-60"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-eyebrow hidden sm:inline text-foreground transition-opacity hover:opacity-60"
                >
                  Login
                </Link>
              )}
              <Link
                href="/cart"
                className="text-eyebrow text-foreground transition-opacity hover:opacity-60"
                aria-label="Shopping cart"
              >
                Cart ({totalItems})
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </Container>
      </header>

      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-0 z-40 bg-background transition-opacity duration-300 lg:hidden",
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-hidden={!menuOpen}
      >
        <nav
          className="flex h-full flex-col justify-between px-8 py-24"
          aria-label="Mobile navigation"
        >
          <ul className="space-y-6">
            {navLinks.map((link, index) => (
              <li
                key={link.href}
                className="transition-all duration-300"
                style={{
                  transitionDelay: menuOpen ? `${index * 50}ms` : "0ms",
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? "translateY(0)" : "translateY(8px)",
                }}
              >
                <Link
                  href={link.href}
                  className="font-display text-display-md font-light"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile bottom actions: Theme toggle, search, account/login, cart */}
          <div className="border-t border-border pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <ThemeToggle showLabel />
              <Link
                href="/cart"
                onClick={() => setMenuOpen(false)}
                className="text-eyebrow text-foreground"
              >
                Cart ({totalItems})
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 text-eyebrow text-muted-foreground">
              <Link href="/search" onClick={() => setMenuOpen(false)}>
                Search
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/account" onClick={() => setMenuOpen(false)}>
                    Account
                  </Link>
                  {user?.role === "SUPER_ADMIN" && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
