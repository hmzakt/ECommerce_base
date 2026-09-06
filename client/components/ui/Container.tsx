import { cn } from "@/lib/utils/cn";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer" | "nav";
  size?: "default" | "wide" | "narrow" | "sm";
}

const sizeClasses = {
  default: "max-w-[var(--container-max)]",
  wide: "max-w-[1600px]",
  narrow: "max-w-3xl",
  sm: "max-w-xl",
};

export function Container({
  children,
  className,
  as: Component = "div",
  size = "default",
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-12",
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </Component>
  );
}
