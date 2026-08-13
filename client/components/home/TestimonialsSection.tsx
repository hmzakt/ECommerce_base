import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { TestimonialsSectionConfig } from "@/lib/types/homepage";

type TestimonialsSectionProps = Omit<
  TestimonialsSectionConfig,
  "visible" | "order" | "type" | "id"
>;

export function TestimonialsSection({
  eyebrow,
  title,
  items,
}: TestimonialsSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="section-padding bg-surface"
    >
      <Container>
        <SectionHeading
          id="testimonials-heading"
          eyebrow={eyebrow}
          title={title}
          align="center"
          className="mb-14"
        />

        <ul className="grid gap-12 md:grid-cols-3 md:gap-10">
          {items.map((item) => (
            <li key={item.author} className="text-center md:text-left">
              <blockquote>
                <p className="font-display text-2xl font-light leading-snug text-foreground">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <footer className="mt-6">
                  <cite className="not-italic">
                    <span className="text-eyebrow text-foreground">
                      {item.author}
                    </span>
                    {item.role && (
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {item.role}
                      </span>
                    )}
                  </cite>
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
