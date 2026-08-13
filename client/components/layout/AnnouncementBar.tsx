import Link from "next/link";

interface AnnouncementBarProps {
  text: string;
  link?: string;
  linkLabel?: string;
}

export function AnnouncementBar({
  text,
  link,
  linkLabel,
}: AnnouncementBarProps) {
  return (
    <div
      role="region"
      aria-label="Announcement"
      className="border-b border-border bg-surface py-2.5 text-center"
    >
      <p className="text-eyebrow text-foreground">
        {text}
        {link && (
          <>
            {" "}
            <Link
              href={link}
              className="underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              {linkLabel ?? "Learn more"}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
