import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Verify Email | Apex Global Logistics",
};

export default function VerifyEmailPage() {
  return (
    <AuthShell subtitle="Activate your account with the verification token." title="Verify email">
      <AuthForm mode="verify-email" />
    </AuthShell>
  );
}
