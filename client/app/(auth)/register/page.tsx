"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { ApiClientError } from "@/lib/api/client";

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
      router.push("/account"); // Or redirect to a "please verify email" page
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

  return (
    <div className="section-padding bg-muted/30 min-h-[70vh] flex items-center">
      <Container size="narrow" className="max-w-xl w-full mx-auto">
        <div className="bg-surface p-8 md:p-12 shadow-sm">
          <h1 className="font-display text-3xl font-light text-center mb-2">Create Account</h1>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            Join Maison to track orders and save your favorites.
          </p>

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
                Must be at least 8 characters and include a number, uppercase, and lowercase letter.
              </p>
            </div>

            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
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
