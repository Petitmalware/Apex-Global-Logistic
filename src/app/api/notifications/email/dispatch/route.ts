import { NextResponse } from "next/server";

import { dispatchPendingEmailNotifications } from "@/features/notifications/services/notification.service";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await requirePermission(PERMISSIONS.NOTIFICATIONS_MANAGE);

  return NextResponse.json({
    result: await dispatchPendingEmailNotifications(),
  });
}
