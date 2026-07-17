import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export const metadata: Metadata = {
  alternates: { canonical: "/login" },
  description:
    "Login to Apex Global Logistics for secure shipment tracking, customer access, and operations workflows.",
  robots: { follow: false, index: false },
  title: "Login | Apex Global Logistics",
};

export default function LoginPage() {
  return (
    <AuthShell subtitle="Sign in with your verified account." title="Sign in">
      <AuthForm mode="login" />
    </AuthShell>
  );
}
