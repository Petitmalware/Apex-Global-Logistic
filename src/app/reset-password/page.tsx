import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export default function ResetPasswordPage() {
  return (
    <AuthShell subtitle="Set a new password using your reset token." title="Reset password">
      <AuthForm mode="reset-password" />
    </AuthShell>
  );
}
