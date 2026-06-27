import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export default function VerifyEmailPage() {
  return (
    <AuthShell subtitle="Activate your account with the verification token." title="Verify email">
      <AuthForm mode="verify-email" />
    </AuthShell>
  );
}
