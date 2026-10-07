import { type NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";
import { InvoiceStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentSessionUser();
    if (
      !user ||
      (!user.roles.includes(AUTH_ROLES.ADMIN) && !user.roles.includes(AUTH_ROLES.SUPER_ADMIN))
    ) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in.", success: false },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { status?: string };
    const rawStatus = (body.status || "").toUpperCase().trim();

    let targetStatus: InvoiceStatus;
    if (rawStatus === "PAID") {
      targetStatus = InvoiceStatus.PAID;
    } else if (rawStatus === "SENT" || rawStatus === "ISSUED") {
      targetStatus = InvoiceStatus.ISSUED;
    } else if (rawStatus === "DRAFT") {
      targetStatus = InvoiceStatus.DRAFT;
    } else if (rawStatus === "OVERDUE") {
      targetStatus = InvoiceStatus.OVERDUE;
    } else if (rawStatus === "CANCELLED" || rawStatus === "VOID") {
      targetStatus = InvoiceStatus.VOID;
    } else if (rawStatus === "PARTIALLY_PAID") {
      targetStatus = InvoiceStatus.PARTIALLY_PAID;
    } else if (rawStatus === "UNCOLLECTIBLE") {
      targetStatus = InvoiceStatus.UNCOLLECTIBLE;
    } else {
      return NextResponse.json(
        {
          error: "Invalid status. Allowed values: DRAFT, ISSUED, PAID, OVERDUE, VOID, PARTIALLY_PAID",
          success: false,
        },
        { status: 400 },
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found", success: false }, { status: 404 });
    }

    const updated = await prisma.invoice.update({
      data: {
        ...(targetStatus === InvoiceStatus.PAID
          ? { amountPaid: invoice.total, paidAt: new Date() }
          : {}),
        ...(targetStatus === InvoiceStatus.ISSUED
          ? { issuedAt: invoice.issuedAt ?? new Date() }
          : {}),
        ...(targetStatus === InvoiceStatus.VOID ? { voidedAt: new Date() } : {}),
        status: targetStatus,
      },
      where: { id },
    });

    return NextResponse.json({ invoice: updated, success: true });
  } catch (error) {
    console.error("[Invoice Status API] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
