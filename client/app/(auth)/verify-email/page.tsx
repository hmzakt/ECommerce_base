"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { verifyEmailApi } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const { fetchMe } = useAuth(); // Refresh user data to get updated isEmailVerified status

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No verification token provided in the URL.");
      return;
    }

    let isMounted = true;

    const verify = async () => {
      try {
        await verifyEmailApi(token);
        if (isMounted) {
          setStatus("success");
          // Refresh user context so it knows the email is verified
          await fetchMe();
        }
      } catch (err) {
        if (isMounted) {
          setStatus("error");
          if (err instanceof ApiClientError) {
            setError(err.message);
          } else {
            setError("Failed to verify email. The link may have expired.");
          }
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, fetchMe]);

  if (status === "loading") {
    return (
      <div className="text-center py-8">
        <h1 className="font-display text-3xl font-light mb-4">Verifying Email...</h1>
        <p className="text-muted-foreground mb-8 text-sm animate-pulse">
          Please wait while we verify your email address.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-light mb-4">Email Verified!</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Thank you for verifying your email address. Your account is now fully active.
        </p>
        <Button href="/account" variant="primary">
          Go to My Account
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="font-display text-3xl font-light mb-4">Verification Failed</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        {error}
      </p>
      <Button href="/account" variant="primary">
        Go to My Account to Resend Link
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="section-padding bg-muted/30 min-h-[70vh] flex items-center">
      <Container size="narrow" className="max-w-md w-full mx-auto">
        <div className="bg-surface p-8 shadow-sm">
          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
