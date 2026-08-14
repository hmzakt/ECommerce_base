"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { resetPasswordApi } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl font-light mb-4">Invalid Link</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          This password reset link is invalid or has expired.
        </p>
        <Button href="/forgot-password" variant="primary">
          Request a New Link
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPasswordApi(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
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

  if (success) {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl font-light mb-4">Password Reset Successful</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Your password has been securely updated. Redirecting you to login...
        </p>
        <Button href="/login" variant="primary">
          Go to Login Now
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl font-light text-center mb-4">Create New Password</h1>
      <p className="text-center text-muted-foreground mb-8 text-sm">
        Please enter your new password below.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 mb-6 text-sm border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-border px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
            placeholder="••••••••"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Must be at least 8 characters and include a number, uppercase, and lowercase letter.
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-border px-4 py-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" className="w-full h-12" disabled={isLoading}>
          {isLoading ? "Resetting Password..." : "Reset Password"}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="section-padding bg-muted/30 min-h-[70vh] flex items-center">
      <Container size="narrow" className="max-w-md w-full mx-auto">
        <div className="bg-surface p-8 shadow-sm">
          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
