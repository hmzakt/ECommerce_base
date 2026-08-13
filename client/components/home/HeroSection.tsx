import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import type { HeroSectionConfig } from "@/lib/types/homepage";

type HeroSectionProps = Omit<HeroSectionConfig, "visible" | "order" | "type" | "id">;

export function HeroSection({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  imageUrl,
  imageAlt,
}: HeroSectionProps) {
  return (
    <section aria-label="Hero" className="section-padding pt-4 md:pt-5">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5 lg:pr-8">
            {eyebrow && (
              <p className="text-eyebrow text-muted-foreground mb-6">{eyebrow}</p>
            )}
            <h1 className="font-display text-display-xl font-light text-foreground">
              {title}
            </h1>
            {description && (
              <p className="text-body-lg text-muted-foreground mt-6 max-w-md">
                {description}
              </p>
            )}
            {(ctaHref || secondaryCtaHref) && (
              <div className="mt-8 flex flex-wrap gap-4">
                {ctaHref && ctaLabel && (
                  <Button href={ctaHref} size="lg">
                    {ctaLabel}
                  </Button>
                )}
                {secondaryCtaHref && secondaryCtaLabel && (
                  <Button href={secondaryCtaHref} variant="secondary" size="lg">
                    {secondaryCtaLabel}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="relative lg:col-span-5 lg:col-start-7">
            <div className="relative aspect-[4/5] overflow-hidden bg-muted sm:aspect-[5/6] lg:aspect-[4/5]">
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                priority
                sizes="(max-width: 800px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
