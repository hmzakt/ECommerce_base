import { Container } from "@/components/ui/Container";
import type { ValuePropsSectionConfig } from "@/lib/types/homepage";

type ValuePropsSectionProps = Omit<
  ValuePropsSectionConfig,
  "visible" | "order" | "type" | "id"
>;

export function ValuePropsSection({ items }: ValuePropsSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-label="Store benefits" className="border-y border-border bg-surface">
      <Container>
        <ul className="grid gap-10 py-12 sm:grid-cols-3 sm:gap-8 sm:py-14">
          {items.map((item) => (
            <li key={item.title} className="text-center sm:text-left">
              <p className="text-eyebrow text-muted-foreground mb-3">
                {item.eyebrow}
              </p>
              <h3 className="font-display text-2xl font-light">{item.title}</h3>
              {item.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
