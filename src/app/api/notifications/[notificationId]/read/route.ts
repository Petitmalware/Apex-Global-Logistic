import { NextResponse } from "next/server";

import { getNotificationCenterSnapshot } from "@/features/notifications/queries/notification.queries";
import { updateNotificationReadStateSchema } from "@/features/notifications/schemas/notification.schemas";
import { setNotificationReadState } from "@/features/notifications/services/notification.service";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type NotificationReadContext = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function PATCH(request: Request, { params }: NotificationReadContext) {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);
  const { notificationId } = await params;
  const parsed = updateNotificationReadStateSchema.safeParse(
    await request.json().catch(() => ({})),
  );

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid read state." }, { status: 400 });
  }

  await setNotificationReadState({
    notificationId,
    read: parsed.data.read,
    user,
  });

  return NextResponse.json({
    snapshot: await getNotificationCenterSnapshot(user),
  });
}

export async function POST(_request: Request, context: NotificationReadContext) {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);
  const { notificationId } = await context.params;

  await setNotificationReadState({
    notificationId,
    read: true,
    user,
  });

  return NextResponse.json({
    snapshot: await getNotificationCenterSnapshot(user),
  });
}
