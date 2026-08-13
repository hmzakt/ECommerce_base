import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { ImageTextSectionConfig } from "@/lib/types/homepage";

type ImageTextSectionProps = Omit<
  ImageTextSectionConfig,
  "visible" | "order" | "type" | "id"
>;

export function ImageTextSection({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  imageUrl,
  imageAlt,
  layout = "image-left",
}: ImageTextSectionProps) {
  const imageFirst = layout === "image-left";

  return (
    <section aria-label="Promotional feature" className="section-padding bg-surface">
      <Container>
        <div
          className={cn(
            "grid items-center gap-10 md:grid-cols-12 md:gap-8",
            !imageFirst && "md:[&>*:first-child]:order-2",
          )}
        >
          <div
            className={cn(
              "relative overflow-hidden bg-muted",
              imageFirst ? "md:col-span-7" : "md:col-span-7 md:col-start-6",
              "aspect-[5/4] md:aspect-[16/10]",
            )}
          >
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-cover"
            />
          </div>

          <div
            className={cn(
              "md:col-span-4",
              imageFirst ? "md:col-start-9" : "md:col-start-1 md:row-start-1",
            )}
          >
            {eyebrow && (
              <p className="text-eyebrow text-muted-foreground mb-4">{eyebrow}</p>
            )}
            <h2 className="font-display text-display-md font-light">{title}</h2>
            {description && (
              <p className="text-body-lg text-muted-foreground mt-5">{description}</p>
            )}
            {ctaHref && ctaLabel && (
              <div className="mt-7">
                <Button href={ctaHref} variant="link" className="text-eyebrow">
                  {ctaLabel} →
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
