import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export const metadata: Metadata = {
  alternates: { canonical: "/register" },
  description:
    "Register for an Apex Global Logistics customer account to manage parcel, pet, and freight shipments.",
  robots: { follow: false, index: false },
  title: "Register | Apex Global Logistics",
};

export default function RegisterPage() {
  return (
    <AuthShell
      subtitle="Customer accounts are verified by email before access is enabled."
      title="Create account"
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
