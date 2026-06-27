import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { AiWorkbench } from "@/features/ai/components/ai-workbench";
import { getShipmentsForUser } from "@/features/shipments/queries/shipment.queries";
import { hasPermission, PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "AI Assist | Apex Global Logistics",
};

export default async function AiAssistPage() {
  const user = await requirePermission(PERMISSIONS.AI_READ);
  const shipments = await getShipmentsForUser(user);

  return (
    <ProtectedShell
      activeHref="/ai"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "AI Assist" }]}
      description="Use governed AI for support answers, shipment insight, customer communication, semantic search, and operational risk detection."
      title="AI Assist"
      user={user}
    >
      <AiWorkbench
        canDraftEmail={hasPermission(user, PERMISSIONS.EMAILS_CREATE)}
        shipments={shipments}
      />
    </ProtectedShell>
  );
}
