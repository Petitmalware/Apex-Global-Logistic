import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Reset Access | Apex Global Logistics",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell subtitle="A reset link will be queued for the account email." title="Reset access">
      <AuthForm mode="forgot-password" />
    </AuthShell>
  );
}
