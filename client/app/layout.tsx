import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { defaultHomepageConfig } from "@/config/homepage";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: defaultHomepageConfig.seo.title,
    template: "%s | Maison",
  },
  description: defaultHomepageConfig.seo.description,
  openGraph: {
    title: defaultHomepageConfig.seo.title,
    description: defaultHomepageConfig.seo.description,
    type: "website",
    images: defaultHomepageConfig.seo.ogImage
      ? [{ url: defaultHomepageConfig.seo.ogImage }]
      : undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const announcement = defaultHomepageConfig.sections.find(
    (section) => section.type === "announcement" && section.visible,
  );

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          {announcement && announcement.type === "announcement" && (
            <AnnouncementBar
              text={announcement.text}
              link={announcement.link}
              linkLabel={announcement.linkLabel}
            />
          )}
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
