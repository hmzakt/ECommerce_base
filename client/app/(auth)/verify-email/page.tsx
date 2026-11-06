"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { verifyEmailApi, resendVerificationApi } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { fetchMe, accessToken } = useAuth();

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">(
    token ? "loading" : "no-token"
  );
  const [errorMsg, setErrorMsg] = useState("");

  // Resend state
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendError, setResendError] = useState("");

  // Auto-verify when token is in URL
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    setStatus("loading");

    verifyEmailApi(token)
      .then(async () => {
        if (!isMounted) return;
        setStatus("success");
        // Refresh user context so isEmailVerified updates
        await fetchMe().catch(() => {});
      })
      .catch((err) => {
        if (!isMounted) return;
        setStatus("error");
        setErrorMsg(
          err instanceof ApiClientError
            ? err.message
            : "Verification failed. The link may have expired."
        );
      });

    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Countdown for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!accessToken) {
      router.push("/login?redirect=/verify-email");
      return;
    }
    setResendStatus("sending");
    setResendError("");
    try {
      await resendVerificationApi(accessToken);
      setResendStatus("sent");
      setResendCooldown(60);
    } catch (err) {
      setResendStatus("error");
      setResendError(
        err instanceof ApiClientError ? err.message : "Failed to resend. Please try again."
      );
    }
  };

  // ── Loading / Verifying ───────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h1 className="font-display text-3xl font-light mb-4">Verifying…</h1>
        <p className="text-muted-foreground text-sm animate-pulse">
          Please wait while we verify your email address.
        </p>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
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
          Your email has been verified. Your account is now fully active.
        </p>
        <Button className="w-full h-12" onClick={() => router.push("/account")}>
          Go to My Account
        </Button>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-light mb-4">Link Expired</h1>
        <p className="text-muted-foreground mb-6 text-sm">{errorMsg}</p>

        {resendStatus === "sent" && (
          <div className="bg-green-50 text-green-700 p-3 mb-4 text-sm border border-green-100">
            Verification email sent! Check your inbox.
          </div>
        )}
        {resendStatus === "error" && (
          <div className="bg-red-50 text-red-600 p-3 mb-4 text-sm border border-red-100">
            {resendError}
          </div>
        )}

        {accessToken ? (
          <Button
            className="w-full h-12 mb-4"
            onClick={handleResend}
            disabled={resendStatus === "sending" || resendCooldown > 0}
          >
            {resendStatus === "sending"
              ? "Sending…"
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend Verification Email"}
          </Button>
        ) : (
          <Link href="/login?redirect=/verify-email">
            <Button className="w-full h-12">Sign In to Resend</Button>
          </Link>
        )}
      </div>
    );
  }

  // ── No token — user landed directly (e.g., from register page) ───────────
  return (
    <div className="text-center">
      <div className="mx-auto w-16 h-16 bg-muted text-muted-foreground rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>
      <h1 className="font-display text-3xl font-light mb-4">Check Your Email</h1>
      <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
        We&apos;ve sent a verification link to your email address.
        Click the link in the email to verify your account and unlock all features.
      </p>

      {resendStatus === "sent" && (
        <div className="bg-green-50 text-green-700 p-3 mb-4 text-sm border border-green-100">
          Verification email sent! Check your inbox.
        </div>
      )}
      {resendStatus === "error" && (
        <div className="bg-red-50 text-red-600 p-3 mb-4 text-sm border border-red-100">
          {resendError}
        </div>
      )}

      {accessToken ? (
        <Button
          variant="secondary"
          className="w-full h-12 mb-4"
          onClick={handleResend}
          disabled={resendStatus === "sending" || resendCooldown > 0}
        >
          {resendStatus === "sending"
            ? "Sending…"
            : resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : "Resend Verification Email"}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-foreground hover:underline underline-offset-4 font-medium">
            Sign in
          </Link>{" "}
          to resend the verification email.
        </p>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="section-padding bg-muted/30 min-h-[70vh] flex items-center">
      <Container size="narrow" className="max-w-md w-full mx-auto">
        <div className="bg-surface p-8 md:p-12 shadow-sm">
          <Suspense fallback={<div className="text-center py-8">Loading…</div>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
