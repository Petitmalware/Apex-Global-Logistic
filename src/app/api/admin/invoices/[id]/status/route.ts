import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { AUTH_ROLES } from "@/lib/auth/constants";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);

    const { id } = await params;
    const body = await request.json() as { status: "PAID" | "SENT" | "OVERDUE" | "CANCELLED" | "DRAFT" };
    const { status } = body;

    const validStatuses = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Dynamic prisma import with path fallback
    let prisma: { invoice: { update: (args: unknown) => Promise<unknown> } };
    try {
      const prismaModule = await import("@/lib/prisma");
      prisma = prismaModule.default ?? prismaModule.prisma;
    } catch {
      const prismaModule = await import("@/lib/db");
      prisma = prismaModule.default ?? prismaModule.db;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(status === "PAID" ? { paidAt: new Date() } : {}),
        ...(status === "SENT" ? { sentAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error) {
    console.error("[Invoice Status API] Error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
