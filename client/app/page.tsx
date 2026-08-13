import type { Metadata } from "next";
import { HomePageSections } from "@/components/home/HomePageSections";
import { getHomepageData } from "@/lib/services/homepage.service";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getHomepageData();

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
  };
}

export default async function HomePage() {
  const homepage = await getHomepageData();

  return <HomePageSections sections={homepage.sections} />;
}
