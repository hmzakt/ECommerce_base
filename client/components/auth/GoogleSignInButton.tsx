"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { ApiClientError } from "@/lib/api/client";

interface GoogleSignInButtonProps {
  onError?: (message: string) => void;
  redirectTo?: string;
}

/**
 * Google Sign-In button (powered by @react-oauth/google).
 *
 * Uses Google Identity Services One-Tap / Sign-In button which returns a
 * credential (Google ID token / JWT). That credential is sent to our backend
 * POST /auth/google where it is verified with google-auth-library.
 */
export function GoogleSignInButton({
  onError,
  redirectTo = "/account",
}: GoogleSignInButtonProps) {
  const { googleLogin } = useAuth();
  const router = useRouter();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError?.("Google sign-in did not return a credential. Please try again.");
      return;
    }
    try {
      await googleLogin(credentialResponse.credential);
      router.push(redirectTo);
    } catch (err) {
      if (err instanceof ApiClientError) {
        onError?.(err.message);
      } else {
        onError?.("Google sign-in failed. Please try again.");
      }
    }
  };

  const handleError = () => {
    onError?.("Google sign-in was cancelled or failed. Please try again.");
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        width="100%"
        theme="outline"
        shape="rectangular"
        text="continue_with"
        logo_alignment="left"
      />
    </div>
  );
}
