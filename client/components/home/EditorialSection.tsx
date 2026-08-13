import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { EditorialSectionConfig } from "@/lib/types/homepage";

type EditorialSectionProps = Omit<
  EditorialSectionConfig,
  "visible" | "order" | "type" | "id"
>;

export function EditorialSection({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  imageUrl,
  imageAlt,
  imagePosition = "right",
}: EditorialSectionProps) {
  const imageFirst = imagePosition === "left";

  return (
    <section aria-label="Editorial feature" className="section-padding">
      <Container size="wide">
        <div
          className={cn(
            "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
            imageFirst && "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1",
          )}
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-muted lg:aspect-[3/4]">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="lg:px-8">
            {eyebrow && (
              <p className="text-eyebrow text-muted-foreground mb-5">{eyebrow}</p>
            )}
            <h2 className="font-display text-display-lg font-light">{title}</h2>
            {description && (
              <p className="text-body-lg text-muted-foreground mt-6 max-w-lg">
                {description}
              </p>
            )}
            {ctaHref && ctaLabel && (
              <div className="mt-8">
                <Button href={ctaHref} variant="secondary">
                  {ctaLabel}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
