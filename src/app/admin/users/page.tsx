import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { createAdminUserAction } from "@/features/admin-users/actions/admin-user.actions";
import { AdminUsersManager } from "@/features/admin-users/components/admin-users-manager";
import { getAdminUsers } from "@/features/admin-users/queries/admin-user.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin Users | Apex Global Logistics",
};

export default async function AdminUsersPage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const admins = await getAdminUsers(user);

  return (
    <ProtectedShell
      activeHref="/admin/users"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/admin", label: "Admin" },
        { label: "Admin Users" },
      ]}
      description="Create and review admin accounts for the Apex operations workspace."
      title="Admin Users"
      user={user}
    >
      <AdminUsersManager action={createAdminUserAction} admins={admins} />
    </ProtectedShell>
  );
}
