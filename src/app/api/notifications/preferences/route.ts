import { NextResponse } from "next/server";

import { updateNotificationPreferencesSchema } from "@/features/notifications/schemas/notification.schemas";
import {
  getNotificationPreferencesForUser,
  updateNotificationPreferencesForUser,
} from "@/features/notifications/services/notification.service";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);
  const preferences = await getNotificationPreferencesForUser(user);

  return NextResponse.json({ preferences });
}

export async function PUT(request: Request) {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);
  const parsed = updateNotificationPreferencesSchema.safeParse(
    await request.json().catch(() => ({})),
  );

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid notification preferences." }, { status: 400 });
  }

  return NextResponse.json({
    preferences: await updateNotificationPreferencesForUser(user, parsed.data),
  });
}
