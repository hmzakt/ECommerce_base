import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-eyebrow text-muted-foreground mb-4">{eyebrow}</p>
      )}
      <h2
        id={id}
        className="font-display text-display-md font-light text-foreground"
      >
        {title}
      </h2>
      {description && (
        <p className="text-body-lg text-muted-foreground mt-4">{description}</p>
      )}
    </div>
  );
}
