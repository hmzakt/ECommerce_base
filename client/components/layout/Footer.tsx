import Link from "next/link";
import { Container } from "@/components/ui/Container";

const footerLinks = {
  shop: [
    { label: "All products", href: "/shop" },
    { label: "Home decor", href: "/categories/home-decor" },
    { label: "Beauty", href: "/categories/beauty" },
    { label: "New arrivals", href: "/shop?sort=newest" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Journal", href: "/journal" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
  ],
  support: [
    { label: "Shipping", href: "/shipping" },
    { label: "Returns", href: "/returns" },
    { label: "FAQ", href: "/faq" },
    { label: "Privacy", href: "/privacy" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container as="footer" className="section-padding pb-10 pt-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="font-display text-3xl font-light tracking-tight"
            >
              Maison
            </Link>
            <p className="text-body-lg text-muted-foreground mt-4 max-w-xs">
              Premium home decor and beauty for considered living.
            </p>
          </div>

          <FooterColumn title="Shop" links={footerLinks.shop} />
          <FooterColumn title="Company" links={footerLinks.company} />
          <FooterColumn title="Support" links={footerLinks.support} />
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Maison. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/terms"
              className="text-xs text-muted-foreground transition-opacity hover:opacity-70"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground transition-opacity hover:opacity-70"
            >
              Privacy
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-eyebrow text-foreground mb-5">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-opacity hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
