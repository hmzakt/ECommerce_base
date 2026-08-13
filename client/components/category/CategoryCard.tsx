import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface CategoryCardProps {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  href: string;
  className?: string;
  priority?: boolean;
  aspect?: "portrait" | "landscape" | "square";
}

const aspectClasses = {
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  square: "aspect-square",
};

export function CategoryCard({
  title,
  description,
  imageUrl,
  href,
  className,
  priority = false,
  aspect = "portrait",
}: CategoryCardProps) {
  return (
    <article className={cn("group", className)}>
      <Link href={href} className="block">
        <div
          className={cn(
            "relative overflow-hidden bg-muted",
            aspectClasses[aspect],
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="image-hover object-cover"
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {title}
            </div>
          )}
        </div>

        <div className="mt-5">
          <h3 className="font-display text-2xl font-light transition-opacity group-hover:opacity-70">
            {title}
          </h3>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          <span className="mt-3 inline-block text-eyebrow text-foreground underline-offset-4 group-hover:underline">
            Explore
          </span>
        </div>
      </Link>
    </article>
  );
}
