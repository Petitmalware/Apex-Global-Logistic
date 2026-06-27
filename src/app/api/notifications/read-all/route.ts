import { NextResponse } from "next/server";

import { getNotificationCenterSnapshot } from "@/features/notifications/queries/notification.queries";
import { markAllNotificationsRead } from "@/features/notifications/services/notification.service";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);

  await markAllNotificationsRead(user);

  return NextResponse.json({
    snapshot: await getNotificationCenterSnapshot(user),
  });
}
