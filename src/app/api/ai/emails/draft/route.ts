import { NextResponse } from "next/server";

import { aiEmailDraftRequestSchema } from "@/features/ai/schemas/ai.schemas";
import { draftEmail } from "@/features/ai/services/ai-feature.service";
import { getZodErrorMessage, handleAiRouteError } from "@/features/ai/services/ai-route.service";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.EMAILS_CREATE);
    const parsed = aiEmailDraftRequestSchema.safeParse(await request.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json({ message: getZodErrorMessage(parsed.error) }, { status: 400 });
    }

    return NextResponse.json(await draftEmail(parsed.data, user));
  } catch (error) {
    return handleAiRouteError(error);
  }
}
