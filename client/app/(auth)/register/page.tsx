"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { ApiClientError } from "@/lib/api/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // After successful registration, show the "check your email" state
  const [registered, setRegistered] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register(formData);
      // Registration succeeded — user is logged in but email not verified yet.
      // Show the "verify your email" notice instead of redirecting to account.
      setRegistered(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Post-registration: email verification prompt ──────────────────────────
  if (registered) {
    return (
      <div className="section-padding bg-muted/30 min-h-[70vh] flex items-center">
        <Container size="narrow" className="max-w-xl w-full mx-auto">
          <div className="bg-surface p-8 md:p-12 shadow-sm text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h1 className="font-display text-3xl font-light mb-2">Almost there!</h1>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Your account has been created. We&apos;ve sent a verification email to{" "}
              <strong className="text-foreground">{formData.email}</strong>.
              <br />
              Please check your inbox and click the link to verify your email.
            </p>
            <Button className="w-full h-12 mb-4" onClick={() => router.push("/verify-email")}>
              I&apos;ll verify later
            </Button>
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <Link href="/verify-email" className="text-foreground underline underline-offset-4">
                request a new link
              </Link>
              .
            </p>
          </div>
        </Container>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="section-padding bg-muted/30 min-h-[70vh] flex items-center">
      <Container size="narrow" className="max-w-xl w-full mx-auto">
        <div className="bg-surface p-8 md:p-12 shadow-sm">
          <h1 className="font-display text-3xl font-light text-center mb-2">Create Account</h1>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            Join Maison to track orders and save your favourites.
          </p>

          {/* Google Sign-In */}
          <div className="mb-6">
            <GoogleSignInButton
              onError={(msg) => setError(msg)}
              redirectTo="/account"
            />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-surface px-4 text-muted-foreground">or</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 mb-6 text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full border border-border px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full border border-border px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-border px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-border px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                placeholder="••••••••"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Must be at least 8 characters with a number, uppercase, and lowercase letter.
              </p>
            </div>

            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? "Creating Account…" : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border pt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-foreground hover:underline underline-offset-4 font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
