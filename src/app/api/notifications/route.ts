import { NextResponse } from "next/server";

import { getNotificationCenterSnapshot } from "@/features/notifications/queries/notification.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);
  const snapshot = await getNotificationCenterSnapshot(user);

  return NextResponse.json({ snapshot });
}
