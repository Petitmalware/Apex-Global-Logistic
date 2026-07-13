import { redirect } from "next/navigation";
import type { Route } from "next";

import { roleHomeByRole } from "@/features/dashboard/data/dashboard";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const [primaryRole] = user.roles;

  redirect((primaryRole ? roleHomeByRole[primaryRole] : "/customer") as Route);
}
