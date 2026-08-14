"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { forgotPasswordApi } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      await forgotPasswordApi(email);
      setSuccess(true);
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
      <Container size="narrow" className="max-w-md w-full mx-auto">
        <div className="bg-surface p-8 shadow-sm">
          <h1 className="font-display text-3xl font-light text-center mb-4">Reset Password</h1>
          
          {!success ? (
            <>
              <p className="text-center text-muted-foreground mb-8 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 mb-6 text-sm border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-border px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                    placeholder="you@example.com"
                  />
                </div>

                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? "Sending Link..." : "Send Reset Link"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="bg-green-50 text-green-700 p-4 mb-6 text-sm border border-green-200">
                If an account exists for that email, a password reset link has been sent. Please check your inbox.
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Didn't receive an email? Check your spam folder or{" "}
                <button 
                  onClick={() => setSuccess(false)}
                  className="text-foreground hover:underline"
                >
                  try again
                </button>.
              </p>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border pt-6">
            Remembered your password?{" "}
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
