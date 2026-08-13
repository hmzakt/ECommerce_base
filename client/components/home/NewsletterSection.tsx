"use client";

import { FormEvent, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import type { NewsletterSectionConfig } from "@/lib/types/homepage";

type NewsletterSectionProps = Omit<
  NewsletterSectionConfig,
  "visible" | "order" | "type" | "id"
>;

export function NewsletterSection({
  title,
  description,
  placeholder = "Your email address",
  submitLabel = "Subscribe",
}: NewsletterSectionProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setEmail("");
  };

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="section-padding border-t border-border"
    >
      <Container size="narrow">
        <div className="text-center">
          <h2
            id="newsletter-heading"
            className="font-display text-display-md font-light"
          >
            {title}
          </h2>
          {description && (
            <p className="text-body-lg text-muted-foreground mt-4">{description}</p>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-0"
            noValidate
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status !== "idle") setStatus("idle");
              }}
              placeholder={placeholder}
              autoComplete="email"
              className="flex-1 border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
            <Button type="submit" className="sm:ml-[-1px]">
              {submitLabel}
            </Button>
          </form>

          {status === "success" && (
            <p className="mt-4 text-sm text-muted-foreground" role="status">
              Thank you for subscribing.
            </p>
          )}
          {status === "error" && (
            <p className="mt-4 text-sm text-foreground" role="alert">
              Please enter a valid email address.
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
