import { NextResponse } from "next/server";

import { getCurrentSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return NextResponse.json(
      {
        message: "Not authenticated.",
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    user,
  });
}
